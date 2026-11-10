import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { adminApi } from "../api";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatPrice } from "../../lib/format";
import { EmptyState, ErrorBox, LoadingRows, ORDER_STATUSES, PageHeader, Pagination, StatusBadge, formatDateTime, useAdminData } from "../ui";

// Orders / inquiries (proposal §12): filter by status, search, open an order.
export default function Orders() {
  usePageTitle("Orders");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "";
  const page = Number(params.get("page")) || 1;
  const [search, setSearch] = useState(params.get("search") || "");

  const { data: counts } = useAdminData(() => adminApi.dashboard(), []);
  const { data, error, loading, reload } = useAdminData(
    () => adminApi.inquiries.list({ status, page, limit: 20, search: params.get("search") || undefined, from: params.get("from") || undefined, to: params.get("to") || undefined }),
    [params.toString()],
  );

  // debounce search into the URL
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("search") || "") === search.trim()) return;
      const next = new URLSearchParams(params);
      if (search.trim()) next.set("search", search.trim());
      else next.delete("search");
      next.delete("page");
      setParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [search, params, setParams]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  const byStatus = counts?.inquiries?.byStatus || {};
  const totalAll = Object.values(byStatus).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader title="Orders" description="Orders and inquiries sent from the website. Payment is collected on delivery." />

      {/* status tabs */}
      <div className="no-scrollbar -mx-4 mb-5 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Order status">
        {[["", "All", totalAll], ...ORDER_STATUSES.map(([value, label]) => [value, label, byStatus[value] || 0])].map(([value, label, count]) => {
          const active = status === value;
          return (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setParam("status", value)}
              className={`flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${active ? "bg-ink text-fog" : "text-ink-soft hover:bg-mist hover:text-ink"}`}
            >
              {label}
              <span className={`rounded-full px-1.5 text-xs tabular-nums ${active ? "bg-fog/20" : "bg-ink/10"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <label className="min-w-64 flex-1">
          <span className="sr-only">Search orders</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number, name, phone or email"
            className="h-11 w-full rounded-xl border border-ink/20 bg-mist px-4 text-sm focus:border-ink focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink-soft">From</span>
          <input type="date" value={params.get("from") || ""} onChange={(e) => setParam("from", e.target.value)} className="h-11 rounded-xl border border-ink/20 bg-mist px-3 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink-soft">To</span>
          <input type="date" value={params.get("to") || ""} onChange={(e) => setParam("to", e.target.value)} className="h-11 rounded-xl border border-ink/20 bg-mist px-3 text-sm" />
        </label>
      </div>

      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? (
        <LoadingRows />
      ) : data?.items.length === 0 ? (
        <EmptyState title="No orders here" text={status || params.get("search") ? "Try another status or search." : "Orders appear here as soon as customers send them from the website."} />
      ) : (
        data && (
          <>
            <div className="relative overflow-x-auto rounded-2xl bg-mist ring-1 ring-ink/5">
              <table className="w-full min-w-[46rem] text-sm">
                <thead>
                  <tr className="border-b border-ink/10 text-left text-xs text-ink-soft">
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Items</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Sent via</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`/admin/orders/${o.id}`)}
                      className="cursor-pointer border-b border-ink/5 transition-colors last:border-0 hover:bg-fog/70"
                    >
                      <td className="px-4 py-3">
                        <Link to={`/admin/orders/${o.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold tabular-nums hover:underline">
                          {o.inquiryNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block font-semibold">{o.name}</span>
                        <span className="text-xs text-ink-soft">{o.phone}</span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{o.itemCount}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatPrice(o.estimatedTotal)}</td>
                      <td className="px-4 py-3 capitalize">{o.channel.toLowerCase()}</td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3 text-ink-soft">{formatDateTime(o.createdAt)}</td>
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
