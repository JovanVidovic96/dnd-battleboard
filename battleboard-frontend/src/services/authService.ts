import api from "./api";

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post("/api/auth/login", { email, password });
    console.log("Login response:", response.data);

    localStorage.setItem("token", response.data.token);
    localStorage.setItem("username", response.data.username);
    return response.data;
  },

  async register(username: string, email: string, password: string) {
    const response = await api.post("/api/auth/register", {
      username,
      email,
      password,
    });
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("username", response.data.username);
    return response.data;
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
  },

  getToken() {
    return localStorage.getItem("token");
  },

  getUsername() {
    return localStorage.getItem("username");
  },

  isLoggedIn() {
    return !!localStorage.getItem("token");
  },
};
