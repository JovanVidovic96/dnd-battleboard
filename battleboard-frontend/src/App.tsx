import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { authService } from "./services/authService";
import LobbyPage from "./pages/LobbyPage";
import GamePage from "./pages/GamePage";
import MapEditorPage from "./pages/MapEditorPage";

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
        <Route path="/map-editor/:mapId" element={<MapEditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
