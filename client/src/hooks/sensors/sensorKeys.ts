export const sensorKeys = {
  all: ['sensors'] as const,
  lists: () => [...sensorKeys.all, 'list'] as const,
  list: (limit: number) => [...sensorKeys.lists(), { limit }] as const,
  current: () => [...sensorKeys.all, 'current'] as const,
  history: (hours: number, page: number, pageSize: number) =>
    [...sensorKeys.all, 'history', hours, page, pageSize] as const,
  stats: () => [...sensorKeys.all, 'stats'] as const,
  chart: (type: string) => [...sensorKeys.all, 'chart', type] as const,
  iot: () => [...sensorKeys.all, 'iot'] as const,
};
