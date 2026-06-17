import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { sessionService } from "../services/sessionService";
import { tokenService } from "../services/tokenService";
import type { Session, Token } from "../types";
import { mapService } from "../services/mapService";
import { uploadService } from "../services/uploadService";
import { toast } from "../utils/toast";
import type { GameMap } from "../types";

/** Pre-game lobby for creating and joining sessions, managing the token library, and managing saved maps. */
function LobbyPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [newSessionName, setNewSessionName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();
  const [myTokens, setMyTokens] = useState<Token[]>([]);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [newToken, setNewToken] = useState({
    name: "",
    maxHp: 10,
    ac: 10,
    isNpc: false,
    enemy: false,
    imageUrl: "",
    width: 1,
    height: 1,
  });
  const [myMaps, setMyMaps] = useState<GameMap[]>([]);
  const [showMapForm, setShowMapForm] = useState(false);
  const [newMap, setNewMap] = useState({
    name: "",
    biome: "CAVE",
    backgroundImgUrl: "",
    cellSize: 48,
    cellWidth: 24,
    cellHeight: 16,
  });

  const loadSessions = async () => {
    try {
      const data = await sessionService.getMysessions();
      setSessions(data);
    } catch {
      toast.error("Failed to load sessions");
    }
  };
  useEffect(() => {
    loadSessions();
    tokenService.getMyTokens().then(setMyTokens).catch(() => toast.error("Failed to load tokens"));
    mapService.getMaps().then(setMyMaps).catch(() => toast.error("Failed to load maps"));
  }, []);

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;
    try {
      await sessionService.createSession(newSessionName);
      setNewSessionName("");
      setShowCreate(false);
      loadSessions();
    } catch {
      toast.error("Failed to create session");
    }
  };

  const handleJoinSession = async () => {
    if (!inviteCode.trim()) return;
    try {
      const session = await sessionService.joinSession(inviteCode);
      navigate(`/game/${session.id}`);
    } catch {
      toast.error("Failed to join session");
    }
  };

  const handleCreateToken = async () => {
    if (!newToken.name.trim()) return;
    try {
      const created = await tokenService.createToken(newToken);
      setMyTokens((prev) => [...prev, created]);
      setShowTokenForm(false);
      setNewToken({
        name: "",
        maxHp: 10,
        ac: 10,
        isNpc: false,
        enemy: false,
        imageUrl: "",
        width: 1,
        height: 1,
      });
    } catch {
      toast.error("Failed to create token");
    }
  };

  const handleAddToSession = async (tokenId: string, sessionId: string) => {
    try {
      await tokenService.updateToken(tokenId, { sessionId });
      toast.success("Token added to session!");
    } catch {
      toast.error("Failed to add token to session");
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    try {
      await tokenService.deleteToken(tokenId);
      setMyTokens((prev) => prev.filter((t) => t.id !== tokenId));
    } catch {
      toast.error("Failed to delete token");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await sessionService.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      toast.error("Failed to delete session");
    }
  };

  const handleToggleActive = async (sessionId: string, currentActive: boolean) => {
    try {
      await sessionService.setActive(sessionId, !currentActive);
      setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, active: !currentActive } : s));
    } catch {
      toast.error("Failed to update session status");
    }
  };

  const handleCreateMap = async () => {
    if (!newMap.name.trim()) return;
    try {
      const created = await mapService.createMap(newMap);
      setMyMaps((prev) => [...prev, created]);
      setShowMapForm(false);
      setNewMap({
        name: "",
        biome: "CAVE",
        backgroundImgUrl: "",
        cellSize: 48,
        cellWidth: 24,
        cellHeight: 16,
      });
    } catch {
      toast.error("Failed to create map");
    }
  };

  const handleDeleteMap = async (mapId: string) => {
    try {
      await mapService.deleteMap(mapId);
      setMyMaps((prev) => prev.filter((m) => m.id !== mapId));
    } catch {
      toast.error("Failed to delete map");
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 80% 0%, rgba(20,12,45,0.8) 0%, transparent 55%), radial-gradient(ellipse at 15% 100%, rgba(60,15,15,0.5) 0%, transparent 50%), #0a0806", padding: "0" }}>
      <div
        style={{
          background: "linear-gradient(180deg, #161209 0%, #100d07 100%)",
          borderBottom: "1px solid rgba(201,147,58,0.3)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <h1
          className="gold-glow"
          style={{
            color: "#c9933a",
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "1.4rem",
            letterSpacing: "0.1em",
            flex: 1,
          }}
        >
          ⚔ DnD Battle Board
        </h1>
        <span style={{ color: "#f4edd8", fontSize: "14px" }}>
          👤 {authService.getUsername()}
        </span>
        <button onClick={handleLogout} style={dangerButtonStyle}>
          Logout
        </button>
      </div>

      <div
        style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px" }}
      >
        <div className="ornate-card ornate-fade" style={{ ...cardStyle, animationDelay: '0s' }}>
          <h2 style={sectionTitleStyle}>🔑 Join Session</h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              placeholder="Invite code (npr. A3F9K2B1)"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoinSession()}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={handleJoinSession} style={buttonStyle}>
              Join
            </button>
          </div>
        </div>

        <div className="ornate-card ornate-fade" style={{ ...cardStyle, animationDelay: '0.1s' }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ ...sectionTitleStyle, marginBottom: 0, flex: 1 }}>
              🏰 My Sessions
            </h2>
            <button
              onClick={() => setShowCreate(!showCreate)}
              style={buttonStyle}
            >
              + New Session
            </button>
          </div>

          {showCreate && (
            <div className="slide-down" style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input
                placeholder="Session name"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateSession()}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={handleCreateSession} style={buttonStyle}>
                Kreiraj
              </button>
            </div>
          )}

          {sessions.length === 0 ? (
            <p
              style={{
                color: "rgba(244,237,216,0.45)",
                fontSize: "14px",
                textAlign: "center",
                padding: "24px",
              }}
            >
              No active sessions. Create one!
            </p>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="ornate-row" style={sessionRowStyle}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "serif",
                      fontSize: "15px",
                      color: "#f5d485",
                      fontWeight: 600,
                    }}
                  >
                    {session.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "rgba(244,237,216,0.45)",
                      marginTop: "2px",
                    }}
                  >
                    Invite:{" "}
                    <span style={{ color: "#c9933a", letterSpacing: "0.1em" }}>
                      {session.inviteCode}
                    </span>
                    {" · "}
                    {session.playerCount} players
                  </div>
                </div>
                <div
                  style={{ display: "flex", gap: "6px", alignItems: "center" }}
                >
                  <button
                    onClick={() => handleToggleActive(session.id, session.active)}
                    className={session.active ? "active-pulse" : undefined}
                    style={{
                      ...buttonStyle,
                      fontSize: "11px",
                      padding: "4px 10px",
                      color: session.active ? "#2d7a3a" : "#555",
                      borderColor: session.active ? "rgba(45,122,58,0.5)" : "rgba(100,100,100,0.4)",
                      background: session.active ? "rgba(45,122,58,0.1)" : "rgba(50,50,50,0.2)",
                    }}
                  >
                    {session.active ? "● Active" : "○ Inactive"}
                  </button>
                  <button
                    onClick={() => navigate(`/game/${session.id}`)}
                    style={buttonStyle}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    style={{
                      ...buttonStyle,
                      color: "#c0392b",
                      fontSize: "11px",
                      padding: "4px 10px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="ornate-card ornate-fade" style={{ ...cardStyle, animationDelay: '0.2s' }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ ...sectionTitleStyle, marginBottom: 0, flex: 1 }}>
              🛡 My Tokens
            </h2>
            <button
              onClick={() => setShowTokenForm(!showTokenForm)}
              style={buttonStyle}
            >
              + New Token
            </button>
          </div>

          {showTokenForm && (
            <div
              className="slide-down"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "16px",
                padding: "12px",
                background: "#1e1a10",
                borderRadius: "4px",
                border: "1px solid rgba(201,147,58,0.15)",
              }}
            >
              <input
                placeholder="Token name"
                value={newToken.name}
                onChange={(e) =>
                  setNewToken((p) => ({ ...p, name: e.target.value }))
                }
                style={inputStyle}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(244,237,216,0.45)",
                      marginBottom: "4px",
                    }}
                  >
                    Max HP
                  </div>
                  <input
                    type="number"
                    value={newToken.maxHp}
                    onChange={(e) =>
                      setNewToken((p) => ({ ...p, maxHp: +e.target.value }))
                    }
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(244,237,216,0.45)",
                      marginBottom: "4px",
                    }}
                  >
                    AC
                  </div>
                  <input
                    type="number"
                    value={newToken.ac}
                    onChange={(e) =>
                      setNewToken((p) => ({ ...p, ac: +e.target.value }))
                    }
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "rgba(244,237,216,0.45)", marginBottom: "6px" }}>Token type</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {([
                    { label: "PC", isNpc: false, enemy: false, activeColor: "#7aaee0", activeBorder: "rgba(27,77,142,0.8)", activeBg: "rgba(27,77,142,0.2)" },
                    { label: "NPC", isNpc: true, enemy: false, activeColor: "#5cb85c", activeBorder: "rgba(45,122,58,0.8)", activeBg: "rgba(45,122,58,0.15)" },
                    { label: "Enemy", isNpc: true, enemy: true, activeColor: "#e07a7a", activeBorder: "rgba(139,26,26,0.8)", activeBg: "rgba(139,26,26,0.2)" },
                  ] as const).map((type) => {
                    const active = newToken.isNpc === type.isNpc && newToken.enemy === type.enemy;
                    return (
                      <button
                        key={type.label}
                        type="button"
                        onClick={() => setNewToken((p) => ({ ...p, isNpc: type.isNpc, enemy: type.enemy }))}
                        style={{
                          flex: 1, padding: "6px 0", borderRadius: "4px", cursor: "pointer",
                          fontFamily: "serif", fontSize: "13px",
                          border: `1px solid ${active ? type.activeBorder : "rgba(201,147,58,0.2)"}`,
                          background: active ? type.activeBg : "#0d0a06",
                          color: active ? type.activeColor : "rgba(244,237,216,0.45)",
                        }}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "rgba(244,237,216,0.45)", marginBottom: "4px" }}>
                  Token image
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {newToken.imageUrl && (
                    <img
                      src={newToken.imageUrl}
                      alt="preview"
                      style={{
                        width: "42px", height: "42px", borderRadius: "50%",
                        objectFit: "cover", border: "1.5px solid rgba(201,147,58,0.4)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadService.uploadImage(file);
                        setNewToken((p) => ({ ...p, imageUrl: url }));
                      } catch {
                        toast.error("Failed to upload image");
                      }
                    }}
                    style={{ ...inputStyle, padding: "4px 8px", fontSize: "12px", flex: 1 }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleCreateToken} style={buttonStyle}>
                  Create
                </button>
                <button
                  onClick={() => setShowTokenForm(false)}
                  style={{ ...buttonStyle, color: "#c0392b" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {myTokens.length === 0 ? (
            <p
              style={{
                color: "rgba(244,237,216,0.45)",
                fontSize: "14px",
                textAlign: "center",
                padding: "24px",
              }}
            >
              No saved tokens. Create one!
            </p>
          ) : (
            myTokens.map((token) => (
              <div key={token.id} className="ornate-row" style={sessionRowStyle}>
                {token.imageUrl ? (
                  <img
                    src={token.imageUrl}
                    alt={token.name}
                    style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      objectFit: "cover", flexShrink: 0,
                      border: `1.5px solid ${token.enemy ? "#8b1a1a" : token.npc ? "#2d7a3a" : "#1b4d8e"}`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                      background: token.enemy ? "rgba(139,26,26,0.3)" : token.npc ? "rgba(45,122,58,0.2)" : "rgba(27,77,142,0.3)",
                      border: `1.5px solid ${token.enemy ? "#8b1a1a" : token.npc ? "#2d7a3a" : "#1b4d8e"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "13px", fontWeight: 700,
                      color: token.enemy ? "#c0392b" : token.npc ? "#5cb85c" : "#c9933a",
                    }}
                  >
                    {token.name[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "serif",
                      fontSize: "14px",
                      color: "#f5d485",
                    }}
                  >
                    {token.name}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(244,237,216,0.45)",
                    }}
                  >
                    HP: {token.maxHp} · AC: {token.ac} ·{" "}
                    {token.enemy ? "Enemy" : token.npc ? "NPC" : "PC"}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    flexDirection: "column",
                  }}
                >
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleAddToSession(token.id, session.id)}
                      style={{
                        ...buttonStyle,
                        fontSize: "11px",
                        padding: "4px 10px",
                      }}
                    >
                      + {session.name}
                    </button>
                  ))}
                  <button
                    onClick={() => handleDeleteToken(token.id)}
                    style={{
                      ...buttonStyle,
                      color: "#c0392b",
                      fontSize: "11px",
                      padding: "4px 10px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="ornate-card ornate-fade" style={{ ...cardStyle, animationDelay: '0.3s' }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ ...sectionTitleStyle, marginBottom: 0, flex: 1 }}>
              🗺 My Maps
            </h2>
            <button
              onClick={() => setShowMapForm(!showMapForm)}
              style={buttonStyle}
            >
              + New Map
            </button>
          </div>

          {showMapForm && (
            <div
              className="slide-down"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "16px",
                padding: "12px",
                background: "#1e1a10",
                borderRadius: "4px",
                border: "1px solid rgba(201,147,58,0.15)",
              }}
            >
              <input
                placeholder="Map name"
                value={newMap.name}
                onChange={(e) =>
                  setNewMap((p) => ({ ...p, name: e.target.value }))
                }
                style={inputStyle}
              />
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(244,237,216,0.45)",
                    marginBottom: "4px",
                  }}
                >
                  Biome
                </div>
                <select
                  value={newMap.biome}
                  onChange={(e) =>
                    setNewMap((p) => ({ ...p, biome: e.target.value }))
                  }
                  style={{ ...inputStyle, width: "100%" }}
                >
                  <option value="CAVE">Cave</option>
                  <option value="FOREST">Forest</option>
                  <option value="OCEAN">Ocean</option>
                  <option value="DESERT">Desert</option>
                  <option value="MOUNTAIN">Mountain</option>
                  <option value="CITY">City</option>
                  <option value="DUNGEON">Dungeon</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(244,237,216,0.45)",
                      marginBottom: "4px",
                    }}
                  >
                    Width (cells)
                  </div>
                  <input
                    type="number"
                    value={newMap.cellWidth}
                    onChange={(e) =>
                      setNewMap((p) => ({ ...p, cellWidth: +e.target.value }))
                    }
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(244,237,216,0.45)",
                      marginBottom: "4px",
                    }}
                  >
                    Height (cells)
                  </div>
                  <input
                    type="number"
                    value={newMap.cellHeight}
                    onChange={(e) =>
                      setNewMap((p) => ({ ...p, cellHeight: +e.target.value }))
                    }
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleCreateMap} style={buttonStyle}>
                  Create
                </button>
                <button
                  onClick={() => setShowMapForm(false)}
                  style={{ ...buttonStyle, color: "#c0392b" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {myMaps.length === 0 ? (
            <p
              style={{
                color: "rgba(244,237,216,0.45)",
                fontSize: "14px",
                textAlign: "center",
                padding: "24px",
              }}
            >
              No saved maps. Create one!
            </p>
          ) : (
            myMaps.map((map) => (
              <div key={map.id} className="ornate-row" style={sessionRowStyle}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "serif",
                      fontSize: "14px",
                      color: "#f5d485",
                    }}
                  >
                    {map.name}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(244,237,216,0.45)",
                    }}
                  >
                    {map.biome} · {map.cellWidth}×{map.cellHeight} cells
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => navigate(`/map-editor/${map.id}`)}
                    style={buttonStyle}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMap(map.id)}
                    style={{ ...buttonStyle, color: "#c0392b" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #14110a 0%, #100d08 100%)",
  border: "1px solid rgba(201,147,58,0.25)",
  borderRadius: "10px",
  padding: "20px 24px",
  marginBottom: "18px",
  boxShadow: "0 4px 18px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,147,58,0.05)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "'Cinzel', serif",
  fontWeight: 700,
  fontSize: "1rem",
  color: "#c9933a",
  letterSpacing: "0.08em",
  marginBottom: "16px",
};

const inputStyle: React.CSSProperties = {
  background: "#1e1a10",
  border: "1px solid rgba(201,147,58,0.25)",
  borderRadius: "4px",
  padding: "8px 12px",
  color: "#f4edd8",
  fontSize: "14px",
  outline: "none",
};

const sessionRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 12px",
  border: "1px solid rgba(201,147,58,0.15)",
  borderRadius: "4px",
  marginBottom: "6px",
  background: "#1e1a10",
};

const buttonStyle: React.CSSProperties = {
  background: "rgba(201,147,58,0.12)",
  border: "1px solid rgba(201,147,58,0.4)",
  borderRadius: "4px",
  padding: "7px 16px",
  color: "#f5d485",
  fontSize: "13px",
  cursor: "pointer",
  fontFamily: "serif",
  letterSpacing: "0.04em",
};

const dangerButtonStyle: React.CSSProperties = {
  background: "rgba(139,26,26,0.15)",
  border: "1px solid rgba(192,57,43,0.4)",
  borderRadius: "4px",
  padding: "7px 16px",
  color: "#c0392b",
  fontSize: "13px",
  cursor: "pointer",
};

export default LobbyPage;
