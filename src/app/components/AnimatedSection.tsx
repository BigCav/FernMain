import { useRef, useEffect, useState, useLayoutEffect } from 'react';

interface Props {
  open: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedSection({ open, children, className }: Props) {
  const innerRef = useRef<HTMLDivElement>(null);

  // Defer the animated state by one rAF so the browser paints opacity:0
  // first, giving CSS transitions a real "from" value to animate from.
  const [animOpen, setAnimOpen] = useState(open);
  useLayoutEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setAnimOpen(true));
      return () => cancelAnimationFrame(id);
    } else {
      setAnimOpen(false);
    }
  }, [open]);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    if (!open) {
      el.style.pointerEvents = 'none';
    } else {
      const t = setTimeout(() => { el.style.pointerEvents = ''; }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateRows: animOpen ? '1fr' : '0fr',
        opacity: animOpen ? 1 : 0,
        transition: 'grid-template-rows 0.26s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s ease',
      }}
    >
      <div
        ref={innerRef}
        style={{ overflow: 'hidden' }}
      >
        {children}
      </div>
    </div>
  );
}
