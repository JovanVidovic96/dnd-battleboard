import api from "./api";

export const tokenService = {
  async createToken(token: {
    name: string;
    imageUrl: string;
    width: number;
    height: number;
    maxHp: number;
    ac: number;
    isNpc: boolean;
    enemy: boolean;
  }) {
    const response = await api.post("/api/tokens", token);
    return response.data;
  },

  async getTokensBySession(sessionId: string) {
    const response = await api.get(`/api/tokens/session/${sessionId}`);
    return response.data;
  },

  async moveToken(tokenId: string, x: number, y: number) {
    const response = await api.put(`/api/tokens/${tokenId}/move`, { x, y });
    return response.data;
  },

  async updateToken(
    tokenId: string,
    data: {
      name?: string;
      hp?: number;
      maxHp?: number;
      ac?: number;
      initiative?: number;
      statuses?: string[];
      sessionId?: string;
      statsPublic?: boolean;
    },
  ) {
    const response = await api.put(`/api/tokens/${tokenId}`, data);
    return response.data;
  },

  async removeFromSession(tokenId: string) {
    await api.delete(`/api/tokens/${tokenId}/session`);
  },

  async deleteToken(tokenId: string) {
    await api.delete(`/api/tokens/${tokenId}`);
  },

  async getMyTokens() {
    const response = await api.get("/api/tokens/owner");
    return response.data;
  },
};
