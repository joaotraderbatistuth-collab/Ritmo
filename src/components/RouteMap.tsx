import React, { useEffect, useRef, useState } from 'react';

// Mapa com a rota do treino (Leaflet). Carregado só no navegador.
// No modo "ao vivo", acompanha a posição atual. O CSS do Leaflet vem do styles.css.
//
// Ruas: tenta o mapa escuro do CARTO; se ele não responder no aparelho, troca sozinho para o
// OpenStreetMap (escurecido por CSS). Assim o mapa nunca fica só cinza.

const OSM_LINK = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
const PROVIDERS = [
  { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', opts: { subdomains: 'abcd', attribution: `${OSM_LINK} &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>` }, darken: false },
  { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', opts: { attribution: OSM_LINK }, darken: true },
];

export interface LatLng {
  lat: number;
  lng: number;
}

export const RouteMap: React.FC<{
  /** Trechos da rota (cada pausa começa um trecho novo). */
  segments: LatLng[][];
  /** Posição atual (ponto azul com a precisão em volta). */
  current?: (LatLng & { acc?: number | null }) | null;
  /** Segue a posição atual em vez de enquadrar a rota inteira. */
  live?: boolean;
  className?: string;
}> = ({ segments, current, live = false, className = 'h-72' }) => {
  const el = useRef<HTMLDivElement>(null);
  const api = useRef<any>(null);
  const fitted = useRef(false);
  // sempre desenha com as props mais novas (o Leaflet carrega depois do primeiro render)
  const props = useRef({ segments, current, live });
  props.current = { segments, current, live };
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [darken, setDarken] = useState(false);

  useEffect(() => {
    let disposed = false;
    let ro: ResizeObserver | null = null;
    setStatus('loading');
    (async () => {
      try {
        const mod: any = await import('leaflet');
        const L = mod.default || mod;
        if (disposed || !el.current) return;
        const map = L.map(el.current, { zoomControl: false, attributionControl: true, preferCanvas: true });
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // ruas, com troca automática de servidor se o primeiro falhar
        let provider = 0;
        let loaded = 0;
        let errors = 0;
        let layer: any = null;
        const useProvider = (i: number) => {
          if (layer) layer.remove();
          const pv = PROVIDERS[i];
          layer = L.tileLayer(pv.url, { maxZoom: 19, ...pv.opts });
          layer.on('tileload', () => {
            loaded++;
          });
          layer.on('tileerror', () => {
            errors++;
            if (loaded === 0 && errors >= 4 && provider < PROVIDERS.length - 1) {
              provider++;
              errors = 0;
              useProvider(provider);
            }
          });
          layer.addTo(map);
          setDarken(pv.darken);
        };
        useProvider(0);

        map.setView([-14.235, -51.925], 4); // Brasil, até chegar a primeira posição
        api.current = {
          L,
          map,
          lines: L.layerGroup().addTo(map),
          marks: L.layerGroup().addTo(map),
          me: null as any,
          meAcc: null as any,
        };
        // o tamanho do mapa pode mudar depois de montar (aba abrindo, celular girando)
        ro = new ResizeObserver(() => map.invalidateSize());
        ro.observe(el.current);
        setTimeout(() => !disposed && map.invalidateSize(), 250);
        setStatus('ready');
        draw();
      } catch (e) {
        console.error('[mapa]', e);
        if (!disposed) setStatus('failed');
      }
    })();
    return () => {
      disposed = true;
      ro?.disconnect();
      api.current?.map.remove();
      api.current = null;
      fitted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const draw = () => {
    const a = api.current;
    if (!a) return;
    const { segments, current, live } = props.current;
    const { L, map } = a;
    a.lines.clearLayers();
    a.marks.clearLayers();
    const all: [number, number][] = [];
    for (const seg of segments) {
      if (seg.length < 1) continue;
      const ll = seg.map((p) => [p.lat, p.lng] as [number, number]);
      all.push(...ll);
      // contorno + linha (fica legível em cima do mapa)
      L.polyline(ll, { color: '#052e1f', weight: 9, opacity: 0.6, lineCap: 'round', lineJoin: 'round' }).addTo(a.lines);
      L.polyline(ll, { color: '#10b981', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(a.lines);
    }
    if (all.length) {
      L.circleMarker(all[0], { radius: 7, color: '#0d1117', weight: 3, fillColor: '#10b981', fillOpacity: 1 }).bindTooltip('Início').addTo(a.marks);
      if (!live && all.length > 1) L.circleMarker(all[all.length - 1], { radius: 7, color: '#0d1117', weight: 3, fillColor: '#f43f5e', fillOpacity: 1 }).bindTooltip('Fim').addTo(a.marks);
    }

    if (current) {
      const pos: [number, number] = [current.lat, current.lng];
      if (!a.me) {
        a.meAcc = L.circle(pos, { radius: current.acc || 10, color: '#38bdf8', weight: 1, opacity: 0.5, fillColor: '#38bdf8', fillOpacity: 0.12 }).addTo(map);
        a.me = L.circleMarker(pos, { radius: 8, color: '#ffffff', weight: 3, fillColor: '#0ea5e9', fillOpacity: 1 }).addTo(map);
      } else {
        a.me.setLatLng(pos);
        a.meAcc.setLatLng(pos).setRadius(current.acc || 10);
      }
    } else if (a.me) {
      a.me.remove();
      a.meAcc.remove();
      a.me = a.meAcc = null;
    }

    if (live) {
      const target = current ? [current.lat, current.lng] : all[all.length - 1];
      if (target) map.setView(target, Math.max(map.getZoom(), 16), { animate: true });
    } else if (all.length > 1 && !fitted.current) {
      map.fitBounds(L.latLngBounds(all), { padding: [28, 28] });
      fitted.current = true;
    } else if (all.length === 1 && !fitted.current) {
      map.setView(all[0], 16);
      fitted.current = true;
    }
  };

  useEffect(draw);

  const waitingGps = live && !current && segments.every((s) => s.length === 0);
  return (
    <div className={`relative isolate w-full ${className}`}>
      <div ref={el} className={`absolute inset-0 rounded-2xl overflow-hidden border border-[#30363d] bg-[#161b22] ${darken ? 'ritmo-map-darken' : ''}`} role="img" aria-label="Mapa do treino" />
      {status === 'loading' && <div className="absolute inset-0 z-[500] flex items-center justify-center rounded-2xl bg-[#161b22] text-sm text-[#8b949e] pointer-events-none">Carregando o mapa...</div>}
      {status === 'failed' && (
        <button type="button" onClick={() => setAttempt((n) => n + 1)} className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#161b22] text-sm text-[#c9d1d9]">
          Não foi possível abrir o mapa.
          <span className="text-emerald-400 font-semibold underline">Tentar de novo</span>
        </button>
      )}
      {status === 'ready' && waitingGps && (
        <div className="absolute left-1/2 -translate-x-1/2 top-3 z-[500] px-3 py-1.5 rounded-full bg-[#0d1117]/90 border border-[#30363d] text-xs text-[#c9d1d9] pointer-events-none whitespace-nowrap">Procurando sua localização...</div>
      )}
    </div>
  );
};
