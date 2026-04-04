require('dotenv').config();
const mqtt = require('mqtt');

const scenario = process.argv[2] || 'normal';
const topic = process.env.MQTT_DATA_TOPIC || 'TN/IOT/smarthome/tt';

const broker = process.env.MQTT_BROKER || 'localhost';
const port = Number(process.env.MQTT_PORT || 1883);
const protocol = process.env.MQTT_BROKER_URL?.startsWith('mqtts://')
  ? 'mqtts'
  : port === 8883
    ? 'mqtts'
    : 'mqtt';

const client = mqtt.connect(`${protocol}://${broker}:${port}`, {
  clientId: `mqtt-test-${Math.random().toString(16).slice(2, 8)}`,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  reconnectPeriod: 0,
  connectTimeout: 10000,
  rejectUnauthorized: false,
});

function buildPayload(kind, prevState) {
  const base = {
    temperature: 29.93,
    humidity: 52.69,
    pressure: 1007.28,
    voltage: 3.8,
    current_mA: 124.8,
    power_mW: 474.24,
    rain: false,
    led1: false,
    led2: false,
  };

  if (kind === 'energy') {
    return { ...base, power_mW: 10000 };
  }

  if (kind === 'anomaly') {
    return { ...base, temperature: 42.5, humidity: 95.2 };
  }

  if (kind === 'device-on') {
    return { ...base, led1: true, led2: prevState?.led2 ?? false };
  }

  if (kind === 'device-off') {
    return { ...base, led1: false, led2: prevState?.led2 ?? false };
  }

  return base;
}

async function publish(payload) {
  return new Promise((resolve, reject) => {
    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

client.on('connect', async () => {
  try {
    if (scenario === 'device-toggle') {
      const first = buildPayload('device-off');
      const second = buildPayload('device-on', first);
      await publish(first);
      setTimeout(async () => {
        try {
          await publish(second);
          console.log('Published device-toggle scenario.');
          client.end(true);
        } catch (error) {
          console.error('Publish failed:', error.message);
          client.end(true);
          process.exit(1);
        }
      }, 1500);
      return;
    }

    const payload = buildPayload(scenario);
    await publish(payload);
    console.log(`Published scenario: ${scenario}`);
    client.end(true);
  } catch (error) {
    console.error('Publish failed:', error.message);
    client.end(true);
    process.exit(1);
  }
});

client.on('error', (error) => {
  console.error('MQTT error:', error.message);
  client.end(true);
  process.exit(1);
});
