export const rainForecastKeys = {
  all: ['rainForecast'] as const,
  lists: () => [...rainForecastKeys.all, 'list'] as const,
  list: (lat?: number, lon?: number) =>
    [...rainForecastKeys.lists(), { lat, lon }] as const,
  details: () => [...rainForecastKeys.all, 'detail'] as const,
  detail: (lat?: number, lon?: number) =>
    [...rainForecastKeys.details(), { lat, lon }] as const,
  probabilities: () => [...rainForecastKeys.all, 'probability'] as const,
  probability: (lat?: number, lon?: number) =>
    [...rainForecastKeys.probabilities(), { lat, lon }] as const,
  next: (lat?: number, lon?: number) =>
    [...rainForecastKeys.all, 'next', { lat, lon }] as const,
};
