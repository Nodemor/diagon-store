import { useState } from "react";
import { adminApi, fieldErrors } from "../api";
import { useConfirm, useToast } from "../context";
import { usePageTitle } from "../../hooks/usePageTitle";
import { imageAt } from "../../lib/format";
import { Img } from "../../components/ui/Img";
import { SingleImageField } from "../components/FormParts";
import { Badge, Button, EmptyState, ErrorBox, Input, LoadingRows, Modal, PageHeader, Select, Textarea, Toggle, formatDate, useAdminData } from "../ui";
import { EditIcon } from "../icons";

// Banner management (proposal §15): hero window slides + promotional banners, with schedules.

const PLACEMENTS = {
  HERO: { label: "Home page hero", hint: "Rotates in the arched shop window at the top of the home page." },
  PROMO: { label: "Promotional banner", hint: "The two large offer banners under “Featured this week”." },
};

/** Date → value for <input type="datetime-local"> in the admin's own time zone. */
const toLocal = (d) => {
  if (!d) return "";
  const date = new Date(d);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const EMPTY = { title: "", subtitle: "", imageUrl: null, buttonText: "", buttonLink: "", placement: "HERO", isActive: true, sortOrder: "0", startsAt: "", endsAt: "" };

function scheduleState(b) {
  const now = Date.now();
  if (!b.isActive) return ["Off", "grey"];
  if (b.startsAt && new Date(b.startsAt).getTime() > now) return [`Starts ${formatDate(b.startsAt)}`, "blue"];
  if (b.endsAt && new Date(b.endsAt).getTime() < now) return ["Ended", "red"];
  return ["Live", "green"];
}

function BannerModal({ banner, placement, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(() =>
    banner
      ? { ...EMPTY, ...banner, subtitle: banner.subtitle || "", buttonText: banner.buttonText || "", buttonLink: banner.buttonLink || "", sortOrder: String(banner.sortOrder), startsAt: toLocal(banner.startsAt), endsAt: toLocal(banner.endsAt) }
      : { ...EMPTY, placement },
  );
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.title.trim()) found.title = "Add a title.";
    if (!form.imageUrl) found.imageUrl = "Upload an image.";
    if (form.buttonText && !form.buttonLink) found.buttonLink = "Where should the button go? e.g. /shop?onSale=true";
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    const body = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      imageUrl: form.imageUrl,
      buttonText: form.buttonText.trim() || null,
      buttonLink: form.buttonLink.trim() || null,
      placement: form.placement,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    };
    try {
      if (banner) await adminApi.banners.update(banner.id, body);
      else await adminApi.banners.create(body);
      toast.success(banner ? "Banner saved" : "Banner added");
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
      wide
      onClose={onClose}
      title={banner ? "Edit banner" : "Add banner"}
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="banner-form" disabled={busy}>{busy ? "Saving…" : "Save banner"}</Button>
        </>
      }
    >
      <form id="banner-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Select label="Where it appears" value={form.placement} onChange={(e) => set("placement", e.target.value)} hint={PLACEMENTS[form.placement].hint} className="sm:col-span-2">
          {Object.entries(PLACEMENTS).map(([v, p]) => <option key={v} value={v}>{p.label}</option>)}
        </Select>
        <div className="sm:col-span-2">
          <SingleImageField folder="banners" value={form.imageUrl} onChange={(v) => set("imageUrl", v)} label="Banner image" hint="Landscape, at least 1600 px wide works best." />
          {errors.imageUrl && <p className="mt-1.5 text-sm text-oxblood">{errors.imageUrl}</p>}
        </div>
        <Input label="Title" value={form.title} error={errors.title} onChange={(e) => set("title", e.target.value)} className="sm:col-span-2" />
        <Textarea label="Description" optional rows={2} value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} className="sm:col-span-2" />
        <Input label="Button text" optional value={form.buttonText} onChange={(e) => set("buttonText", e.target.value)} hint="e.g. Shop the sale" />
        <Input label="Button link" optional value={form.buttonLink} error={errors.buttonLink} onChange={(e) => set("buttonLink", e.target.value)} hint="e.g. /shop?onSale=true or /category/fashion" />
        <Input label="Starts" optional type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
        <Input label="Ends" optional type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} hint="Leave empty to keep it running." />
        <Input label="Display order" inputMode="numeric" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value.replace(/\D/g, ""))} hint="Lower numbers come first." />
        <div className="self-end pb-2">
          <Toggle label="Banner is on" checked={form.isActive} onChange={(v) => set("isActive", v)} />
        </div>
      </form>
    </Modal>
  );
}

