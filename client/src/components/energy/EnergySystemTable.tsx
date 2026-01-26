'use client';

interface SystemComponent {
  name: string;
  spec: string;
  status: string;
  statusColor: string;
  metric: string;
  value: string;
  valueColor?: string;
}

export default function EnergySystemTable() {
  const components: SystemComponent[] = [
    {
      name: 'Solar Panel',
      spec: '6V 2A',
      status: 'Năng lượng thu được',
      statusColor: 'text-gray-900',
      metric: '45.2 Wh',
      value: '45.2 Wh',
      valueColor: 'text-gray-900'
    },
    {
      name: 'CN3791 Solar Charger',
      spec: 'Hoạt động',
      status: 'Năng lượng tiêu thụ',
      statusColor: 'text-green-700',
      metric: '32.8 Wh',
      value: '32.8 Wh',
      valueColor: 'text-gray-900'
    },
    {
      name: 'INA219 DC Sensor',
      spec: 'Đang đo',
      status: 'Thời gian hoạt động',
      statusColor: 'text-green-700',
      metric: '8h 24m',
      value: '8h 24m',
      valueColor: 'text-gray-900'
    },
    {
      name: 'DC-DC XL4005E1',
      spec: '5V Output',
      status: 'Hiệu suất',
      statusColor: 'text-gray-900',
      metric: '85%',
      value: '85%',
      valueColor: 'text-green-700'
    }
  ];

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Thông tin hệ thống năng lượng</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Phần cứng</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Thông số</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Thông kế hôm nay</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {components.map((component, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4">
                  <span className="text-sm font-medium text-gray-900">{component.name}</span>
                </td>
                <td className="py-4 px-4">
                  <span className={`text-sm font-semibold ${component.statusColor}`}>
                    {component.spec}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-600">{component.status}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className={`text-sm font-bold ${component.valueColor || 'text-gray-900'}`}>
                    {component.value}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
