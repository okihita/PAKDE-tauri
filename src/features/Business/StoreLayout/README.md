# Store Layout & Floor Plan

2D drag-and-drop shelf layout designer for cooperative retail stores (Waserda). Grid-based canvas editor with zone areas, shelf racks, and inventory item bin assignment. Persists layouts and shelf-to-inventory mappings to local SQLite via Tauri Rust backend.

## Tech
- **Canvas**: Konva.js (react-konva) with GPU-accelerated rendering
- **Grid**: Configurable cell size (0.5m, 1m, 2m), axis labels, snap-to-grid
- **Drag**: RAF-throttled mouse tracking, boundary clamping, zero React setState jank
- **Persistence**: SQLite with schema healing on first access
- **Zoom**: Mouse-wheel centered zoom (0.3x–2.5x), fit-to-screen, step buttons
- **SFX**: Procedural Web Audio oscillator tones — no external assets
