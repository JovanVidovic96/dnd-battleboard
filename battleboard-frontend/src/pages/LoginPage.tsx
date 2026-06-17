import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

const ALLOWED_DOMAINS = new Set([
  "gmail.com","googlemail.com",
  "yahoo.com","yahoo.co.uk","yahoo.fr","yahoo.de","yahoo.es","yahoo.it","yahoo.com.br","yahoo.com.au",
  "hotmail.com","hotmail.co.uk","hotmail.fr","hotmail.de","hotmail.es","hotmail.it",
  "outlook.com","outlook.fr","outlook.de","outlook.es","outlook.it",
  "live.com","live.co.uk","live.fr","live.de",
  "msn.com",
  "icloud.com","me.com","mac.com",
  "protonmail.com","proton.me",
  "aol.com",
  "mail.com",
  "zoho.com",
  "yandex.com","yandex.ru",
  "gmx.com","gmx.net","gmx.de",
]);

const STARS: [number, number, number, number][] = [
  [72,42,1.2,0.85],[145,28,1,0.7],[198,75,1.5,0.9],[280,18,1,0.65],
  [320,55,1.3,0.8],[405,38,1,0.75],[452,88,1.2,0.7],[518,22,1,0.9],
  [575,68,1.5,0.6],[648,32,1,0.8],[718,52,1.3,0.85],[792,18,1,0.7],
  [868,72,1,0.75],[938,28,1.5,0.8],[1018,48,1,0.65],[1098,22,1.2,0.9],
  [1175,58,1,0.7],[1248,38,1.3,0.8],[1325,78,1,0.75],[1388,32,1.5,0.85],
  [55,145,1,0.65],[128,118,1.5,0.8],[212,168,1,0.7],[295,108,1.2,0.9],
  [375,158,1,0.6],[458,128,1.3,0.75],[548,178,1,0.8],[638,118,1.5,0.7],
  [728,148,1,0.85],[818,108,1.2,0.65],[908,168,1,0.8],[998,128,1.3,0.75],
  [1085,158,1,0.9],[1168,118,1.5,0.7],[1258,148,1,0.65],[1348,128,1.2,0.8],
  [68,248,1,0.7],[168,228,1.3,0.8],[268,268,1,0.65],[368,238,1.5,0.75],
  [468,258,1,0.85],[568,218,1.2,0.7],[668,248,1,0.8],[768,228,1.3,0.65],
  [868,268,1,0.75],[968,238,1.5,0.8],[1068,258,1,0.7],[1168,218,1.2,0.85],
  [1268,248,1,0.65],[1368,228,1.3,0.75],
];

