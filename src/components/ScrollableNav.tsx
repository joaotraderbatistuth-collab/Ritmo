import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Container de rolagem horizontal com setas clicáveis e degradê nas bordas,
 * deixando claro que o menu continua para os lados.
 */
export const ScrollableNav: React.FC<{ children: React.ReactNode; dark?: boolean }> = ({ children, dark = true }) => {
  const fadeL = dark ? 'from-[#0d1117] via-[#0d1117]/90' : 'from-[#f6f8fa] via-[#f6f8fa]/90';
  const fadeR = dark ? 'from-[#0d1117] via-[#0d1117]/90' : 'from-[#f6f8fa] via-[#f6f8fa]/90';
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    const el = ref.current;
    window.addEventListener('resize', update);
    const ro = typeof ResizeObserver !== 'undefined' && el ? new ResizeObserver(update) : null;
    if (ro && el) ro.observe(el);
    return () => {
      window.removeEventListener('resize', update);
      ro?.disconnect();
    };
  }, []);

  const scrollBy = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.6), behavior: 'smooth' });
  };

  const arrow =
    'absolute top-0 bottom-2 z-10 flex items-center px-1.5 text-emerald-400 hover:text-emerald-300';

  return (
    <div className="relative mb-6 border-b border-[#30363d]">
      {canLeft && (
        <button
          type="button"
          aria-label="Ver opções anteriores"
          onClick={() => scrollBy(-1)}
          className={`${arrow} left-0 bg-gradient-to-r ${fadeL} to-transparent pr-6`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <div ref={ref} onScroll={update} className="overflow-x-auto pb-2 scroll-smooth">
        {children}
      </div>
      {canRight && (
        <button
          type="button"
          aria-label="Ver mais opções"
          onClick={() => scrollBy(1)}
          className={`${arrow} right-0 bg-gradient-to-l ${fadeR} to-transparent pl-6`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
