import { useState } from "react";
import { adminApi, fieldErrors } from "../api";
import { useAdminAuth, useToast } from "../context";
import { usePageTitle } from "../../hooks/usePageTitle";
import { Button, Input, PageHeader, Panel } from "../ui";

export default function Profile() {
  usePageTitle("My account");
  const { admin } = useAdminAuth();
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.currentPassword) found.currentPassword = "Enter your current password.";
    if (form.newPassword.length < 10) found.newPassword = "At least 10 characters.";
    if (form.newPassword !== form.confirm) found.confirm = "The two new passwords don't match.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await adminApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success("Password changed");
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="My account" description={`${admin?.name}, ${admin?.email}`} />
      <Panel title="Change password" className="max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Current password" type="password" autoComplete="current-password" value={form.currentPassword} error={errors.currentPassword} onChange={set("currentPassword")} />
          <Input label="New password" type="password" autoComplete="new-password" value={form.newPassword} error={errors.newPassword} onChange={set("newPassword")} hint="At least 10 characters." />
          <Input label="Repeat new password" type="password" autoComplete="new-password" value={form.confirm} error={errors.confirm} onChange={set("confirm")} />
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Change password"}</Button>
        </form>
      </Panel>
    </>
  );
}
