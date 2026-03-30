export type LooseRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is LooseRecord =>
  typeof value === 'object' && value !== null;

const toRecord = (value: unknown): LooseRecord => (isRecord(value) ? value : {});

function toDataArray(oldData: unknown): unknown[] {
  const merged = toRecord(oldData);
  if (Array.isArray(merged.data)) return [...merged.data];
  if (Array.isArray(oldData)) return [...oldData];
  return [];
}

function toDataObject(oldData: unknown): LooseRecord {
  const merged = toRecord(oldData);
  return {
    ...(isRecord(merged.data) ? merged.data : merged),
  };
}

export function mergeSensorListFromSensorData(oldData: unknown, sensorData: unknown): unknown {
  const normalizedSensorData = toRecord(sensorData);

  if (!oldData) {
    return { data: [normalizedSensorData] };
  }

  const merged = toRecord(oldData);
  const dataArray = toDataArray(oldData);

  if (dataArray.length > 0) {
    dataArray[0] = {
      ...toRecord(dataArray[0]),
      ...normalizedSensorData,
    };
  }

  return {
    ...merged,
    data: dataArray,
  };
}

export function mergeSensorListFromAiAdvice(oldData: unknown, aiData: unknown): unknown {
  if (!oldData) {
    return oldData;
  }

  const normalizedAiData = toRecord(aiData);
  const merged = toRecord(oldData);
  const dataArray = toDataArray(oldData);

  if (dataArray.length > 0) {
    const head = toRecord(dataArray[0]);

    if (typeof normalizedAiData.powerW === 'number') {
      head.power_mW = normalizedAiData.powerW * 1000;
    }
    if (normalizedAiData.led1 !== undefined) {
      head.led1 = normalizedAiData.led1;
    }
    if (normalizedAiData.led2 !== undefined) {
      head.led2 = normalizedAiData.led2;
    }

    dataArray[0] = head;
  }

  return {
    ...merged,
    data: dataArray,
  };
}

export function mergeCurrentSensorsFromSensorData(oldData: unknown, sensorData: unknown): unknown {
  const normalizedSensorData = toRecord(sensorData);

  if (!oldData) {
    return { data: normalizedSensorData };
  }

  const merged = toRecord(oldData);
  const dataObj = toDataObject(oldData);

  Object.keys(normalizedSensorData).forEach((key) => {
    dataObj[key] = normalizedSensorData[key];
  });

  return {
    ...merged,
    data: dataObj,
  };
}

export function mergeCurrentSensorsFromAiAdvice(oldData: unknown, aiData: unknown): unknown {
  if (!oldData) {
    return oldData;
  }

  const normalizedAiData = toRecord(aiData);
  const merged = toRecord(oldData);
  const dataObj = toDataObject(oldData);

  if (typeof normalizedAiData.powerW === 'number') {
    dataObj.power_mW = normalizedAiData.powerW * 1000;
  }
  if (normalizedAiData.led1 !== undefined) {
    dataObj.led1 = normalizedAiData.led1;
  }
  if (normalizedAiData.led2 !== undefined) {
    dataObj.led2 = normalizedAiData.led2;
  }

  return {
    ...merged,
    data: dataObj,
  };
}
