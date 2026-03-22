// Draggable vertical resize handle between PFD and MFD panels.
// Supports both mouse and touch events for tablet compatibility.

import { useCallback, useRef, useEffect } from 'react';

interface ResizeHandleProps {
  onDrag: (deltaX: number) => void;
}

export function ResizeHandle({ onDrag }: ResizeHandleProps) {
  const dragging = useRef(false);
  const lastX = useRef(0);
  const onDragRef = useRef(onDrag);

  // Keep ref in sync with latest callback
  useEffect(() => {
    onDragRef.current = onDrag;
  }, [onDrag]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const delta = e.clientX - lastX.current;
    lastX.current = e.clientX;
    onDragRef.current(delta);
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const delta = touch.clientX - lastX.current;
    lastX.current = touch.clientX;
    onDragRef.current(delta);
  }, []);

  const stopDrag = useCallback(() => {
    dragging.current = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', stopDrag);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', stopDrag);
  }, [onMouseMove, onTouchMove]);

  const startDrag = useCallback(
    (clientX: number) => {
      dragging.current = true;
      lastX.current = clientX;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', stopDrag);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', stopDrag);
    },
    [onMouseMove, onTouchMove, stopDrag],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [onMouseMove, onTouchMove, stopDrag]);

  return (
    <div
      className="w-1.5 cursor-col-resize flex items-center justify-center group shrink-0 hover:bg-cyan-500/10 active:bg-cyan-500/20 transition-colors"
      onMouseDown={(e) => {
        e.preventDefault();
        startDrag(e.clientX);
      }}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        if (touch) startDrag(touch.clientX);
      }}
    >
      <div className="w-px h-12 bg-cyan-700/40 group-hover:bg-cyan-400/60 group-active:bg-cyan-400 transition-colors rounded-full" />
    </div>
  );
}
