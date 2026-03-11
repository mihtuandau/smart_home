export const MQTT_CONFIG = {
  host: process.env.MQTT_BROKER || 'nfa1412a.ala.asia-southeast1.emqxsl.com',
  port: parseInt(process.env.MQTT_PORT || '8883', 10),
  protocol: 'mqtts',
  username: process.env.MQTT_USERNAME || 'mqttx_PTUD',
  password: process.env.MQTT_PASSWORD || '123456789',
  clientId: `nest-server-${Math.random().toString(16).slice(2, 10)}`,
  clean: true,
  reconnectPeriod: parseInt(process.env.MQTT_RECONNECT_PERIOD || '5000', 10),
  connectTimeout: parseInt(process.env.MQTT_CONNECT_TIMEOUT || '30000', 10),
  rejectUnauthorized: true,
};

export const MQTT_TOPICS = {
  DATA_TOPIC: process.env.MQTT_DATA_TOPIC || 'TN/IOT/smarthome/tt',
  CMD_TOPIC: process.env.MQTT_CMD_TOPIC || 'TN/IOT/smarthome/cmd/led',
};
