
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ONLINE: 'online',
  OFFLINE: 'offline',
  ERROR: 'error',
  WARNING: 'warning',
  SUCCESS: 'success',
} as const;

export const DEVICE_TYPES = {
  LED: 'led',
  SERVO: 'servo',
  SENSOR: 'sensor',
  TOUCH: 'touch',
} as const;

export const SENSOR_TYPES = {
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  PRESSURE: 'pressure',
  LIGHT: 'light',
  VOLTAGE: 'voltage',
  CURRENT: 'current',
  POWER: 'power',
  RAIN: 'rain',
} as const;

export const ALERT_LEVELS = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export const CHART_TYPES = {
  LINE: 'line',
  AREA: 'area',
  BAR: 'bar',
  PIE: 'pie',
} as const;

export const TIME_RANGES = {
  HOUR_1: 1,
  HOURS_6: 6,
  HOURS_12: 12,
  HOURS_24: 24,
  DAYS_7: 168, 
  DAYS_30: 720, 
} as const;

export const HARDWARE = {
  ESP32: 'ESP32 DevKit 1',
  LDR: 'LM393 LDR',
  INA219: 'INA219 DC',
  OLED: 'OLED I2C 128x64',
  AHT20: 'AHT20 + BMP280',
  SOLAR_CHARGER: 'CN3791 Solar Charger',
  TOUCH_SENSORS: 'x4 TOUCH Sensors',
  DC_DC: 'DC-DC XL4005E1',
  LED_SERVO: 'x3 LED + Servo',
} as const;

export const HARDWARE_DESCRIPTIONS = {
  [HARDWARE.ESP32]: 'Bộ điều khiển chính',
  [HARDWARE.LDR]: 'Cảm biến ánh sáng',
  [HARDWARE.INA219]: 'Đo dòng & điện áp',
  [HARDWARE.OLED]: 'Màn hình hiển thị',
  [HARDWARE.AHT20]: 'Nhiệt độ, độ ẩm, áp suất',
  [HARDWARE.SOLAR_CHARGER]: 'Sạc pin từ solar',
  [HARDWARE.TOUCH_SENSORS]: 'Cảm biến chạm',
  [HARDWARE.DC_DC]: 'Bộ hạ áp 5V',
  [HARDWARE.LED_SERVO]: 'Đèn & động cơ servo',
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Lỗi kết nối mạng',
  UNAUTHORIZED: 'Bạn cần đăng nhập để tiếp tục',
  FORBIDDEN: 'Bạn không có quyền truy cập',
  NOT_FOUND: 'Không tìm thấy dữ liệu',
  INTERNAL_SERVER_ERROR: 'Lỗi máy chủ nội bộ',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
  TIMEOUT_ERROR: 'Hết thời gian chờ',
  UNKNOWN_ERROR: 'Đã xảy ra lỗi không xác định',
} as const;

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGOUT_SUCCESS: 'Đăng xuất thành công',
  REGISTER_SUCCESS: 'Đăng ký thành công',
  UPDATE_SUCCESS: 'Cập nhật thành công',
  DELETE_SUCCESS: 'Xóa thành công',
  CREATE_SUCCESS: 'Tạo mới thành công',
  SAVE_SUCCESS: 'Lưu thành công',
} as const;

// LocalStorage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_STATE: 'sidebar_state',
  SELECTED_DEVICES: 'selected_devices',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 32,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// Export Types
export type StatusType = typeof STATUS[keyof typeof STATUS];
export type DeviceType = typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES];
export type SensorType = typeof SENSOR_TYPES[keyof typeof SENSOR_TYPES];
export type AlertLevel = typeof ALERT_LEVELS[keyof typeof ALERT_LEVELS];
export type ChartType = typeof CHART_TYPES[keyof typeof CHART_TYPES];
