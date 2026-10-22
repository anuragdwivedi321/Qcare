import React, { useState, useEffect, useRef } from 'react';

interface TooltipState {
  text: string;
  x: number;
  y: number;
  visible: boolean;
  isAbove: boolean;
}

export const GlobalTooltip: React.FC = () => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    text: '',
    x: 0,
    y: 0,
    visible: false,
    isAbove: true
  });

  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.('[data-tooltip], [title]') as HTMLElement | null;
      if (!target) return;

      // Convert native title to data-tooltip to suppress ugly OS tooltip
      if (target.hasAttribute('title') && target.getAttribute('title')) {
        const titleText = target.getAttribute('title') || '';
        target.setAttribute('data-tooltip', titleText);
        target.removeAttribute('title');
      }

      const text = target.getAttribute('data-tooltip');
      if (!text || !text.trim()) return;

      if (currentTargetRef.current === target) return;
      currentTargetRef.current = target;

      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);

      // 180ms gentle hover delay to avoid annoying flashes while moving mouse
      showTimeoutRef.current = setTimeout(() => {
        if (currentTargetRef.current !== target) return;

        const rect = target.getBoundingClientRect();
        const x = Math.min(Math.max(16, rect.left + rect.width / 2), window.innerWidth - 16);

        // Auto flip: If element is in bottom 120px of viewport, place tooltip above
        const isAbove = rect.bottom > window.innerHeight - 100 || rect.top > window.innerHeight - 140;
        const y = isAbove ? Math.max(8, rect.top - 8) : Math.min(window.innerHeight - 30, rect.bottom + 8);

        setTooltip({
          text: text.trim(),
          x,
          y,
          isAbove,
          visible: true
        });
      }, 180);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const activeEl = currentTargetRef.current;
      if (!activeEl) return;

      if (e.relatedTarget && activeEl.contains(e.relatedTarget as Node)) {
        return;
      }

      currentTargetRef.current = null;
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

      hideTimeoutRef.current = setTimeout(() => {
        setTooltip(prev => ({ ...prev, visible: false }));
      }, 60);
    };

    const handleDismiss = () => {
      currentTargetRef.current = null;
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      setTooltip(prev => ({ ...prev, visible: false }));
    };

    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });
    document.addEventListener('click', handleDismiss, { passive: true });
    window.addEventListener('scroll', handleDismiss, { passive: true, capture: true });

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('click', handleDismiss);
      window.removeEventListener('scroll', handleDismiss, { capture: true });
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  if (!tooltip.visible || !tooltip.text) return null;

  // Safe clamping for left/right viewport boundaries
  const maxTooltipWidth = 280;
  const halfWidth = maxTooltipWidth / 2;
  const safeX = Math.max(halfWidth + 12, Math.min(window.innerWidth - halfWidth - 12, tooltip.x));

  const isLight = true; // High-contrast clinical frosted light glass

  return (
    <div
      role="tooltip"
      className={`liquid-glass-tooltip ${tooltip.isAbove ? 'is-above' : 'is-below'} ${isLight ? 'is-light' : 'is-dark'}`}
      style={{
        position: 'fixed',
        left: safeX,
        top: tooltip.y,
        transform: tooltip.isAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)'
      }}
    >
      {tooltip.text}
    </div>
  );
};
