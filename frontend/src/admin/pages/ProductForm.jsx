import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminApi, fieldErrors } from "../api";
import { useConfirm, useToast } from "../context";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatPrice } from "../../lib/format";
import { ImageManager } from "../components/ImageManager";
import { RelatedPicker, SpecsEditor, TagInput } from "../components/FormParts";
import { RichTextEditor } from "../components/RichTextEditor";
import { Button, ErrorBox, Input, LoadingRows, PRODUCT_STATUSES, PageHeader, Panel, Select, StatusBadge, Textarea, Toggle, useAdminData } from "../ui";
import { adminPath } from "../../lib/adminPath";

// Add / edit product (proposal §4, §5, §16–§20, §29 "Product Addition Workflow").

const EMPTY = {
  name: "",
  slug: "",
  sku: "",
  brand: "",
  categoryId: "",
  subcategoryId: "",
  shortDescription: "",
  description: "",
  price: "",
  salePrice: "",
  stock: "0",
  lowStockThreshold: "5",
  status: "ACTIVE",
  specifications: [],
  tags: [],
  isFeatured: false,
  isNewArrival: true,
  related: [],
  metaTitle: "",
  metaDescription: "",
};

const fromProduct = (p) => ({
  name: p.name,
  slug: p.slug,
  sku: p.sku || "",
  brand: p.brand || "",
  categoryId: p.categoryId ? String(p.categoryId) : "",
  subcategoryId: p.subcategoryId ? String(p.subcategoryId) : "",
  shortDescription: p.shortDescription || "",
  description: p.description || "",
  price: String(p.price),
  salePrice: p.salePrice != null ? String(p.salePrice) : "",
  stock: String(p.stock),
  lowStockThreshold: String(p.lowStockThreshold),
  status: p.status,
  specifications: p.specifications || [],
  tags: p.tags || [],
  isFeatured: p.isFeatured,
  isNewArrival: p.isNewArrival,
  related: p.relatedProducts || [],
  metaTitle: p.metaTitle || "",
  metaDescription: p.metaDescription || "",
});

const toPayload = (f) => ({
  name: f.name.trim(),
  slug: f.slug.trim() || null,
  sku: f.sku.trim() || null,
  brand: f.brand.trim() || null,
  categoryId: f.categoryId ? Number(f.categoryId) : null,
  subcategoryId: f.subcategoryId ? Number(f.subcategoryId) : null,
  shortDescription: f.shortDescription.trim() || null,
  description: f.description && f.description !== "<br>" ? f.description : null,
  price: Number(f.price || 0),
  salePrice: f.salePrice === "" ? null : Number(f.salePrice),
  stock: Number(f.stock || 0),
  lowStockThreshold: Number(f.lowStockThreshold || 0),
  status: f.status,
  specifications: f.specifications.filter((s) => s.label.trim() && s.value.trim()).map((s) => ({ label: s.label.trim(), value: s.value.trim() })),
  tags: f.tags,
  isFeatured: f.isFeatured,
  isNewArrival: f.isNewArrival,
  relatedProductIds: f.related.map((r) => r.id),
  metaTitle: f.metaTitle.trim() || null,
  metaDescription: f.metaDescription.trim() || null,
});

