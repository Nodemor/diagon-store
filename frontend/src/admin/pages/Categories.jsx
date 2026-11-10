import { useState } from "react";
import { adminApi, fieldErrors } from "../api";
import { useConfirm, useToast } from "../context";
import { usePageTitle } from "../../hooks/usePageTitle";
import { imageAt } from "../../lib/format";
import { Img } from "../../components/ui/Img";
import { CloseIcon, PlusIcon } from "../../components/ui/icons";
import { SingleImageField } from "../components/FormParts";
import { Badge, Button, EmptyState, ErrorBox, Input, LoadingRows, Modal, PageHeader, Textarea, Toggle, useAdminData } from "../ui";
import { EditIcon } from "../icons";

// Category & subcategory management (proposal §6).

const EMPTY = { name: "", slug: "", description: "", imageUrl: null, isActive: true, sortOrder: "0", metaTitle: "", metaDescription: "" };

function CategoryModal({ category, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(() =>
    category
      ? { ...EMPTY, ...category, description: category.description || "", sortOrder: String(category.sortOrder), metaTitle: category.metaTitle || "", metaDescription: category.metaDescription || "" }
      : EMPTY,
  );
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setErrors({ name: "Give the category a name." });
    setBusy(true);
    const body = {
      name: form.name.trim(),
      slug: form.slug?.trim() || null,
      description: form.description.trim() || null,
      imageUrl: form.imageUrl || null,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
      metaTitle: form.metaTitle.trim() || null,
      metaDescription: form.metaDescription.trim() || null,
    };
    try {
      if (category) await adminApi.categories.update(category.id, body);
      else await adminApi.categories.create(body);
      toast.success(category ? "Category saved" : "Category added");
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
      title={category ? `Edit ${category.name}` : "Add category"}
      wide
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="category-form" disabled={busy}>{busy ? "Saving…" : category ? "Save category" : "Add category"}</Button>
        </>
      }
    >
      <form id="category-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Input label="Name" value={form.name} error={errors.name} onChange={(e) => set("name", e.target.value)} className="sm:col-span-2" />
        <Textarea label="Description" optional rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} className="sm:col-span-2" hint="Shown at the top of the category page." />
        <div className="sm:col-span-2">
          <SingleImageField folder="categories" value={form.imageUrl} onChange={(v) => set("imageUrl", v)} label="Shopfront image" hint="Shown in the shop window on the home page and behind the category title." />
        </div>
        <Input label="Display order" inputMode="numeric" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value.replace(/\D/g, ""))} hint="Lower numbers come first." />
        <Input label="URL name" optional value={form.slug || ""} error={errors.slug} onChange={(e) => set("slug", e.target.value)} hint={`/category/${form.slug || "made-from-the-name"}`} />
        <div className="sm:col-span-2">
          <Toggle label="Visible in the shop" description="Hidden categories and their products don't appear to customers." checked={form.isActive} onChange={(v) => set("isActive", v)} />
        </div>
        <Input label="SEO page title" optional value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} />
        <Input label="SEO description" optional value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} />
      </form>
    </Modal>
  );
}

