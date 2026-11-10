import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../api";
import { useConfirm, useToast } from "../context";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatPrice, imageAt } from "../../lib/format";
import { Img } from "../../components/ui/Img";
import { MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "../../components/ui/icons";
import { Button, ErrorBox, LoadingRows, ORDER_STATUSES, PageHeader, Panel, Select, StatusBadge, Textarea, formatDateTime, useAdminData } from "../ui";

// One order: customer, items, status changes with notes, internal notes (proposal §12).
export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { data: order, error, loading, reload, setData } = useAdminData(() => adminApi.inquiries.get(id), [id]);
  usePageTitle(order ? `Order ${order.inquiryNumber}` : "Order");

  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setNotes(order.adminNotes || "");
    }
  }, [order]);

  const updateStatus = async (e) => {
    e.preventDefault();
    if (status === order.status && !note.trim()) return;
    if (status === "CANCELLED" && !(await confirm({ title: "Cancel this order?", body: "The customer will see it as cancelled on the tracking page.", confirmText: "Cancel order", danger: true }))) return;
    setBusy("status");
    try {
      const updated = await adminApi.inquiries.setStatus(id, { status, note: note.trim() || null });
      setData(updated);
      setNote("");
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const saveNotes = async () => {
    setBusy("notes");
    try {
      const updated = await adminApi.inquiries.setNotes(id, notes.trim() || null);
      setData(updated);
      toast.success("Notes saved");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!(await confirm({ title: `Delete order ${order.inquiryNumber}?`, body: "This removes the order and its history for good. Customers will no longer be able to track it.", confirmText: "Delete order", danger: true }))) return;
    try {
      await adminApi.inquiries.remove(id);
      toast.success("Order deleted");
      navigate("/admin/orders");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading && !order) return <LoadingRows rows={6} />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!order) return null;

  return (
    <>
      <PageHeader
        back={<Link to="/admin/orders" className="mb-2 inline-block text-sm text-ink-soft hover:text-ink">← All orders</Link>}
        title={<span className="font-sans font-semibold tracking-tight tabular-nums">{order.inquiryNumber}</span>}
        description={`Placed ${formatDateTime(order.createdAt)} via ${order.channel.toLowerCase()}. Cash on delivery.`}
        actions={
          <>
            <StatusBadge status={order.status} />
            <Button size="sm" variant="outline" onClick={() => window.print()}>Print</Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="Items">
            <ul className="divide-y divide-ink/10">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  <Img src={imageAt(item.product?.images?.[0]?.url, 120)} alt="" className="h-14 w-11 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1 text-sm">
                    {item.product ? (
                      <Link to={`/admin/products/${item.product.id}`} className="font-semibold hover:underline">{item.productName}</Link>
                    ) : (
                      <span className="font-semibold">{item.productName} <span className="font-normal text-ink-soft">(product removed)</span></span>
                    )}
                    <p className="text-xs text-ink-soft">
                      {item.sku ? `Code ${item.sku}, ` : ""}
                      {formatPrice(item.unitPrice)} × {item.quantity}
                      {item.product ? `, ${item.product.stock} in stock now` : ""}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums">{formatPrice(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-baseline justify-between border-t border-ink/10 pt-3">
              <span className="font-semibold">Estimated total ({order.itemCount} item{order.itemCount === 1 ? "" : "s"})</span>
              <span className="text-2xl font-semibold tabular-nums">{formatPrice(order.estimatedTotal)}</span>
            </div>
            <p className="mt-1 text-xs text-ink-soft">Delivery charge is agreed with the customer. Stock isn't changed automatically; adjust it on the product.</p>
          </Panel>

          <Panel title="History">
            <ol className="relative space-y-4 border-l-2 border-fog-deep pl-5">
              {order.history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-mist bg-lamp" aria-hidden="true" />
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={h.status} />
                    <span className="text-xs text-ink-soft">{formatDateTime(h.createdAt)}{h.admin ? ` by ${h.admin.name}` : ""}</span>
                  </div>
                  {h.note && <p className="mt-1 text-sm">{h.note}</p>}
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Customer">
            <p className="text-lg font-semibold">{order.name}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <PhoneIcon width={16} height={16} className="text-ink-soft" />
                <a href={`tel:+${order.phone}`} className="hover:underline">+{order.phone}</a>
              </li>
              {order.email && (
                <li className="flex items-center gap-2">
                  <MailIcon width={16} height={16} className="text-ink-soft" />
                  <a href={`mailto:${order.email}`} className="hover:underline">{order.email}</a>
                </li>
              )}
              <li className="flex items-start gap-2">
                <PinIcon width={16} height={16} className="mt-0.5 shrink-0 text-ink-soft" />
                <span className="whitespace-pre-line">{order.address}{order.city ? `\n${order.city}` : ""}</span>
              </li>
            </ul>
            {order.notes && (
              <p className="mt-4 rounded-xl bg-lamp/15 p-3 text-sm">
                <span className="font-semibold">Customer note: </span>
                {order.notes}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {order.customerWhatsappUrl && (
                <a href={order.customerWhatsappUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-[#25d366] px-4 text-sm font-semibold text-night">
                  <WhatsAppIcon width={18} height={18} /> Message on WhatsApp
                </a>
              )}
              {order.customer && (
                <Link to={`/admin/customers/${order.customer.id}`} className="inline-flex h-10 items-center rounded-full border border-ink/20 px-4 text-sm font-semibold hover:border-ink">
                  {order.customer._count.inquiries} order{order.customer._count.inquiries === 1 ? "" : "s"} from this customer
                </Link>
              )}
            </div>
          </Panel>

          <Panel title="Update status" description="The customer sees the new status on the tracking page.">
            <form onSubmit={updateStatus} className="space-y-4">
              <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {ORDER_STATUSES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
              <Textarea label="Note" optional rows={2} value={note} onChange={(e) => setNote(e.target.value)} hint="Kept in the order history, e.g. who you spoke to or the courier name." />
              <Button type="submit" className="w-full" disabled={busy === "status" || (status === order.status && !note.trim())}>
                {busy === "status" ? "Saving…" : "Update status"}
              </Button>
            </form>
          </Panel>

          <Panel title="Internal notes" description="Only admins can see these.">
            <Textarea label="Notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button size="sm" variant="outline" className="mt-3" onClick={saveNotes} disabled={busy === "notes" || notes === (order.adminNotes || "")}>
              {busy === "notes" ? "Saving…" : "Save notes"}
            </Button>
          </Panel>

          <button type="button" onClick={remove} className="text-sm font-semibold text-oxblood underline underline-offset-4">
            Delete this order
          </button>
        </div>
      </div>
    </>
  );
}
