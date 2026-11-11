import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { adminApi } from "../api";
import { useConfirm, useToast } from "../context";
import { usePageTitle } from "../../hooks/usePageTitle";
import { whatsappLink } from "../../lib/format";
import { MailIcon, PhoneIcon, WhatsAppIcon } from "../../components/ui/icons";
import { Badge, EmptyState, ErrorBox, LoadingRows, PageHeader, Pagination, formatDateTime, useAdminData } from "../ui";

// Messages from the Contact Us form. Opening a message marks it as read.
export default function Messages() {
  usePageTitle("Messages");
  const toast = useToast();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const unreadOnly = params.get("unread") === "true";
  const page = Number(params.get("page")) || 1;
  const [open, setOpen] = useState(null);
  const { data, error, loading, reload, setData } = useAdminData(() => adminApi.messages.list({ unread: unreadOnly || undefined, page, limit: 20 }), [unreadOnly, page]);

  const setRead = async (m, isRead) => {
    setData((d) => ({ ...d, unread: d.unread + (isRead ? -1 : 1), items: d.items.map((x) => (x.id === m.id ? { ...x, isRead } : x)) }));
    try {
      await adminApi.messages.update(m.id, { isRead });
    } catch (err) {
      toast.error(err.message);
      reload();
    }
  };

  const toggle = (m) => {
    setOpen((id) => (id === m.id ? null : m.id));
    if (!m.isRead) setRead(m, true);
  };

  const remove = async (m) => {
    if (!(await confirm({ title: `Delete the message from ${m.name}?`, confirmText: "Delete", danger: true }))) return;
    try {
      await adminApi.messages.remove(m.id);
      toast.success("Message deleted");
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const tab = (value, label) => (
    <button
      type="button"
      role="tab"
      aria-selected={unreadOnly === value}
      onClick={() => setParams(value ? { unread: "true" } : {})}
      className={`h-10 rounded-full px-4 text-sm font-semibold ${unreadOnly === value ? "bg-ink text-fog" : "text-ink-soft hover:bg-mist hover:text-ink"}`}
    >
      {label}
    </button>
  );

  return (
    <>
      <PageHeader title="Messages" description="Sent from the Contact Us page. A copy is also emailed to the business address when email is set up." />
      <div className="mb-5 flex gap-1" role="tablist" aria-label="Filter messages">
        {tab(false, "All")}
        {tab(true, `Unread${data?.unread ? ` (${data.unread})` : ""}`)}
      </div>

      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? (
        <LoadingRows />
      ) : data?.items.length === 0 ? (
        <EmptyState title={unreadOnly ? "All caught up" : "No messages yet"} text={unreadOnly ? "Every message has been read." : "Messages from the Contact Us page will appear here."} />
      ) : (
        data && (
          <>
            <ul className="space-y-2">
              {data.items.map((m) => {
                const expanded = open === m.id;
                const wa = m.phone ? whatsappLink(m.phone.replace(/^0/, "94"), `Hello ${m.name}, this is Diagon Store replying to your message.`) : null;
                return (
                  <li key={m.id} className={`rounded-2xl ring-1 ring-ink/5 ${m.isRead ? "bg-mist" : "bg-white"}`}>
                    <button type="button" onClick={() => toggle(m)} aria-expanded={expanded} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 text-left">
                      {!m.isRead && <span className="h-2.5 w-2.5 rounded-full bg-lamp" aria-label="Unread" />}
                      <span className={m.isRead ? "font-semibold" : "font-bold"}>{m.name}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">{m.subject || m.message}</span>
                      <span className="text-xs text-ink-soft">{formatDateTime(m.createdAt)}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="border-t border-ink/10 px-5 pb-5 pt-4">
                            {m.subject && <p className="font-semibold">{m.subject}</p>}
                            <p className="mt-1 whitespace-pre-line text-[0.95rem]">{m.message}</p>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              {m.email && (
                                <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "Your message to Diagon Store"}`)}`} className="inline-flex h-9 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-fog">
                                  <MailIcon width={16} height={16} /> Reply by email
                                </a>
                              )}
                              {wa && (
                                <a href={wa} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-full bg-[#25d366] px-4 text-sm font-semibold text-night">
                                  <WhatsAppIcon width={16} height={16} /> WhatsApp
                                </a>
                              )}
                              {m.phone && (
                                <a href={`tel:${m.phone}`} className="inline-flex h-9 items-center gap-2 rounded-full border border-ink/20 px-4 text-sm font-semibold">
                                  <PhoneIcon width={16} height={16} /> {m.phone}
                                </a>
                              )}
                              <span className="ml-auto flex gap-1">
                                <button type="button" onClick={() => setRead(m, !m.isRead)} className="h-9 rounded-full px-3 text-sm font-semibold hover:bg-fog">
                                  Mark as {m.isRead ? "unread" : "read"}
                                </button>
                                <button type="button" onClick={() => remove(m)} className="h-9 rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-oxblood/10 hover:text-oxblood">
                                  Delete
                                </button>
                              </span>
                            </div>
                            {m.email && <p className="mt-3 text-xs text-ink-soft">{m.email}</p>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {!m.isRead && !expanded && <span className="sr-only"><Badge>New</Badge></span>}
                  </li>
                );
              })}
            </ul>
            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={(p) => setParams({ ...(unreadOnly ? { unread: "true" } : {}), page: String(p) })} />
          </>
        )
      )}
    </>
  );
}