function Subcategories({ category, onChanged }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [adding, setAdding] = useState("");
  const [editing, setEditing] = useState(null); // { id, name }

  const add = async (e) => {
    e.preventDefault();
    if (adding.trim().length < 2) return;
    try {
      await adminApi.categories.createSub(category.id, { name: adding.trim() });
      setAdding("");
      onChanged();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const rename = async (e) => {
    e.preventDefault();
    try {
      await adminApi.categories.updateSub(editing.id, { name: editing.name.trim() });
      setEditing(null);
      onChanged();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (sub) => {
    if (!(await confirm({ title: `Delete ${sub.name}?`, body: sub.productCount ? `${sub.productCount} product(s) stay in ${category.name} without a subcategory.` : undefined, confirmText: "Delete", danger: true }))) return;
    try {
      await adminApi.categories.removeSub(sub.id);
      onChanged();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {category.subcategories.map((sub) =>
        editing?.id === sub.id ? (
          <form key={sub.id} onSubmit={rename} className="flex items-center gap-1">
            <input autoFocus value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} onKeyDown={(e) => e.key === "Escape" && setEditing(null)} className="h-8 w-36 rounded-full border border-ink/30 bg-mist px-3 text-sm focus:outline-none" aria-label="Subcategory name" />
            <button type="submit" className="h-8 rounded-full bg-ink px-3 text-xs font-semibold text-fog">Save</button>
          </form>
        ) : (
          <span key={sub.id} className="group inline-flex items-center gap-1 rounded-full bg-fog py-1 pl-3 pr-1 text-sm">
            <button type="button" onClick={() => setEditing({ id: sub.id, name: sub.name })} className="hover:underline" title="Rename">
              {sub.name}
            </button>
            <span className="text-xs text-ink-soft">{sub.productCount}</span>
            <button type="button" onClick={() => remove(sub)} className="grid h-6 w-6 place-items-center rounded-full text-ink-soft hover:bg-oxblood/10 hover:text-oxblood" aria-label={`Delete ${sub.name}`}>
              <CloseIcon width={12} height={12} />
            </button>
          </span>
        ),
      )}
      <form onSubmit={add} className="flex items-center gap-1">
        <input value={adding} onChange={(e) => setAdding(e.target.value)} placeholder="New subcategory" aria-label={`New subcategory in ${category.name}`} className="h-8 w-40 rounded-full border border-dashed border-ink/30 bg-transparent px-3 text-sm focus:border-ink focus:outline-none" />
        <button type="submit" disabled={adding.trim().length < 2} className="grid h-8 w-8 place-items-center rounded-full hover:bg-fog disabled:opacity-40" aria-label="Add subcategory">
          <PlusIcon width={16} height={16} />
        </button>
      </form>
    </div>
  );
}

export default function Categories() {
  usePageTitle("Categories");
  const toast = useToast();
  const confirm = useConfirm();
  const { data, error, loading, reload, setData } = useAdminData(() => adminApi.categories.list(), []);
  const [modal, setModal] = useState(null); // null | "new" | category

  const toggleActive = async (c) => {
    setData((list) => list.map((x) => (x.id === c.id ? { ...x, isActive: !c.isActive } : x)));
    try {
      await adminApi.categories.update(c.id, { isActive: !c.isActive });
      toast.success(`${c.name} is now ${c.isActive ? "hidden" : "visible"}`);
    } catch (err) {
      toast.error(err.message);
      reload();
    }
  };

  const remove = async (c) => {
    if (!(await confirm({ title: `Delete ${c.name}?`, body: `Its subcategories are deleted too. ${c.productCount} product(s) stay in the shop without a category.`, confirmText: "Delete category", danger: true }))) return;
    try {
      await adminApi.categories.remove(c.id);
      toast.success("Category deleted");
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Categories" description="Each category is a shopfront on the home page. Add subcategories to help customers filter." actions={<Button onClick={() => setModal("new")}>Add category</Button>} />
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? (
        <LoadingRows />
      ) : data?.length === 0 ? (
        <EmptyState title="No categories yet" text="Create categories like Electronics or Fashion, then add products to them." action={<Button onClick={() => setModal("new")}>Add category</Button>} />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {data?.map((c) => (
            <li key={c.id} className={`rounded-2xl bg-mist p-5 ring-1 ring-ink/5 ${c.isActive ? "" : "opacity-70"}`}>
              <div className="flex gap-4">
                <Img src={imageAt(c.imageUrl, 240)} alt="" className="h-20 w-16 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-sans text-lg font-semibold tracking-normal">{c.name}</h2>
                    {!c.isActive && <Badge>Hidden</Badge>}
                  </div>
                  <p className="text-sm text-ink-soft">{c.productCount} product{c.productCount === 1 ? "" : "s"}, order {c.sortOrder}, /category/{c.slug}</p>
                  {c.description && <p className="mt-1 line-clamp-2 text-sm">{c.description}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button type="button" onClick={() => setModal(c)} className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-fog hover:text-ink" aria-label={`Edit ${c.name}`}>
                    <EditIcon width={17} height={17} />
                  </button>
                </div>
              </div>
              <Subcategories category={c} onChanged={reload} />
              <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3">
                <div className="w-56">
                  <Toggle label="Visible in the shop" checked={c.isActive} onChange={() => toggleActive(c)} />
                </div>
                <button type="button" onClick={() => remove(c)} className="text-sm font-semibold text-ink-soft hover:text-oxblood">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {modal && (
        <CategoryModal
          category={modal === "new" ? null : modal}
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
