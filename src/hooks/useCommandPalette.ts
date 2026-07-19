import { useEffect, useState, useCallback } from "react";

/**
 * Global command-palette keyboard listener.
 *
 * Triggers:
 *  - Cmd/Ctrl + K  → toggle the palette
 *  - "/"           → open the palette (only when not typing in a form field)
 *
 * The palette itself owns its internal arrow/enter/escape handling; this hook
 * only manages the open/closed state at the app level so both the TopBar
 * button and the shortcuts stay in sync.
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => setOpen(true), []);
  const closePalette = useCallback(() => setOpen(false), []);
  const togglePalette = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K — works regardless of focus context.
      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        togglePalette();
        return;
      }

      // "/" — open, but only when the user isn't already typing somewhere.
      if (!mod && e.key === "/") {
        const el = document.activeElement as HTMLElement | null;
        const typing =
          el &&
          (el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA" ||
            el.isContentEditable ||
            el.getAttribute("role") === "textbox");
        if (!typing) {
          e.preventDefault();
          openPalette();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openPalette, togglePalette]);

  return { open, setOpen, openPalette, closePalette, togglePalette };
}
