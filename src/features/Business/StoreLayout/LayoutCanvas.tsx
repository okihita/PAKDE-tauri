import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Line, Text, Group, Circle } from "react-konva";
import type Konva from "konva";
import type { LayoutZone, InventoryItem } from "@/types";
import { MousePointer2, Square, Box, Eraser } from "lucide-react";
import "./index.css";

const CELL = 60;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.1;

type Tool = "select" | "zone" | "shelf" | "erase";

const ZONE_COLORS = [
  "#4ade80", "#60a5fa", "#fbbf24", "#c084fc",
  "#fb7185", "#2dd4bf", "#a3e635", "#fb923c",
];

interface LayoutCanvasProps {
  zones: LayoutZone[];
  zonesSetter: React.Dispatch<React.SetStateAction<LayoutZone[]>>;
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  selectedZone: LayoutZone | null;
  onZoneSelect: (zone: LayoutZone) => void;
  onZoneUpdate: (zone: LayoutZone) => void;
  inventoryItems: InventoryItem[];
}

function generateLocalId(): string {
  return `lz-new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getStockIndicator(items: InventoryItem[]): { color: string; pct: number } {
  if (items.length === 0) return { color: "#374151", pct: 0 };
  const totalStock = items.reduce((s, i) => s + i.stock_quantity, 0);
  const capacity = items.length * 100;
  const pct = Math.min(100, Math.max(0, (totalStock / capacity) * 100));
  if (pct === 0) return { color: "#ef4444", pct: 0 };
  if (pct < 30) return { color: "#f59e0b", pct };
  return { color: "#10b981", pct };
}

function hexToRGBA(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// Pure helpers — no component closure, no stale deps
function snap(v: number) {
  return Math.round(v / CELL) * CELL;
}
function clampPos(v: number, size: number, max: number) {
  return Math.max(0, Math.min(max - size, v));
}

export default function LayoutCanvas({
  zones,
  zonesSetter,
  gridWidth,
  gridHeight,
  cellSize,
  selectedZone,
  onZoneSelect,
  onZoneUpdate,
  inventoryItems,
}: LayoutCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<Tool>("zone");
  const [zoneColor, setZoneColor] = useState(ZONE_COLORS[0]);

  // ── Drawing refs — avoid React setState on every mousemove pixel ──
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const drawCurrentRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef(false);
  const rafRef = useRef(0);
  // Preview rect updated at most once per animation frame via RAF
  const [previewRect, setPreviewRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Derived — memoized so zone filters don't re-create every render
  const gridPxW = gridWidth * CELL;
  const gridPxH = gridHeight * CELL;
  const areaZones = useMemo(() => zones.filter((z) => z.zone_type === "zone"), [zones]);
  const shelfZones = useMemo(() => zones.filter((z) => z.zone_type === "shelf"), [zones]);

  // Grid lines — skip recomputation on unrelated state changes
  const gridLines = useMemo(() => {
    const lines: Array<{ points: number[]; key: string }> = [];
    for (let x = 0; x <= gridWidth; x++)
      lines.push({ points: [x * CELL, 0, x * CELL, gridPxH], key: `v-${x}` });
    for (let y = 0; y <= gridHeight; y++)
      lines.push({ points: [0, y * CELL, gridPxW, y * CELL], key: `h-${y}` });
    return lines;
  }, [gridWidth, gridHeight, gridPxW, gridPxH]);

  // Cancel any in-flight RAF on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Fit canvas
  useEffect(() => {
    const fit = () => {
      if (!containerRef.current || !stageRef.current) return;
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      stageRef.current.width(cw);
      stageRef.current.height(ch);
      const s = Math.min(cw / gridPxW, ch / gridPxH, 1) * 0.85;
      setScale(s);
      setOffset({ x: (cw - gridPxW * s) / 2, y: (ch - gridPxH * s) / 2 });
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [gridPxW, gridPxH]);

  // Zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const ptr = stage.getPointerPosition();
      if (!ptr) return;
      const dir = e.evt.deltaY > 0 ? -1 : 1;
      let ns = scale + dir * ZOOM_STEP;
      if (ns < MIN_ZOOM) ns = MIN_ZOOM;
      if (ns > MAX_ZOOM) ns = MAX_ZOOM;
      const mp = { x: (ptr.x - offset.x) / scale, y: (ptr.y - offset.y) / scale };
      setScale(ns);
      setOffset({ x: ptr.x - mp.x * ns, y: ptr.y - mp.y * ns });
    },
    [scale, offset],
  );

  // ── Unified mouseDown: pan or tool action ──
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.evt.button === 1 || e.evt.button === 2) {
        e.evt.preventDefault();
        stageRef.current?.draggable(true);
        return;
      }
      if (e.target !== e.target.getStage()) return;

      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;

      const gx = snap((pos.x - offset.x) / scale);
      const gy = snap((pos.y - offset.y) / scale);

      if (activeTool === "zone") {
        drawStartRef.current = { x: gx, y: gy };
        drawCurrentRef.current = { x: gx, y: gy };
        isDrawingRef.current = true;
        setPreviewRect({ x: gx, y: gy, w: CELL, h: CELL });
      } else if (activeTool === "shelf") {
        const cx = clampPos(gx, 2 * CELL, gridPxW);
        const cy = clampPos(gy, 1 * CELL, gridPxH);
        zonesSetter((prev) => [
          ...prev,
          {
            id: generateLocalId(),
            layout_id: "",
            name: `Rak ${shelfZones.length + 1}`,
            zone_type: "shelf",
            x: cx,
            y: cy,
            width: 2,
            height: 1,
            rows: 4,
            cols: 3,
            color: "#4CAF50",
          },
        ]);
      }
    },
    [activeTool, offset, scale, gridPxW, gridPxH, shelfZones, zonesSetter],
  );

  const handleMouseUp = useCallback(() => {
    stageRef.current?.draggable(false);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;

    if (!isDrawingRef.current || activeTool !== "zone" || !drawStartRef.current || !drawCurrentRef.current) {
      isDrawingRef.current = false;
      drawStartRef.current = null;
      drawCurrentRef.current = null;
      setPreviewRect(null);
      return;
    }

    const s = drawStartRef.current;
    const c = drawCurrentRef.current;
    const x1 = Math.min(s.x, c.x);
    const y1 = Math.min(s.y, c.y);
    const x2 = Math.max(s.x, c.x);
    const y2 = Math.max(s.y, c.y);
    const w = snap(x2 - x1) || CELL;
    const h = snap(y2 - y1) || CELL;

    zonesSetter((prev) => [
      ...prev,
      {
        id: generateLocalId(),
        layout_id: "",
        name: `Area ${areaZones.length + 1}`,
        zone_type: "zone",
        x: clampPos(snap(x1), w, gridPxW),
        y: clampPos(snap(y1), h, gridPxH),
        width: w / CELL,
        height: h / CELL,
        rows: 0,
        cols: 0,
        color: zoneColor,
      },
    ]);

    isDrawingRef.current = false;
    drawStartRef.current = null;
    drawCurrentRef.current = null;
    setPreviewRect(null);
  }, [activeTool, gridPxW, gridPxH, areaZones, zoneColor, zonesSetter]);

  // ── Mouse move during zone drawing — throttled to one React update per animation frame ──
  const handleStageMouseMove = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDrawingRef.current || activeTool !== "zone") return;
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const gx = snap((pos.x - offset.x) / scale);
      const gy = snap((pos.y - offset.y) / scale);
      drawCurrentRef.current = { x: gx, y: gy };

      if (rafRef.current) return; // already have a pending frame
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        if (!isDrawingRef.current || !drawStartRef.current || !drawCurrentRef.current) return;
        const ds = drawStartRef.current;
        const dc = drawCurrentRef.current;
        const x1 = Math.min(ds.x, dc.x);
        const y1 = Math.min(ds.y, dc.y);
        const w = Math.abs(dc.x - ds.x) || CELL;
        const h = Math.abs(dc.y - ds.y) || CELL;
        setPreviewRect({ x: snap(x1), y: snap(y1), w, h });
      });
    },
    [activeTool, offset, scale],
  );

  const cursorClass =
    activeTool === "zone"
      ? "cursor-crosshair"
      : activeTool === "shelf"
        ? "cursor-copy"
        : activeTool === "erase"
          ? "cursor-not-allowed"
          : "cursor-default";

  return (
    <div
      ref={containerRef}
      className={`store-layout-canvas ${cursorClass}`}
      onContextMenu={(e) => e.preventDefault()}
      style={{ width: "100%", height: "100%" }}
    >
      {/* ── Toolbar ── */}
      <div className="absolute top-2 left-2 z-10 flex items-stretch gap-1">
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
          {([
            ["select", MousePointer2],
            ["zone", Square],
            ["shelf", Box],
            ["erase", Eraser],
          ] as const).map(([tool, Icon]) => (
            <button
              key={tool}
              onClick={() => setActiveTool(tool)}
              className={`px-2.5 py-1.5 text-xxs font-bold flex items-center gap-1 transition-colors border-r border-slate-800 last:border-r-0
                ${activeTool === tool ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"}
              `}
              title={tool.charAt(0).toUpperCase() + tool.slice(1)}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline capitalize">{tool}</span>
            </button>
          ))}
        </div>

        {/* Zone color picker — only when zone tool active */}
        {activeTool === "zone" && (
          <div className="flex items-center gap-0.5 bg-slate-900/90 border border-slate-800 rounded-lg px-1.5">
            {ZONE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setZoneColor(c)}
                className={`w-4 h-4 rounded-sm transition-all ${
                  zoneColor === c ? "ring-2 ring-white scale-125" : "hover:scale-110"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        {/* Selected info */}
        {selectedZone && (
          <button
            onClick={() => onZoneSelect(selectedZone)}
            className="text-xxs font-bold px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
          >
            ⚙ {selectedZone.name}
          </button>
        )}
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-2 right-2 z-10 text-xxxs font-mono text-slate-500 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
        1 □ = {cellSize === 1 ? "1 m" : cellSize === 0.5 ? "0.5 m" : `${cellSize} m`}
      </div>

      <Stage
        ref={stageRef}
        width={800}
        height={600}
        scaleX={scale}
        scaleY={scale}
        x={offset.x}
        y={offset.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleStageMouseMove}
      >
        {/* ── Grid Layer ── */}
        <Layer listening={false}>
          <Rect x={0} y={0} width={gridPxW} height={gridPxH} fill="#0f172a" stroke="#1e293b" strokeWidth={2} />
          {gridLines.map((l) => (
            <Line key={l.key} points={l.points} stroke="#1e293b" strokeWidth={0.5} listening={false} />
          ))}
          {Array.from({ length: gridWidth }, (_, x) => (
            <Text
              key={`lx-${x}`}
              x={x * CELL + 2}
              y={-16}
              text={cellSize === 1 ? `${x}m` : `${(x * cellSize).toFixed(1)}`}
              fontSize={8} fill="#475569"
              fontFamily="JetBrains Mono, monospace" listening={false}
            />
          ))}
          {Array.from({ length: gridHeight }, (_, y) => (
            <Text
              key={`ly-${y}`}
              x={-22}
              y={y * CELL + 2}
              text={cellSize === 1 ? `${y}m` : `${(y * cellSize).toFixed(1)}`}
              fontSize={8} fill="#475569"
              fontFamily="JetBrains Mono, monospace" listening={false}
            />
          ))}
        </Layer>

        {/* ── Zone (area) layer ── */}
        <Layer>
          {areaZones.map((zone) => {
            const isSel = selectedZone?.id === zone.id;
            const zw = zone.width * CELL;
            const zh = zone.height * CELL;
            return (
              <Group
                key={zone.id}
                x={zone.x}
                y={zone.y}
                draggable={activeTool === "select"}
                onDragEnd={(e) => {
                  if (activeTool !== "select") return;
                  const node = e.target;
const nx = clampPos(snap(node.x()), zw, gridPxW);
                   const ny = clampPos(snap(node.y()), zh, gridPxH);
                  node.x(nx);
                  node.y(ny);
                  onZoneUpdate({ ...zone, x: nx, y: ny });
                }}
                onClick={() => {
                  if (activeTool === "erase") {
                    zonesSetter((prev) => prev.filter((z) => z.id !== zone.id));
                    return;
                  }
                  onZoneSelect(zone);
                }}
              >
                {/* Zone fill */}
                <Rect
                  width={zw} height={zh}
                  fill={hexToRGBA(zone.color, 0.1)}
                  cornerRadius={6}
                />
                {/* Zone border */}
                <Rect
                  width={zw} height={zh}
                  fill="transparent"
                  stroke={isSel ? zone.color : hexToRGBA(zone.color, 0.4)}
                  strokeWidth={isSel ? 2.5 : 1.5}
                  cornerRadius={6}
                  dash={isSel ? [8, 4] : []}
                />
                {/* Zone label centered */}
                <Text
                  x={4}
                  y={zh / 2 - 7}
                  width={zw - 8}
                  text={zone.name}
                  fontSize={11}
                  fontFamily="JetBrains Mono, monospace"
                  fontStyle="bold"
                  fill={isSel ? zone.color : hexToRGBA(zone.color, 0.6)}
                  align="center"
                  listening={false}
                />
                <Text
                  x={4}
                  y={zh / 2 + 5}
                  width={zw - 8}
                  text={`${(zone.width * (cellSize ?? 1)).toFixed(1)}m × ${(zone.height * (cellSize ?? 1)).toFixed(1)}m`}
                  fontSize={8}
                  fontFamily="JetBrains Mono, monospace"
                  fill={hexToRGBA(zone.color, 0.35)}
                  align="center"
                  listening={false}
                />
              </Group>
            );
          })}

          {/* Zone drawing preview */}
          {previewRect && (
            <Rect
              x={previewRect.x} y={previewRect.y}
              width={previewRect.w} height={previewRect.h}
              fill={hexToRGBA(zoneColor, 0.12)}
              stroke={zoneColor}
              strokeWidth={2} cornerRadius={6} dash={[6, 3]}
              listening={false}
            />
          )}
        </Layer>

        {/* ── Shelf layer ── */}
        <Layer>
          {shelfZones.map((zone) => {
            const zoneInventory = inventoryItems.filter((i) => i.zone_id === zone.id);
            const indicator = getStockIndicator(zoneInventory);
            const isSel = selectedZone?.id === zone.id;
            const zw = zone.width * CELL;
            const zh = zone.height * CELL;

            return (
              <Group
                key={zone.id}
                x={zone.x}
                y={zone.y}
                draggable={activeTool === "select"}
                onDragEnd={(e) => {
                  if (activeTool !== "select") return;
                  const node = e.target;
const nx = clampPos(snap(node.x()), zw, gridPxW);
                   const ny = clampPos(snap(node.y()), zh, gridPxH);
                  node.x(nx);
                  node.y(ny);
                  onZoneUpdate({ ...zone, x: nx, y: ny });
                }}
                onClick={() => {
                  if (activeTool === "erase") {
                    zonesSetter((prev) => prev.filter((z) => z.id !== zone.id));
                    return;
                  }
                  onZoneSelect(zone);
                }}
              >
                <Rect width={zw} height={zh} fill={indicator.color} opacity={0.25} cornerRadius={4} />
                <Rect
                  width={zw} height={zh}
                  fill="transparent"
                  stroke={isSel ? "#10b981" : indicator.color}
                  strokeWidth={isSel ? 2 : 1.5}
                  cornerRadius={4}
                  dash={isSel ? [6, 3] : []}
                />
                {/* Selection handles */}
                {isSel && (
                  <>
                    {[[0, 0], [zw, 0], [0, zh], [zw, zh]].map(([hx, hy], hi) => (
                      <Circle key={hi} x={hx} y={hy} radius={4} fill="#10b981" />
                    ))}
                  </>
                )}
                {/* Bin overlay */}
                {zone.rows > 0 && zone.cols > 0 &&
                  Array.from({ length: zone.rows * zone.cols }, (_, bi) => {
                    const row = Math.floor(bi / zone.cols);
                    const col = bi % zone.cols;
                    const bw = zw / zone.cols;
                    const bh = zh / zone.rows;
                    const binItem = zoneInventory.find(
                      (i) => i.shelf_row === row && i.shelf_col === col,
                    );
                    const bc = binItem
                      ? binItem.stock_quantity > 0
                        ? binItem.stock_quantity < 10 ? "#f59e0b" : "#10b981"
                        : "#ef4444"
                      : "transparent";
                    return (
                      <Rect
                        key={`bin-${bi}`}
                        x={col * bw + 1} y={row * bh + 1}
                        width={bw - 2} height={bh - 2}
                        fill={binItem ? bc : "transparent"}
                        opacity={binItem ? 0.3 : 0}
                        stroke={binItem ? bc : "#1e293b"}
                        strokeWidth={0.5}
                        cornerRadius={1}
                        listening={false}
                      />
                    );
                  })
                }
                <Text
                  x={4} y={zh + 2}
                  text={`${zone.name} · ${(zone.width * (cellSize ?? 1)).toFixed(1)}×${(zone.height * (cellSize ?? 1)).toFixed(1)}m · ${zone.rows}×${zone.cols}`}
                  fontSize={9}
                  fontFamily="JetBrains Mono, monospace"
                  fill={isSel ? "#10b981" : "#94a3b8"}
                  listening={false}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
