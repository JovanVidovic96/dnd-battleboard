import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tokenService } from "../services/tokenService";
import { diceService } from "../services/diceService";
import { authService } from "../services/authService";
import type { Token, DiceRoll } from "../types";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stompClientRef = useRef<Client | null>(null);

  const [tokens, setTokens] = useState<Token[]>([]);
  const [diceHistory, setDiceHistory] = useState<DiceRoll[]>([]);
  const [formula, setFormula] = useState("1d20");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [activeTool, setActiveTool] = useState<"select" | "move">("select");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragTokenRef = useRef<Token | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // WebSocket konekcija
  useEffect(() => {
    if (!sessionId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      onConnect: () => {
        console.log("WebSocket connected");

        client.subscribe(`/topic/session/${sessionId}`, (message) => {
          const data = JSON.parse(message.body);

          if (data.x !== undefined && data.y !== undefined) {
            // Token move event
            setTokens((prev) =>
              prev.map((t) =>
                t.id === data.tokenId ? { ...t, x: data.x, y: data.y } : t,
              ),
            );
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

  // Učitaj tokene
  useEffect(() => {
    if (!sessionId) return;
    tokenService
      .getTokensBySession(sessionId)
      .then(setTokens)
      .catch(console.error);
    diceService
      .getPublicHistory(sessionId)
      .then(setDiceHistory)
      .catch(console.error);
  }, [sessionId]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Background
    ctx.fillStyle = "#0d0a06";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    const GRID = 48 * zoom;
    ctx.strokeStyle = "rgba(201,147,58,0.15)";
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

    // Tokeni
    tokens.forEach((token) => {
      const tx = token.x * zoom + pan.x;
      const ty = token.y * zoom + pan.y;
      const size = 48 * zoom;

      // Token circle
      ctx.beginPath();
      ctx.arc(tx + size / 2, ty + size / 2, size / 2 - 2, 0, Math.PI * 2);
      ctx.fillStyle = token.npc ? "#1a0808" : "#080f1a";
      ctx.fill();
      ctx.strokeStyle = token.npc ? "#8b1a1a" : "#1b4d8e";
      ctx.lineWidth = selectedToken?.id === token.id ? 3 : 1.5;
      ctx.stroke();

      // Token inicijal
      ctx.fillStyle = token.npc ? "#c0392b" : "#c9933a";
      ctx.font = `bold ${Math.floor(size * 0.35)}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(token.name[0].toUpperCase(), tx + size / 2, ty + size / 2);

      // HP bar
      const hpRatio = token.hp / token.maxHp;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(tx + 2, ty + size - 6, size - 4, 4);
      ctx.fillStyle =
        hpRatio > 0.5 ? "#2d7a3a" : hpRatio > 0.25 ? "#c9933a" : "#8b1a1a";
      ctx.fillRect(tx + 2, ty + size - 6, (size - 4) * Math.max(0, hpRatio), 4);
    });
  }, [tokens, zoom, pan, selectedToken]);

  const handleRoll = async () => {
    if (!sessionId) return;
    try {
      const result = await diceService.roll(sessionId, formula);
      setDiceHistory((prev) => [result, ...prev.slice(0, 19)]);
    } catch (err) {
      console.error("Greška pri bacanju");
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const GRID = 48 * zoom;

    const clicked = tokens.find((t) => {
      const tx = t.x * zoom + pan.x;
      const ty = t.y * zoom + pan.y;
      return x >= tx && x <= tx + GRID && y >= ty && y <= ty + GRID;
    });

    if (clicked) {
      isDraggingRef.current = true;
      dragTokenRef.current = clicked;
      const tx = clicked.x * zoom + pan.x;
      const ty = clicked.y * zoom + pan.y;
      dragOffsetRef.current = { x: x - tx, y: y - ty };
      setSelectedToken(clicked);
      dragTokenRef.current = clicked;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !dragTokenRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const GRID = 48;

    const newX =
      Math.round((x - dragOffsetRef.current.x - pan.x) / (GRID * zoom)) * GRID;
    const newY =
      Math.round((y - dragOffsetRef.current.y - pan.y) / (GRID * zoom)) * GRID;

    setTokens((prev) =>
      prev.map((t) =>
        t.id === dragTokenRef.current!.id ? { ...t, x: newX, y: newY } : t,
      ),
    );
  };

  const handleMouseUp = async () => {
    if (!isDraggingRef.current || !dragTokenRef.current) return;
    isDraggingRef.current = false;

    const token = tokens.find((t) => t.id === dragTokenRef.current!.id);
    if (!token) return;

    // Sačuvaj u bazi
    await tokenService.moveToken(token.id, token.x, token.y);

    // WebSocket broadcast
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
      {/* Header */}
      <div
        style={{
          background: "#12100a",
          borderBottom: "1px solid rgba(201,147,58,0.25)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: "12px",
        }}
      >
        <span
          style={{
            color: "#c9933a",
            fontFamily: "serif",
            fontWeight: 700,
            letterSpacing: "0.1em",
          }}
        >
          ⚔ DnD Battle Board
        </span>
        <span style={{ color: "rgba(244,237,216,0.45)", fontSize: "13px" }}>
          Sesija: {sessionId?.slice(0, 8)}...
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            style={btnStyle}
          >
            +
          </button>
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

      {/* Main area */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 260px",
          overflow: "hidden",
        }}
      >
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", cursor: "crosshair" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />

        {/* Desni panel - tokeni */}
        <div
          style={{
            background: "#12100a",
            borderLeft: "1px solid rgba(201,147,58,0.25)",
            overflow: "auto",
            padding: "12px",
          }}
        >
          <div
            style={{
              fontFamily: "serif",
              fontSize: "11px",
              color: "rgba(244,237,216,0.45)",
              letterSpacing: "0.1em",
              marginBottom: "12px",
            }}
          >
            TOKENI U SESIJI
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
              Nema tokena u sesiji
            </p>
          ) : (
            tokens.map((token) => (
              <div
                key={token.id}
                onClick={() => setSelectedToken(token)}
                style={{
                  padding: "8px 10px",
                  borderRadius: "4px",
                  marginBottom: "6px",
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
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: token.npc
                        ? "rgba(139,26,26,0.3)"
                        : "rgba(27,77,142,0.3)",
                      border: `1.5px solid ${token.npc ? "#8b1a1a" : "#1b4d8e"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: token.npc ? "#c0392b" : "#c9933a",
                    }}
                  >
                    {token.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", color: "#f4edd8" }}>
                      {token.name}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(244,237,216,0.45)",
                      }}
                    >
                      HP: {token.hp}/{token.maxHp} · AC: {token.ac}
                    </div>
                  </div>
                </div>
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
                      background:
                        token.hp / token.maxHp > 0.5 ? "#2d7a3a" : "#8b1a1a",
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom panel */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          borderTop: "1px solid rgba(201,147,58,0.25)",
        }}
      >
        {/* Dice log */}
        <div
          style={{
            background: "#12100a",
            borderRight: "1px solid rgba(201,147,58,0.25)",
            overflow: "auto",
            padding: "8px 12px",
          }}
        >
          <div
            style={{
              fontFamily: "serif",
              fontSize: "10px",
              color: "rgba(244,237,216,0.45)",
              letterSpacing: "0.1em",
              marginBottom: "8px",
            }}
          >
            LOG BACANJA
          </div>
          {diceHistory.map((roll) => (
            <div
              key={roll.id}
              style={{
                fontSize: "12px",
                color: "#f4edd8",
                padding: "3px 0",
                borderBottom: "1px solid rgba(201,147,58,0.08)",
              }}
            >
              <span style={{ color: "#c9933a" }}>{roll.ownerUsername}</span>
              {" bacio "}
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
                [{roll.rolls.join(", ")}]
              </span>
            </div>
          ))}
        </div>

        {/* Dice roller */}
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
              Baci
            </button>
          </div>
        </div>
      </div>
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

export default GamePage;
