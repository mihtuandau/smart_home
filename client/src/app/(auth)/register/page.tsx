'use client';

import React from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 p-10 rounded-2xl shadow-xl">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-red-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Đăng ký đã bị khóa</h2>
            <p className="text-gray-600 text-sm">Hiện tại chúng tôi không chấp nhận đăng ký tài khoản mới</p>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-4 rounded-lg text-sm mb-6 flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold mb-1">Tính năng đăng ký tạm thời bị tắt</p>
              <p>Vui lòng liên hệ với quản trị viên để tạo tài khoản mới</p>
            </div>
          </div>

          {/* Login Button */}
          <div className="space-y-4">
            <Link 
              href="/login" 
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 font-medium"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
