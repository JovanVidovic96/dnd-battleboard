import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tokenService } from "../services/tokenService";
import { diceService } from "../services/diceService";
import type { Token, DiceRoll } from "../types";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { mapService } from '../services/mapService';
import type { GameMap } from '../types';
import { sessionService } from '../services/sessionService';
import { authService } from '../services/authService';
import { toast } from '../utils/toast';

/** Cell-indexed positions for all placeable map elements. Each pair is [column, row]. */
export interface MapData {
  walls: [number, number][];
  doors: [number, number][];
  traps: [number, number][];
  water?: [number, number][];
  mud?: [number, number][];
  sand?: [number, number][];
  fire?: [number, number][];
  tree?: [number, number][];
  chest?: [number, number][];
  table?: [number, number][];
  chair?: [number, number][];
}

export interface Session {
  id: string;
  name: string;
  inviteCode: string;
  hostUsername: string;
  playerCount: number;
  active: boolean;
  activeMapId: string | null;
}

const INITIAL_MAP_DATA: MapData = {
  walls: [], doors: [], traps: [],
  water: [], mud: [], sand: [],
  fire: [], tree: [], chest: [],
  table: [], chair: []
};

/** Draws a stone wall tile with brickwork mortar lines and depth shadow. */
function drawProceduralWall(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#3c3d40';
  ctx.fillRect(x, y, size, size);

  let shadowGrad = ctx.createLinearGradient(x, y, x, y + size);
  shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  shadowGrad.addColorStop(0.2, 'rgba(0, 0, 0, 0)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(x, y, size, size);

  ctx.strokeStyle = '#1c1d1f';
  ctx.lineWidth = Math.max(1, size * 0.04);
  ctx.strokeRect(x, y, size, size);

  ctx.strokeStyle = '#252628';
  ctx.lineWidth = Math.max(1, size * 0.02);

  ctx.beginPath();
  ctx.moveTo(x, y + size / 2);
  ctx.lineTo(x + size, y + size / 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + size / 2, y);
  ctx.lineTo(x + size / 2, y + size / 2);
  ctx.moveTo(x + size * 0.3, y + size / 2);
  ctx.lineTo(x + size * 0.3, y + size);
  ctx.moveTo(x + size * 0.7, y + size / 2);
  ctx.lineTo(x + size * 0.7, y + size);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.moveTo(x + size * 0.1, y + size * 0.15);
  ctx.lineTo(x + size * 0.18, y + size * 0.3);
  ctx.lineTo(x + size * 0.08, y + size * 0.4);
  ctx.stroke();

  ctx.restore();
}

/** Draws a wooden door tile in open or closed state, with frame detail and handle. */
function drawProceduralDoor(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isOpen: boolean) {
  ctx.save();

  if (isOpen) {
    ctx.fillStyle = 'rgba(20, 15, 10, 0.6)';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = 'rgba(201, 147, 58, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
    ctx.setLineDash([]);

    ctx.translate(x, y);
    ctx.fillStyle = '#5a391a';
    ctx.fillRect(0, 0, size * 0.2, size * 0.95);
    ctx.strokeStyle = '#321f0e';
    ctx.strokeRect(0, 0, size * 0.2, size * 0.95);
  } else {
    ctx.fillStyle = '#2d1e10';
    ctx.fillRect(x, y, size, size);

    const padding = size * 0.08;
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);

    ctx.strokeStyle = '#5c3a1a';
    ctx.lineWidth = Math.max(1, size * 0.02);
    const step = (size - padding * 2) / 3;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + padding + i * step, y + padding);
      ctx.lineTo(x + padding + i * step, y + size - padding);
      ctx.stroke();
    }

    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(x + padding, y + size * 0.25, size - padding * 2, size * 0.08);
    ctx.fillRect(x + padding, y + size * 0.65, size - padding * 2, size * 0.08);

    ctx.fillStyle = '#f5d485';
    ctx.beginPath();
    ctx.arc(x + size * 0.75, y + size / 2, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b59342';
    ctx.stroke();
  }

  ctx.restore();
}

/** Draws a trap tile with crossed X spikes and corner anchors. */
function drawProceduralTrap(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#28292b';
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = '#151617';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);

  ctx.strokeStyle = '#3f4145';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + size * 0.15, y + size * 0.15, size * 0.7, size * 0.7);

  ctx.strokeStyle = '#4d1414';
  ctx.beginPath();
  ctx.moveTo(x + size * 0.15, y + size * 0.15); ctx.lineTo(x + size * 0.05, y + size * 0.05);
  ctx.moveTo(x + size * 0.85, y + size * 0.15); ctx.lineTo(x + size * 0.95, y + size * 0.05);
  ctx.moveTo(x + size * 0.15, y + size * 0.85); ctx.lineTo(x + size * 0.05, y + size * 0.95);
  ctx.moveTo(x + size * 0.85, y + size * 0.85); ctx.lineTo(x + size * 0.95, y + size * 0.95);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(192, 57, 43, 0.85)';
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + size * 0.25, y + size * 0.25);
  ctx.lineTo(x + size * 0.75, y + size * 0.75);
  ctx.moveTo(x + size * 0.75, y + size * 0.25);
  ctx.lineTo(x + size * 0.25, y + size * 0.75);
  ctx.stroke();

  ctx.restore();
}

/** Draws a water tile with deep blue fill and ripple strokes. */
function drawProceduralWater(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#1d3557';
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = '#457b9d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + size * 0.2, y + size * 0.3);
  ctx.quadraticCurveTo(x + size * 0.4, y + size * 0.1, x + size * 0.6, y + size * 0.3);
  ctx.moveTo(x + size * 0.4, y + size * 0.7);
  ctx.quadraticCurveTo(x + size * 0.6, y + size * 0.5, x + size * 0.8, y + size * 0.7);
  ctx.stroke();
  ctx.restore();
}

