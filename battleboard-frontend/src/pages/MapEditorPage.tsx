import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mapService } from '../services/mapService';
import { toast } from '../utils/toast';
import type { GameMap } from '../types';

const GRID = 48;

type Tool =
  | 'wall' | 'door' | 'trap'
  | 'water' | 'mud' | 'sand'
  | 'fire' | 'tree' | 'chest'
  | 'table' | 'chair'
  | 'erase';

interface MapData {
  walls: [number, number][];
  doors: [number, number][];
  traps: [number, number][];
  water: [number, number][];
  mud: [number, number][];
  sand: [number, number][];
  fire: [number, number][];
  tree: [number, number][];
  chest: [number, number][];
  table: [number, number][];
  chair: [number, number][];
}

const INITIAL_MAP_DATA: MapData = {
  walls: [], doors: [], traps: [],
  water: [], mud: [], sand: [],
  fire: [], tree: [], chest: [],
  table: [], chair: []
};

const BIOME_COLORS: Record<string, { base: string; alt: string; grid: string; detail: string }> = {
  CAVE:     { base: '#1a1510', alt: '#12100a', grid: 'rgba(201,147,58,0.1)', detail: '#261f18' },
  FOREST:   { base: '#0d1a0d', alt: '#0a1408', grid: 'rgba(45,122,58,0.2)', detail: '#1b381b' },
  OCEAN:    { base: '#080d1a', alt: '#060a14', grid: 'rgba(42,96,128,0.15)', detail: '#101b33' },
  DESERT:   { base: '#1a1508', alt: '#141006', grid: 'rgba(210,180,80,0.15)', detail: '#29210d' },
  MOUNTAIN: { base: '#121212', alt: '#0d0d0d', grid: 'rgba(180,180,180,0.1)',  detail: '#1f1f1f' },
  CITY:     { base: '#141419', alt: '#0f0f14', grid: 'rgba(100,120,200,0.12)', detail: '#22222b' },
  DUNGEON:  { base: '#100a0a', alt: '#0a0606', grid: 'rgba(139,26,26,0.15)',  detail: '#1f1414' },
};

