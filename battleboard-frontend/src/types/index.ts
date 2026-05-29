export interface User {
  username: string;
  token: string;
}

export interface Token {
  id: string;
  sessionId: string | null;
  name: string;
  ownerUsername: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  ac: number;
  initiative: number;
  statuses: string[];
  active: boolean;
  npc: boolean;
  enemy: boolean;
}

export interface DiceRoll {
  id: string;
  formula: string;
  rolls: number[];
  rollsResult: number;
  privateRoll: boolean;
  ownerUsername: string;
  sessionId: string;
  createdAt: string;
}

export interface GameMap {
  id: string;
  name: string;
  ownerUsername: string;
  biome: string;
  backgroundImgUrl: string;
  cellSize: number;
  cellWidth: number;
  cellHeight: number;
  active: boolean;
  mapData: string | null;
}

export interface Session {
  id: string;
  name: string;
  inviteCode: string;
  hostUsername: string;
  playerCount: number;
  active: boolean;
  activeMapId: string | null;
}