/** Draws a mud tile with dark brown fill and puddle shapes. */
function drawProceduralMud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#36281e';
  ctx.beginPath();
  ctx.arc(x + size * 0.3, y + size * 0.4, size * 0.15, 0, Math.PI * 2);
  ctx.arc(x + size * 0.7, y + size * 0.7, size * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draws a sand tile with warm yellow fill and scattered grain dots. */
function drawProceduralSand(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#e9c46a';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#f4a261';
  for(let i=0; i<4; i++) {
    let px = x + ((i * 13 + 5) % 1) * size;
    let py = y + ((i * 7 + 11) % 1) * size;
    ctx.fillRect(px, py, Math.max(1, size * 0.04), Math.max(1, size * 0.04));
  }
  ctx.restore();
}

/** Draws a fire tile with a radial amber glow and flame silhouette. */
function drawProceduralFire(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  let grad = ctx.createRadialGradient(x+size/2, y+size/2, size*0.1, x+size/2, y+size/2, size*0.4);
  grad.addColorStop(0, '#ffb703');
  grad.addColorStop(0.4, '#fb8500');
  grad.addColorStop(1, 'rgba(211, 47, 47, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, size, size);

  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.moveTo(x + size*0.5, y + size*0.2);
  ctx.quadraticCurveTo(x + size*0.3, y + size*0.5, x + size*0.35, y + size*0.8);
  ctx.lineTo(x + size*0.65, y + size*0.8);
  ctx.quadraticCurveTo(x + size*0.7, y + size*0.5, x + size*0.5, y + size*0.2);
  ctx.fill();
  ctx.restore();
}

/** Draws a tree tile with layered canopy circles and a drop shadow. */
function drawProceduralTree(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.arc(x + size*0.55, y + size*0.55, size * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2a9d8f';
  ctx.beginPath();
  ctx.arc(x + size/2, y + size/2, size * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#264653';
  ctx.beginPath();
  ctx.arc(x + size/2 - size*0.05, y + size/2 - size*0.05, size * 0.38, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#1d3557';
  ctx.globalAlpha = 0.15;
  ctx.fillRect(x, y, size, size);
  ctx.restore();
}

/** Draws a chest tile with wooden body, gold border, and lock clasp. */
function drawProceduralChest(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  const pad = size * 0.15;
  ctx.fillStyle = '#5c3a21';
  ctx.fillRect(x + pad, y + pad * 1.5, size - pad * 2, size - pad * 3);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = Math.max(1, size * 0.05);
  ctx.strokeRect(x + pad, y + pad * 1.5, size - pad * 2, size - pad * 3);
  ctx.fillStyle = '#b58900';
  ctx.fillRect(x + size/2 - size*0.06, y + size/2 - size*0.06, size*0.12, size*0.12);
  ctx.restore();
}

/** Draws a table tile with a wooden plank top and dark outline. */
function drawProceduralTable(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  const pad = size * 0.1;
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(x + pad, y + pad, size - pad * 2, size - pad * 2);
  ctx.strokeStyle = '#5c3a1a';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + pad, y + pad, size - pad * 2, size - pad * 2);
  ctx.restore();
}

/** Draws a chair tile with seat rectangle and backrest bar. */
function drawProceduralChair(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#a0522d';
  ctx.fillRect(x + size * 0.25, y + size * 0.25, size * 0.5, size * 0.5);
  ctx.fillStyle = '#5c3a1a';
  ctx.fillRect(x + size * 0.25, y + size * 0.21, size * 0.5, size * 0.08);
  ctx.restore();
}

const tokenImageCache = new Map<string, HTMLImageElement>();

/** Main battleboard page rendering a canvas-based grid, token panel, fog of war, and dice roller with real-time WebSocket sync. */
function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stompClientRef = useRef<Client | null>(null);

  const [tokens, setTokens] = useState<Token[]>([]);
  const [diceHistory, setDiceHistory] = useState<DiceRoll[]>([]);
  const [formula, setFormula] = useState("1d20");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [activeTool] = useState<"select" | "move">("select");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragTokenRef = useRef<Token | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOriginRef = useRef({ x: 0, y: 0 });
  const [canvasCursor, setCanvasCursor] = useState<string>("grab");
  const [hpChange, setHpChange] = useState(0);
  const [initiativeInput, setInitiativeInput] = useState(0);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(-1);
  const [showMapModal, setShowMapModal] = useState(false);
  const [availableMaps, setAvailableMaps] = useState<GameMap[]>([]);
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [libraryTokens, setLibraryTokens] = useState<Token[]>([]);
  const [hostUsername, setHostUsername] = useState<string>("");

  const currentUsername = authService.getUsername() ?? "";
  const isDM = currentUsername !== "" && currentUsername === hostUsername;
  const canSeeStats = (t: Token) => isDM || (!t.npc && !t.enemy) || t.statsPublic;
  const canSeeStatuses = (t: Token) => isDM || (!t.npc && !t.enemy);
  const canControl = (t: Token) => isDM || (!t.npc && !t.enemy && t.ownerUsername === currentUsername);
  const [activeMapData, setActiveMapData] = useState<MapData | null>(null);
  const [activeMap, setActiveMap] = useState<GameMap | null>(null);

  const [openedDoors, setOpenedDoors] = useState<Record<string, boolean>>({});
  const [imageVersion, setImageVersion] = useState(0);
  const [fogEnabled, setFogEnabled] = useState(false);
  const [fogActive, setFogActive] = useState(false);
  const [fogBrushMode, setFogBrushMode] = useState<'reveal' | 'hide'>('reveal');
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const revealedCellsRef = useRef<Set<string>>(new Set());
  const isFogPaintingRef = useRef(false);

  /** Per-biome color palette used when rendering the active map on the game canvas. */
  const BIOME_COLORS: Record<string, { base: string; alt: string; grid: string; detail: string }> = {
    CAVE:     { base: '#1a1510', alt: '#12100a', grid: 'rgba(201,147,58,0.12)', detail: '#261f18' },
    FOREST:   { base: '#0d1a0d', alt: '#0a1408', grid: 'rgba(45,122,58,0.2)',   detail: '#162e16' },
    OCEAN:    { base: '#080d1a', alt: '#060a14', grid: 'rgba(42,96,128,0.2)',  detail: '#101b33' },
    DESERT:   { base: '#1a1508', alt: '#141006', grid: 'rgba(210,180,80,0.2)',  detail: '#29210d' },
    MOUNTAIN: { base: '#121212', alt: '#0d0d0d', grid: 'rgba(180,180,180,0.15)', detail: '#1f1f1f' },
    CITY:     { base: '#0f0f14', alt: '#0a0a10', grid: 'rgba(100,120,200,0.15)', detail: '#22222b' },
    DUNGEON:  { base: '#100a0a', alt: '#0a0606', grid: 'rgba(139,26,26,0.2)',   detail: '#1f1414' },
  };

  useEffect(() => {
    if (!sessionId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${window.location.origin}/ws`),
      onConnect: () => {

        client.subscribe(`/topic/session/${sessionId}`, (message) => {
          const data = JSON.parse(message.body);

          if (data.x !== undefined && data.y !== undefined) {
            setTokens((prev) =>
              prev.map((t) =>
                t.id === data.tokenId ? { ...t, x: data.x, y: data.y } : t,
              ),
            );
          }

          if (data.hp !== undefined && data.tokenId) {
            setTokens(prev => prev.map(t => t.id === data.tokenId ? { ...t, hp: data.hp } : t));
            setSelectedToken(prev => prev?.id === data.tokenId ? { ...prev, hp: data.hp } as Token : prev);
          }

          if (data.revealedCells !== undefined) {
            const cells = new Set<string>(data.revealedCells);
            revealedCellsRef.current = cells;
            setRevealedCells(cells);
            setFogActive(true);
          }

          if (data.statsPublic !== undefined && data.tokenId) {
            setTokens(prev => prev.map(t => t.id === data.tokenId ? { ...t, statsPublic: data.statsPublic } : t));
            setSelectedToken(prev => prev?.id === data.tokenId ? { ...prev, statsPublic: data.statsPublic } as Token : prev);
          }

          if (data.tokenAdded) {
            setTokens(prev => prev.some(t => t.id === data.tokenAdded.id) ? prev : [...prev, data.tokenAdded]);
          }

          if (data.tokenRemoved) {
            setTokens(prev => prev.filter(t => t.id !== data.tokenRemoved));
            setSelectedToken(prev => prev?.id === data.tokenRemoved ? null : prev);
          }
        });
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [sessionId]);

  useEffect(() => {
    setInitiativeInput(selectedToken?.initiative ?? 0);
  }, [selectedToken?.id]);

  useEffect(() => {
    if (!sessionId) return;
    tokenService
      .getTokensBySession(sessionId)
      .then(setTokens)
      .catch(() => toast.error("Failed to load tokens"));
    diceService
      .getPublicHistory(sessionId)
      .then(setDiceHistory)
      .catch(() => toast.error("Failed to load dice history"));
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    sessionService.getSession(sessionId)
      .then(session => {
        setHostUsername(session.hostUsername);
        if (session.activeMapId) applyMapToCanvas(session.activeMapId).catch(() => {});
      })
      .catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.fillStyle = "#0d0a06";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const GRID = 48 * zoom;

    if (activeMap) {
      const colors = BIOME_COLORS[activeMap.biome] || BIOME_COLORS.CAVE;
      for (let r = 0; r < activeMap.cellHeight; r++) {
        for (let c = 0; c < activeMap.cellWidth; c++) {
          const x = c * GRID + pan.x;
          const y = r * GRID + pan.y;
          const seed = (r * 7 + c * 13) % 5;
          ctx.fillStyle = seed < 2 ? colors.alt : colors.base;
          ctx.fillRect(x, y, GRID, GRID);

          ctx.strokeStyle = colors.detail;
          ctx.lineWidth = 1;
          if (seed === 0) {
            ctx.strokeRect(x + GRID * 0.1, y + GRID * 0.1, GRID * 0.8, GRID * 0.8);
          } else if (seed === 3) {
            ctx.beginPath();
            ctx.moveTo(x, y); ctx.lineTo(x + GRID * 0.2, y + GRID * 0.2);
            ctx.moveTo(x + GRID, y + GRID); ctx.lineTo(x + GRID * 0.8, y + GRID * 0.8);
            ctx.stroke();
          }
        }
      }
    }

    if (activeMapData) {
      if (Array.isArray(activeMapData.water)) {
        activeMapData.water.forEach(([c, r]) => {
          drawProceduralWater(ctx, c * GRID + pan.x, r * GRID + pan.y, GRID);
        });
      }
      if (Array.isArray(activeMapData.mud)) {
        activeMapData.mud.forEach(([c, r]) => {
          drawProceduralMud(ctx, c * GRID + pan.x, r * GRID + pan.y, GRID);
        });
      }
      if (Array.isArray(activeMapData.sand)) {
        activeMapData.sand.forEach(([c, r]) => {
          drawProceduralSand(ctx, c * GRID + pan.x, r * GRID + pan.y, GRID);
        });
      }
    }

    ctx.strokeStyle = activeMap ? (BIOME_COLORS[activeMap.biome]?.grid || "rgba(201,147,58,0.15)") : "rgba(201,147,58,0.15)";
    ctx.lineWidth = 0.5;

    for (let x = pan.x % GRID; x < canvas.width; x += GRID) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = pan.y % GRID; y < canvas.height; y += GRID) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (activeMapData && Array.isArray(activeMapData.traps)) {
      activeMapData.traps.forEach(([c, r]) => {
        drawProceduralTrap(ctx, c * GRID + pan.x, r * GRID + pan.y, GRID);
      });
    }

    if (activeMapData) {
      if (Array.isArray(activeMapData.walls)) {
        activeMapData.walls.forEach(([c, r]) => {
          drawProceduralWall(ctx, c * GRID + pan.x, r * GRID + pan.y, GRID);
        });
      }
      if (Array.isArray(activeMapData.doors)) {
        activeMapData.doors.forEach(([c, r]) => {
          const isOpen = !!openedDoors[`${c},${r}`];
          drawProceduralDoor(ctx, c * GRID + pan.x, r * GRID + pan.y, GRID, isOpen);
        });
      }
    }

    if (activeMapData) {
      if (Array.isArray(activeMapData.table)) {
        activeMapData.table.forEach(([c, r]) => {
          drawProceduralTable(ctx, c * GRID + pan.x, r * GRID + pan.y, GRID);
        });
      }
      if (Array.isArray(activeMapData.chair)) {
        activeMapData.chair.forEach(([c, r]) => {
          drawProceduralChair(ctx, c * GRID + pan.x, r * GRID + pan.y, GRID);
        });
      }
      if (Array.isArray(activeMapData.chest)) {
        activeMapData.chest.forEach(([c, r]) => {
          drawProceduralChest(ctx, c * GRID + pan.x, r * GRID + pan.y, GRID);
        });
      }
    }

    if (activeMapData) {
      if (Array.isArray(activeMapData.fire)) {
        activeMapData.fire.forEach(([c, r]) => {
          drawProceduralFire(ctx, c * GRID + pan.x, r * GRID + pan.y, GRID);
        });
      }
      if (Array.isArray(activeMapData.tree)) {
        activeMapData.tree.forEach(([c, r]) => {
          drawProceduralTree(ctx, c * GRID + pan.x, r * GRID + pan.y, GRID);
        });
      }
    }

    if (Array.isArray(tokens)) {
      tokens.forEach((token) => {
        const tx = token.x * zoom + pan.x;
        const ty = token.y * zoom + pan.y;
        const size = 48 * zoom;
        const cx = tx + size / 2;
        const cy = ty + size / 2;
        const r = size / 2 - 2;

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = token.enemy ? "#1a0808" : token.npc ? "#081a08" : "#080f1a";
        ctx.fill();

        const cachedImg = token.imageUrl ? tokenImageCache.get(token.imageUrl) : undefined;
        const imgReady = !!(cachedImg?.complete && cachedImg.naturalWidth > 0);

        if (token.imageUrl && !cachedImg) {
          const img = new Image();
          img.src = token.imageUrl;
          img.onload = () => {
            tokenImageCache.set(token.imageUrl, img);
            setImageVersion((v) => v + 1);
          };
          tokenImageCache.set(token.imageUrl, img);
        }

        if (imgReady && cachedImg) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(cachedImg, tx + 2, ty + 2, size - 4, size - 4);
          ctx.restore();
        } else if (token.name && token.name.length > 0) {
          ctx.fillStyle = token.enemy ? "#c0392b" : token.npc ? "#5cb85c" : "#c9933a";
          ctx.font = `bold ${Math.floor(size * 0.35)}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(token.name[0].toUpperCase(), cx, cy);
        }

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = token.enemy ? "#8b1a1a" : token.npc ? "#2d7a3a" : "#1b4d8e";
        ctx.lineWidth = selectedToken?.id === token.id ? 3 : 1.5;
        ctx.stroke();

        if (token.maxHp > 0) {
          const hpRatio = token.hp / token.maxHp;
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(tx + 2, ty + size - 6, size - 4, 4);
          ctx.fillStyle = hpRatio > 0.5 ? "#2d7a3a" : hpRatio > 0.25 ? "#c9933a" : "#8b1a1a";
          ctx.fillRect(tx + 2, ty + size - 6, (size - 4) * Math.max(0, hpRatio), 4);
        }
      });
    }

    if ((fogEnabled || fogActive) && activeMap) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
      for (let r = 0; r < activeMap.cellHeight; r++) {
        for (let c = 0; c < activeMap.cellWidth; c++) {
          if (!revealedCells.has(`${c},${r}`)) {
            ctx.fillRect(c * GRID + pan.x, r * GRID + pan.y, GRID, GRID);
          }
        }
      }
    }
  }, [tokens, zoom, pan, selectedToken, activeMapData, activeMap, openedDoors, imageVersion, fogEnabled, fogActive, revealedCells]);

  const handleRoll = async () => {
    if (!sessionId) return;
    try {
      const result = await diceService.roll(sessionId, formula);
      setDiceHistory((prev) => [result, ...prev.slice(0, 19)]);
    } catch {
      toast.error("Failed to roll dice");
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const GRID_SIZE = 48 * zoom;

    const clickedToken = tokens.find((t) => {
      const tx = t.x * zoom + pan.x;
      const ty = t.y * zoom + pan.y;
      return x >= tx && x <= tx + GRID_SIZE && y >= ty && y <= ty + GRID_SIZE;
    });

    if (clickedToken) {
      setSelectedToken(clickedToken);
      if (canControl(clickedToken)) {
        isDraggingRef.current = true;
        dragTokenRef.current = clickedToken;
        const tx = clickedToken.x * zoom + pan.x;
        const ty = clickedToken.y * zoom + pan.y;
        dragOffsetRef.current = { x: x - tx, y: y - ty };
      }
      return;
    }

    if (activeTool === "select" && activeMapData && Array.isArray(activeMapData.doors)) {
      const c = Math.floor((x - pan.x) / GRID_SIZE);
      const r = Math.floor((y - pan.y) / GRID_SIZE);

      const clickedDoor = activeMapData.doors.find(([dc, dr]) => dc === c && dr === r);
      if (clickedDoor) {
        const key = `${c},${r}`;
        setOpenedDoors(prev => ({
          ...prev,
          [key]: !prev[key]
        }));
        return;
      }
    }

    if (fogEnabled) {
      isFogPaintingRef.current = true;
      const GRID_SIZE = 48 * zoom;
      const c = Math.floor((x - pan.x) / GRID_SIZE);
      const r = Math.floor((y - pan.y) / GRID_SIZE);
      if (activeMap && c >= 0 && c < activeMap.cellWidth && r >= 0 && r < activeMap.cellHeight) {
        const key = `${c},${r}`;
        const next = new Set(revealedCellsRef.current);
        if (fogBrushMode === 'reveal') next.add(key); else next.delete(key);
        revealedCellsRef.current = next;
        setRevealedCells(next);
      }
      return;
    }

    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX, y: e.clientY };
    panOriginRef.current = { ...pan };
    setCanvasCursor("grabbing");
  };

  const applyMapToCanvas = async (mapId: string) => {
    const map = await mapService.getMap(mapId);
    setActiveMap(map);
    const canvas = canvasRef.current;
    if (canvas && canvas.offsetWidth > 0) {
      const zoomX = canvas.offsetWidth / (map.cellWidth * 48);
      const zoomY = canvas.offsetHeight / (map.cellHeight * 48);
      const fitZoom = Math.min(zoomX, zoomY) * 0.95;
      setZoom(fitZoom);
      setPan({
        x: (canvas.offsetWidth - map.cellWidth * 48 * fitZoom) / 2,
        y: (canvas.offsetHeight - map.cellHeight * 48 * fitZoom) / 2,
      });
    }
    setActiveMapData(
      map.mapData ? { ...INITIAL_MAP_DATA, ...JSON.parse(map.mapData) } : INITIAL_MAP_DATA
    );
    setOpenedDoors({});
    revealedCellsRef.current = new Set();
    setRevealedCells(new Set());
  };

  const handleLoadMap = async (mapId: string) => {
    if (!sessionId) return;
    try {
      await sessionService.setActiveMap(sessionId, mapId);
      await applyMapToCanvas(mapId);
      setShowMapModal(false);
    } catch {
      toast.error("Failed to load map");
    }
  };

  const handleOpenMapModal = async () => {
    const maps = await mapService.getMaps();
    setAvailableMaps(maps);
    setShowMapModal(true);
  };

  const handleOpenAddTokenModal = async () => {
    try {
      const all = await tokenService.getMyTokens();
      const sessionTokenIds = new Set(tokens.map(t => t.id));
      setLibraryTokens(all.filter((t: Token) => !sessionTokenIds.has(t.id)));
      setShowAddTokenModal(true);
    } catch {
      toast.error("Failed to load token library");
    }
  };

  const handleAddLibraryToken = async (tokenId: string) => {
    if (!sessionId) return;
    try {
      const updated = await tokenService.updateToken(tokenId, { sessionId });
      setTokens(prev => [...prev, updated]);
      setLibraryTokens(prev => prev.filter(t => t.id !== tokenId));
      if (stompClientRef.current?.connected) {
        stompClientRef.current.publish({
          destination: "/app/token/session-add",
          body: JSON.stringify({ sessionId, tokenAdded: updated }),
        });
      }
    } catch {
      toast.error("Failed to add token to session");
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isFogPaintingRef.current && fogEnabled) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const GRID_SIZE = 48 * zoom;
      const c = Math.floor((x - pan.x) / GRID_SIZE);
      const r = Math.floor((y - pan.y) / GRID_SIZE);
      if (activeMap && c >= 0 && c < activeMap.cellWidth && r >= 0 && r < activeMap.cellHeight) {
        const key = `${c},${r}`;
        if (fogBrushMode === 'reveal' ? !revealedCellsRef.current.has(key) : revealedCellsRef.current.has(key)) {
          const next = new Set(revealedCellsRef.current);
          if (fogBrushMode === 'reveal') next.add(key); else next.delete(key);
          revealedCellsRef.current = next;
          setRevealedCells(next);
        }
      }
      return;
    }
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({ x: panOriginRef.current.x + dx, y: panOriginRef.current.y + dy });
      return;
    }
    if (!isDraggingRef.current || !dragTokenRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const GRID_SIZE = 48;

    const newX = Math.round((x - dragOffsetRef.current.x - pan.x) / (GRID_SIZE * zoom)) * GRID_SIZE;
    const newY = Math.round((y - dragOffsetRef.current.y - pan.y) / (GRID_SIZE * zoom)) * GRID_SIZE;

    setTokens((prev) =>
      prev.map((t) =>
        t.id === dragTokenRef.current!.id ? { ...t, x: newX, y: newY } : t,
      ),
    );
  };

  const handleInitiativeSet = async (value: number) => {
    if (!selectedToken) return;
    setTokens((prev) => prev.map((t) => t.id === selectedToken.id ? { ...t, initiative: value } : t));
    setSelectedToken((prev) => prev ? { ...prev, initiative: value } : null);
    try {
      await tokenService.updateToken(selectedToken.id, { initiative: value });
    } catch {
      toast.error("Failed to set initiative");
    }
  };

  const handleHpUpdate = async (amount: number) => {
    if (!selectedToken) return;
    const newHp = Math.max(0, Math.min(selectedToken.maxHp, selectedToken.hp + amount));

    setTokens((prev) =>
      prev.map((t) => (t.id === selectedToken.id ? { ...t, hp: newHp } : t)),
    );
    setSelectedToken((prev) => (prev ? { ...prev, hp: newHp } : null));

    try {
      await tokenService.updateToken(selectedToken.id, { hp: newHp });
      if (stompClientRef.current?.connected) {
        stompClientRef.current.publish({
          destination: "/app/token/hp",
          body: JSON.stringify({
            tokenId: selectedToken.id,
            sessionId: sessionId,
            hp: newHp,
          }),
        });
      }
    } catch {
      toast.error("Failed to update HP");
    }
  };

  const handleStatsVisibilityToggle = async (token: Token) => {
    const newVal = !token.statsPublic;
    try {
      await tokenService.updateToken(token.id, { statsPublic: newVal });
      setTokens(prev => prev.map(t => t.id === token.id ? { ...t, statsPublic: newVal } : t));
      setSelectedToken(prev => prev?.id === token.id ? { ...prev, statsPublic: newVal } : prev);
      if (stompClientRef.current?.connected) {
        stompClientRef.current.publish({
          destination: "/app/token/stats-visibility",
          body: JSON.stringify({ tokenId: token.id, sessionId, statsPublic: newVal }),
        });
      }
    } catch {
      toast.error("Failed to toggle stats visibility");
    }
  };

  const handleStatusToggle = async (status: string) => {
    if (!selectedToken) return;
    const current = selectedToken.statuses || [];
    const newStatuses = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    setTokens(prev => prev.map(t => t.id === selectedToken.id ? { ...t, statuses: newStatuses } : t));
    setSelectedToken(prev => prev ? { ...prev, statuses: newStatuses } : null);
    try {
      await tokenService.updateToken(selectedToken.id, { statuses: newStatuses });
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleMouseUp = async () => {
    if (isFogPaintingRef.current) {
      isFogPaintingRef.current = false;
      return;
    }
    if (isPanningRef.current) {
      isPanningRef.current = false;
      setCanvasCursor("grab");
      return;
    }
    if (!isDraggingRef.current || !dragTokenRef.current) return;
    isDraggingRef.current = false;

    const token = tokens.find((t) => t.id === dragTokenRef.current!.id);
    if (!token) return;

    try {
      await tokenService.moveToken(token.id, token.x, token.y);
      if (stompClientRef.current?.connected) {
        stompClientRef.current.publish({
          destination: "/app/token/move",
          body: JSON.stringify({
            tokenId: token.id,
            sessionId: sessionId,
            x: token.x,
            y: token.y,
          }),
        });
      }
    } catch {
      toast.error("Failed to move token");
    }

    dragTokenRef.current = null;
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "48px 1fr 200px",
        height: "100vh",
        background: "#0d0a06",
      }}
    >
      <div
        style={{
          background: "linear-gradient(180deg, #161209 0%, #100d07 100%)",
          borderBottom: "1px solid rgba(201,147,58,0.3)",
          boxShadow: "0 4px 18px rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: "12px",
        }}
      >
        <span
          style={{
            color: "#c9933a",
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textShadow: "0 0 18px rgba(201,147,58,0.3)",
          }}
        >
          ⚔ DnD Battle Board
        </span>
        <span style={{ color: "rgba(244,237,216,0.45)", fontSize: "13px" }}>
          Session: {sessionId?.slice(0, 8)}...
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            style={btnStyle}
          >
            +
          </button>
          {isDM && <button onClick={handleOpenMapModal} style={btnStyle}>🗺 Map</button>}
          {isDM && <button
            onClick={() => {
              setFogEnabled((f) => {
                setCanvasCursor(!f ? "crosshair" : "grab");
                return !f;
              });
            }}
            style={{ ...fogBtnStyle, background: fogEnabled ? "rgba(30,55,90,0.7)" : undefined, borderColor: fogEnabled ? "rgba(60,110,180,0.6)" : undefined, color: fogEnabled ? "#7aaee0" : undefined }}
          >
            🌫 Fog
          </button>}
          {isDM && fogEnabled && (
            <>
              <button
                onClick={() => setFogBrushMode('reveal')}
                style={{ ...fogBtnStyle, background: fogBrushMode === 'reveal' ? "rgba(30,70,45,0.7)" : undefined, borderColor: fogBrushMode === 'reveal' ? "rgba(60,160,90,0.6)" : undefined, color: fogBrushMode === 'reveal' ? "#7ecf96" : undefined }}
              >
                Reveal
              </button>
              <button
                onClick={() => setFogBrushMode('hide')}
                style={{ ...fogBtnStyle, background: fogBrushMode === 'hide' ? "rgba(80,30,30,0.7)" : undefined, borderColor: fogBrushMode === 'hide' ? "rgba(180,60,60,0.6)" : undefined, color: fogBrushMode === 'hide' ? "#cf7e7e" : undefined }}
              >
                Hide
              </button>
              <button
                onClick={() => {
                  if (!activeMap) return;
                  const all = new Set<string>();
                  for (let r = 0; r < activeMap.cellHeight; r++)
                    for (let c = 0; c < activeMap.cellWidth; c++)
                      all.add(`${c},${r}`);
                  revealedCellsRef.current = all;
                  setRevealedCells(all);
                }}
                style={fogBtnStyle}
              >
                Reveal All
              </button>
              <button
                onClick={() => {
                  revealedCellsRef.current = new Set();
                  setRevealedCells(new Set());
                }}
                style={fogBtnStyle}
              >
                Hide All
              </button>
              <button
                onClick={() => {
                  if (stompClientRef.current?.connected)
                    stompClientRef.current.publish({ destination: "/app/fog", body: JSON.stringify({ sessionId, revealedCells: Array.from(revealedCellsRef.current) }) });
                  setFogActive(true);
                  toast.success("Fog saved");
                }}
                style={{ ...fogBtnStyle, background: "rgba(30,70,45,0.7)", borderColor: "rgba(60,160,90,0.6)", color: "#7ecf96" }}
              >
                💾 Save
              </button>
            </>
          )}
          <span
            style={{ color: "#f4edd8", fontSize: "12px", alignSelf: "center" }}
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
            style={btnStyle}
          >
            −
          </button>
          <button
            onClick={() => navigate("/lobby")}
            style={{ ...btnStyle, color: "#c0392b" }}
          >
            ← Lobby
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", cursor: canvasCursor }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />

        <div
          style={{
            background: "linear-gradient(180deg, #14110a 0%, #100d08 100%)",
            borderLeft: "1px solid rgba(201,147,58,0.25)",
            boxShadow: "inset 8px 0 24px -16px rgba(0,0,0,0.6)",
            overflow: "auto",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {tokens.some((t) => t.initiative > 0) && (
            <>
              <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: "12px", color: "rgba(244,237,216,0.45)", letterSpacing: "0.1em" }}>
                ⚡ INITIATIVE
              </div>
              {[...tokens]
                .filter((t) => t.initiative > 0)
                .sort((a, b) => b.initiative - a.initiative)
                .map((token, idx) => (
                  <div
                    key={token.id}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "4px 8px", borderRadius: "3px",
                      background: idx === currentTurnIdx ? "rgba(201,147,58,0.12)" : "transparent",
                      border: `1px solid ${idx === currentTurnIdx ? "rgba(201,147,58,0.5)" : "rgba(201,147,58,0.08)"}`,
                    }}
                  >
                    <span style={{ fontSize: "11px", color: "rgba(244,237,216,0.35)", width: "16px" }}>{idx + 1}.</span>
                    <span style={{ flex: 1, fontSize: "13px", color: idx === currentTurnIdx ? "#f5d485" : "#f4edd8" }}>{token.name}</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#c9933a" }}>{token.initiative}</span>
                  </div>
                ))}
              <button
                onClick={() => setCurrentTurnIdx((prev) => {
                  const count = tokens.filter((t) => t.initiative > 0).length;
                  return prev >= count - 1 ? 0 : prev + 1;
                })}
                style={{ ...quickBtnStyle, padding: "4px", color: "#c9933a", borderColor: "rgba(201,147,58,0.4)", width: "100%" }}
              >
                Next →
              </button>
              <div style={{ borderTop: "1px solid rgba(201,147,58,0.15)" }} />
            </>
          )}

          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: "12px", color: "rgba(244,237,216,0.45)", letterSpacing: "0.1em", flex: 1 }}>
              🛡 TOKENS IN SESSION
            </div>
            <button onClick={handleOpenAddTokenModal} style={{ ...btnStyle, padding: "2px 8px", fontSize: "14px", lineHeight: 1 }} title="Add token to session">+</button>
          </div>

          {tokens.length === 0 ? (
            <p
              style={{
                color: "rgba(244,237,216,0.3)",
                fontSize: "13px",
                textAlign: "center",
                marginTop: "24px",
              }}
            >
              No tokens in session
            </p>
          ) : (
            tokens.map((token) => (
              <div
                key={token.id}
                className="ornate-row"
                onClick={() => setSelectedToken(token)}
                style={{
                  padding: "8px 10px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  border: `1px solid ${selectedToken?.id === token.id ? "rgba(201,147,58,0.6)" : "rgba(201,147,58,0.15)"}`,
                  background:
                    selectedToken?.id === token.id
                      ? "rgba(201,147,58,0.08)"
                      : "#1e1a10",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {token.imageUrl ? (
                    <img
                      src={token.imageUrl}
                      alt={token.name}
                      style={{
                        width: "34px", height: "34px", borderRadius: "50%",
                        objectFit: "cover", flexShrink: 0,
                        border: `2px solid ${token.enemy ? "#8b1a1a" : token.npc ? "#2d7a3a" : "#1b4d8e"}`,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "34px", height: "34px", borderRadius: "50%",
                        background: token.enemy ? "rgba(139,26,26,0.3)" : token.npc ? "rgba(45,122,58,0.2)" : "rgba(27,77,142,0.3)",
                        border: `2px solid ${token.enemy ? "#8b1a1a" : token.npc ? "#2d7a3a" : "#1b4d8e"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "14px", fontWeight: 700, flexShrink: 0,
                        color: token.enemy ? "#c0392b" : token.npc ? "#5cb85c" : "#c9933a",
                      }}
                    >
                      {token.name ? token.name[0].toUpperCase() : '?'}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", color: "#f4edd8" }}>
                      {token.name}
                      {token.statsPublic && !isDM && <span style={{ fontSize: "10px", color: "#c9933a", marginLeft: "6px" }}>📖</span>}
                    </div>
                    {canSeeStats(token) ? (
                      <div style={{ fontSize: "12px", color: "rgba(244,237,216,0.45)" }}>
                        HP: {token.hp}/{token.maxHp} · AC: {token.ac} · {token.enemy ? "Enemy" : token.npc ? "NPC" : "PC"}
                      </div>
                    ) : (
                      <div style={{ fontSize: "11px", color: "rgba(244,237,216,0.25)", fontStyle: "italic" }}>stats hidden</div>
                    )}
                  </div>
                </div>

                {canSeeStats(token) && (
                  <div
                    style={{
                      marginTop: "6px",
                      height: "3px",
                      background: "rgba(0,0,0,0.4)",
                      borderRadius: "2px",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "2px",
                        width: `${Math.max(0, (token.hp / token.maxHp) * 100)}%`,
                        background: token.hp / token.maxHp > 0.5 ? "#2d7a3a" : "#8b1a1a",
                      }}
                    />
                  </div>
                )}

                {canSeeStatuses(token) && token.statuses && token.statuses.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "5px" }}>
                    {token.statuses.map(s => (
                      <span key={s} style={{ fontSize: "11px", padding: "2px 6px", background: "rgba(139,26,26,0.2)", border: "1px solid rgba(192,57,43,0.35)", borderRadius: "3px", color: "#e07a7a" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {selectedToken?.id === token.id && (
                  <div
                    style={{
                      marginTop: "10px",
                      borderTop: "1px solid rgba(201,147,58,0.15)",
                      paddingTop: "10px",
                    }}
                  >
                    {isDM && (token.npc || token.enemy) && (
                      <div style={{ marginBottom: "10px" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatsVisibilityToggle(token); }}
                          style={{ ...quickBtnStyle, width: "100%", padding: "5px", color: token.statsPublic ? "#5cb85c" : "rgba(244,237,216,0.5)", borderColor: token.statsPublic ? "rgba(45,122,58,0.5)" : "rgba(201,147,58,0.25)" }}
                        >
                          {token.statsPublic ? "✓ Stats public" : "Publish stats"}
                        </button>
                      </div>
                    )}

                    {!canControl(token) && (
                      <p style={{ fontSize: "12px", color: "rgba(244,237,216,0.3)", textAlign: "center", margin: "8px 0" }}>
                        {canSeeStats(token) ? "View only" : "Stats hidden"}
                      </p>
                    )}

                    {canControl(token) && <>
                      <div style={{ fontSize: "12px", color: "rgba(244,237,216,0.45)", fontFamily: "serif", letterSpacing: "0.08em", marginBottom: "8px" }}>
                        HP CONTROLS
                      </div>
                      <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                        <button onClick={(e) => { e.stopPropagation(); handleHpUpdate(-10); }} style={quickBtnStyle}>-10</button>
                        <button onClick={(e) => { e.stopPropagation(); handleHpUpdate(-5); }} style={quickBtnStyle}>-5</button>
                        <button onClick={(e) => { e.stopPropagation(); handleHpUpdate(-1); }} style={quickBtnStyle}>-1</button>
                        <button onClick={(e) => { e.stopPropagation(); handleHpUpdate(1); }} style={{ ...quickBtnStyle, color: "#2d7a3a", borderColor: "rgba(45,122,58,0.4)" }}>+1</button>
                        <button onClick={(e) => { e.stopPropagation(); handleHpUpdate(5); }} style={{ ...quickBtnStyle, color: "#2d7a3a", borderColor: "rgba(45,122,58,0.4)" }}>+5</button>
                        <button onClick={(e) => { e.stopPropagation(); handleHpUpdate(10); }} style={{ ...quickBtnStyle, color: "#2d7a3a", borderColor: "rgba(45,122,58,0.4)" }}>+10</button>
                      </div>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        <input
                          type="number"
                          value={hpChange}
                          onChange={(e) => setHpChange(+e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Value"
                          style={{ flex: 1, background: "#0d0a06", border: "1px solid rgba(201,147,58,0.25)", borderRadius: "4px", padding: "6px 8px", color: "#f4edd8", fontSize: "13px", outline: "none" }}
                        />
                        <button onClick={(e) => { e.stopPropagation(); handleHpUpdate(-hpChange); setHpChange(0); }} style={{ ...quickBtnStyle, padding: "4px 8px" }}>DMG</button>
                        <button onClick={(e) => { e.stopPropagation(); handleHpUpdate(hpChange); setHpChange(0); }} style={{ ...quickBtnStyle, padding: "4px 8px", color: "#2d7a3a", borderColor: "rgba(45,122,58,0.4)" }}>HEAL</button>
                      </div>

                      <div style={{ marginTop: "10px", borderTop: "1px solid rgba(201,147,58,0.15)", paddingTop: "10px" }}>
                        <div style={{ fontSize: "12px", color: "rgba(244,237,216,0.45)", fontFamily: "serif", letterSpacing: "0.08em", marginBottom: "8px" }}>INICIJATIVA</div>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <input type="number" value={initiativeInput} onChange={(e) => setInitiativeInput(+e.target.value)} onClick={(e) => e.stopPropagation()} min={0} max={30} style={{ flex: 1, background: "#0d0a06", border: "1px solid rgba(201,147,58,0.25)", borderRadius: "4px", padding: "6px 8px", color: "#f4edd8", fontSize: "13px", outline: "none" }} />
                          <button onClick={(e) => { e.stopPropagation(); handleInitiativeSet(initiativeInput); }} style={{ ...quickBtnStyle, padding: "4px 10px", color: "#c9933a", borderColor: "rgba(201,147,58,0.4)" }}>Set</button>
                        </div>
                      </div>

                      <div style={{ marginTop: "10px", borderTop: "1px solid rgba(201,147,58,0.15)", paddingTop: "10px" }}>
                        <div style={{ fontSize: "12px", color: "rgba(244,237,216,0.45)", fontFamily: "serif", letterSpacing: "0.08em", marginBottom: "8px" }}>STATUSES</div>
                        {(selectedToken.statuses || []).length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "8px" }}>
                            {(selectedToken.statuses || []).map(s => (
                              <span key={s} onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(139,26,26,0.25)", border: "1px solid rgba(192,57,43,0.5)", borderRadius: "4px", padding: "4px 8px", fontSize: "12px", color: "#e07a7a" }}>
                                {s}
                                <button onClick={(e) => { e.stopPropagation(); handleStatusToggle(s); }} style={{ background: "none", border: "none", color: "#e07a7a", cursor: "pointer", padding: "0", fontSize: "13px", lineHeight: 1 }}>×</button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                          {["Blinded","Charmed","Frightened","Grappled","Invisible","Paralyzed","Poisoned","Prone","Stunned","Unconscious"].map(s => {
                            const active = (selectedToken.statuses || []).includes(s);
                            return (
                              <button key={s} onClick={(e) => { e.stopPropagation(); handleStatusToggle(s); }} style={{ fontSize: "12px", padding: "4px 9px", cursor: "pointer", borderRadius: "4px", fontFamily: "serif", background: active ? "rgba(139,26,26,0.3)" : "rgba(0,0,0,0.25)", border: `1px solid ${active ? "rgba(192,57,43,0.7)" : "rgba(201,147,58,0.25)"}`, color: active ? "#e07a7a" : "rgba(244,237,216,0.5)" }}>
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ marginTop: "10px", borderTop: "1px solid rgba(201,147,58,0.15)", paddingTop: "10px" }}>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await tokenService.removeFromSession(token.id);
                              setTokens((prev) => prev.filter((t) => t.id !== token.id));
                              setSelectedToken(null);
                              if (stompClientRef.current?.connected) {
                                stompClientRef.current.publish({
                                  destination: "/app/token/session-remove",
                                  body: JSON.stringify({ sessionId, tokenRemoved: token.id }),
                                });
                              }
                            } catch {
                              toast.error("Failed to remove token from session");
                            }
                          }}
                          style={{ ...quickBtnStyle, width: "100%", padding: "5px", color: "#c0392b", borderColor: "rgba(192,57,43,0.4)" }}
                        >
                          Remove from session
                        </button>
                      </div>
                    </>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          borderTop: "1px solid rgba(201,147,58,0.3)",
          boxShadow: "0 -4px 18px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(0deg, #14110a 0%, #100d08 100%)",
            borderRight: "1px solid rgba(201,147,58,0.25)",
            overflow: "auto",
            padding: "8px 12px",
          }}
        >
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: "10px",
              color: "rgba(244,237,216,0.45)",
              letterSpacing: "0.1em",
              marginBottom: "8px",
            }}
          >
            🎲 ROLL LOG
          </div>
          {diceHistory.map((roll) => (
            <div
              key={roll.id}
              className="ornate-fade"
              style={{
                fontSize: "12px",
                color: "#f4edd8",
                padding: "3px 0",
                borderBottom: "1px solid rgba(201,147,58,0.08)",
              }}
            >
              <span style={{ color: "#c9933a" }}>{roll.ownerUsername}</span>
              {" rolled "}
              <span style={{ color: "rgba(244,237,216,0.6)" }}>
                {roll.formula}
              </span>
              {" → "}
              <span style={{ color: "#f5d485", fontWeight: 700 }}>
                {roll.rollsResult}
              </span>
              <span
                style={{
                  color: "rgba(244,237,216,0.3)",
                  fontSize: "10px",
                  marginLeft: "6px",
                }}
              >
                [{roll.rolls ? roll.rolls.join(", ") : ""}]
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "#12100a",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontFamily: "serif",
              fontSize: "10px",
              color: "rgba(244,237,216,0.45)",
              letterSpacing: "0.1em",
            }}
          >
            DICE ROLLER
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "4px",
            }}
          >
            {["d4", "d6", "d8", "d10", "d12", "d20", "d100", "2d6"].map((d) => (
              <button
                key={d}
                onClick={() => setFormula(d === "2d6" ? "2d6" : `1${d}`)}
                style={{
                  background:
                    formula === (d === "2d6" ? "2d6" : `1${d}`)
                      ? "rgba(201,147,58,0.2)"
                      : "#1e1a10",
                  border: `1px solid rgba(201,147,58,${formula === (d === "2d6" ? "2d6" : `1${d}`) ? "0.6" : "0.2"})`,
                  borderRadius: "4px",
                  padding: "6px 4px",
                  color: "#f5d485",
                  fontFamily: "serif",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {d}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              style={{
                flex: 1,
                background: "#1e1a10",
                border: "1px solid rgba(201,147,58,0.25)",
                borderRadius: "4px",
                padding: "6px 8px",
                color: "#f4edd8",
                fontSize: "13px",
                outline: "none",
                fontFamily: "monospace",
              }}
            />
            <button
              onClick={handleRoll}
              style={{
                ...btnStyle,
                background: "rgba(139,26,26,0.2)",
                borderColor: "rgba(192,57,43,0.5)",
                color: "#c0392b",
              }}
            >
              Roll
            </button>
          </div>
        </div>
      </div>
      {showAddTokenModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#12100a', border: '1px solid rgba(201,147,58,0.4)', borderRadius: '8px', padding: '24px', width: '420px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'serif', color: '#c9933a', fontSize: '16px', flex: 1 }}>Add Token to Session</h2>
              <button onClick={() => setShowAddTokenModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(244,237,216,0.5)', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>
            {libraryTokens.length === 0 ? (
              <p style={{ color: 'rgba(244,237,216,0.45)', textAlign: 'center', padding: '24px' }}>All your tokens are already in this session.</p>
            ) : (
              libraryTokens.map(token => (
                <div key={token.id} onClick={() => handleAddLibraryToken(token.id)} style={{ padding: '10px 12px', border: '1px solid rgba(201,147,58,0.2)', borderRadius: '4px', marginBottom: '6px', cursor: 'pointer', background: '#1e1a10', display: 'flex', alignItems: 'center', gap: '12px' }} onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,147,58,0.6)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(201,147,58,0.2)')}>
                  {token.imageUrl ? (
                    <img src={token.imageUrl} alt={token.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${token.enemy ? "#8b1a1a" : token.npc ? "#2d7a3a" : "#1b4d8e"}` }} />
                  ) : (
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: token.enemy ? 'rgba(139,26,26,0.3)' : token.npc ? 'rgba(45,122,58,0.2)' : 'rgba(27,77,142,0.3)', border: `2px solid ${token.enemy ? "#8b1a1a" : token.npc ? "#2d7a3a" : "#1b4d8e"}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: token.enemy ? '#c0392b' : token.npc ? '#5cb85c' : '#c9933a', flexShrink: 0 }}>
                      {token.name[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'serif', color: '#f5d485', fontSize: '14px' }}>{token.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(244,237,216,0.45)' }}>HP: {token.maxHp} · AC: {token.ac} · {token.enemy ? 'Enemy' : token.npc ? 'NPC' : 'PC'}</div>
                  </div>
                  <span style={{ color: '#c9933a', fontSize: '12px' }}>+ Add</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showMapModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#12100a', border: '1px solid rgba(201,147,58,0.4)', borderRadius: '8px', padding: '24px', width: '420px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'serif', color: '#c9933a', fontSize: '16px', flex: 1 }}>Select Map</h2>
              <button onClick={() => setShowMapModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(244,237,216,0.5)', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>
            {availableMaps.length === 0 ? (
              <p style={{ color: 'rgba(244,237,216,0.45)', textAlign: 'center', padding: '24px' }}>You have no saved maps.</p>
            ) : (
              availableMaps.map(map => (
                <div key={map.id} onClick={() => handleLoadMap(map.id)} style={{ padding: '10px 12px', border: '1px solid rgba(201,147,58,0.2)', borderRadius: '4px', marginBottom: '6px', cursor: 'pointer', background: '#1e1a10', display: 'flex', alignItems: 'center', gap: '12px' }} onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,147,58,0.6)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(201,147,58,0.2)')}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'serif', color: '#f5d485', fontSize: '14px' }}>{map.name}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(244,237,216,0.45)' }}>{map.biome} · {map.cellWidth}×{map.cellHeight}</div>
                  </div>
                  <span style={{ color: '#c9933a', fontSize: '12px' }}>Load →</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "rgba(201,147,58,0.1)",
  border: "1px solid rgba(201,147,58,0.3)",
  borderRadius: "4px",
  padding: "5px 12px",
  color: "#f5d485",
  fontSize: "12px",
  cursor: "pointer",
};

const fogBtnStyle: React.CSSProperties = {
  background: "rgba(55,55,68,0.7)",
  border: "1px solid rgba(110,110,135,0.45)",
  borderRadius: "4px",
  padding: "5px 12px",
  color: "#9898b2",
  fontSize: "12px",
  cursor: "pointer",
};

const quickBtnStyle: React.CSSProperties = {
  background: "rgba(139,26,26,0.15)",
  border: "1px solid rgba(192,57,43,0.3)",
  borderRadius: "4px",
  padding: "4px 7px",
  color: "#c0392b",
  fontSize: "12px",
  cursor: "pointer",
  fontFamily: "serif",
};

export default GamePage;
