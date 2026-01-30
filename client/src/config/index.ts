/**
 * Application Configuration
 * Centralized configuration for environment variables and constants
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  MQTT_URL: process.env.NEXT_PUBLIC_MQTT_URL || 'ws://localhost:1883',
  TIMEOUT: 30000, // 30 seconds
} as const;

// Auth Configuration
export const AUTH_CONFIG = {
  TOKEN_KEY: 'auth_token',
  USER_KEY: 'user',
  REFRESH_TOKEN_KEY: 'refresh_token',
  TOKEN_EXPIRES_IN: '7d',
} as const;

// WebSocket Configuration
export const WS_CONFIG = {
  RECONNECT_INTERVAL: 5000, // 5 seconds
  MAX_RECONNECT_ATTEMPTS: 10,
  PING_INTERVAL: 30000, // 30 seconds
} as const;

// Query Configuration
export const QUERY_CONFIG = {
  STALE_TIME: {
    DEFAULT: 1000 * 60 * 5, // 5 minutes
    SENSORS: 1000 * 30, // 30 seconds
    DEVICES: 1000 * 30, // 30 seconds
    DASHBOARD: 1000 * 60 * 2, // 2 minutes
    ENERGY: 1000 * 60 * 5, // 5 minutes
  },
  REFETCH_INTERVAL: {
    SENSORS: 5000, // 5 seconds
    DEVICES: 3000, // 3 seconds
    SYSTEM_HEALTH: 30000, // 30 seconds
  },
  CACHE_TIME: 1000 * 60 * 30, // 30 minutes
  RETRY: 1,
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: 'Smart Home Management System',
  DESCRIPTION: 'Hệ thống quản lý nhà thông minh với IoT',
  VERSION: '1.0.0',
  DEFAULT_LOCALE: 'vi',
} as const;

// Device Configuration
export const DEVICE_CONFIG = {
  LED: {
    COUNT: 2,
    DEFAULT_STATE: false,
  },
  SERVO: {
    MIN_ANGLE: 0,
    MAX_ANGLE: 180,
    DEFAULT_ANGLE: 90,
    POSITIONS: {
      CLOSE: 0,
      MIDDLE: 90,
      OPEN: 180,
    },
  },
  TOUCH_SENSORS: {
    COUNT: 4,
  },
} as const;

// Sensor Thresholds
export const SENSOR_THRESHOLDS = {
  TEMPERATURE: {
    MIN: 20,
    MAX: 35,
    UNIT: '°C',
  },
  HUMIDITY: {
    MIN: 40,
    MAX: 90,
    UNIT: '%',
  },
  PRESSURE: {
    MIN: 1000,
    MAX: 1030,
    UNIT: 'hPa',
  },
  LIGHT: {
    DARK_THRESHOLD: 500, // lux
    UNIT: 'lx',
  },
  VOLTAGE: {
    MIN: 0,
    MAX: 24,
    UNIT: 'V',
  },
  CURRENT: {
    MIN: 0,
    MAX: 5000,
    UNIT: 'mA',
  },
} as const;

// Chart Configuration
export const CHART_CONFIG = {
  COLORS: {
    TEMPERATURE: '#ef4444',
    HUMIDITY: '#3b82f6',
    PRESSURE: '#a855f7',
    LIGHT: '#eab308',
    VOLTAGE: '#10b981',
    CURRENT: '#f97316',
    POWER: '#ec4899',
  },
  ANIMATION_DURATION: 750,
  GRID_COLOR: '#f3f4f6',
  AXIS_COLOR: '#e5e7eb',
} as const;

// Routes Configuration
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  DEVICES: '/devices',
  SENSORS: '/sensors',
  ENERGY: '/energy',
  AUTOMATION: '/automation',
  NOTIFICATIONS: '/notification',
  SETTINGS: '/setting',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/profile',
  REFRESH_TOKEN: '/auth/refresh',

  // Dashboard
  DASHBOARD_OVERVIEW: '/dashboard/overview',
  DASHBOARD_ENERGY: '/dashboard/energy',
  DASHBOARD_HEALTH: '/dashboard/health',
  DASHBOARD_ACTIVITIES: '/dashboard/activities',

  // Sensors
  SENSORS_LATEST: '/sensors/latest',
  SENSORS_CURRENT: '/sensors/current',
  SENSORS_HISTORY: '/sensors/history',
  SENSORS_STATS: '/sensors/stats',
  SENSORS_CHART: '/sensors/chart',

  // Devices
  DEVICES: '/devices',
  DEVICES_STATS: '/devices/stats',
  DEVICE_BY_ID: (id: string) => `/devices/${id}`,
  DEVICE_TOGGLE: (id: string) => `/devices/${id}/toggle`,
  DEVICE_HISTORY: (id: string) => `/devices/${id}/history`,

  // IoT Control
  IOT_CONTROL_LED: '/iot/control/led',
  IOT_CONTROL_SERVO: '/iot/control/servo',
  IOT_STATUS: '/iot/status',
  IOT_DATA_LATEST: '/iot/data/latest',
  IOT_SENSORS: '/iot/sensors',
  IOT_POWER: '/iot/power',
  IOT_DEVICES: '/iot/devices',
  IOT_LOGS: '/iot/logs',

  // Automation
  AUTOMATION: '/automation',
  AUTOMATION_ACTIVE: '/automation/active',
  AUTOMATION_BY_ID: (id: string) => `/automation/${id}`,
  AUTOMATION_TOGGLE: (id: string) => `/automation/${id}/toggle`,
} as const;

// Toast/Notification Configuration
export const TOAST_CONFIG = {
  DURATION: {
    SHORT: 2000,
    DEFAULT: 3000,
    LONG: 5000,
  },
  POSITION: 'top-right',
} as const;

// Pagination Configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
} as const;

// Date/Time Format
export const DATE_FORMAT = {
  FULL: 'DD/MM/YYYY HH:mm:ss',
  DATE: 'DD/MM/YYYY',
  TIME: 'HH:mm:ss',
  SHORT_TIME: 'HH:mm',
  CHART: 'HH:mm',
} as const;
