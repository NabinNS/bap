export default function CustomerOrders() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">My Orders</h2>
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
        <p className="text-sm text-slate-400">You have no orders yet.</p>
      </div>
    </div>
  );
}
