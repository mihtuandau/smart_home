export const billingKeys = {
  all: ['billing'] as const,
  forecast: (price?: number) => [...billingKeys.all, 'forecast', price] as const,
  ledDaily: (days: number) => [...billingKeys.all, 'led-daily', days] as const,
};
