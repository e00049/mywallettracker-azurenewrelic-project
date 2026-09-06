import { useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const inr = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n || 0);

const today = () => new Date().toISOString().slice(0, 10);

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [txns, setTxns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    txn_type: "expense", amount: "", description: "", date: today(), category: "",
  });
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [s, t, c] = await Promise.all([
        client.get("/transactions/summary/"),
        client.get("/transactions/"),
        client.get("/categories/"),
      ]);
      setSummary(s.data);
      setTxns(t.data.results ?? t.data);
      setCategories(c.data.results ?? c.data);
    } catch {
      setError("Could not load data.");
    }
  };

  useEffect(() => { load(); }, []);

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await client.post("/categories/", { name: newCategory });
      setNewCategory("");
      load();
    } catch (err) {
      setError(err.response?.data?.name?.[0] || "Could not add category.");
    }
  };

  const addTxn = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await client.post("/transactions/", {
        ...form,
        category: form.category || null,
      });
      setForm({ ...form, amount: "", description: "" });
      load();
    } catch (err) {
      const d = err.response?.data;
      setError(d?.amount?.[0] || d?.date?.[0] || "Could not add transaction.");
    }
  };

  const remove = async (id) => {
    await client.delete(`/transactions/${id}/`);
    load();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">MyWalletTracker</h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600">{user?.username}</span>
            <button onClick={logout} className="text-slate-900 underline">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="rounded bg-red-50 border border-red-200 text-red-700 text-sm p-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label="Income" value={inr(summary?.total_income)} tone="text-green-700" />
          <Stat label="Expense" value={inr(summary?.total_expense)} tone="text-red-700" />
          <Stat
            label="Balance"
            value={inr(summary?.balance)}
            tone={summary?.balance >= 0 ? "text-green-700" : "text-red-700"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white rounded-lg shadow p-5 lg:col-span-1 space-y-6">
            <div>
              <h2 className="font-semibold mb-3">Add transaction</h2>
              <form onSubmit={addTxn} className="space-y-3">
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.txn_type}
                  onChange={(e) => setForm({ ...form, txn_type: e.target.value })}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>

                <input
                  type="number" step="0.01" min="0.01" placeholder="Amount"
                  className="w-full border rounded px-3 py-2"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />

                <input
                  placeholder="Description"
                  className="w-full border rounded px-3 py-2"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />

                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />

                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <button className="w-full bg-slate-900 text-white rounded py-2 hover:bg-slate-700">
                  Add
                </button>
              </form>
            </div>

            <div>
              <h2 className="font-semibold mb-3">Categories</h2>
              <form onSubmit={addCategory} className="flex gap-2 mb-3">
                <input
                  placeholder="New category"
                  className="flex-1 border rounded px-3 py-2"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <button className="bg-slate-200 rounded px-3 hover:bg-slate-300">Add</button>
              </form>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span key={c.id} className="text-xs bg-slate-100 border rounded px-2 py-1">
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow p-5 lg:col-span-2">
            <h2 className="font-semibold mb-3">Transactions</h2>
            {txns.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500 border-b">
                  <tr>
                    <th className="py-2">Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th className="text-right">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-2 whitespace-nowrap">{t.date}</td>
                      <td>{t.description || "—"}</td>
                      <td className="text-slate-600">{t.category_name || "Uncategorized"}</td>
                      <td className={`text-right font-medium ${
                        t.txn_type === "income" ? "text-green-700" : "text-red-700"
                      }`}>
                        {t.txn_type === "income" ? "+" : "−"}{inr(t.amount)}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => remove(t.id)}
                          className="text-slate-400 hover:text-red-600 px-2"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${tone}`}>{value}</p>
    </div>
  );
}
