import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mapService } from '../services/mapService';
import type { GameMap } from '../types';

const GRID = 48;

type Tool = 'wall' | 'door' | 'trap' | 'erase';

interface MapData {
  walls: [number, number][];
  doors: [number, number][];
  traps: [number, number][];
}

const BIOME_COLORS: Record<string, { base: string; alt: string; grid: string }> = {
  CAVE:     { base: '#1a1510', alt: '#12100a', grid: 'rgba(201,147,58,0.12)' },
  FOREST:   { base: '#0d1a0d', alt: '#0a1408', grid: 'rgba(45,122,58,0.2)' },
  OCEAN:    { base: '#080d1a', alt: '#060a14', grid: 'rgba(42,96,128,0.2)' },
  DESERT:   { base: '#1a1508', alt: '#141006', grid: 'rgba(210,180,80,0.2)' },
  MOUNTAIN: { base: '#121212', alt: '#0d0d0d', grid: 'rgba(180,180,180,0.15)' },
  CITY:     { base: '#0f0f14', alt: '#0a0a10', grid: 'rgba(100,120,200,0.15)' },
  DUNGEON:  { base: '#100a0a', alt: '#0a0606', grid: 'rgba(139,26,26,0.2)' },
};

function MapEditorPage() {
  const { mapId } = useParams<{ mapId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [map, setMap] = useState<GameMap | null>(null);
  const [tool, setTool] = useState<Tool>('wall');
  const [mapData, setMapData] = useState<MapData>({ walls: [], doors: [], traps: [] });
  const [isDrawing, setIsDrawing] = useState(false);
  const [saved, setSaved] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const lastPanRef = useRef({ x: 0, y: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapId) {
      setError('Nedostaje ID mape u URL-u');
      setLoading(false);
      return;
    }
    mapService.getMap(mapId)
      .then((m: GameMap) => {
        console.log('Učitana mapa:', m); // 👈 pogledaj u konzoli
        setMap(m);
        if (m.mapData) {
          try { setMapData(JSON.parse(m.mapData)); } catch (e) {
            console.error('Greška pri parsiranju mapData', e);
          }
        }
        // Provera validnosti dimenzija odmah nakon učitavanja
        if (!m.cellWidth || !m.cellHeight || m.cellWidth <= 0 || m.cellHeight <= 0) {
          setError(`Mapa ima neispravne dimenzije: ${m.cellWidth} x ${m.cellHeight}`);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Greška pri učitavanju mape', err);
        setError(err.message || 'Neuspješno učitavanje mape');
        setLoading(false);
      });
  }, [mapId]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Osiguraj da canvas ima fizičke dimenzije (ako su 0, postavi privremene)
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    if (w === 0 || h === 0) {
      // Canvas još nije vidljiv – pokušaj ponovo kasnije
      requestAnimationFrame(() => draw());
      return;
    }
    canvas.width = w;
    canvas.height = h;

    // Ako nema mape ili imamo error, ne crtaj mapu nego samo poruku
    if (!map || error) {
      ctx.fillStyle = '#c9933a';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(error || 'Nema podataka o mapi', w/2, h/2);
      return;
    }

    // Ako su dimenzije neispravne (trebalo bi da je uhvaćeno u error state, ali dodatna zaštita)
    if (!map.cellWidth || !map.cellHeight || map.cellWidth <= 0 || map.cellHeight <= 0) {
      ctx.fillStyle = '#c0392b';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Neispravne dimenzije mape: ${map.cellWidth} x ${map.cellHeight}`, w/2, h/2);
      return;
    }

    const colors = BIOME_COLORS[map.biome] || BIOME_COLORS.CAVE;
    const GS = GRID * zoom;

    // Pozadina
    for (let r = 0; r < map.cellHeight; r++) {
      for (let c = 0; c < map.cellWidth; c++) {
        const x = c * GS + pan.x;
        const y = r * GS + pan.y;
        const seed = (r * 7 + c * 13) % 5;
        ctx.fillStyle = seed < 2 ? colors.alt : colors.base;
        ctx.fillRect(x, y, GS, GS);
        if (seed === 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.08)';
          ctx.fillRect(x + 2, y + 2, GS - 4, GS - 4);
        }
      }
    }

    // Grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= map.cellWidth; c++) {
      const x = c * GS + pan.x;
      ctx.beginPath(); ctx.moveTo(x, pan.y); ctx.lineTo(x, map.cellHeight * GS + pan.y); ctx.stroke();
    }
    for (let r = 0; r <= map.cellHeight; r++) {
      const y = r * GS + pan.y;
      ctx.beginPath(); ctx.moveTo(pan.x, y); ctx.lineTo(map.cellWidth * GS + pan.x, y); ctx.stroke();
    }

    // Zidovi
    mapData.walls.forEach(([c, r]) => {
      ctx.fillStyle = 'rgba(60,40,20,0.95)';
      ctx.fillRect(c * GS + pan.x, r * GS + pan.y, GS, GS);
      ctx.strokeStyle = 'rgba(100,70,30,0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(c * GS + pan.x + 0.5, r * GS + pan.y + 0.5, GS - 1, GS - 1);
    });

    // Vrata
    mapData.doors.forEach(([c, r]) => {
      const x = c * GS + pan.x, y = r * GS + pan.y;
      ctx.fillStyle = 'rgba(139,90,43,0.7)';
      ctx.fillRect(x + GS * 0.1, y + GS * 0.2, GS * 0.8, GS * 0.6);
      ctx.strokeStyle = '#8b5a2b';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + GS * 0.1, y + GS * 0.2, GS * 0.8, GS * 0.6);
      ctx.fillStyle = '#f5d485';
      ctx.font = `bold ${Math.floor(GS * 0.4)}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('D', x + GS / 2, y + GS / 2);
    });

    // Zamke
    mapData.traps.forEach(([c, r]) => {
      const x = c * GS + pan.x, y = r * GS + pan.y;
      ctx.fillStyle = '#c0392b';
      ctx.font = `bold ${Math.floor(GS * 0.5)}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('✕', x + GS / 2, y + GS / 2);
    });
  }, [map, mapData, zoom, pan, error]);

  useEffect(() => { draw(); }, [draw]);

  // Resize observer da ponovo crtamo kada se promeni veličina prozora
  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const getCellFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const c = Math.floor((x - pan.x) / (GRID * zoom));
    const r = Math.floor((y - pan.y) / (GRID * zoom));
    if (!map || c < 0 || r < 0 || c >= map.cellWidth || r >= map.cellHeight) return null;
    return [c, r] as [number, number];
  };

  const applyTool = (cell: [number, number]) => {
    const [c, r] = cell;
    setMapData(prev => {
      const next = { ...prev, walls: [...prev.walls], doors: [...prev.doors], traps: [...prev.traps] };
      const key = (arr: [number,number][]) => arr.some(([x,y]) => x === c && y === r);

      if (tool === 'erase') {
        next.walls = next.walls.filter(([x,y]) => !(x === c && y === r));
        next.doors = next.doors.filter(([x,y]) => !(x === c && y === r));
        next.traps = next.traps.filter(([x,y]) => !(x === c && y === r));
      } else if (tool === 'wall' && !key(next.walls)) {
        next.doors = next.doors.filter(([x,y]) => !(x === c && y === r));
        next.traps = next.traps.filter(([x,y]) => !(x === c && y === r));
        next.walls.push([c, r]);
      } else if (tool === 'door' && !key(next.doors)) {
        next.walls = next.walls.filter(([x,y]) => !(x === c && y === r));
        next.traps = next.traps.filter(([x,y]) => !(x === c && y === r));
        next.doors.push([c, r]);
      } else if (tool === 'trap' && !key(next.traps)) {
        next.walls = next.walls.filter(([x,y]) => !(x === c && y === r));
        next.doors = next.doors.filter(([x,y]) => !(x === c && y === r));
        next.traps.push([c, r]);
      }
      return next;
    });
    setSaved(false);
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2 || e.altKey) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      lastPanRef.current = { ...pan };
      return;
    }
    setIsDrawing(true);
    const cell = getCellFromEvent(e);
    if (cell) applyTool(cell);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      setPan({ x: lastPanRef.current.x + e.clientX - panStartRef.current.x, y: lastPanRef.current.y + e.clientY - panStartRef.current.y });
      return;
    }
    if (!isDrawing) return;
    const cell = getCellFromEvent(e);
    if (cell) applyTool(cell);
  };

  const onMouseUp = () => { setIsDrawing(false); isPanningRef.current = false; };

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(2.5, Math.max(0.3, z * delta)));
  };

  const handleSave = async () => {
    if (!mapId || !map) return;
    try {
      await mapService.updateMap(mapId, {
        name: map.name,
        biome: map.biome,
        backgroundImgUrl: map.backgroundImgUrl || "", // ako je null, pošalji prazan string
        cellSize: map.cellSize,
        cellWidth: map.cellWidth,
        cellHeight: map.cellHeight,
        mapData: JSON.stringify(mapData),
      });
      setSaved(true);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleClear = () => {
    setMapData({ walls: [], doors: [], traps: [] });
    setSaved(false);
  };

  const TOOLS = [
    { id: 'wall', label: '⬛ Zid', color: '#8b7355' },
    { id: 'door', label: 'D Vrata', color: '#8b5a2b' },
    { id: 'trap', label: '✕ Zamka', color: '#c0392b' },
    { id: 'erase', label: '✦ Briši', color: '#555' },
  ];

  // Prikaz učitavanja ili greške (preko celog ekrana)
  if (loading) {
    return (
      <div style={{ height: '100vh', background: '#0d0a06', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#c9933a', fontSize: '18px', fontFamily: 'serif' }}>⏳ Učitavanje mape...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', background: '#0d0a06', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#c0392b', fontSize: '18px', fontFamily: 'monospace', marginBottom: '20px', textAlign: 'center', maxWidth: '80%' }}>
          ⚠️ Greška: {error}
        </div>
        <button onClick={() => navigate('/lobby')} style={hBtnStyle}>← Povratak u Lobby</button>
      </div>
    );
  }

  // Glavni render – samo ako nema greške i mapa je učitana
  return (
    <div style={{ height: '100vh', background: '#0d0a06', display: 'grid', gridTemplateRows: '48px 1fr' }}>
      <div style={{ background: '#12100a', borderBottom: '1px solid rgba(201,147,58,0.25)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px' }}>
        <span style={{ color: '#c9933a', fontFamily: 'serif', fontWeight: 700, letterSpacing: '0.1em' }}>⚔ Map Editor</span>
        <span style={{ color: 'rgba(244,237,216,0.45)', fontSize: '13px' }}>{map?.name}</span>
        <span style={{ fontSize: '11px', color: map?.biome ? '#c9933a' : '#555', fontFamily: 'serif' }}>{map?.biome}</span>

        <div style={{ display: 'flex', gap: '6px', marginLeft: '16px' }}>
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setTool(t.id as Tool)} style={{ background: tool === t.id ? 'rgba(201,147,58,0.2)' : 'rgba(0,0,0,0.3)', border: `1px solid ${tool === t.id ? 'rgba(201,147,58,0.6)' : 'rgba(201,147,58,0.2)'}`, borderRadius: '4px', padding: '4px 12px', color: tool === t.id ? '#f5d485' : 'rgba(244,237,216,0.5)', fontSize: '12px', cursor: 'pointer', fontFamily: 'serif' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: '8px' }}>
          <button onClick={() => setZoom(z => Math.min(2.5, z + 0.1))} style={hBtnStyle}>+</button>
          <span style={{ color: 'rgba(244,237,216,0.5)', fontSize: '11px', minWidth: '36px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} style={hBtnStyle}>−</button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={handleClear} style={{ ...hBtnStyle, color: '#c0392b', borderColor: 'rgba(192,57,43,0.4)' }}>Očisti</button>
          <button onClick={handleSave} style={{ ...hBtnStyle, background: saved ? 'rgba(45,122,58,0.15)' : 'rgba(201,147,58,0.2)', borderColor: saved ? 'rgba(45,122,58,0.4)' : 'rgba(201,147,58,0.6)', color: saved ? '#2d7a3a' : '#f5d485' }}>
            {saved ? '✓ Sačuvano' : 'Sačuvaj'}
          </button>
          <button onClick={() => navigate('/lobby')} style={hBtnStyle}>← Lobby</button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', cursor: tool === 'erase' ? 'cell' : 'crosshair', display: 'block' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onContextMenu={e => e.preventDefault()}
      />
    </div>
  );
}

const hBtnStyle: React.CSSProperties = {
  background: 'rgba(201,147,58,0.1)',
  border: '1px solid rgba(201,147,58,0.3)',
  borderRadius: '4px',
  padding: '4px 10px',
  color: '#f5d485',
  fontSize: '12px',
  cursor: 'pointer',
};

export default MapEditorPage;
