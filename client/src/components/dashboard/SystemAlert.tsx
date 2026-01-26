'use client';

export default function SystemAlert() {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-green-900 text-sm mb-1">Hệ thống hoạt động tốt</h3>
          <p className="text-sm text-green-700">Tất cả cảm biến và thiết bị đang hoạt động bình thường</p>
        </div>
      </div>
    </div>
  );
}
