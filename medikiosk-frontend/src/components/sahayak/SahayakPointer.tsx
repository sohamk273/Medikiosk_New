import { useEffect, useState, useRef } from 'react';
import { useSahayakAssist } from '@/features/sahayak/SahayakAssistContext';

interface PointerPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
  visible: boolean;
}

export function SahayakPointer() {
  const { guidedAssistMode, guidedTargetId, guidedPlacement, pulseCounter } = useSahayakAssist();
  const [position, setPosition] = useState<PointerPosition>({ top: 0, left: 0, placement: 'top', visible: false });
  const [animating, setAnimating] = useState(false);
  const animTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!guidedAssistMode || !guidedTargetId) {
      setPosition(prev => ({ ...prev, visible: false }));
      return;
    }

    const updatePosition = () => {
      const el = document.getElementById(guidedTargetId);
      if (!el) {
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }

      const rect = el.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = 0;
      let left = 0;
      let chosenPlacement = guidedPlacement === 'auto' ? 'top' : guidedPlacement;

      // Auto fallback if placement goes off screen
      if (chosenPlacement === 'top' && rect.top < 120) {
        chosenPlacement = 'bottom';
      }

      switch (chosenPlacement) {
        case 'bottom':
          top = rect.bottom + scrollY + 12;
          left = rect.left + scrollX + rect.width / 2;
          break;
        case 'left':
          top = rect.top + scrollY + rect.height / 2;
          left = rect.left + scrollX - 56;
          break;
        case 'right':
          top = rect.top + scrollY + rect.height / 2;
          left = rect.right + scrollX + 16;
          break;
        case 'top':
        default:
          top = rect.top + scrollY - 60;
          left = rect.left + scrollX + rect.width / 2;
          break;
      }

      setPosition({
        top,
        left,
        placement: chosenPlacement as 'top' | 'bottom' | 'left' | 'right',
        visible: true,
      });

      // Trigger temporary subtle tap gesture animation
      setAnimating(true);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      animTimerRef.current = window.setTimeout(() => {
        setAnimating(false);
      }, 1600);
    };

    // Run on mount, pulse, resize or scroll
    updatePosition();
    const interval = setInterval(updatePosition, 300);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, [guidedAssistMode, guidedTargetId, guidedPlacement, pulseCounter]);

  if (!guidedAssistMode || !position.visible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, 0)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      className="transition-all duration-300 ease-out"
    >
      <div className={animating ? 'animate-sahayak-pointer' : ''}>
        {/* Subtle, clinical hand/finger pointer SVG */}
        <div className="relative flex flex-col items-center filter drop-shadow-md">
          {position.placement === 'top' && (
            <svg
              className="w-12 h-12 text-teal-800"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Pointing down finger */}
              <path d="M12 2a2 2 0 0 1 2 2v10.5l2.2-2.2a2 2 0 0 1 2.8 2.8l-5.6 5.6a3 3 0 0 1-4.2 0l-3.8-3.8a2 2 0 0 1 2.8-2.8L10 16.2V4a2 2 0 0 1 2-2z" />
            </svg>
          )}

          {position.placement === 'bottom' && (
            <svg
              className="w-12 h-12 text-teal-800"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Pointing up finger */}
              <path d="M12 22a2 2 0 0 1-2-2V9.5l-2.2 2.2a2 2 0 0 1-2.8-2.8l5.6-5.6a3 3 0 0 1 4.2 0l3.8 3.8a2 2 0 0 1-2.8 2.8L14 7.8V20a2 2 0 0 1-2 2z" />
            </svg>
          )}

          {position.placement === 'left' && (
            <svg
              className="w-12 h-12 text-teal-800"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Pointing right finger */}
              <path d="M2 12a2 2 0 0 1 2-2h10.5l-2.2-2.2a2 2 0 0 1 2.8-2.8l5.6 5.6a3 3 0 0 1 0 4.2l-3.8 3.8a2 2 0 0 1-2.8-2.8L16.2 14H4a2 2 0 0 1-2-2z" />
            </svg>
          )}

          {position.placement === 'right' && (
            <svg
              className="w-12 h-12 text-teal-800"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Pointing left finger */}
              <path d="M22 12a2 2 0 0 1-2 2H9.5l2.2 2.2a2 2 0 0 1-2.8 2.8l-5.6-5.6a3 3 0 0 1 0-4.2l3.8-3.8a2 2 0 0 1 2.8 2.8L7.8 10H20a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
