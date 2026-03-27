'use client';

import React, { ReactNode, Component, ErrorInfo } from 'react';
import { translations } from '@/i18n';
import { Home, Mail, RotateCcw, TriangleAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

function getLangForErrorBoundary(): 'vi' | 'en' {
  if (typeof window === 'undefined') return 'vi';
  const saved = window.localStorage.getItem('language');
  return saved === 'en' ? 'en' : 'vi';
}

function tr(key: string, fallback: string): string {
  const lang = getLangForErrorBoundary();
  const keys = key.split('.');
  let value: any = translations[lang];
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) value = value[k];
    else return fallback;
  }
  return typeof value === 'string' ? value : fallback;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error: error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });

  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 border border-red-200">
            <div className="text-center mb-4">
              <TriangleAlert className="w-14 h-14 text-red-500 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-red-600 text-center mb-2">
              {tr('errors.oopsError', 'Oops! Có lỗi xảy ra')}
            </h1>

            <p className="text-gray-700 text-center mb-4">
              {tr('errors.unexpectedError', 'Ứng dụng gặp lỗi không mong muốn. Vui lòng tải lại trang hoặc liên hệ hỗ trợ.')}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-h-40 overflow-y-auto">
                <p className="text-xs font-mono text-red-800 whitespace-pre-wrap">
                  <strong>Error:</strong> {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <p className="text-xs font-mono text-red-700 mt-2 whitespace-pre-wrap">
                    <strong>Stack:</strong> {this.state.errorInfo.componentStack}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium inline-flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {tr('errors.retry', 'Thử lại')}
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-medium inline-flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                {tr('errors.home', 'Trang chủ')}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4 inline-flex items-center justify-center gap-1.5 w-full">
              <Mail className="w-3.5 h-3.5" />
              {tr('errors.ifIssuePersists', 'Nếu lỗi tiếp tục xảy ra, vui lòng')} 
              <a href="mailto:support@smart-home.local" className="text-blue-600 hover:underline">
                {tr('errors.contactSupport', 'liên hệ hỗ trợ')}
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
