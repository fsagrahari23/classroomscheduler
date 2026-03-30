'use client';

export default function StatCard({ label, value, icon: Icon, variant = 'default', subtext }) {
  const variantClasses = {
    default: 'bg-slate-800 border-slate-700',
    success: 'bg-green-900/20 border-green-700/50',
    warning: 'bg-amber-900/20 border-amber-700/50',
    danger: 'bg-red-900/20 border-red-700/50',
    primary: 'bg-indigo-900/20 border-indigo-600/50',
    info: 'bg-blue-900/20 border-blue-700/50',
  };

  const textVariant = {
    default: 'text-slate-100',
    success: 'text-green-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
    primary: 'text-indigo-400',
    info: 'text-blue-400',
  };

  return (
    <div className={`card border ${variantClasses[variant]} hover:border-indigo-600/30 transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">{label}</p>
          <div className="mt-3 flex items-baseline gap-2">
            <p className={`text-4xl font-bold ${textVariant[variant]}`}>{value}</p>
            {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
          </div>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg bg-slate-700/50`}>
            <Icon size={24} className={textVariant[variant]} />
          </div>
        )}
      </div>
    </div>
  );
}
