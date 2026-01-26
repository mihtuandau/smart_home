'use client';

interface QuickAction {
  icon: string;
  label: string;
  color: string;
}

export default function QuickActions() {
  const actions: QuickAction[] = [
    { icon: '💡', label: 'Tắt tất cả đèn', color: 'bg-blue-50 hover:bg-blue-100' },
    { icon: '🌙', label: 'Chế độ ngủ', color: 'bg-green-50 hover:bg-green-100' },
    { icon: '🏠', label: 'Ra ngoài', color: 'bg-yellow-50 hover:bg-yellow-100' },
    { icon: '🎬', label: 'Xem phim', color: 'bg-purple-50 hover:bg-purple-100' },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Thao tác nhanh</h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <button key={index} className={`p-4 ${action.color} rounded-lg text-center transition`}>
            <div className="text-3xl mb-2">{action.icon}</div>
            <p className="text-sm font-medium text-gray-900">{action.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
