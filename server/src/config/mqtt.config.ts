export const MQTT_CONFIG = {
  host: 'nfa1412a.ala.asia-southeast1.emqxsl.com',
  port: 8883,
  protocol: 'mqtts',
  username: 'mqttx_PTUD',
  password: '123456789',
  clientId: `nest-server-${Math.random().toString(16).slice(2, 10)}`,
  clean: true,
  reconnectPeriod: 5000,
  connectTimeout: 30000,
  rejectUnauthorized: true,
};

export const MQTT_TOPICS = {
  DATA_TOPIC: 'TN/IOT/smarthome/tt',
  CMD_TOPIC: 'TN/IOT/smarthome/cmd',
};
