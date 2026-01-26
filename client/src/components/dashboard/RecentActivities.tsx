'use client';

interface Activity {
  device: string;
  action: string;
  time: string;
  status: string;
}

export default function RecentActivities() {
  const activities: Activity[] = [
    { device: 'Đèn phòng khách', action: 'Bật', time: '5 phút trước', status: 'success' },
    { device: 'Điều hòa phòng ngủ', action: 'Tắt', time: '15 phút trước', status: 'info' },
    { device: 'Màn che cà phê', action: 'Mở', time: '1 giờ trước', status: 'success' },
    { device: 'Đèn sân vườn', action: 'Bật tự động', time: '2 giờ trước', status: 'warning' },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Hoạt động gần đây</h2>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div>
              <p className="font-medium text-gray-900">{activity.device}</p>
              <p className="text-sm text-gray-500">{activity.action}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
