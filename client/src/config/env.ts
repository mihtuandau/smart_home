
export interface EnvConfig {
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_WS_URL: string;
  NEXT_PUBLIC_MQTT_URL: string;
  NEXT_PUBLIC_APP_NAME: string;

  NEXT_PUBLIC_DEBUG?: string;
}

declare global {
  interface Window {
    __ENV?: Partial<Record<keyof EnvConfig, string>>;
  }
}

export function getEnvVar(key: keyof EnvConfig, fallback: string = ''): string {
  if (typeof window === 'undefined') {
    return process.env[key] || fallback;
  }
  return window.__ENV?.[key] || process.env[key] || fallback;
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDebugEnabled(): boolean {
  return getEnvVar('NEXT_PUBLIC_DEBUG') === 'true';
}

export function validateEnv(): void {
  const required: (keyof EnvConfig)[] = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_WS_URL',
  ];

  const missing: string[] = [];

  for (const key of required) {
    if (!getEnvVar(key)) {
      missing.push(key);
    }
  }
}
