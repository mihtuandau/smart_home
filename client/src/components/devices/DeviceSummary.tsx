export default function DeviceSummary() {
  const stats = [
    { label: 'LED đang bật', value: '0/3' },
    { label: 'Vị trí Servo', value: '180°' },
    { label: 'Chế độ Servo', value: 'Auto' },
    { label: 'Touch đang chạm', value: '0/4' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-6">Tóm tắt trạng thái thiết bị</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
