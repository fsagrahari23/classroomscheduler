'use client';

export default function FilterTabs({ activeTab, onTabChange, tabs }) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-700 px-6 py-4 bg-slate-800/50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 font-medium text-sm transition-all duration-200 border-b-2 ${
            activeTab === tab.id
              ? 'border-b-indigo-600 text-indigo-400'
              : 'border-b-transparent text-slate-400 hover:text-slate-100'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-2 text-xs bg-slate-700 px-2 py-1 rounded-full">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
