export const energyKeys = {
  all: ["energy"] as const,
  stats: (hours: number) => [...energyKeys.all, "stats", hours] as const,
  battery: () => [...energyKeys.all, "battery"] as const,
  solar: (hours: number) => [...energyKeys.all, "solar", hours] as const,
  sources: (hours: number) => [...energyKeys.all, "sources", hours] as const,
  efficiency: (hours: number) =>
    [...energyKeys.all, "efficiency", hours] as const,
  summary: () => [...energyKeys.all, "summary"] as const,
};
