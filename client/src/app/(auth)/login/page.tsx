'use client';

import React, { useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LoginCredentials } from '@/types';
import { loginSchema } from '@/lib/validations/auth';
import { CircleAlert, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const result = loginSchema.safeParse(credentials);
    if (!result.success) {
      const errors: { email?: string; password?: string } = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as 'email' | 'password';
        const minimum = 'minimum' in issue ? issue.minimum : undefined;
        const message =
          field === 'email'
            ? issue.code === 'invalid_format'
              ? t('auth.validation.emailInvalid')
              : t('auth.validation.emailRequired')
            : issue.code === 'too_small' && minimum === 6
              ? t('auth.validation.passwordMin')
              : t('auth.validation.passwordRequired');
        if (!errors[field]) errors[field] = message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      await login(credentials);
      const redirect = searchParams.get('redirect');
      const safeRedirect =
        redirect && redirect.startsWith('/') && !redirect.startsWith('//')
          ? redirect
          : '/dashboard';
      router.push(safeRedirect);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.loginError');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/images/images_login.jpg)',
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/4" />

      <div className="relative w-full max-w-md z-10">
        <div className="bg-white/18 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/35">

          <div className="bg-gradient-to-r from-cyan-500/36 via-blue-500/36 to-blue-600/36 backdrop-blur-md px-8 pb-6 border-b border-white/18">
            <div className="flex justify-center">
              <div className="">
                <Image
                  src="/images/logo_smart.png"
                  alt="Smart Home Logo"
                  width={40}
                  height={40}
                  className="h-30 w-30 object-contain"
                  priority
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white text-center">Smart Home</h1>
            <p className="text-white/80 text-center text-sm mt-1">{t('auth.loginSubtitle')}</p>
          </div>

          <div className="p-8 backdrop-blur-md">

            {error && (
              <div className="mb-6 p-4 bg-red-500/14 border border-red-300/35 rounded-xl flex items-start gap-3 backdrop-blur-sm">
                <CircleAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-950 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-cyan-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={credentials.email}
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    className={`block w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-transparent transition backdrop-blur-sm text-gray-900 placeholder-gray-700 ${
                      fieldErrors.email ? 'border-red-400/55 bg-red-50/18' : 'border-white/26 bg-white/16 hover:bg-white/24'
                    }`}
                    placeholder="your@email.com"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-red-700 font-medium">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-950 mb-2">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-cyan-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'  }
                    autoComplete="current-password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className={`block w-full pl-10 pr-11 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-transparent transition backdrop-blur-sm text-gray-900 placeholder-gray-700 ${
                      fieldErrors.password ? 'border-red-400/55 bg-red-50/18' : 'border-white/26 bg-white/16 hover:bg-white/24'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-cyan-700 hover:text-cyan-900 transition"
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1.5 text-xs text-red-700 font-medium">{fieldErrors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center cursor-pointer">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-400/30 text-cyan-600 focus:ring-cyan-300 bg-white/16"
                  />
                  <span className="ml-2 text-sm text-gray-900">{t('auth.rememberMe')}</span>
                </label>
                <a href="#" className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition">
                  {t('auth.forgotPassword')}
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-7 py-2.5 px-4 bg-gradient-to-r from-cyan-500/52 to-blue-600/52 hover:from-cyan-600/62 hover:to-blue-700/62 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 backdrop-blur-sm border border-cyan-200/25"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    {t('auth.pleaseWait')}
                  </>
                ) : (
                  t('auth.loginButton')
                )}
              </button>

              <p className="text-center text-sm text-gray-900 pt-3">
                {t('auth.noAccount')}{' '}
                <Link href="/register" className="font-semibold text-cyan-600 hover:text-cyan-700 transition">
                  {t('auth.registerLink')}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
