import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.username, form.password);
      navigate("/");
    } catch (err) {
      const d = err.response?.data;
      setError(d?.non_field_errors?.[0] || d?.detail || "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-lg shadow p-8">
        <div className="mb-1 text-xl"><Logo size={32} /></div>
        <p className="text-sm text-slate-500 mb-6">Sign in to your account</p>

        {error && (
          <div className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm p-3">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium mb-1">Username</label>
        <input
          className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-slate-400"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />

        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-slate-400"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button
          disabled={busy}
          className="w-full bg-slate-900 text-white rounded py-2 hover:bg-slate-700 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-sm text-center mt-4 text-slate-600">
          No account? <Link to="/register" className="text-slate-900 underline">Register</Link>
        </p>
      </form>
    </div>
  );
}
