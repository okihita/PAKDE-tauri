import { useEffect } from "react";
import { create } from "zustand";
import { getPalette, DEFAULT_PALETTE_ID, type Palette } from "@/data/palettes";

const STORAGE_KEY = "pakde-active-palette";

function loadPaletteId(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_PALETTE_ID;
}

function savePaletteId(id: string) {
  localStorage.setItem(STORAGE_KEY, id);
}

function applyPaletteVars(palette: Palette) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(palette.vars)) {
    root.style.setProperty(key, value);
  }
}

interface PaletteStore {
  activeId: string;
  palette: Palette;
  setPalette: (id: string) => void;
}

export const usePaletteStore = create<PaletteStore>((set) => {
  const initialId = loadPaletteId();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const initialPalette = getPalette(initialId) || getPalette(DEFAULT_PALETTE_ID) || getPalette("emerald")!;

  return {
    activeId: initialId,
    palette: initialPalette,
    setPalette: (id: string) => {
      const palette = getPalette(id);
      if (!palette) return;
      savePaletteId(id);
      applyPaletteVars(palette);
      set({ activeId: id, palette });
    },
  };
});

/**
 * Hook to call once at app root. Applies the stored palette on mount.
 */
export function usePaletteInit() {
  const palette = usePaletteStore((s) => s.palette);

  useEffect(() => {
    applyPaletteVars(palette);
  }, [palette]);
}

export function usePalette(): [Palette, (id: string) => void] {
  const palette = usePaletteStore((s) => s.palette);
  const setPalette = usePaletteStore((s) => s.setPalette);
  return [palette, setPalette];
}
