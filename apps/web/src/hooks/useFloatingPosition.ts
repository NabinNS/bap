"use client";

import { useFloating, autoUpdate, offset, flip, shift, size, type Placement } from "@floating-ui/react";

type Options = {
  open: boolean;
  placement?: Placement;
  gap?: number;
  /** Make the floating element match the reference element's width (e.g. a dropdown list). */
  matchReferenceWidth?: boolean;
};

/**
 * Shared positioning for dropdowns/popovers/tooltips: anchors a floating element to a
 * reference element, flipping to the opposite side and shifting within the viewport when
 * there isn't room. Pair with <FloatingPortal> from @floating-ui/react to render the
 * floating element at the document root, and spread `floatingStyles` on it.
 *
 * Only works when the floating element itself is what gets measured for collision
 * detection — a 3rd-party component that manages its own internal portal/positioning
 * (e.g. BsDateInput's calendar) can't be driven by this hook.
 */
export function useFloatingPosition({ open, placement = "bottom-start", gap = 4, matchReferenceWidth = false }: Options) {
  return useFloating({
    open,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(gap),
      flip({ fallbackPlacements: [placement.startsWith("top") ? "bottom-start" : "top-start"] }),
      shift({ padding: 8 }),
      ...(matchReferenceWidth
        ? [size({ apply({ rects, elements }) { elements.floating.style.width = `${rects.reference.width}px`; } })]
        : []),
    ],
  });
}
