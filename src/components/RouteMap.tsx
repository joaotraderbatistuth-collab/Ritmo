import React, { useEffect, useRef } from 'react';

// Mapa com a rota do treino (Leaflet + mapa escuro do CARTO/OpenStreetMap).
// Carregado só no navegador. No modo "ao vivo", acompanha a posição atual.

const TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>';

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

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = (await import('leaflet')).default;
      // @ts-ignore — CSS carregado sob demanda
      await import('leaflet/dist/leaflet.css');
      if (disposed || !el.current) return;
      const map = L.map(el.current, { zoomControl: false, attributionControl: true, preferCanvas: true });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer(TILES, { maxZoom: 19, subdomains: 'abcd', attribution: ATTRIBUTION, detectRetina: true }).addTo(map);
      map.setView([-14.235, -51.925], 4); // Brasil, até chegar a primeira posição
      api.current = {
        L,
        map,
        lines: L.layerGroup().addTo(map),
        marks: L.layerGroup().addTo(map),
        me: null as any,
        meAcc: null as any,
      };
      draw();
    })();
    return () => {
      disposed = true;
      api.current?.map.remove();
      api.current = null;
      fitted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return <div ref={el} className={`w-full rounded-2xl overflow-hidden border border-[#30363d] bg-[#0d1117] z-0 ${className}`} role="img" aria-label="Mapa do treino" />;
};
