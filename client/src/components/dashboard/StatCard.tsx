'use client';

interface StatCardProps {
  label: string;
  value: string;
  color: string;
  subtitle?: string;
  progress?: number;
  index: number;
}

export default function StatCard({ label, value, color, subtitle, progress, index }: StatCardProps) {
  return (
    <div
      className="relative section-card shadow-sm border border-gray-200 border-l-4 p-3 sm:p-4 md:p-5 transition-shadow hover:shadow-md"
      style={{ borderLeftColor: color }}
    >
      <div className="mb-2 sm:mb-3">
        <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      
      <div className="mb-1.5 sm:mb-2">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{value}</h3>
      </div>
      
      {subtitle && (
        <p className="text-[11px] sm:text-xs text-gray-600">{subtitle}</p>
      )}
      
      {progress !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: color }}
            ></div>
          </div>
        </div>
      )}
      
      <div 
        className="absolute bottom-0 left-0 h-0.5 rounded-b-xl transition-all duration-300"
        style={{ width: '100%', backgroundColor: color, opacity: 0.6 }}
      ></div>
    </div>
  );
}
