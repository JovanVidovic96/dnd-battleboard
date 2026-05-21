import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      if (isRegister) {
        await authService.register(username, email, password);
      } else {
        await authService.login(email, password);
      }
      navigate("/lobby");
    } catch (err) {
      setError("Pogrešni podaci, pokušaj ponovo.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#1a1a2e",
      }}
    >
      <h1 style={{ color: "#c9933a", fontFamily: "serif", fontSize: "2.5rem" }}>
        DnD Battle Board
      </h1>

      <div
        style={{
          background: "#12100a",
          border: "1px solid rgba(201,147,58,0.3)",
          borderRadius: "8px",
          padding: "32px",
          width: "360px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <h2
          style={{ color: "#f4edd8", textAlign: "center", marginBottom: "8px" }}
        >
          {isRegister ? "Registracija" : "Prijava"}
        </h2>

        {isRegister && (
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />
        )}

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          style={inputStyle}
        />

        {error && (
          <p
            style={{ color: "#c0392b", fontSize: "13px", textAlign: "center" }}
          >
            {error}
          </p>
        )}

        <button onClick={handleSubmit} style={buttonStyle}>
          {isRegister ? "Registruj se" : "Prijavi se"}
        </button>

        <button
          onClick={() => setIsRegister(!isRegister)}
          style={{
            background: "none",
            border: "none",
            color: "#c9933a",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          {isRegister
            ? "Već imaš nalog? Prijavi se"
            : "Nemaš nalog? Registruj se"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  background: "#1e1a10",
  border: "1px solid rgba(201,147,58,0.25)",
  borderRadius: "4px",
  padding: "10px 12px",
  color: "#f4edd8",
  fontSize: "14px",
  outline: "none",
};

const buttonStyle = {
  background: "rgba(201,147,58,0.15)",
  border: "1px solid rgba(201,147,58,0.5)",
  borderRadius: "4px",
  padding: "10px",
  color: "#f5d485",
  fontSize: "14px",
  cursor: "pointer",
  fontFamily: "serif",
  letterSpacing: "0.06em",
};

export default LoginPage;
