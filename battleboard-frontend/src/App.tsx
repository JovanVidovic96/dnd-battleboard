import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { authService } from "./services/authService";
import LobbyPage from "./pages/LobbyPage";
import GamePage from "./pages/GamePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            authService.isLoggedIn() ? (
              <Navigate to="/lobby" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/game/:sessionId" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