function MapEditorPage() {
  const { mapId } = useParams<{ mapId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [map, setMap] = useState<GameMap | null>(null);
  const [tool, setTool] = useState<Tool>('wall');
  const [mapData, setMapData] = useState<MapData>(INITIAL_MAP_DATA);
  const [isDrawing, setIsDrawing] = useState(false);
  const [saved, setSaved] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 50, y: 50 }); // Početni mali odmak da mapa ne bude zalepljena za ivicu
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
        setMap(m);
        if (m.mapData) {
          try {
            const parsed = JSON.parse(m.mapData);
            setMapData({ ...INITIAL_MAP_DATA, ...parsed });
          } catch {
            toast.error("Greška pri učitavanju podataka mape");
          }
        }
        if (!m.cellWidth || !m.cellHeight || m.cellWidth <= 0 || m.cellHeight <= 0) {
          setError(`Mapa ima neispravne dimenzije: ${m.cellWidth} x ${m.cellHeight}`);
        }
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Greška pri učitavanju mape");
        setError(err.message || 'Neuspješno učitavanje mape');
        setLoading(false);
      });
  }, [mapId]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    if (w === 0 || h === 0) {
      requestAnimationFrame(() => draw());
      return;
    }
    canvas.width = w;
    canvas.height = h;

    if (!map || error) {
      ctx.fillStyle = '#c9933a';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(error || 'Nema podataka o mapi', w/2, h/2);
      return;
    }

    const colors = BIOME_COLORS[map.biome] || BIOME_COLORS.CAVE;
    const GS = GRID * zoom;

    // --- SLOJ 1: Teksturisana pozadina biomu ---
    for (let r = 0; r < map.cellHeight; r++) {
      for (let c = 0; c < map.cellWidth; c++) {
        const x = c * GS + pan.x;
        const y = r * GS + pan.y;

        const seed = (r * 7 + c * 13) % 7;
        const subSeed = (r * 11 + c * 19) % 4;

        // Baza
        ctx.fillStyle = seed < 3 ? colors.base : colors.alt;
        ctx.fillRect(x, y, GS, GS);

        // Teksturisanje na osnovu specifičnog bioma
        ctx.strokeStyle = colors.detail;
        ctx.fillStyle = colors.detail;
        ctx.lineWidth = Math.max(0.5, zoom);

        if (map.biome === 'FOREST') {
          if (seed % 2 === 0) {
            ctx.beginPath();
            ctx.moveTo(x + GS * 0.3, y + GS * 0.7);
            ctx.lineTo(x + GS * 0.3, y + GS * 0.45);
            ctx.moveTo(x + GS * 0.3, y + GS * 0.7);
            ctx.lineTo(x + GS * 0.15, y + GS * 0.5);
            ctx.moveTo(x + GS * 0.3, y + GS * 0.7);
            ctx.lineTo(x + GS * 0.45, y + GS * 0.55);
            ctx.stroke();
          }
          if (seed === 5) {
            ctx.beginPath();
            ctx.arc(x + GS * 0.7, y + GS * 0.3, GS * 0.06, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (map.biome === 'CAVE' || map.biome === 'MOUNTAIN') {
          if (seed === 0) {
            ctx.beginPath();
            ctx.arc(x + GS*0.5, y + GS*0.5, GS*0.1, 0, Math.PI * 2);
            ctx.fill();
          } else if (seed === 5) {
            ctx.beginPath();
            ctx.moveTo(x + GS*0.2, y + GS*0.2); ctx.lineTo(x + GS*0.4, y + GS*0.3); ctx.lineTo(x + GS*0.5, y + GS*0.1);
            ctx.stroke();
          }
        } else if (map.biome === 'DUNGEON' || map.biome === 'CITY') {
          ctx.strokeRect(x + 1, y + 1, GS - 2, GS - 2);
          if (map.biome === 'CITY' && subSeed === 0) {
            ctx.beginPath();
            ctx.moveTo(x, y + GS*0.5); ctx.lineTo(x + GS, y + GS*0.5);
            ctx.stroke();
          }
        } else if (map.biome === 'DESERT') {
          if (seed === 1) {
            ctx.beginPath();
            ctx.arc(x + GS*0.5, y + GS, GS*0.5, Math.PI, Math.PI * 1.5);
            ctx.stroke();
          }
          ctx.fillRect(x + GS*0.3, y + GS*0.4, 1.5, 1.5);
          ctx.fillRect(x + GS*0.7, y + GS*0.8, 1.5, 1.5);
        } else if (map.biome === 'OCEAN') {
          if (seed % 3 === 0) {
            ctx.beginPath();
            ctx.moveTo(x + GS*0.2, y + GS*0.5);
            ctx.bezierCurveTo(x + GS*0.4, y + GS*0.4, x + GS*0.6, y + GS*0.6, x + GS*0.8, y + GS*0.5);
            ctx.stroke();
          }
        }
      }
    }

    // --- SLOJ 2: Terenski elementi (Pesak, Blato, Voda) ---
    mapData.sand?.forEach(([c, r]) => {
      const x = c * GS + pan.x, y = r * GS + pan.y;
      ctx.fillStyle = '#e2c98a';
      ctx.fillRect(x, y, GS, GS);
      ctx.fillStyle = '#cbb067';
      ctx.fillRect(x + GS*0.2, y + GS*0.3, 2, 2);
      ctx.fillRect(x + GS*0.7, y + GS*0.6, 2, 2);
    });

    mapData.mud?.forEach(([c, r]) => {
      const x = c * GS + pan.x, y = r * GS + pan.y;
      ctx.fillStyle = '#4a3319';
      ctx.fillRect(x, y, GS, GS);
      ctx.strokeStyle = '#362410';
      ctx.lineWidth = 2 * zoom;
      ctx.beginPath();
      ctx.arc(x + GS*0.5, y + GS*0.5, GS*0.3, 0, Math.PI, true);
      ctx.stroke();
    });

    mapData.water?.forEach(([c, r]) => {
      const x = c * GS + pan.x, y = r * GS + pan.y;
      ctx.save();
      ctx.fillStyle = '#12233c';
      ctx.fillRect(x, y, GS, GS);
      const grad = ctx.createRadialGradient(x + GS/2, y + GS/2, GS * 0.1, x + GS/2, y + GS/2, GS * 0.5);
      grad.addColorStop(0, '#1d3557');
      grad.addColorStop(1, '#12233c');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, GS, GS);
      ctx.strokeStyle = 'rgba(69, 123, 157, 0.4)';
      ctx.lineWidth = Math.max(1, 1.5 * zoom);
      ctx.beginPath();
      ctx.moveTo(x + GS * 0.1, y + GS * 0.4);
      ctx.quadraticCurveTo(x + GS * 0.3, y + GS * 0.2, x + GS * 0.5, y + GS * 0.4);
      ctx.quadraticCurveTo(x + GS * 0.7, y + GS * 0.6, x + GS * 0.9, y + GS * 0.4);
      ctx.stroke();
      ctx.restore();
    });

    // --- SLOJ 3: Mreža (Grid) ---
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

    // --- SLOJ 4: Strukture (Zidovi, Vrata) ---
    mapData.walls.forEach(([c, r]) => {
      const x = c * GS + pan.x, y = r * GS + pan.y;
      ctx.fillStyle = '#2c1e15';
      ctx.fillRect(x, y, GS, GS);
      ctx.strokeStyle = '#402d20';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 1, y + 1, GS - 2, GS - 2);
      ctx.beginPath();
      ctx.moveTo(x, y + GS*0.5); ctx.lineTo(x + GS, y + GS*0.5);
      ctx.moveTo(x + GS*0.5, y); ctx.lineTo(x + GS*0.5, y + GS*0.5);
      ctx.stroke();
    });

    mapData.doors.forEach(([c, r]) => {
      const x = c * GS + pan.x, y = r * GS + pan.y;
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(x + GS * 0.15, y + GS * 0.15, GS * 0.7, GS * 0.7);
      ctx.strokeStyle = '#5c3a1a';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + GS * 0.15, y + GS * 0.15, GS * 0.7, GS * 0.7);
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath(); ctx.arc(x + GS*0.5, y + GS*0.5, GS*0.08, 0, Math.PI*2); ctx.fill();
    });

    // --- SLOJ 5: Nameštaj i Kovčezi ---
    mapData.table?.forEach(([c, r]) => {
      const x = c * GS + pan.x, y = r * GS + pan.y;
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(x + GS*0.05, y + GS*0.1, GS*0.9, GS*0.8);
      ctx.strokeStyle = '#5c3a1a';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + GS*0.05, y + GS*0.1, GS*0.9, GS*0.8);
    });

    mapData.chair?.forEach(([c, r]) => {
      const x = c * GS + pan.x, y = r * GS + pan.y;
      ctx.fillStyle = '#cd853f';
      ctx.beginPath();
      ctx.arc(x + GS*0.5, y + GS*0.5, GS*0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8b5a2b';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + GS*0.5, y + GS*0.5, GS*0.25, Math.PI, 0);
      ctx.stroke();
    });

    mapData.chest?.forEach(([c, r]) => {
      const x = c * GS + pan.x, y = r * GS + pan.y;
      ctx.fillStyle = '#5c3a1a';
      ctx.fillRect(x + GS*0.15, y + GS*0.25, GS*0.7, GS*0.5);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(x + GS*0.2, y + GS*0.25, GS*0.1, GS*0.5);
      ctx.fillRect(x + GS*0.7, y + GS*0.25, GS*0.1, GS*0.5);
      ctx.fillRect(x + GS*0.42, y + GS*0.4, GS*0.16, GS*0.2);
    });

    // --- SLOJ 6: Opasnosti, Efekti i Krošnje ---
    mapData.traps.forEach(([c, r]) => {
      const x = c * GS + pan.x, y = r * GS + pan.y;
      ctx.fillStyle = 'rgba(192, 57, 43, 0.8)';
      ctx.font = `bold ${Math.floor(GS * 0.5)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('✕', x + GS / 2, y + GS / 2);
    });

    mapData.fire?.forEach(([c, r]) => {
      const x = c * GS + pan.x, y = r * GS + pan.y;
      ctx.fillStyle = 'rgba(230, 126, 34, 0.3)';
      ctx.beginPath(); ctx.arc(x + GS*0.5, y + GS*0.5, GS*0.45, 0, Math.PI*2); ctx.fill();
      ctx.font = `${Math.floor(GS * 0.65)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🔥', x + GS / 2, y + GS / 2 - 2);
    });

    mapData.tree?.forEach(([c, r]) => {
      const x = c * GS + pan.x, y = r * GS + pan.y;
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath(); ctx.arc(x + GS * 0.56, y + GS * 0.56, GS * 0.52, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5c3a21';
      ctx.beginPath(); ctx.arc(x + GS * 0.5, y + GS * 0.5, GS * 0.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e5e3a';
      ctx.beginPath(); ctx.arc(x + GS * 0.5, y + GS * 0.5, GS * 0.52, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2d7a3a';
      ctx.beginPath(); ctx.arc(x + GS * 0.46, y + GS * 0.46, GS * 0.38, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4fa860';
      ctx.beginPath(); ctx.arc(x + GS * 0.42, y + GS * 0.42, GS * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

  }, [map, mapData, zoom, pan, error]);

  useEffect(() => { draw(); }, [draw]);

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
      const next: MapData = {
        walls: [...prev.walls], doors: [...prev.doors], traps: [...prev.traps],
        water: [...(prev.water || [])], mud: [...(prev.mud || [])], sand: [...(prev.sand || [])],
        fire: [...(prev.fire || [])], tree: [...(prev.tree || [])], chest: [...(prev.chest || [])],
        table: [...(prev.table || [])], chair: [...(prev.chair || [])]
      };

      const keys = Object.keys(next) as Array<keyof MapData>;

      keys.forEach(key => {
        next[key] = next[key].filter(([x, y]) => !(x === c && y === r)) as any;
      });

      if (tool === 'erase') return next;

      const currentLayer = `${tool}s` === 'walls' || `${tool}s` === 'doors' || `${tool}s` === 'traps'
        ? (`${tool}s` as keyof MapData)
        : (tool as keyof MapData);

      if (next[currentLayer]) {
        (next[currentLayer] as [number, number][]).push([c, r]);
      }

      return next;
    });
    setSaved(false);
  };

  // --- POPRAVLJENE KONTROLE ZA PANINOVANJE (POMERANJE) MAPE ---
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Pomeranje radi na: Desni klik (button 2), Srednji klik/Točkić (button 1) ili Alt + Levi klik
    if (e.button === 2 || e.button === 1 || e.altKey) {
      e.preventDefault();
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      lastPanRef.current = { ...pan };
      return;
    }

    // Levi klik aktivira crtanje alatom
    if (e.button === 0) {
      setIsDrawing(true);
      const cell = getCellFromEvent(e);
      if (cell) applyTool(cell);
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      // Izračunaj pomeraj i ukloni restrikcije granica kako bi korisnik mogao slobodno "skrolovati" u stranu
      setPan({
        x: lastPanRef.current.x + e.clientX - panStartRef.current.x,
        y: lastPanRef.current.y + e.clientY - panStartRef.current.y
      });
      return;
    }
    if (!isDrawing) return;
    const cell = getCellFromEvent(e);
    if (cell) applyTool(cell);
  };

  const onMouseUp = (_e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    isPanningRef.current = false;
  };

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
        backgroundImgUrl: map.backgroundImgUrl || "",
        cellSize: map.cellSize,
        cellWidth: map.cellWidth,
        cellHeight: map.cellHeight,
        mapData: JSON.stringify(mapData),
      });
      setSaved(true);
    } catch {
      toast.error("Greška pri čuvanju mape");
    }
  };

  const handleClear = () => {
    if(window.confirm("Da li ste sigurni da želite očistiti cijelu mapu?")) {
      setMapData(INITIAL_MAP_DATA);
      setSaved(false);
    }
  };

  const TOOLS = [
    { id: 'wall', label: '⬛ Zid', color: '#2c1e15' },
    { id: 'door', label: '🚪 Vrata', color: '#8b5a2b' },
    { id: 'trap', label: '✕ Zamka', color: '#c0392b' },
    { id: 'water', label: '💧 Voda', color: '#2980b9' },
    { id: 'mud', label: '🟫 Blato', color: '#4a3319' },
    { id: 'sand', label: '⏳ Pesak', color: '#e2c98a' },
    { id: 'fire', label: '🔥 Vatra', color: '#e67e22' },
    { id: 'tree', label: '🌳 Drvo', color: '#28a745' },
    { id: 'chest', label: '📦 Kovčeg', color: '#5c3a1a' },
    { id: 'table', label: '🟨 Sto', color: '#a0522d' },
    { id: 'chair', label: '🪑 Stolica', color: '#cd853f' },
    { id: 'erase', label: '✦ Briši', color: '#555' },
  ];

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

  return (
    <div style={{ height: '100vh', background: '#0d0a06', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
      <div style={{ background: '#12100a', borderBottom: '1px solid rgba(201,147,58,0.25)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', padding: '8px 16px', gap: '12px' }}>
        <span style={{ color: '#c9933a', fontFamily: 'serif', fontWeight: 700, letterSpacing: '0.1em' }}>⚔ Map Editor</span>
        <span style={{ color: 'rgba(244,237,216,0.45)', fontSize: '13px' }}>{map?.name}</span>
        <span style={{ fontSize: '11px', color: map?.biome ? '#c9933a' : '#555', fontFamily: 'serif', background: 'rgba(201,147,58,0.05)', padding: '2px 6px', borderRadius: '3px' }}>{map?.biome}</span>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginLeft: '8px' }}>
          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id as Tool)}
              style={{
                background: tool === t.id ? 'rgba(201,147,58,0.25)' : 'rgba(0,0,0,0.4)',
                border: `1px solid ${tool === t.id ? '#c9933a' : 'rgba(201,147,58,0.2)'}`,
                borderRadius: '4px',
                padding: '6px 10px',
                color: tool === t.id ? '#f5d485' : 'rgba(244,237,216,0.6)',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'serif',
                transition: 'all 0.15s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: 'auto' }}>
          <button onClick={() => setZoom(z => Math.min(2.5, z + 0.1))} style={hBtnStyle}>+</button>
          <span style={{ color: 'rgba(244,237,216,0.5)', fontSize: '11px', minWidth: '36px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} style={hBtnStyle}>−</button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
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
  padding: '6px 10px',
  color: '#f5d485',
  fontSize: '12px',
  cursor: 'pointer',
};

export default MapEditorPage;
