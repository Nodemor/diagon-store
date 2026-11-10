import { useState } from "react";
import { Navigate } from "react-router-dom";
import { adminApi, fieldErrors } from "../api";
import { useAdminAuth, useConfirm, useToast } from "../context";
import { usePageTitle } from "../../hooks/usePageTitle";
import { Badge, Button, ErrorBox, Input, LoadingRows, Modal, PageHeader, Select, Toggle, formatDateTime, useAdminData } from "../ui";

// Admin users and roles (proposal §14). Super admins only.
const ROLE_TEXT = {
  SUPER_ADMIN: "Everything, including admin users",
  ADMIN: "Products, categories, orders, banners, pages and settings",
};

function AdminModal({ admin, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: admin?.name || "", email: admin?.email || "", password: "", role: admin?.role || "ADMIN", isActive: admin?.isActive ?? true });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (form.name.trim().length < 2) found.name = "Enter a name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = "Enter a valid email.";
    if (!admin && form.password.length < 10) found.password = "At least 10 characters.";
    if (admin && form.password && form.password.length < 10) found.password = "At least 10 characters, or leave empty to keep the current password.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    const body = { name: form.name.trim(), email: form.email.trim(), role: form.role, isActive: form.isActive, ...(form.password ? { password: form.password } : {}) };
    try {
      if (admin) await adminApi.admins.update(admin.id, body);
      else await adminApi.admins.create(body);
      toast.success(admin ? "Admin updated" : "Admin added. Share the password with them securely.");
      onSaved();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={admin ? `Edit ${admin.name}` : "Add admin"}
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="admin-form" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </>
      }
    >
      <form id="admin-form" onSubmit={submit} className="space-y-4">
        <Input label="Name" value={form.name} error={errors.name} onChange={(e) => set("name", e.target.value)} />
        <Input label="Email (used to sign in)" type="email" value={form.email} error={errors.email} onChange={(e) => set("email", e.target.value)} />
        <Input label={admin ? "New password" : "Password"} optional={Boolean(admin)} type="password" autoComplete="new-password" value={form.password} error={errors.password} onChange={(e) => set("password", e.target.value)} hint="At least 10 characters." />
        <Select label="Role" value={form.role} onChange={(e) => set("role", e.target.value)} hint={ROLE_TEXT[form.role]}>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super admin</option>
        </Select>
        <Toggle label="Can sign in" description="Turn off to block this account without deleting it." checked={form.isActive} onChange={(v) => set("isActive", v)} />
      </form>
    </Modal>
  );
}

export default function Admins() {
  usePageTitle("Admin users");
  const { isSuper, admin: me } = useAdminAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, error, loading, reload } = useAdminData(() => (isSuper ? adminApi.admins.list() : Promise.resolve([])), [isSuper]);
  const [modal, setModal] = useState(null);

  if (!isSuper) return <Navigate to="/admin" replace />;

  const remove = async (a) => {
    if (!(await confirm({ title: `Remove ${a.name}?`, body: "They will no longer be able to sign in.", confirmText: "Remove admin", danger: true }))) return;
    try {
      await adminApi.admins.remove(a.id);
      toast.success("Admin removed");
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Admin users" description="People who can sign in to the back office." actions={<Button onClick={() => setModal("new")}>Add admin</Button>} />
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? (
        <LoadingRows />
      ) : (
        <ul className="divide-y divide-ink/10 rounded-2xl bg-mist ring-1 ring-ink/5">
          {data?.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-night font-semibold text-moon">{a.name[0]}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{a.name} {a.id === me.id && <span className="text-sm font-normal text-ink-soft">(you)</span>}</p>
                <p className="text-sm text-ink-soft">{a.email}, last signed in {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "never"}</p>
              </div>
              <Badge tone={a.role === "SUPER_ADMIN" ? "amber" : "blue"}>{a.role === "SUPER_ADMIN" ? "Super admin" : "Admin"}</Badge>
              {!a.isActive && <Badge tone="red">Blocked</Badge>}
              <div className="flex gap-1">
                <button type="button" onClick={() => setModal(a)} className="h-9 rounded-full px-3 text-sm font-semibold hover:bg-fog">Edit</button>
                {a.id !== me.id && <button type="button" onClick={() => remove(a)} className="h-9 rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-oxblood/10 hover:text-oxblood">Remove</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {modal && (
        <AdminModal
          admin={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
          }}
        />
      )}
    </>
  );
}
