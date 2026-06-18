export default function CustomerDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Welcome back!</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Orders", value: "12" },
          { label: "Pending Delivery", value: "2" },
          { label: "Wishlist Items", value: "5" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{stat.label}</p>
            <p className="mt-1 text-3xl font-extrabold text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Recent Orders</h3>
        <p className="text-sm text-slate-400">No orders yet. Start shopping!</p>
      </div>
    </div>
  );
}
