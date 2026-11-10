import { Link, useParams } from "react-router-dom";
import { adminApi } from "../api";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatPrice, whatsappLink } from "../../lib/format";
import { MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "../../components/ui/icons";
import { ErrorBox, LoadingRows, PageHeader, Panel, StatusBadge, formatDateTime, useAdminData } from "../ui";

export default function CustomerDetail() {
  const { id } = useParams();
  const { data: c, error, loading, reload } = useAdminData(() => adminApi.customers.get(id), [id]);
  usePageTitle(c ? c.name : "Customer");

  if (loading && !c) return <LoadingRows rows={5} />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!c) return null;

  const completed = c.inquiries.filter((o) => o.status === "COMPLETED");
  const spent = completed.reduce((sum, o) => sum + o.estimatedTotal, 0);
  const wa = whatsappLink(c.phone, `Hello ${c.name}, this is Diagon Store.`);

  return (
    <>
      <PageHeader
        back={<Link to="/admin/customers" className="mb-2 inline-block text-sm text-ink-soft hover:text-ink">← All customers</Link>}
        title={c.name}
        description={`Customer since ${formatDateTime(c.createdAt)}`}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
        <Panel title="Contact">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><PhoneIcon width={16} height={16} className="text-ink-soft" /><a href={`tel:+${c.phone}`} className="hover:underline">+{c.phone}</a></li>
            {c.email && <li className="flex items-center gap-2"><MailIcon width={16} height={16} className="text-ink-soft" /><a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a></li>}
            {c.address && <li className="flex items-start gap-2"><PinIcon width={16} height={16} className="mt-0.5 text-ink-soft" /><span className="whitespace-pre-line">{c.address}</span></li>}
          </ul>
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-[#25d366] px-4 text-sm font-semibold text-night">
              <WhatsAppIcon width={18} height={18} /> Message on WhatsApp
            </a>
          )}
          <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-ink/10 pt-4">
            <div><dt className="text-xs text-ink-soft">Orders</dt><dd className="text-2xl font-semibold tabular-nums">{c.inquiries.length}</dd></div>
            <div><dt className="text-xs text-ink-soft">Completed value</dt><dd className="text-2xl font-semibold tabular-nums">{formatPrice(spent)}</dd></div>
          </dl>
        </Panel>

        <Panel title="Order history">
          <ul className="divide-y divide-ink/10">
            {c.inquiries.map((o) => (
              <li key={o.id}>
                <Link to={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-fog/60">
                  <span className="font-semibold tabular-nums">{o.inquiryNumber}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">{o.items.map((i) => `${i.productName} × ${i.quantity}`).join(", ")}</span>
                  <span className="text-sm font-semibold tabular-nums">{formatPrice(o.estimatedTotal)}</span>
                  <StatusBadge status={o.status} />
                  <span className="w-full text-xs text-ink-soft">{formatDateTime(o.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
