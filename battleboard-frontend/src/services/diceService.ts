import api from "./api";

export const diceService = {
  async roll(sessionId: string, formula: string, privateRoll: boolean = false) {
    const response = await api.post(`/api/dice/${sessionId}`, {
      formula,
      privateRoll,
    });
    return response.data;
  },

  async getPublicHistory(sessionId: string) {
    const response = await api.get(`/api/dice/${sessionId}/public`);
    return response.data;
  },
};
