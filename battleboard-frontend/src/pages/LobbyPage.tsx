import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { sessionService } from "../services/sessionService";
import { tokenService } from "../services/tokenService";
import type { Session } from "../types";
import { mapService } from "../services/mapService";
import type { GameMap } from "../types";

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
    } catch (err) {
      console.error("Greška pri učitavanju sesija");
    }
  };
  useEffect(() => {
    loadSessions();
    tokenService.getMyTokens().then(setMyTokens).catch(console.error);
    mapService.getMaps().then(setMyMaps).catch(console.error);
  }, []);

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;
    try {
      await sessionService.createSession(newSessionName);
      setNewSessionName("");
      setShowCreate(false);
      loadSessions();
    } catch (err) {
      console.error("Greška pri kreiranju sesije");
    }
  };

  const handleJoinSession = async () => {
    if (!inviteCode.trim()) return;
    try {
      const session = await sessionService.joinSession(inviteCode);
      navigate(`/game/${session.id}`);
    } catch (err) {
      console.error("Greška pri pridruživanju sesiji");
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
        imageUrl: "",
        width: 1,
        height: 1,
      });
    } catch (err) {
      console.error("Greška pri kreiranju tokena");
    }
  };

  const handleAddToSession = async (tokenId: string, sessionId: string) => {
    try {
      await tokenService.updateToken(tokenId, { sessionId });
      alert("Token dodat u sesiju!");
    } catch (err) {
      console.error("Greška pri dodavanju tokena u sesiju");
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    try {
      await tokenService.deleteToken(tokenId);
      setMyTokens((prev) => prev.filter((t) => t.id !== tokenId));
    } catch (err) {
      console.error("Greška pri brisanju tokena");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await sessionService.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error("Greška pri brisanju sesije");
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
    } catch (err) {
      console.error("Greška pri kreiranju mape");
    }
  };

  const handleDeleteMap = async (mapId: string) => {
    try {
      await mapService.deleteMap(mapId);
      setMyMaps((prev) => prev.filter((m) => m.id !== mapId));
    } catch (err) {
      console.error("Greška pri brisanju mape");
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d0a06", padding: "0" }}>
      {/* ===== HEADER ===== */}
      <div
        style={{
          background: "#12100a",
          borderBottom: "1px solid rgba(201,147,58,0.25)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <h1
          style={{
            color: "#c9933a",
            fontFamily: "serif",
            fontSize: "1.4rem",
            letterSpacing: "0.1em",
            flex: 1,
          }}
        >
          DnD Battle Board
        </h1>
        <span style={{ color: "#f4edd8", fontSize: "14px" }}>
          {authService.getUsername()}
        </span>
        <button onClick={handleLogout} style={dangerButtonStyle}>
          Odjavi se
        </button>
      </div>

      <div
        style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px" }}
      >
        {/* ===== PRIDRUZI SE SESIJI ===== */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Pridruži se sesiji</h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              placeholder="Invite code (npr. A3F9K2B1)"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoinSession()}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={handleJoinSession} style={buttonStyle}>
              Pridruži se
            </button>
          </div>
        </div>

        {/* ===== MOJE SESIJE ===== */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ ...sectionTitleStyle, marginBottom: 0, flex: 1 }}>
              Moje sesije
            </h2>
            <button
              onClick={() => setShowCreate(!showCreate)}
              style={buttonStyle}
            >
              + Nova sesija
            </button>
          </div>

          {/* FORMA ZA KREIRANJE SESIJE */}
          {showCreate && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input
                placeholder="Naziv sesije"
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

          {/* LISTA SESIJA */}
          {sessions.length === 0 ? (
            <p
              style={{
                color: "rgba(244,237,216,0.45)",
                fontSize: "14px",
                textAlign: "center",
                padding: "24px",
              }}
            >
              Nemaš aktivnih sesija. Kreiraj novu!
            </p>
          ) : (
            sessions.map((session) => (
              <div key={session.id} style={sessionRowStyle}>
                {/* INFO O SESIJI */}
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
                    {session.playerCount} igrača
                  </div>
                </div>
                {/* DUGMAD ZA SESIJU */}
                <div
                  style={{ display: "flex", gap: "6px", alignItems: "center" }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: session.active ? "#2d7a3a" : "#555",
                    }}
                  />
                  <button
                    onClick={() => navigate(`/game/${session.id}`)}
                    style={buttonStyle}
                  >
                    Otvori
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
                    Obriši
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ===== TOKEN LIBRARY ===== */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ ...sectionTitleStyle, marginBottom: 0, flex: 1 }}>
              Moji tokeni
            </h2>
            <button
              onClick={() => setShowTokenForm(!showTokenForm)}
              style={buttonStyle}
            >
              + Novi token
            </button>
          </div>

          {showTokenForm && (
            <div
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
                placeholder="Ime tokena"
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
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "#f4edd8",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={newToken.isNpc}
                  onChange={(e) =>
                    setNewToken((p) => ({ ...p, isNpc: e.target.checked }))
                  }
                />
                NPC karakter
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleCreateToken} style={buttonStyle}>
                  Kreiraj
                </button>
                <button
                  onClick={() => setShowTokenForm(false)}
                  style={{ ...buttonStyle, color: "#c0392b" }}
                >
                  Otkaži
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
              Nemaš sačuvanih tokena. Kreiraj novi!
            </p>
          ) : (
            myTokens.map((token) => (
              <div key={token.id} style={sessionRowStyle}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: token.npc
                      ? "rgba(139,26,26,0.3)"
                      : "rgba(27,77,142,0.3)",
                    border: `1.5px solid ${token.npc ? "#8b1a1a" : "#1b4d8e"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: token.npc ? "#c0392b" : "#c9933a",
                    flexShrink: 0,
                  }}
                >
                  {token.name[0].toUpperCase()}
                </div>
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
                    {token.npc ? "NPC" : "PC"}
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
                    Obriši
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ===== MOJE MAPE ===== */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ ...sectionTitleStyle, marginBottom: 0, flex: 1 }}>
              Moje mape
            </h2>
            <button
              onClick={() => setShowMapForm(!showMapForm)}
              style={buttonStyle}
            >
              + Nova mapa
            </button>
          </div>

          {showMapForm && (
            <div
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
                placeholder="Naziv mape"
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
                  Biom
                </div>
                <select
                  value={newMap.biome}
                  onChange={(e) =>
                    setNewMap((p) => ({ ...p, biome: e.target.value }))
                  }
                  style={{ ...inputStyle, width: "100%" }}
                >
                  <option value="CAVE">Pećina</option>
                  <option value="FOREST">Šuma</option>
                  <option value="OCEAN">Okean</option>
                  <option value="DESERT">Pustinja</option>
                  <option value="MOUNTAIN">Planina</option>
                  <option value="CITY">Grad</option>
                  <option value="DUNGEON">Tamnica</option>
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
                    Širina (ćelije)
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
                    Visina (ćelije)
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
                  Kreiraj
                </button>
                <button
                  onClick={() => setShowMapForm(false)}
                  style={{ ...buttonStyle, color: "#c0392b" }}
                >
                  Otkaži
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
              Nemaš sačuvanih mapa. Kreiraj novu!
            </p>
          ) : (
            myMaps.map((map) => (
              <div key={map.id} style={sessionRowStyle}>
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
                    {map.biome} · {map.cellWidth}×{map.cellHeight} ćelija
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => navigate(`/map-editor/${map.id}`)}
                    style={buttonStyle}
                  >
                    Uredi
                  </button>
                  <button
                    onClick={() => handleDeleteMap(map.id)}
                    style={{ ...buttonStyle, color: "#c0392b" }}
                  >
                    Obriši
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
  background: "#12100a",
  border: "1px solid rgba(201,147,58,0.25)",
  borderRadius: "8px",
  padding: "20px 24px",
  marginBottom: "16px",
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "serif",
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
