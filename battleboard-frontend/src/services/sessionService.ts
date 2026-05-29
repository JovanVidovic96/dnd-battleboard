import api from "./api";

export const sessionService = {
  async createSession(name: string) {
    const response = await api.post("/api/sessions", { name });
    return response.data;
  },

  async joinSession(inviteCode: string) {
    const response = await api.post("/api/sessions/join", { inviteCode });
    return response.data;
  },

  async getMysessions() {
    const response = await api.get("/api/sessions/host");
    return response.data;
  },

  async deleteSession(sessionId: string) {
    await api.delete(`/api/sessions/${sessionId}`);
  },

  async setActiveMap(sessionId: string, mapId: string) {
    const response = await api.put(`/api/sessions/${sessionId}`, { activeMapId: mapId });
    return response.data;
  },

  async getSession(sessionId: string) {
    const response = await api.get(`/api/sessions/${sessionId}`);
    return response.data;
  },
};
