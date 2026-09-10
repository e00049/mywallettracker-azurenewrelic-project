import { useEffect, useState } from "react";
import {
  Bar, BarChart, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import client from "../api/client";

const COLORS = [
  "#0891b2",  // cyan
  "#f59e0b",  // amber
  "#8b5cf6",  // violet
  "#10b981",  // emerald
  "#ef4444",  // red
  "#3b82f6",  // blue
  "#ec4899",  // pink
  "#84cc16",  // lime
];

const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n || 0);

export default function Charts({ summary, refreshKey }) {
  const [monthly, setMonthly] = useState([]);

  useEffect(() => {
    client
      .get("/transactions/monthly/?months=6")
      .then((res) => setMonthly(res.data))
      .catch(() => setMonthly([]));
  }, [refreshKey]);

  const byCategory = (summary?.expense_by_category ?? []).map((c) => ({
    name: c.category,
    value: Number(c.total),
  }));

  const hasCategory = byCategory.length > 0;
  const hasMonthly = monthly.length > 0;

  if (!hasCategory && !hasMonthly) return null;
  // When only one chart has data, let it span the full width
  // Stacked in a narrow sidebar column, so always single-column

  return (
    <div className="flex flex-col gap-6">
      {hasCategory && (
        <section className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold mb-4">Spending by category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={byCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={35}
                paddingAngle={2}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => inr(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </section>
      )}

      {hasMonthly && (
        <section className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold mb-4">Last 6 months</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v / 1000 + "k"} />
              <Tooltip formatter={(v) => inr(v)} />
              <Legend />
              <Bar dataKey="income" fill="#16a34a" name="Income" />
              <Bar dataKey="expense" fill="#dc2626" name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}
    </div>
  );
}