/** Login and registration page with a procedural dark fantasy castle SVG illustration. Email domain is validated against a known-provider allowlist. */
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    const domain = email.split("@")[1]?.toLowerCase();
    if (!ALLOWED_DOMAINS.has(domain)) {
      setError("Please use a real email provider (Gmail, Outlook, Yahoo, iCloud, etc.).");
      return;
    }
    if (isRegister && !username.trim()) {
      setError("Please enter a username.");
      return;
    }
    try {
      if (isRegister) {
        await authService.register(username, email, password);
      } else {
        await authService.login(email, password);
      }
      navigate("/lobby");
    } catch {
      setError("Incorrect credentials, please try again.");
    }
  };

  return (
    <div style={{ position: "relative", height: "100vh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>

      <svg
        viewBox="0 0 1440 900"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#03020a"/>
            <stop offset="65%" stopColor="#0b0619"/>
            <stop offset="100%" stopColor="#1c0a0a"/>
          </linearGradient>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f5d485" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#c9933a" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="fireGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8b1a1a" stopOpacity="0.28"/>
            <stop offset="100%" stopColor="#8b1a1a" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="groundMist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d0208" stopOpacity="0"/>
            <stop offset="100%" stopColor="#080410" stopOpacity="1"/>
          </linearGradient>
        </defs>

        <rect width="1440" height="900" fill="url(#skyGrad)"/>
        <ellipse cx="1080" cy="155" rx="130" ry="130" fill="url(#moonGlow)" className="moon-glow-pulse"/>
        <ellipse cx="180" cy="900" rx="520" ry="280" fill="url(#fireGlow)"/>

        <circle cx="1080" cy="155" r="52" fill="#e8c87a" opacity="0.72"/>
        <circle cx="1068" cy="146" r="13" fill="#d4a84a" opacity="0.45"/>
        <circle cx="1092" cy="162" r="8" fill="#c49030" opacity="0.3"/>

        {STARS.map(([cx, cy, r, op], i) => (
          <circle
            key={i} cx={cx} cy={cy} r={r} fill="white"
            className={i % 3 === 0 ? 'twinkle-slow' : i % 3 === 1 ? 'twinkle-med' : 'twinkle-fast'}
            style={{ '--op': op, animationDelay: `${(i * 0.41) % 5}s` } as React.CSSProperties}
          />
        ))}

        <polygon
          points="0,900 0,615 55,535 135,572 215,505 295,548 378,478 458,528 538,458 618,508 698,438 758,480 820,448 902,498 982,428 1062,478 1142,408 1222,458 1302,428 1382,468 1440,438 1440,900"
          fill="#0d0b1e" opacity="0.92"
        />

        <polygon
          points="0,900 0,715 78,642 158,678 238,608 318,652 398,582 478,632 558,562 638,608 698,548 738,578 778,558 858,612 938,542 1018,592 1098,522 1178,572 1258,528 1338,578 1440,535 1440,900"
          fill="#090714"
        />

        <polygon points="580,900 635,578 665,560 700,545 720,538 740,545 768,558 800,575 860,900" fill="#06040f"/>

        <rect x="632" y="386" width="46" height="198" fill="#06040f"/>
        <rect x="632" y="371" width="9" height="18" fill="#06040f"/>
        <rect x="645" y="371" width="9" height="18" fill="#06040f"/>
        <rect x="658" y="371" width="9" height="18" fill="#06040f"/>
        <rect x="669" y="371" width="9" height="18" fill="#06040f"/>
        <rect x="648" y="428" width="8" height="13" fill="#c9933a" className="castle-light" style={{ '--fl': 0.55, animationDelay: '0.3s' } as React.CSSProperties}/>
        <rect x="648" y="468" width="8" height="13" fill="#c9933a" className="castle-light" style={{ '--fl': 0.45, animationDelay: '1.1s' } as React.CSSProperties}/>

        <rect x="680" y="358" width="92" height="228" fill="#06040f"/>
        <rect x="680" y="341" width="11" height="20" fill="#06040f"/>
        <rect x="695" y="341" width="11" height="20" fill="#06040f"/>
        <rect x="710" y="341" width="11" height="20" fill="#06040f"/>
        <rect x="725" y="341" width="11" height="20" fill="#06040f"/>
        <rect x="740" y="341" width="11" height="20" fill="#06040f"/>
        <rect x="755" y="341" width="11" height="20" fill="#06040f"/>
        <rect x="699" y="405" width="9" height="14" fill="#c9933a" className="castle-light" style={{ '--fl': 0.62, animationDelay: '0s'   } as React.CSSProperties}/>
        <rect x="718" y="405" width="9" height="14" fill="#c9933a" className="castle-light" style={{ '--fl': 0.58, animationDelay: '0.7s' } as React.CSSProperties}/>
        <rect x="737" y="405" width="9" height="14" fill="#c9933a" className="castle-light" style={{ '--fl': 0.52, animationDelay: '1.4s' } as React.CSSProperties}/>
        <rect x="706" y="452" width="9" height="14" fill="#c9933a" className="castle-light" style={{ '--fl': 0.48, animationDelay: '0.5s' } as React.CSSProperties}/>
        <rect x="728" y="452" width="9" height="14" fill="#c9933a" className="castle-light" style={{ '--fl': 0.5,  animationDelay: '1.7s' } as React.CSSProperties}/>
        <rect x="706" y="499" width="9" height="14" fill="#c9933a" className="castle-light" style={{ '--fl': 0.4,  animationDelay: '0.9s' } as React.CSSProperties}/>
        <rect x="728" y="499" width="9" height="14" fill="#c9933a" className="castle-light" style={{ '--fl': 0.42, animationDelay: '1.2s' } as React.CSSProperties}/>
        <rect x="713" y="526" width="26" height="60" fill="#020108"/>
        <ellipse cx="726" cy="526" rx="13" ry="11" fill="#020108"/>

        <rect x="774" y="380" width="46" height="204" fill="#06040f"/>
        <rect x="774" y="365" width="9" height="18" fill="#06040f"/>
        <rect x="787" y="365" width="9" height="18" fill="#06040f"/>
        <rect x="800" y="365" width="9" height="18" fill="#06040f"/>
        <rect x="811" y="365" width="9" height="18" fill="#06040f"/>
        <rect x="789" y="422" width="8" height="13" fill="#c9933a" className="castle-light" style={{ '--fl': 0.5,  animationDelay: '0.6s' } as React.CSSProperties}/>
        <rect x="789" y="462" width="8" height="13" fill="#c9933a" className="castle-light" style={{ '--fl': 0.42, animationDelay: '1.9s' } as React.CSSProperties}/>

        <rect x="793" y="337" width="2" height="30" fill="#8b1a1a" opacity="0.85"/>
        <polygon className="flag-wave" points="795,337 795,351 812,344" fill="#8b1a1a" opacity="0.85"/>

        <path
          className="dragon-fly"
          d="M975,205 Q962,196 948,201 Q938,210 944,217 Q955,213 964,218 L973,214 Q980,218 989,216 Q998,217 1006,210 Q1012,202 1002,197 Q990,194 975,205 Z M973,214 L971,228 L966,225 Z"
          fill="#180608" opacity="0.75"
        />

        <rect x="0" y="700" width="1440" height="200" fill="url(#groundMist)"/>
      </svg>

      <div className="ornate-fade" style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>

        <div style={{ textAlign: "center" }}>
          <h1 className="gold-glow" style={{
            color: "#c9933a",
            fontFamily: "'Cinzel Decorative', 'Cinzel', Georgia, serif",
            fontWeight: 700,
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            letterSpacing: "0.15em",
            marginBottom: "6px",
          }}>
            ⚔ DnD Battle Board
          </h1>
          <p style={{
            color: "rgba(244,237,216,0.35)",
            fontFamily: "Georgia, serif",
            fontSize: "0.75rem",
            letterSpacing: "0.25em",
          }}>
            YOUR DIGITAL BATTLEFIELD
          </p>
        </div>

        <div style={{
          background: "rgba(6,4,14,0.9)",
          border: "1px solid rgba(201,147,58,0.3)",
          borderRadius: "8px",
          padding: "32px",
          width: "min(360px, 90vw)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          backdropFilter: "blur(10px)",
          boxShadow: "0 8px 48px rgba(0,0,0,0.8), inset 0 1px 0 rgba(201,147,58,0.08)",
        }}>
          <h2 style={{
            color: "#f4edd8",
            textAlign: "center",
            fontFamily: "'Cinzel', Georgia, serif",
            fontWeight: 700,
            fontSize: "1.05rem",
            letterSpacing: "0.08em",
            marginBottom: "4px",
          }}>
            {isRegister ? "Create Account" : "Welcome Back"}
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
            placeholder="Email address"
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
            <p style={{ color: "#c0392b", fontSize: "13px", textAlign: "center", margin: "0" }}>
              {error}
            </p>
          )}

          <button onClick={handleSubmit} style={buttonStyle}>
            {isRegister ? "Sign Up" : "Sign In"}
          </button>

          <div style={{ height: "1px", background: "rgba(201,147,58,0.12)", margin: "2px 0" }}/>

          <button
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            style={{ background: "none", border: "none", color: "#c9933a", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia, serif" }}
          >
            {isRegister ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#0e0b1e",
  border: "1px solid rgba(201,147,58,0.22)",
  borderRadius: "4px",
  padding: "10px 12px",
  color: "#f4edd8",
  fontSize: "14px",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  background: "rgba(201,147,58,0.14)",
  border: "1px solid rgba(201,147,58,0.5)",
  borderRadius: "4px",
  padding: "11px",
  color: "#f5d485",
  fontSize: "14px",
  cursor: "pointer",
  fontFamily: "Georgia, serif",
  letterSpacing: "0.08em",
};

export default LoginPage;
