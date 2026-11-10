import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAdminAuth } from "../context";
import { LampMark } from "../../components/ui/icons";
import { Button } from "../ui";

export default function Login() {
  const { admin, login, notice } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (admin) return <Navigate to={location.state?.from || "/admin"} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || "/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Couldn't sign in.");
    } finally {
      setBusy(false);
    }
  };

  const input = "mt-1.5 h-12 w-full rounded-xl border border-cobble-line bg-cobble/60 px-4 text-moon placeholder:text-moon-soft/70 focus:border-lamp focus:outline-none";

  return (
    <div className="relative grid min-h-svh place-items-center overflow-hidden bg-night px-4 text-moon">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full lamp-halo opacity-50" />
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm rounded-3xl border border-cobble-line/70 bg-night-deep/80 p-8 shadow-2xl backdrop-blur"
      >
        <div className="flex items-center gap-2">
          <LampMark />
          <span className="font-sign text-2xl">Diagon Store</span>
        </div>
        <h1 className="mt-6 text-4xl">Back office</h1>
        <p className="mt-1 text-sm text-moon-soft">Sign in to manage products, orders and the website.</p>

        {(error || notice) && (
          <p role="alert" className="mt-5 rounded-xl bg-oxblood/25 p-3 text-sm font-semibold text-[#ffd6dc]">
            {error || notice}
          </p>
        )}

        <label className="mt-6 block text-sm font-semibold">
          Email
          <input className={input} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="mt-4 block text-sm font-semibold">
          Password
          <input className={input} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <Button type="submit" className="mt-7 w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <p className="mt-5 text-center text-xs text-moon-soft">
          <a href="/" className="underline underline-offset-4 hover:text-lamp">Back to the shop</a>
        </p>
      </motion.form>
    </div>
  );
}
