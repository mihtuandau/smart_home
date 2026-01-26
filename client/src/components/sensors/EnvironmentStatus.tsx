'use client';

export default function EnvironmentStatus() {
  const sensors = [
    {
      icon: '☀️',
      title: 'Ánh sáng (LM393 LDR)',
      value: '722.2',
      unit: 'lx',
      range: 'Phạm vi: 0-1000 lx',
      status: 'Ban ngày',
      statusColor: 'bg-yellow-100 text-yellow-700'
    },
    {
      icon: '🌧️',
      title: 'Cảm biến mưa',
      value: 'Không mưa',
      unit: '',
      subtitle: 'Servo chờ sẵn',
      status: 'Bình thường',
      statusColor: 'bg-green-100 text-green-700'
    }
  ];

  const environmentStatus = [
    { label: 'Servo (Mái che)', value: 'Mở' },
    { label: 'Đèn LED', value: 'Tắt' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Light Sensor */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-3 text-gray-600">
          <span className="text-lg">{sensors[0].icon}</span>
          <span className="text-sm font-medium">{sensors[0].title}</span>
        </div>
        <div className="mb-3">
          <span className="text-4xl font-bold text-gray-900">{sensors[0].value}</span>
          <span className="text-xl text-gray-500 ml-1">{sensors[0].unit}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{sensors[0].range}</span>
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${sensors[0].statusColor}`}>
            {sensors[0].status}
          </span>
        </div>
      </div>

      {/* Rain Sensor */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-3 text-gray-600">
          <span className="text-lg">{sensors[1].icon}</span>
          <span className="text-sm font-medium">{sensors[1].title}</span>
        </div>
        <div className="mb-2">
          <span className="text-3xl font-bold text-gray-900">{sensors[1].value}</span>
        </div>
        <div className="mb-3">
          <span className="text-xs text-gray-500">{sensors[1].subtitle}</span>
        </div>
        <div className="flex items-center justify-end">
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${sensors[1].statusColor}`}>
            {sensors[1].status}
          </span>
        </div>
      </div>

      {/* Environment Status */}
      <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Trạng thái môi trường</h3>
        <div className="space-y-3">
          {environmentStatus.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{item.label}</span>
              <span className="text-sm font-bold text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
