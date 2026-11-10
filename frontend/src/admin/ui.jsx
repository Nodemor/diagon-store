/* eslint-disable react-refresh/only-export-components */
// Small UI kit for the admin panel: calm, practical, same palette as the shop.
import { useCallback, useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CloseIcon } from "../components/ui/icons";

export { Button, ButtonLink } from "../components/ui/Button";

// ---- data loading -----------------------------------------------------------

/** const { data, error, loading, reload, setData } = useAdminData(() => adminApi.x(), [deps]) */
export function useAdminData(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    loader()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState({ data: null, error, loading: false }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === "function" ? updater(s.data) : updater })), []);
  return { ...state, reload, setData };
}

// ---- layout -------------------------------------------------------------------

export function PageHeader({ title, description, actions, back }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back}
        <h1 className="text-[2.4rem] leading-tight md:text-5xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, actions, children, className = "" }) {
  return (
    <section className={`rounded-2xl bg-mist p-5 ring-1 ring-ink/5 md:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-sans text-lg font-semibold tracking-normal">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/20 px-6 py-14 text-center">
      <p className="font-sign text-3xl">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div role="alert" className="rounded-xl bg-oxblood/10 p-4 text-sm text-oxblood">
      <span className="font-semibold">{error.message || "Something went wrong."}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="ml-3 underline underline-offset-4">
          Try again
        </button>
      )}
    </div>
  );
}

export function LoadingRows({ rows = 5 }) {
  return (
    <div className="animate-pulse space-y-3" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-12 rounded-xl bg-fog-deep" />
      ))}
    </div>
  );
}

// ---- form fields ------------------------------------------------------------------

const control =
  "w-full rounded-xl border bg-mist px-3.5 text-[0.95rem] text-ink transition-colors focus:outline-none disabled:opacity-60";
const controlState = (error) => (error ? "border-oxblood focus:border-oxblood" : "border-ink/20 focus:border-ink");

/** Label + control + hint/error. Pass the control as children, or use Input/Textarea/Select below. */
export function Field({ label, hint, error, optional, children, id, className = "" }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-semibold">
          {label}
          {optional && <span className="font-normal text-ink-soft">Optional</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-oxblood">{error}</p>
      ) : (
        hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-soft">{hint}</p>
      )}
    </div>
  );
}

function useFieldId(id) {
  const auto = useId();
  return id || `f-${auto}`;
}

export function Input({ label, hint, error, optional, className = "", id, ...props }) {
  const fid = useFieldId(id);
  return (
    <Field label={label} hint={hint} error={error} optional={optional} id={fid} className={className}>
      <input
        id={fid}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
        className={`${control} ${controlState(error)} h-11`}
        {...props}
      />
    </Field>
  );
}

export function Textarea({ label, hint, error, optional, className = "", id, rows = 4, ...props }) {
  const fid = useFieldId(id);
  return (
    <Field label={label} hint={hint} error={error} optional={optional} id={fid} className={className}>
      <textarea
        id={fid}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
        className={`${control} ${controlState(error)} py-2.5`}
        {...props}
      />
    </Field>
  );
}

export function Select({ label, hint, error, optional, className = "", id, children, ...props }) {
  const fid = useFieldId(id);
  return (
    <Field label={label} hint={hint} error={error} optional={optional} id={fid} className={className}>
      <select
        id={fid}
        aria-invalid={Boolean(error)}
        className={`${control} ${controlState(error)} h-11 pr-8`}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}

/** Accessible on/off switch. */
export function Toggle({ checked, onChange, label, description, disabled }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-semibold">{label}</label>
        {description && <p className="text-xs text-ink-soft">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 disabled:opacity-50 ${checked ? "bg-verdigris-deep" : "bg-ink/20"}`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 600, damping: 32 }}
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${checked ? "right-0.5" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

// ---- badges --------------------------------------------------------------------------

const TONES = {
  green: "bg-verdigris/15 text-verdigris-deep",
  amber: "bg-lamp/20 text-lamp-deep",
  red: "bg-oxblood/10 text-oxblood",
  blue: "bg-[#2b3a55]/10 text-[#2b3a55]",
  plum: "bg-plum/10 text-plum",
  grey: "bg-ink/10 text-ink-soft",
};

export function Badge({ tone = "grey", children }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>{children}</span>;
}

export const ORDER_STATUSES = [
  ["NEW", "New", "amber"],
  ["CONTACTED", "Contacted", "blue"],
  ["CONFIRMED", "Confirmed", "plum"],
  ["PROCESSING", "Processing", "plum"],
  ["COMPLETED", "Completed", "green"],
  ["CANCELLED", "Cancelled", "red"],
];
export const PRODUCT_STATUSES = [
  ["ACTIVE", "Active", "green"],
  ["DRAFT", "Draft", "grey"],
  ["INACTIVE", "Inactive", "grey"],
  ["OUT_OF_STOCK", "Out of stock", "red"],
];

export function StatusBadge({ status, kind = "order" }) {
  const list = kind === "order" ? ORDER_STATUSES : PRODUCT_STATUSES;
  const [, label, tone] = list.find(([value]) => value === status) || [status, status, "grey"];
  return <Badge tone={tone}>{label}</Badge>;
}

// ---- pagination ------------------------------------------------------------------------

export function Pagination({ page, pages, total, onChange }) {
  if (!pages || pages <= 1) return total ? <p className="mt-4 text-sm text-ink-soft">{total} total</p> : null;
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-ink-soft">{total} total, page {page} of {pages}</p>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="h-9 rounded-full border border-ink/20 px-4 font-semibold hover:border-ink disabled:opacity-40">
          Previous
        </button>
        <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className="h-9 rounded-full border border-ink/20 px-4 font-semibold hover:border-ink disabled:opacity-40">
          Next
        </button>
      </div>
    </div>
  );
}

// ---- modal -------------------------------------------------------------------------------

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
          <motion.button
            type="button"
            tabIndex={-1}
            aria-label="Close"
            className="absolute inset-0 bg-night-deep/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            data-lenis-prevent
            className={`relative flex max-h-[92svh] w-full flex-col rounded-t-3xl bg-fog text-ink shadow-2xl sm:rounded-3xl ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
              <h2 className="text-3xl">{title}</h2>
              <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-mist" aria-label="Close">
                <CloseIcon />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-ink/10 px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ---- formatting ----------------------------------------------------------------------------

const dateTime = new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
const dateOnly = new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "short", year: "numeric" });
export const formatDateTime = (d) => (d ? dateTime.format(new Date(d)) : "—");
export const formatDate = (d) => (d ? dateOnly.format(new Date(d)) : "—");
