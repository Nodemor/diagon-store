/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { adminApi, setUnauthorizedHandler } from "./api";

// ---------------------------------------------------------------------------
// Auth: who is signed in. The session is an httpOnly cookie, so on load we simply ask the API
// who we are. A blocked admin or a revoked session is signed out immediately.
// ---------------------------------------------------------------------------
const AuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [state, setState] = useState({ admin: null, checking: true, notice: null });

  /** Local sign-out (session already gone on the server). */
  const signedOut = useCallback((notice = null) => setState({ admin: null, checking: false, notice }), []);

  /** "Sign out" button: ends this admin's sessions on the server too. */
  const logout = useCallback(async () => {
    await adminApi.logout().catch(() => {});
    signedOut();
  }, [signedOut]);

  useEffect(() => {
    setUnauthorizedHandler(() => signedOut("Your session has ended. Please sign in again."));
    adminApi.currentAdmin().then((admin) => setState({ admin, checking: false, notice: null }));
  }, [signedOut]);

  const login = useCallback(async (email, password) => {
    const { admin } = await adminApi.login(email, password);
    setState({ admin, checking: false, notice: null });
    return admin;
  }, []);

  const value = useMemo(
    () => ({ ...state, isSuper: state.admin?.role === "SUPER_ADMIN", login, logout }),
    [state, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAdminAuth = () => useContext(AuthContext);

// ---------------------------------------------------------------------------
// Toasts: toast.success("Product saved") / toast.error(message)
// ---------------------------------------------------------------------------
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const push = useCallback((kind, message) => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-3), { id, kind, message }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), kind === "error" ? 6000 : 3200);
  }, []);

  const api = useMemo(
    () => ({ success: (m) => push("success", m), error: (m) => push("error", m), info: (m) => push("info", m) }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              role={t.kind === "error" ? "alert" : "status"}
              className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-semibold shadow-[0_18px_40px_-18px_rgb(0_0_0/0.6)] ${
                t.kind === "error" ? "bg-oxblood text-white" : t.kind === "success" ? "bg-night text-moon" : "bg-mist text-ink ring-1 ring-ink/10"
              }`}
            >
              {t.kind === "success" && <span className="mr-2 text-lamp" aria-hidden="true">✓</span>}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// ---------------------------------------------------------------------------
// Confirm dialog: if (await confirm({ title, body, confirmText, danger: true })) ...
// ---------------------------------------------------------------------------
const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const confirmButton = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setDialog({ ...options, resolve });
      }),
    [],
  );

  const close = (result) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  useEffect(() => {
    if (!dialog) return undefined;
    requestAnimationFrame(() => confirmButton.current?.focus());
    const onKey = (e) => e.key === "Escape" && close(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {dialog && (
          <div className="fixed inset-0 z-[70] grid place-items-center p-4">
            <motion.button
              type="button"
              tabIndex={-1}
              aria-label="Cancel"
              className="absolute inset-0 bg-night-deep/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => close(false)}
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-body"
              className="relative w-full max-w-sm rounded-2xl bg-mist p-6 text-ink shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
            >
              <h2 id="confirm-title" className="text-2xl">{dialog.title}</h2>
              {dialog.body && <p id="confirm-body" className="mt-2 text-sm text-ink-soft">{dialog.body}</p>}
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => close(false)} className="h-10 rounded-full px-4 text-sm font-semibold hover:bg-fog">
                  {dialog.cancelText || "Cancel"}
                </button>
                <button
                  ref={confirmButton}
                  type="button"
                  onClick={() => close(true)}
                  className={`h-10 rounded-full px-5 text-sm font-semibold ${dialog.danger ? "bg-oxblood text-white hover:bg-oxblood/90" : "bg-lamp text-night hover:bg-lamp-soft"}`}
                >
                  {dialog.confirmText || "Confirm"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
