export default function AdminDashboard() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-h3 font-bold text-text-default">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: "NPR 0" },
          { label: "Total Orders", value: "0" },
          { label: "Products", value: "0" },
          { label: "Customers", value: "0" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-text-subtle uppercase tracking-wide">{stat.label}</p>
            <p className="mt-1 text-3xl font-extrabold text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-text-body mb-4">Recent Orders</h3>
          <p className="text-sm text-text-subtle">No orders yet.</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-text-body mb-4">Top Products</h3>
          <p className="text-sm text-text-subtle">No data yet.</p>
        </div>
      </div>
    </div>
  );
}
