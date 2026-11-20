"use client";

import { useEffect } from "react";

/**
 * When the user scrolls while a number input is focused, blur it so the value
 * does not change — but allow the page/modal to scroll normally.
 */
export function NumberInputScrollLock() {
  useEffect(() => {
    const onWheel = () => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement && el.type === "number") {
        el.blur();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true, capture: true });
    return () =>
      window.removeEventListener("wheel", onWheel, { capture: true });
  }, []);

  return null;
}