export default function Banners() {
  usePageTitle("Banners");
  const toast = useToast();
  const confirm = useConfirm();
  const { data, error, loading, reload, setData } = useAdminData(() => adminApi.banners.list(), []);
  const [modal, setModal] = useState(null); // { banner?, placement }

  const toggle = async (b) => {
    setData((list) => list.map((x) => (x.id === b.id ? { ...x, isActive: !b.isActive } : x)));
    try {
      await adminApi.banners.update(b.id, { isActive: !b.isActive });
    } catch (err) {
      toast.error(err.message);
      reload();
    }
  };

  const remove = async (b) => {
    if (!(await confirm({ title: `Delete “${b.title}”?`, confirmText: "Delete banner", danger: true }))) return;
    try {
      await adminApi.banners.remove(b.id);
      toast.success("Banner deleted");
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Banners" description="Seasonal promotions and campaigns. Schedule start and end dates and they switch on and off by themselves." />
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? (
        <LoadingRows />
      ) : (
        data &&
        Object.entries(PLACEMENTS).map(([placement, info]) => {
          const list = data.filter((b) => b.placement === placement);
          return (
            <section key={placement} className="mb-10">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-3xl">{info.label}</h2>
                  <p className="text-sm text-ink-soft">{info.hint}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setModal({ placement })}>Add banner</Button>
              </div>
              {list.length === 0 ? (
                <EmptyState title="No banners here" text={placement === "HERO" ? "The hero window shows a featured product until you add one." : "This section is hidden until you add one."} />
              ) : (
                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((b) => {
                    const [label, tone] = scheduleState(b);
                    return (
                      <li key={b.id} className="overflow-hidden rounded-2xl bg-mist ring-1 ring-ink/5">
                        <div className="relative aspect-[16/9]">
                          <Img src={imageAt(b.imageUrl, 700)} alt="" className="h-full w-full object-cover" />
                          <span className="absolute left-3 top-3"><Badge tone={tone}>{label}</Badge></span>
                        </div>
                        <div className="p-4">
                          <p className="font-semibold">{b.title}</p>
                          {b.subtitle && <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{b.subtitle}</p>}
                          <p className="mt-2 text-xs text-ink-soft">
                            {b.buttonText ? `“${b.buttonText}” → ${b.buttonLink}` : "No button"}
                            {(b.startsAt || b.endsAt) && `, ${b.startsAt ? formatDate(b.startsAt) : "now"} to ${b.endsAt ? formatDate(b.endsAt) : "no end"}`}
                          </p>
                          <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink/10 pt-3">
                            <div className="w-28"><Toggle label="On" checked={b.isActive} onChange={() => toggle(b)} /></div>
                            <div className="flex gap-1">
                              <button type="button" onClick={() => setModal({ banner: b, placement })} className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-fog hover:text-ink" aria-label={`Edit ${b.title}`}><EditIcon width={17} height={17} /></button>
                              <button type="button" onClick={() => remove(b)} className="h-9 rounded-full px-3 text-xs font-semibold text-ink-soft hover:bg-oxblood/10 hover:text-oxblood">Delete</button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })
      )}
      {modal && (
        <BannerModal
          banner={modal.banner}
          placement={modal.placement}
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
