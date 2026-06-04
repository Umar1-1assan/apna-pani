export function StatCard({ label, value, icon, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border border-gray-100 hover:border-gray-200/80 flex items-start gap-4 hover:-translate-y-0.5 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}