export default function ProductForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const { data: categories } = useAdminData(() => adminApi.categories.list(), []);
  const { data: product, error: loadError, loading } = useAdminData(() => (isNew ? Promise.resolve(null) : adminApi.products.get(id)), [id]);

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [images, setImages] = useState([]);
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const [pending, setPending] = useState([]);
  const [uploading, setUploading] = useState(false);

  usePageTitle(isNew ? "Add product" : product ? `Edit ${product.name}` : "Edit product");

  useEffect(() => {
    if (product) {
      setForm(fromProduct(product));
      setImages(product.images);
      setDirty(false);
    }
  }, [product]);

  // warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return undefined;
    const onUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const bind = (key) => ({ value: form[key], onChange: (e) => set(key, e.target.value), error: errors[key] });

  const category = categories?.find((c) => String(c.id) === form.categoryId);
  const price = Number(form.price) || 0;
  const sale = form.salePrice === "" ? null : Number(form.salePrice);
  const discount = sale != null && price > 0 && sale < price ? Math.round((1 - sale / price) * 100) : 0;

  const setDiscount = (percent) => {
    const p = Number(percent);
    if (!price || !p) return set("salePrice", "");
    set("salePrice", String(Math.round(price * (1 - Math.min(95, Math.max(1, p)) / 100))));
  };

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = "Give the product a name.";
    if (!(Number(form.price) >= 0) || form.price === "") e.price = "Enter the regular price.";
    if (sale != null && sale >= price) e.salePrice = "The sale price must be lower than the regular price.";
    if (!(Number(form.stock) >= 0)) e.stock = "Enter the stock quantity (0 or more).";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const save = async (statusOverride) => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    const payload = toPayload({ ...form, status: statusOverride || form.status });
    setSaving(statusOverride || "save");
    try {
      if (isNew) {
        const created = await adminApi.products.create(payload);
        if (pending.length) {
          try {
            await adminApi.products.uploadImages(created.id, pending.map((p) => p.file));
          } catch (err) {
            toast.error(`Product saved, but the photos didn't upload: ${err.message}`);
          }
        }
        setDirty(false);
        toast.success(payload.status === "ACTIVE" ? "Product published. It's live in the shop." : "Draft saved");
        navigate(adminPath(`/products/${created.id}`), { replace: true });
      } else {
        const updated = await adminApi.products.update(id, payload);
        setForm(fromProduct(updated));
        setDirty(false);
        toast.success("Changes saved");
      }
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  };

  const remove = async () => {
    if (!(await confirm({ title: `Delete ${product.name}?`, body: "The product and its photos are removed for good. To hide it for now, set the status to Inactive.", confirmText: "Delete product", danger: true }))) return;
    try {
      await adminApi.products.remove(id);
      toast.success("Product deleted");
      navigate(adminPath("/products"));
    } catch (err) {
      toast.error(err.message);
    }
  };

  // image handlers (saved product)
  const imageHandlers = useMemo(
    () => ({
      onUpload: async (files) => {
        setUploading(true);
        try {
          setImages(await adminApi.products.uploadImages(id, files));
          toast.success(`${files.length} photo${files.length > 1 ? "s" : ""} added`);
        } catch (err) {
          toast.error(err.message);
        } finally {
          setUploading(false);
        }
      },
      onReorder: (next) => setImages(next),
      onReorderEnd: async () => {
        try {
          setImages(await adminApi.products.reorderImages(id, imagesRef.current.map((i) => i.id)));
        } catch (err) {
          toast.error(err.message);
        }
      },
      onAltChange: async (imageId, altText) => {
        try {
          setImages(await adminApi.products.updateImage(id, imageId, { altText }));
        } catch (err) {
          toast.error(err.message);
        }
      },
      onDelete: async (image) => {
        if (!(await confirm({ title: "Remove this photo?", confirmText: "Remove", danger: true }))) return;
        try {
          setImages(await adminApi.products.deleteImage(id, image.id));
        } catch (err) {
          toast.error(err.message);
        }
      },
    }),
    [id, toast, confirm],
  );

  if (!isNew && loading && !product) return <LoadingRows rows={8} />;
  if (loadError) return <ErrorBox error={loadError} />;

  return (
    <>
      <PageHeader
        back={<Link to={adminPath("/products")} className="mb-2 inline-block text-sm text-ink-soft hover:text-ink">← All products</Link>}
        title={isNew ? "Add product" : form.name || "Edit product"}
        description={isNew ? "Fill in the details, add photos, then publish. It appears in the shop straight away." : undefined}
        actions={
          !isNew && (
            <>
              <StatusBadge status={form.status} kind="product" />
              {product?.slug && (
                <a href={`/product/${product.slug}`} target="_blank" rel="noreferrer" className="text-sm font-semibold underline underline-offset-4">
                  View in shop
                </a>
              )}
            </>
          )
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        noValidate
        className="grid gap-6 xl:grid-cols-[1fr_22rem]"
      >
        <div className="min-w-0 space-y-6">
          <Panel title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Product name" className="sm:col-span-2" {...bind("name")} required />
              <Input label="Product code / SKU" optional hint="e.g. DS-1001. Shown to customers and in WhatsApp messages." {...bind("sku")} />
              <Input label="Brand" optional {...bind("brand")} />
              <Textarea label="Short description" optional rows={2} className="sm:col-span-2" hint="One or two sentences shown near the price." {...bind("shortDescription")} />
            </div>
          </Panel>

          <Panel title="Description">
            <RichTextEditor id="product-description" value={form.description} onChange={(html) => set("description", html)} />
          </Panel>

          <Panel title="Photos" description="Customers can browse all photos on the product page.">
            {isNew ? (
              <ImageManager pending={pending} setPending={(u) => { setPending(u); setDirty(true); }} />
            ) : (
              <ImageManager images={images} busy={uploading} {...imageHandlers} />
            )}
          </Panel>

          <Panel title="Specifications" description="Shown as a table on the product page.">
            <SpecsEditor value={form.specifications} onChange={(v) => set("specifications", v)} />
          </Panel>

          <Panel title="Related products" description="Hand-picked suggestions shown first under “You may also like”. The rest are filled in from the same category.">
            <RelatedPicker value={form.related} onChange={(v) => set("related", v)} excludeId={product?.id} />
          </Panel>

          <Panel title="Search engines" description="Optional. Leave empty to use the product name and short description.">
            <div className="grid gap-4">
              <Input label="Page title" optional {...bind("metaTitle")} />
              <Textarea label="Meta description" optional rows={2} hint={`${form.metaDescription.length}/300 characters`} {...bind("metaDescription")} />
              <Input label="URL name" optional hint={`Shop address: /product/${form.slug || "made-from-the-name"}`} {...bind("slug")} />
            </div>
          </Panel>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Panel title={isNew ? "Publish" : "Status"}>
            <div className="space-y-4">
              {!isNew && (
                <Select label="Product status" {...bind("status")} hint="Draft and inactive products are hidden. Out of stock products are shown but can't be ordered.">
                  {PRODUCT_STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              )}
              <Toggle label="Featured" description="Shown in “Featured this week” on the home page." checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} />
              <Toggle label="New arrival" description="Shown in “Just arrived” with a New badge." checked={form.isNewArrival} onChange={(v) => set("isNewArrival", v)} />
              {isNew ? (
                <div className="grid gap-2 pt-2">
                  <Button type="button" onClick={() => save("ACTIVE")} disabled={Boolean(saving)}>{saving === "ACTIVE" ? "Publishing…" : "Publish product"}</Button>
                  <Button type="button" variant="outline" onClick={() => save("DRAFT")} disabled={Boolean(saving)}>{saving === "DRAFT" ? "Saving…" : "Save as draft"}</Button>
                </div>
              ) : (
                <Button type="submit" className="w-full" disabled={Boolean(saving) || !dirty}>{saving ? "Saving…" : dirty ? "Save changes" : "All changes saved"}</Button>
              )}
            </div>
          </Panel>

          <Panel title="Pricing">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Regular price (Rs)" inputMode="decimal" className="col-span-2" {...bind("price")} onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))} />
              <Input label="Sale price (Rs)" optional inputMode="decimal" {...bind("salePrice")} onChange={(e) => set("salePrice", e.target.value.replace(/[^\d.]/g, ""))} />
              <Input label="Discount %" optional inputMode="numeric" value={discount || ""} onChange={(e) => setDiscount(e.target.value.replace(/\D/g, ""))} />
            </div>
            {discount > 0 && (
              <p className="mt-3 rounded-xl bg-oxblood/10 p-3 text-sm text-oxblood">
                Customers see <s>{formatPrice(price)}</s> <strong>{formatPrice(sale)}</strong>, {discount}% off.
              </p>
            )}
          </Panel>

          <Panel title="Stock">
            <div className="grid grid-cols-2 gap-4">
              <Input label="In stock" inputMode="numeric" {...bind("stock")} onChange={(e) => set("stock", e.target.value.replace(/\D/g, ""))} />
              <Input label="Low stock alert at" inputMode="numeric" {...bind("lowStockThreshold")} onChange={(e) => set("lowStockThreshold", e.target.value.replace(/\D/g, ""))} />
            </div>
          </Panel>

          <Panel title="Organisation">
            <div className="grid gap-4">
              <Select label="Category" value={form.categoryId} error={errors.categoryId} onChange={(e) => { set("categoryId", e.target.value); set("subcategoryId", ""); }}>
                <option value="">No category</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}{c.isActive ? "" : " (hidden)"}</option>)}
              </Select>
              <Select label="Subcategory" value={form.subcategoryId} error={errors.subcategoryId} onChange={(e) => set("subcategoryId", e.target.value)} disabled={!category?.subcategories?.length}>
                <option value="">{category?.subcategories?.length ? "None" : "Choose a category first"}</option>
                {category?.subcategories?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <div>
                <label htmlFor="product-tags" className="mb-1.5 block text-sm font-semibold">Tags</label>
                <TagInput id="product-tags" value={form.tags} onChange={(v) => set("tags", v)} />
                <p className="mt-1.5 text-xs text-ink-soft">Extra words customers might search for, e.g. “bluetooth, wireless”.</p>
              </div>
            </div>
          </Panel>

          {!isNew && (
            <button type="button" onClick={remove} className="text-sm font-semibold text-oxblood underline underline-offset-4">
              Delete this product
            </button>
          )}
        </div>
      </form>
    </>
  );
}
