import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { adminApi } from "../api";
import { useAdminAuth } from "../context";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatPrice, imageAt } from "../../lib/format";
import { Img } from "../../components/ui/Img";
import { ButtonLink, ErrorBox, LoadingRows, PageHeader, Panel, StatusBadge, formatDateTime, useAdminData } from "../ui";
import { adminPath } from "../../lib/adminPath";

// Dashboard (proposal §13): store statistics, recent orders, stock alerts.

function Stat({ label, value, to, tone = "default", index }) {
  const accent = { amber: "text-lamp-deep", red: "text-oxblood", green: "text-verdigris-deep", default: "text-ink" }[tone];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.35 }}>
      <Link to={to} className="group block rounded-2xl bg-mist p-5 ring-1 ring-ink/5 transition-shadow hover:shadow-[0_14px_30px_-20px_rgb(28_34_48/0.5)]">
        <p className="text-sm text-ink-soft">{label}</p>
        <p className={`mt-1 text-4xl font-semibold tabular-nums ${accent}`}>{value}</p>
        <p className="mt-2 text-xs font-semibold text-ink-soft underline-offset-4 group-hover:underline">View</p>
      </Link>
    </motion.div>
  );
}

export default function Dashboard() {
  usePageTitle("Dashboard");
  const { admin } = useAdminAuth();
  const { data, error, loading, reload } = useAdminData(() => adminApi.dashboard(), []);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();

  return (
    <>
      <PageHeader
        title={`${greeting}, ${admin?.name?.split(" ")[0] || "there"}`}
        description="Here's what's happening in the shop."
        actions={
          <>
            <ButtonLink to={adminPath("/products/new")} size="sm">Add product</ButtonLink>
            <ButtonLink to={adminPath("/orders?status=NEW")} size="sm" variant="outline">New orders</ButtonLink>
            {data?.unreadMessages > 0 && (
              <ButtonLink to={adminPath("/messages?unread=true")} size="sm" variant="outline">
                {data.unreadMessages} unread message{data.unreadMessages === 1 ? "" : "s"}
              </ButtonLink>
            )}
          </>
        }
      />

      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? (
        <LoadingRows rows={4} />
      ) : (
        data && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {[
                ["New orders", data.inquiries.new, adminPath("/orders?status=NEW"), "amber"],
                ["Pending (contacted)", data.inquiries.pending, adminPath("/orders?status=CONTACTED")],
                ["Confirmed orders", data.inquiries.confirmed, adminPath("/orders?status=CONFIRMED")],
                ["Completed orders", data.inquiries.completed, adminPath("/orders?status=COMPLETED"), "green"],
                ["Total products", data.products.total, adminPath("/products")],
                ["Active products", data.products.active, adminPath("/products?status=ACTIVE"), "green"],
                ["Out of stock", data.products.outOfStock, adminPath("/products?stock=out"), "red"],
                ["Categories", data.totalCategories, adminPath("/categories")],
              ].map(([label, value, to, tone], i) => (
                <Stat key={label} label={label} value={value} to={to} tone={tone} index={i} />
              ))}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <Panel title="Recent orders" actions={<Link to={adminPath("/orders")} className="text-sm font-semibold underline underline-offset-4">All orders</Link>}>
                {data.recentInquiries.length === 0 ? (
                  <p className="text-sm text-ink-soft">No orders yet. They'll appear here as soon as customers send them.</p>
                ) : (
                  <ul className="divide-y divide-ink/10">
                    {data.recentInquiries.map((o) => (
                      <li key={o.id}>
                        <Link to={adminPath(`/orders/${o.id}`)} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-fog/60">
                          <span className="font-semibold tabular-nums">{o.inquiryNumber}</span>
                          <span className="min-w-0 flex-1 truncate text-sm">{o.name}</span>
                          <span className="text-sm tabular-nums">{formatPrice(o.estimatedTotal)}</span>
                          <StatusBadge status={o.status} />
                          <span className="w-full text-xs text-ink-soft sm:w-auto">{formatDateTime(o.createdAt)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel
                title="Stock alerts"
                description={`${data.products.lowStock} low on stock, ${data.products.outOfStock} out of stock`}
                actions={<Link to={adminPath("/products?stock=low")} className="text-sm font-semibold underline underline-offset-4">Manage stock</Link>}
              >
                {data.stockAlerts.length === 0 ? (
                  <p className="text-sm text-ink-soft">Everything is well stocked.</p>
                ) : (
                  <ul className="divide-y divide-ink/10">
                    {data.stockAlerts.map((p) => (
                      <li key={p.id}>
                        <Link to={adminPath(`/products/${p.id}`)} className="flex items-center gap-3 py-2.5 hover:bg-fog/60">
                          <Img src={imageAt(p.images?.[0]?.url, 120)} alt="" className="h-11 w-9 shrink-0 rounded-lg object-cover" />
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                          <span className={`text-sm font-semibold tabular-nums ${p.inStock ? "text-lamp-deep" : "text-oxblood"}`}>
                            {p.inStock ? `${p.stock} left` : "Out of stock"}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </>
        )
      )}
    </>
  );
}
