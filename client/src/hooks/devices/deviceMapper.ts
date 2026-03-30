import type { QueryClient } from '@tanstack/react-query';

export type LooseRecord = Record<string, unknown>;

export interface StatsData extends LooseRecord {
  total?: number;
  online?: number;
  offline?: number;
}

export interface StatsCache extends LooseRecord {
  data?: StatsData;
}

export interface LatestDataCache extends LooseRecord {
  data?: LooseRecord;
}

export interface MutationContext {
  previousLatest?: unknown;
  previousStats?: unknown;
  previousData?: unknown;
}

export const isRecord = (value: unknown): value is LooseRecord =>
  typeof value === 'object' && value !== null;

export const toRecord = (value: unknown): LooseRecord => (isRecord(value) ? value : {});

export const toStatsCache = (value: unknown): StatsCache => {
  const base = toRecord(value);
  return {
    ...base,
    data: toRecord(base.data) as StatsData,
  };
};

export const toLatestCache = (value: unknown): LatestDataCache => {
  const base = toRecord(value);
  return {
    ...base,
    data: toRecord(base.data),
  };
};

export function syncStatsFromLatestCache(
  queryClient: QueryClient,
  latestDataKey: readonly unknown[],
  statsKey: readonly unknown[],
) {
  const latestCache = queryClient.getQueryData(latestDataKey);
  const latest = toRecord(toLatestCache(latestCache).data ?? latestCache);
  if (!latest) return;

  queryClient.setQueryData(statsKey, (oldStats: unknown) => {
    const base = toStatsCache(oldStats);
    const dataObj = toRecord(base.data) as StatsData;

    const ledsOn = (latest.led1 ? 1 : 0) + (latest.led2 ? 1 : 0);
    const customEntries = [latest.device1, latest.device2];
    const customPresent = customEntries.filter((v) => {
      if (v === undefined || v === null) return false;
      if (typeof v === 'object') {
        const obj = toRecord(v);
        return Boolean(obj.name) || obj.state !== undefined || obj.power !== undefined;
      }
      return true;
    }).length;
    const customOn = customEntries.filter((v) => {
      if (v === true) return true;
      if (v && typeof v === 'object') {
        return toRecord(v).state === true;
      }
      return false;
    }).length;

    const total = Math.max(2, 2 + customPresent);
    const online = Math.max(0, Math.min(total, ledsOn + customOn));

    dataObj.total = total;
    dataObj.online = online;
    dataObj.offline = total - online;

    base.data = dataObj;
    return base;
  });
}

function toOnOffStats(payload: LooseRecord): StatsData | null {
  const hasLedState = payload.led1 !== undefined || payload.led2 !== undefined;
  const hasCustomState = payload.device1 !== undefined || payload.device2 !== undefined;
  if (!hasLedState && !hasCustomState) return null;

  const ledsOn = (payload.led1 ? 1 : 0) + (payload.led2 ? 1 : 0);
  const customDevices = [payload.device1, payload.device2];

  const customPresent = customDevices.filter((value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'object') {
      const obj = toRecord(value);
      return Boolean(obj.name) || obj.state !== undefined || obj.power !== undefined;
    }
    return true;
  }).length;

  const customOn = customDevices.filter((value) => {
    if (value === true) return true;
    if (value && typeof value === 'object') {
      return toRecord(value).state === true;
    }
    return false;
  }).length;

  const total = 2 + customPresent;
  const online = ledsOn + customOn;

  return {
    total,
    online,
    offline: total - online,
  };
}

export function mergeStatsCache(oldData: unknown, statusData: unknown): unknown {
  const normalizedStatus = toRecord(statusData);
  if (!Object.keys(normalizedStatus).length) {
    return oldData;
  }

  if (!oldData) {
    return { data: normalizedStatus };
  }

  const merged = toStatsCache(oldData);
  const dataObj = toRecord(merged.data) as StatsData;

  if (normalizedStatus.online !== undefined) {
    const incomingOnline =
      typeof normalizedStatus.online === 'number' ? normalizedStatus.online : undefined;
    const incomingTotal =
      typeof normalizedStatus.total === 'number' ? normalizedStatus.total : dataObj.total;
    const shouldIgnoreDrop =
      dataObj.online !== undefined &&
      dataObj.online > 0 &&
      incomingOnline === 0 &&
      incomingTotal !== undefined &&
      incomingTotal === dataObj.total;

    if (!shouldIgnoreDrop && incomingOnline !== undefined) {
      dataObj.online = incomingOnline;
    }
  }

  if (typeof normalizedStatus.total === 'number') {
    dataObj.total = normalizedStatus.total;
  }

  if (typeof normalizedStatus.offline === 'number') {
    dataObj.offline = normalizedStatus.offline;
  }

  if (dataObj.total === undefined || dataObj.total < 2) {
    dataObj.total = 2;
  }

  if (dataObj.online !== undefined && dataObj.total !== undefined) {
    dataObj.online = Math.max(0, Math.min(dataObj.online, dataObj.total));
    dataObj.offline = dataObj.total - dataObj.online;
  }

  merged.data = dataObj;
  return merged;
}

export function getStatsPatchFromIoT(iotData: unknown): StatsData | null {
  const normalized = toRecord(iotData);
  if (!Object.keys(normalized).length) return null;
  return toOnOffStats(normalized);
}

export function applyAiAdviceToStats(oldData: unknown, aiData: unknown): unknown {
  const normalized = toRecord(aiData);
  if (!Object.keys(normalized).length) {
    return oldData;
  }

  if (normalized.led1 === undefined && normalized.led2 === undefined) {
    return oldData;
  }

  const ledsOn = (normalized.led1 ? 1 : 0) + (normalized.led2 ? 1 : 0);

  const base = toStatsCache(oldData);
  const dataObj = toRecord(base.data) as StatsData;
  const total = Math.max(2, dataObj.total ?? 2);

  if (total === 2) {
    dataObj.online = ledsOn;
    dataObj.total = 2;
    dataObj.offline = 2 - ledsOn;
  }

  base.data = dataObj;
  return base;
}

export function mergeLatestCacheFromIoT(oldData: unknown, socketData: unknown): unknown {
  const normalized = toRecord(socketData);

  if (!oldData) {
    return { data: normalized };
  }

  const merged = toLatestCache(oldData);
  const dataObj = toRecord(merged.data);

  if (normalized.led1 !== undefined) {
    dataObj.led1 = normalized.led1;
  }
  if (normalized.led2 !== undefined) {
    dataObj.led2 = normalized.led2;
  }
  if (normalized.temperature !== undefined) {
    dataObj.temperature = normalized.temperature;
  }
  if (normalized.humidity !== undefined) {
    dataObj.humidity = normalized.humidity;
  }
  if (normalized.voltage !== undefined) {
    dataObj.voltage = normalized.voltage;
  }
  if (normalized.current_mA !== undefined) {
    dataObj.current_mA = normalized.current_mA;
  }
  if (normalized.power !== undefined) {
    dataObj.power = normalized.power;
  }

  merged.data = dataObj;
  return merged;
}

export function mergeLatestCacheFromAi(oldData: unknown, aiData: unknown): unknown {
  const normalized = toRecord(aiData);

  if (!oldData) {
    return { data: { led1: normalized.led1, led2: normalized.led2 } };
  }

  const merged = toLatestCache(oldData);
  const dataObj = toRecord(merged.data);

  if (normalized.led1 !== undefined) {
    dataObj.led1 = normalized.led1;
  }
  if (normalized.led2 !== undefined) {
    dataObj.led2 = normalized.led2;
  }

  merged.data = dataObj;
  return merged;
}
