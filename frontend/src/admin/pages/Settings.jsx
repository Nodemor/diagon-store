import { useEffect, useState } from "react";
import { adminApi } from "../api";
import { useToast } from "../context";
import { usePageTitle } from "../../hooks/usePageTitle";
import { whatsappLink } from "../../lib/format";
import { Button, ErrorBox, Input, LoadingRows, PageHeader, Panel, Textarea, useAdminData } from "../ui";

// Website settings (proposal §24–§26, §28 "Website Settings").
const GROUPS = [
  {
    title: "Store",
    description: "Shown in the header, footer and browser tab.",
    fields: [
      ["storeName", "Store name"],
      ["tagline", "Tagline"],
      ["footerText", "Footer text", { textarea: true }],
    ],
  },
  {
    title: "Contact & ordering",
    description: "Orders are sent to this WhatsApp number and email.",
    fields: [
      ["whatsappNumber", "WhatsApp number", { hint: "International format, digits only. Sri Lanka: 94 then the number without the 0, e.g. 94771234567.", inputMode: "tel" }],
      ["phone", "Phone number", { hint: "Shown in the footer, e.g. 077 123 4567.", inputMode: "tel" }],
      ["email", "Business email", { hint: "Shown in the footer and used for email inquiries.", type: "email" }],
      ["address", "Address", { textarea: true }],
      ["businessHours", "Business hours", { hint: "e.g. Monday to Saturday, 9 am to 7 pm" }],
      ["mapEmbedUrl", "Google Map embed link", { hint: "Google Maps → Share → Embed a map → copy the src link (starts with https://www.google.com/maps/embed)." }],
    ],
  },
  {
    title: "Social media",
    description: "Icons appear in the footer for the links you fill in.",
    fields: [
      ["facebookUrl", "Facebook page", { type: "url" }],
      ["instagramUrl", "Instagram", { type: "url" }],
      ["tiktokUrl", "TikTok", { type: "url" }],
      ["youtubeUrl", "YouTube", { type: "url" }],
    ],
  },
  {
    title: "Search engines",
    description: "Used for the home page in Google results and link previews.",
    fields: [
      ["metaTitle", "Home page title"],
      ["metaDescription", "Home page description", { textarea: true }],
    ],
  },
];

export default function Settings() {
  usePageTitle("Settings");
  const toast = useToast();
  const { data, error, loading, reload } = useAdminData(() => adminApi.settings.get(), []);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const changed = data ? Object.keys(form).filter((k) => (form[k] ?? "") !== (data[k] ?? "")) : [];

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = Object.fromEntries(changed.map((k) => [k, form[k] ?? ""]));
      const updated = await adminApi.settings.update(body);
      setForm(updated);
      reload();
      toast.success("Settings saved. The website uses them right away.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) return <LoadingRows rows={8} />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const wa = whatsappLink(form.whatsappNumber, "Test message from the Diagon Store back office");

  return (
    <form onSubmit={save}>
      <PageHeader
        title="Settings"
        description="Business details shown on the website. No developer needed to change them."
        actions={<Button type="submit" disabled={busy || !changed.length}>{busy ? "Saving…" : changed.length ? `Save ${changed.length} change${changed.length > 1 ? "s" : ""}` : "All saved"}</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        {GROUPS.map((group) => (
          <Panel key={group.title} title={group.title} description={group.description}>
            <div className="space-y-4">
              {group.fields.map(([key, label, opts = {}]) => {
                const props = {
                  label,
                  hint: opts.hint,
                  value: form[key] ?? "",
                  onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
                };
                return opts.textarea ? (
                  <Textarea key={key} rows={2} {...props} />
                ) : (
                  <Input key={key} type={opts.type || "text"} inputMode={opts.inputMode} {...props} />
                );
              })}
              {group.title === "Contact & ordering" && wa && (
                <a href={wa} target="_blank" rel="noreferrer" className="inline-block text-sm font-semibold underline underline-offset-4">
                  Test the WhatsApp number
                </a>
              )}
            </div>
          </Panel>
        ))}
      </div>
    </form>
  );
}
