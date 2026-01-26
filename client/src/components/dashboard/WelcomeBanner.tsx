'use client';

interface WelcomeBannerProps {
  username?: string;
}

export default function WelcomeBanner({ username }: WelcomeBannerProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Smart Home AI Dashboard</h1>
          <p className="text-blue-100 text-sm">Hệ thống quản lý nhà thông minh với năng lượng mặt trời</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-blue-100">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          Tất cả hệ thống hoạt động bình thường
        </div>
      </div>
    </div>
  );
}
