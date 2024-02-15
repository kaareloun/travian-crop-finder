export type Config = {
  server: string;
  village: {
    x: number;
    y: number;
  };
  searchRadius: number;
  types: number[];
};

export type Village = { x: number; y: number; distance: number; size: string };
