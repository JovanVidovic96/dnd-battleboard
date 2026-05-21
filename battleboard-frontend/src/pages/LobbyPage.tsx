import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { sessionService } from "../services/sessionService";
import type { Session } from "../types";

function LobbyPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [newSessionName, setNewSessionName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

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

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d0a06", padding: "0" }}>
      {/* Header */}
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
        {/* Join Session */}
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

        {/* My Sessions */}
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
