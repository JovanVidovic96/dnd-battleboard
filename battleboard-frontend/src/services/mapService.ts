import api from "./api";

export const mapService = {
  async getMaps() {
    const response = await api.get("/api/maps/owner");
    return response.data;
  },

  async getMap(mapId: string) {
      const response = await api.get(`/api/maps/${mapId}`);
      return response.data;
  },

  async createMap(data: {
    name: string;
    biome: string;
    backgroundImgUrl: string;
    cellSize: number;
    cellWidth: number;
    cellHeight: number;
  }) {
    const response = await api.post("/api/maps", data);
    return response.data;
  },

  async updateMap(
    mapId: string,
    data: {
      name?: string;
      biome?: string;
      backgroundImgUrl?: string;
      cellSize?: number;
      cellWidth?: number;
      cellHeight?: number;
      mapData?: string;
    },
  ) {
    const response = await api.put(`/api/maps/${mapId}`, data);
    return response.data;
  },

  async deleteMap(mapId: string) {
    await api.delete(`/api/maps/${mapId}`);
  },
};
