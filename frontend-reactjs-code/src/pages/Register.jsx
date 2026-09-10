import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";

// Defined OUTSIDE the component. If this lives inside Register, React
// recreates it on every keystroke, remounting the input and losing focus.
function Field({ label, name, type = "text", value, onChange, error }) {
  return (
    <>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        name={name}
        className="w-full border rounded px-3 py-2 mb-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
        value={value}
        onChange={onChange}
        required
      />
      {error ? (
        <p className="text-red-600 text-xs mb-3">{[].concat(error).join(" ")}</p>
      ) : (
        <div className="mb-3" />
      )}
    </>
  );
}

export default function Register() {
  const [form, setForm] = useState({
    username: "", email: "", password: "", password_confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setBusy(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setErrors(err.response?.data || { detail: "Registration failed." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-lg shadow p-8">
        <div className="mb-2 text-xl"><Logo size={32} /></div>
        <h1 className="text-xl font-semibold mb-6">Create account</h1>

        {errors.detail && (
          <div className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm p-3">
            {errors.detail}
          </div>
        )}

        <Field
          label="Username" name="username"
          value={form.username} onChange={handleChange} error={errors.username}
        />
        <Field
          label="Email" name="email" type="email"
          value={form.email} onChange={handleChange} error={errors.email}
        />
        <Field
          label="Password" name="password" type="password"
          value={form.password} onChange={handleChange} error={errors.password}
        />
        <Field
          label="Confirm password" name="password_confirm" type="password"
          value={form.password_confirm} onChange={handleChange} error={errors.password_confirm}
        />

        <button
          disabled={busy}
          className="w-full bg-slate-900 text-white rounded py-2 hover:bg-slate-700 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create account"}
        </button>

        <p className="text-sm text-center mt-4 text-slate-600">
          Already registered? <Link to="/login" className="text-slate-900 underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
