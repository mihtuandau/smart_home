'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, TriangleAlert, Users } from 'lucide-react';

export default function RegisterPage() {
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

          <div className="bg-gradient-to-r from-cyan-500/36 via-blue-500/36 to-blue-600/36 backdrop-blur-md px-8 pt-8 pb-6 border-b border-white/18">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/30 shadow-lg hover:bg-white/18 transition">
                <Users className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white text-center">Đăng ký đã khóa</h1>
            <p className="text-white/80 text-center text-sm mt-1">Tính năng tạo tài khoản tạm thời không khả dụng</p>
          </div>

          <div className="p-8 backdrop-blur-md">

            <div className="mb-6 p-4 bg-amber-500/14 border border-amber-300/35 rounded-xl backdrop-blur-sm">
              <div className="flex gap-3">
                <TriangleAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-950 text-sm mb-1">Đăng ký tạm thời bị khóa</p>
                  <p className="text-sm text-amber-900">Chúng tôi hiện không chấp nhận đăng ký tài khoản mới. Vui lòng liên hệ với quản trị viên để được hỗ trợ.</p>
                </div>
              </div>
            </div>

            <div className="mb-6 p-4 bg-blue-500/14 border border-blue-300/35 rounded-xl backdrop-blur-sm">
              <p className="text-sm text-blue-950">
                <span className="font-semibold inline-flex items-center gap-1.5"><Mail className="w-4 h-4" />Email hỗ trợ:</span><br/>
                support@smarthome.local
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/login"
                className="w-full flex justify-center items-center py-2.5 px-4 bg-gradient-to-r from-cyan-500/52 to-blue-600/52 hover:from-cyan-600/62 hover:to-blue-700/62 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl backdrop-blur-sm border border-cyan-200/25"
              >
                Quay lại Đăng nhập
              </Link>
              <a
                href="mailto:support@smarthome.local"
                className="w-full flex justify-center items-center py-2.5 px-4 border border-white/26 bg-white/16 hover:bg-white/24 text-gray-900 font-semibold rounded-lg transition backdrop-blur-sm"
              >
                Liên hệ Hỗ trợ
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
