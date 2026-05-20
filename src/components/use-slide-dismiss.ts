"use client";

import { useCallback, useRef, type PointerEvent } from "react";

type SlideDismissOptions = {
  threshold?: number;
  maxOffset?: number;
};

type SlideState = {
  x: number;
  y: number;
  dragging: boolean;
  target: HTMLElement;
  pointerId: number;
};

const HORIZONTAL_LOCK_RATIO = 1.15;
const START_SLOP = 12;

export function useSlideDismiss(onDismiss: () => void, options: SlideDismissOptions = {}) {
  const threshold = options.threshold ?? 84;
  const maxOffset = options.maxOffset ?? 220;
  const stateRef = useRef<SlideState | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  const clearStyles = useCallback((target: HTMLElement) => {
    target.classList.remove("is-slide-dismissing", "slide-dismiss-resetting");
    target.style.removeProperty("--slide-dismiss-x");
    target.style.removeProperty("--slide-dismiss-opacity");
  }, []);

  const resetTarget = useCallback((target: HTMLElement) => {
    target.classList.add("slide-dismiss-resetting");
    target.classList.remove("is-slide-dismissing");
    window.requestAnimationFrame(() => {
      target.style.setProperty("--slide-dismiss-x", "0px");
      target.style.setProperty("--slide-dismiss-opacity", "1");
    });
    clearResetTimer();
    resetTimerRef.current = window.setTimeout(() => clearStyles(target), 180);
  }, [clearResetTimer, clearStyles]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    clearResetTimer();
    clearStyles(event.currentTarget);
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Synthetic pointer events used by automated QA may not have an active pointer capture target.
    }
    stateRef.current = {
      x: event.clientX,
      y: event.clientY,
      dragging: false,
      target: event.currentTarget,
      pointerId: event.pointerId
    };
  }, [clearResetTimer, clearStyles]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const state = stateRef.current;
    if (!state) return;

    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;
    if (!state.dragging) {
      if (Math.abs(dx) < START_SLOP && Math.abs(dy) < START_SLOP) return;
      if (dx <= 0 || Math.abs(dx) < Math.abs(dy) * HORIZONTAL_LOCK_RATIO) return;
      state.dragging = true;
      state.target.classList.add("is-slide-dismissing");
      state.target.classList.remove("slide-dismiss-resetting");
    }

    if (event.cancelable) event.preventDefault();
    const offset = Math.min(Math.max(dx, 0), maxOffset);
    const progress = Math.min(offset / threshold, 1);
    state.target.style.setProperty("--slide-dismiss-x", `${offset}px`);
    state.target.style.setProperty("--slide-dismiss-opacity", `${Math.max(0.58, 1 - progress * 0.32)}`);
  }, [maxOffset, threshold]);

  const finish = useCallback((event: PointerEvent<HTMLElement>) => {
    const state = stateRef.current;
    stateRef.current = null;
    if (!state) return;

    try {
      state.target.releasePointerCapture?.(state.pointerId);
    } catch {
      // The pointer may already be released if the browser cancelled the gesture.
    }
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;
    const shouldClose = state.dragging && dx > threshold && Math.abs(dx) > Math.abs(dy) * HORIZONTAL_LOCK_RATIO;

    if (shouldClose) {
      state.target.style.setProperty("--slide-dismiss-x", `${maxOffset}px`);
      state.target.style.setProperty("--slide-dismiss-opacity", "0.58");
      onDismiss();
      return;
    }

    resetTarget(state.target);
  }, [maxOffset, onDismiss, resetTarget, threshold]);

  const cancel = useCallback(() => {
    const state = stateRef.current;
    stateRef.current = null;
    if (state) resetTarget(state.target);
  }, [resetTarget]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: finish,
    onPointerCancel: cancel
  };
}
