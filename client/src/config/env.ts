/**
 * Environment Variables Type Definitions
 */

export interface EnvConfig {
  // API Configuration
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_WS_URL: string;
  NEXT_PUBLIC_MQTT_URL: string;
  NEXT_PUBLIC_APP_NAME: string;
  
  // Development Only
  NEXT_PUBLIC_DEBUG?: string;
}

/**
 * Get environment variable with fallback
 */
export function getEnvVar(key: keyof EnvConfig, fallback: string = ''): string {
  if (typeof window === 'undefined') {
    return process.env[key] || fallback;
  }
  return (window as any).__ENV?.[key] || process.env[key] || fallback;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return getEnvVar('NEXT_PUBLIC_DEBUG') === 'true';
}

/**
 * Validate required environment variables
 */
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

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

// Validate environment on module load (only in development)
if (isDevelopment() && typeof window !== 'undefined') {
  try {
    validateEnv();
    console.log('✅ Environment variables validated successfully');
  } catch (error) {
    console.error(error);
  }
}
