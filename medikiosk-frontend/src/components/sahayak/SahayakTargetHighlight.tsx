import { useEffect, useState } from 'react';
import { useSahayakAssist } from '@/features/sahayak/SahayakAssistContext';

export function SahayakTargetHighlight() {
  const { guidedAssistMode, guidedTargetId } = useSahayakAssist();
  const [style, setStyle] = useState<{ top: number; left: number; width: number; height: number; visible: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    visible: false,
  });

  useEffect(() => {
    if (!guidedAssistMode || !guidedTargetId) {
      setStyle(s => ({ ...s, visible: false }));
      return;
    }

    const updateHighlight = () => {
      const el = document.getElementById(guidedTargetId);
      if (!el) {
        setStyle(s => ({ ...s, visible: false }));
        return;
      }

      const rect = el.getBoundingClientRect();
      setStyle({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        visible: true,
      });
    };

    updateHighlight();
    const interval = setInterval(updateHighlight, 300);
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [guidedAssistMode, guidedTargetId]);

  if (!guidedAssistMode || !style.visible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: `${style.top - 4}px`,
        left: `${style.left - 4}px`,
        width: `${style.width + 8}px`,
        height: `${style.height + 8}px`,
        zIndex: 9990,
        pointerEvents: 'none',
      }}
      className="border-2 border-teal-600 ring-4 ring-teal-600/10 rounded-2xl transition-all duration-300 pointer-events-none"
    />
  );
}
