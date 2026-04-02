// Pointer-event based drag handler for PFD bug markers (AC-4).
// Translates drag gestures into store actions via onValueChange callback.

import { useRef, useCallback } from 'react';

export interface BugDragConfig {
  axis: 'horizontal' | 'vertical';
  pxPerUnit: number;
  min: number;
  max: number;
  step: number;
  invert?: boolean;    // true = dragging up decreases value (speed tape: up = higher speed, invert = true)
  wrap?: boolean;      // true = wraps around min/max boundary (heading)
  currentValue: number;
  onValueChange: (value: number) => void;
}

export function useBugDrag(config: BugDragConfig) {
  const accumRef = useRef(0);
  const lastValueRef = useRef(config.currentValue);
  const configRef = useRef(config);

  // Keep refs in sync each render
  lastValueRef.current = config.currentValue;
  configRef.current = config;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      accumRef.current = 0;

      const onPointerMove = (ev: PointerEvent) => {
        const c = configRef.current;
        const delta = c.axis === 'horizontal' ? ev.movementX : ev.movementY;
        const sign = c.invert ? -1 : 1;
        accumRef.current += delta * sign;

        const unitsDelta = Math.trunc(accumRef.current / c.pxPerUnit) * c.step;
        if (unitsDelta === 0) return;

        // Consume the used pixels
        accumRef.current -= (unitsDelta / c.step) * c.pxPerUnit;

        let newValue = lastValueRef.current + unitsDelta;

        if (c.wrap) {
          const range = c.max - c.min;
          newValue = ((newValue - c.min) % range + range) % range + c.min;
        } else {
          newValue = Math.max(c.min, Math.min(c.max, newValue));
        }

        // Snap to step
        newValue = Math.round(newValue / c.step) * c.step;

        if (newValue !== lastValueRef.current) {
          c.onValueChange(newValue);
        }
      };

      const onPointerUp = () => {
        target.removeEventListener('pointermove', onPointerMove);
        target.removeEventListener('pointerup', onPointerUp);
        target.removeEventListener('lostpointercapture', onPointerUp);
      };

      target.addEventListener('pointermove', onPointerMove);
      target.addEventListener('pointerup', onPointerUp);
      target.addEventListener('lostpointercapture', onPointerUp);
    },
    [], // Stable — reads from refs
  );

  return { onPointerDown };
}
