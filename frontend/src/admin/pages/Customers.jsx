import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { adminApi } from "../api";
import { usePageTitle } from "../../hooks/usePageTitle";
import { EmptyState, ErrorBox, LoadingRows, PageHeader, Pagination, StatusBadge, formatDate, useAdminData } from "../ui";

// Customers (proposal §28 "Customer / Inquiry Management"): built from orders, keyed by mobile number.
export default function Customers() {
  usePageTitle("Customers");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const { data, error, loading, reload } = useAdminData(
    () => adminApi.customers.list({ search: params.get("search") || undefined, page: params.get("page") || 1, limit: 20 }),
    [params.toString()],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("search") || "") === search.trim()) return;
      setParams(search.trim() ? { search: search.trim() } : {}, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [search, params, setParams]);

  return (
    <>
      <PageHeader title="Customers" description="Everyone who has sent an order. A customer is recognised by their mobile number." />
      <label className="mb-5 block max-w-md">
        <span className="sr-only">Search customers</span>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, mobile or email" className="h-11 w-full rounded-xl border border-ink/20 bg-mist px-4 text-sm focus:border-ink focus:outline-none" />
      </label>
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? (
        <LoadingRows />
      ) : data?.items.length === 0 ? (
        <EmptyState title="No customers yet" text="Customers are added automatically when they send their first order." />
      ) : (
        data && (
          <>
            <div className="relative overflow-x-auto rounded-2xl bg-mist ring-1 ring-ink/5">
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="border-b border-ink/10 text-left text-xs text-ink-soft">
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Mobile</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Orders</th>
                    <th className="px-4 py-3 font-semibold">Last order</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((c) => (
                    <tr key={c.id} onClick={() => navigate(`/admin/customers/${c.id}`)} className="cursor-pointer border-b border-ink/5 last:border-0 hover:bg-fog/60">
                      <td className="px-4 py-3">
                        <Link to={`/admin/customers/${c.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold hover:underline">{c.name}</Link>
                      </td>
                      <td className="px-4 py-3 tabular-nums">+{c.phone}</td>
                      <td className="px-4 py-3 text-ink-soft">{c.email || "—"}</td>
                      <td className="px-4 py-3 tabular-nums">{c.inquiryCount}</td>
                      <td className="px-4 py-3">
                        {c.lastInquiry ? (
                          <span className="flex items-center gap-2">
                            <StatusBadge status={c.lastInquiry.status} />
                            <span className="text-ink-soft">{formatDate(c.lastInquiry.createdAt)}</span>
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={(p) => setParams({ ...Object.fromEntries(params), page: String(p) })} />
          </>
        )
      )}
    </>
  );
}
