import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminApi } from "../api";
import { useConfirm, useToast } from "../context";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatPrice, imageAt } from "../../lib/format";
import { Img } from "../../components/ui/Img";
import { ButtonLink, EmptyState, ErrorBox, LoadingRows, PRODUCT_STATUSES, PageHeader, Pagination, StatusBadge, useAdminData } from "../ui";
import { EditIcon, StarIcon } from "../icons";
import { adminPath } from "../../lib/adminPath";

/** Stock cell: type a number and press Enter (or leave the field) to save. */
function StockCell({ product, onSaved }) {
  const toast = useToast();
  const [value, setValue] = useState(String(product.stock));
  const [busy, setBusy] = useState(false);
  useEffect(() => setValue(String(product.stock)), [product.stock]);

  const save = async () => {
    const stock = Number(value);
    if (!Number.isInteger(stock) || stock < 0) {
      setValue(String(product.stock));
      return;
    }
    if (stock === product.stock) return;
    setBusy(true);
    try {
      onSaved(await adminApi.products.stock(product.id, { stock }));
      toast.success(`Stock for ${product.name} set to ${stock}`);
    } catch (e) {
      toast.error(e.message);
      setValue(String(product.stock));
    } finally {
      setBusy(false);
    }
  };

  const tone = product.stockStatus === "OUT_OF_STOCK" ? "border-oxblood/50 text-oxblood" : product.stockStatus === "LOW_STOCK" ? "border-lamp text-lamp-deep" : "border-ink/15";
  return (
    <input
      aria-label={`Stock for ${product.name}`}
      inputMode="numeric"
      value={value}
      disabled={busy}
      onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
      onBlur={save}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      onClick={(e) => e.stopPropagation()}
      className={`h-9 w-20 rounded-lg border bg-mist px-2 text-center font-semibold tabular-nums focus:border-ink focus:outline-none ${tone}`}
    />
  );
}

// Product management (proposal §4, §19, §28): list, filter, quick stock edits.
export default function Products() {
  usePageTitle("Products");
  const toast = useToast();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const { data: categories } = useAdminData(() => adminApi.categories.list(), []);
  const query = Object.fromEntries([...params.entries()].filter(([, v]) => v));
  const { data, error, loading, reload, setData } = useAdminData(() => adminApi.products.list({ limit: 20, ...query }), [params.toString()]);

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("search") || "") === search.trim()) return;
      setParam("search", search.trim());
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: key === "search" });
  };

  const replace = (updated) => setData((d) => ({ ...d, items: d.items.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)) }));

  const toggleFlag = async (product, key) => {
    try {
      replace(await adminApi.products.update(product.id, { [key]: !product[key] }));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async (product) => {
    if (!(await confirm({ title: `Delete ${product.name}?`, body: "The product and its photos are removed. Past orders keep their copy of the name and price. To hide it temporarily, set it to Inactive instead.", confirmText: "Delete product", danger: true }))) return;
    try {
      await adminApi.products.remove(product.id);
      toast.success("Product deleted");
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const select = "h-11 rounded-xl border border-ink/20 bg-mist px-3 pr-8 text-sm focus:border-ink focus:outline-none";

  return (
    <>
      <PageHeader title="Products" description="Everything in the shop. Draft and inactive products are hidden from customers." actions={<ButtonLink to={adminPath("/products/new")}>Add product</ButtonLink>} />

      <div className="mb-5 flex flex-wrap gap-3">
        <label className="min-w-60 flex-1">
          <span className="sr-only">Search products</span>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, code or brand" className="h-11 w-full rounded-xl border border-ink/20 bg-mist px-4 text-sm focus:border-ink focus:outline-none" />
        </label>
        <select aria-label="Status" className={select} value={params.get("status") || ""} onChange={(e) => setParam("status", e.target.value)}>
          <option value="">All statuses</option>
          {PRODUCT_STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select aria-label="Category" className={select} value={params.get("categoryId") || ""} onChange={(e) => setParam("categoryId", e.target.value)}>
          <option value="">All categories</option>
          {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select aria-label="Stock" className={select} value={params.get("stock") || ""} onChange={(e) => setParam("stock", e.target.value)}>
          <option value="">Any stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <select aria-label="Sort" className={select} value={params.get("sort") || ""} onChange={(e) => setParam("sort", e.target.value)}>
          <option value="">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name_asc">Name A–Z</option>
          <option value="stock_asc">Lowest stock</option>
          <option value="price_asc">Price low–high</option>
          <option value="price_desc">Price high–low</option>
        </select>
      </div>

      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? (
        <LoadingRows />
      ) : data?.items.length === 0 ? (
        <EmptyState title="No products found" text={Object.keys(query).length ? "Try clearing a filter." : "Add your first product to open the shop."} action={<ButtonLink to={adminPath("/products/new")}>Add product</ButtonLink>} />
      ) : (
        data && (
          <>
            <div className="relative overflow-x-auto rounded-2xl bg-mist ring-1 ring-ink/5">
              <table className="w-full min-w-[56rem] text-sm">
                <thead>
                  <tr className="border-b border-ink/10 text-left text-xs text-ink-soft">
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 text-right font-semibold">Price</th>
                    <th className="px-4 py-3 font-semibold">Stock</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Featured / New</th>
                    <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => (
                    <tr key={p.id} className="border-b border-ink/5 last:border-0 hover:bg-fog/60">
                      <td className="px-4 py-2.5">
                        <Link to={adminPath(`/products/${p.id}`)} className="flex items-center gap-3">
                          <Img src={imageAt(p.images?.[0]?.url, 120)} alt="" className="h-12 w-10 shrink-0 rounded-lg object-cover" />
                          <span className="min-w-0">
                            <span className="block max-w-[18rem] truncate font-semibold hover:underline">{p.name}</span>
                            <span className="text-xs text-ink-soft">{p.sku || "No code"}{p.brand ? `, ${p.brand}` : ""}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-ink-soft">{p.category?.name || "—"}{p.subcategory ? ` / ${p.subcategory.name}` : ""}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        <span className="font-semibold">{formatPrice(p.finalPrice)}</span>
                        {p.onSale && <span className="block text-xs text-ink-soft line-through">{formatPrice(p.price)}</span>}
                      </td>
                      <td className="px-4 py-2.5"><StockCell product={p} onSaved={replace} /></td>
                      <td className="px-4 py-2.5"><StatusBadge status={p.status} kind="product" /></td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1.5">
                          <button type="button" onClick={() => toggleFlag(p, "isFeatured")} aria-pressed={p.isFeatured} title="Featured" className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${p.isFeatured ? "bg-lamp text-night" : "text-ink-soft hover:bg-fog"}`}>
                            <StarIcon width={17} height={17} />
                            <span className="sr-only">Featured</span>
                          </button>
                          <button type="button" onClick={() => toggleFlag(p, "isNewArrival")} aria-pressed={p.isNewArrival} title="New arrival" className={`h-9 rounded-full px-3 text-xs font-semibold transition-colors ${p.isNewArrival ? "bg-verdigris-deep text-white" : "text-ink-soft hover:bg-fog"}`}>
                            New
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          <Link to={adminPath(`/products/${p.id}`)} className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-fog hover:text-ink" aria-label={`Edit ${p.name}`}><EditIcon width={17} height={17} /></Link>
                          <button type="button" onClick={() => remove(p)} className="h-9 rounded-full px-3 text-xs font-semibold text-ink-soft hover:bg-oxblood/10 hover:text-oxblood">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={(p) => setParam("page", String(p))} />
          </>
        )
      )}
    </>
  );
}
