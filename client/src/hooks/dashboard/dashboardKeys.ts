export const dashboardKeys = {
  all: ["dashboard"] as const,
  overview: () => [...dashboardKeys.all, "overview"] as const,
  energy: (hours: number) => [...dashboardKeys.all, "energy", hours] as const,
  health: () => [...dashboardKeys.all, "health"] as const,
  activities: (limit: number) =>
    [...dashboardKeys.all, "activities", limit] as const,
};
