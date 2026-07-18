// Global, action-matched UI sound effects.
//
// Attaches a capture-phase listener so *every* interaction plays a cue that
// matches the action, without touching each component:
//   - default press on any interactive element  -> short tick (playClick)
//   - element (or ancestor) with data-sfx="back"     -> descending tone
//   - element (or ancestor) with data-sfx="success"  -> chime
//   - element (or ancestor) with data-sfx="error"    -> buzz
//   - element (or ancestor) with data-sfx="ignore"   -> no sound (component
//     handles its own richer cue, avoids doubling)
//
// Semantic components may also skip the global tick and call `sfx.*` directly.

import { useEffect } from "react";
import { sfx } from "@/features/System/ProfileSelect/sfx";

const INTERACTIVE = "button,a,input,select,textarea,label,[role='button'],[role='menuitem'],.cursor-pointer";

const findSfxHint = (el: Element | null): string | null => {
  let node: Element | null = el;
  while (node) {
    const hint = node.getAttribute?.("data-sfx");
    if (hint) return hint;
    node = node.parentElement;
  }
  return null;
};

const playFor = (hint: string | null) => {
  switch (hint) {
    case "back":
      sfx.playBack();
      return;
    case "success":
      sfx.playChime();
      return;
    case "error":
      sfx.playError();
      return;
    case "ignore":
      return;
    default:
      sfx.playClick(350, 0.04);
  }
};

/** Mount once at the app root. Pass `enabled=false` to suspend (e.g. on screens
 *  that already play their own cues, to avoid doubling). */
export function useGlobalSfx(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target || !target.closest) return;
      const hint = findSfxHint(target);
      if (hint === "ignore") return;
      if (target.closest(INTERACTIVE)) {
        playFor(hint);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Sound the activation of focused controls via keyboard.
      if (e.key !== "Enter" && e.key !== " ") return;
      const target = e.target as Element | null;
      if (!target || !target.closest) return;
      const hint = findSfxHint(target);
      if (hint === "ignore") return;
      if (target.closest(INTERACTIVE)) {
        playFor(hint);
      }
    };

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [enabled]);
}
