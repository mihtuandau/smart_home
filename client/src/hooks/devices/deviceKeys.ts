export const deviceKeys = {
  all: ["devices"] as const,
  lists: () => [...deviceKeys.all, "list"] as const,
  list: (filters: string) => [...deviceKeys.lists(), { filters }] as const,
  details: () => [...deviceKeys.all, "detail"] as const,
  detail: (id: string) => [...deviceKeys.details(), id] as const,
  stats: () => [...deviceKeys.all, "stats"] as const,
  latestData: () => [...deviceKeys.all, "latestData"] as const,
  status: () => [...deviceKeys.all, "status"] as const,
};
