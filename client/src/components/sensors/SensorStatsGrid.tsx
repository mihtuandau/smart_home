'use client';

interface SensorCardProps {
  icon: string;
  title: string;
  value: string;
  unit: string;
  range: string;
  status: string;
  statusColor: string;
}

function SensorCard({ icon, title, value, unit, range, status, statusColor }: SensorCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 mb-3 text-gray-600">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      
      <div className="mb-3">
        <span className="text-4xl font-bold text-gray-900">{value}</span>
        <span className="text-xl text-gray-500 ml-1">{unit}</span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{range}</span>
        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusColor}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

export default function SensorStatsGrid() {
  const sensors = [
    {
      icon: '🌡️',
      title: 'Nhiệt độ (AHT20)',
      value: '26.2',
      unit: '°C',
      range: 'Phạm vi: 20-35°C',
      status: 'Bình thường',
      statusColor: 'bg-green-100 text-green-700'
    },
    {
      icon: '💧',
      title: 'Độ ẩm (AHT20)',
      value: '64.8',
      unit: '%',
      range: 'Phạm vi: 40-90%',
      status: 'Bình thường',
      statusColor: 'bg-green-100 text-green-700'
    },
    {
      icon: '🌪️',
      title: 'Áp suất (BMP280)',
      value: '1013.9',
      unit: 'hPa',
      range: 'Phạm vi: 1000-1030 hPa',
      status: 'Ổn định',
      statusColor: 'bg-green-100 text-green-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sensors.map((sensor, index) => (
        <SensorCard key={index} {...sensor} />
      ))}
    </div>
  );
}
