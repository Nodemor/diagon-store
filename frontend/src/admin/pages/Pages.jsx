import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi } from "../api";
import { usePageTitle } from "../../hooks/usePageTitle";
import { slugifyText } from "../util";
import { Badge, Button, EmptyState, ErrorBox, Input, LoadingRows, Modal, PageHeader, formatDateTime, useAdminData } from "../ui";
import { adminPath } from "../../lib/adminPath";

// Content pages (proposal §26–§27): About, Privacy, Terms, Delivery, Returns…
export default function Pages() {
  usePageTitle("Pages");
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAdminData(() => adminApi.pages.list(), []);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  return (
    <>
      <PageHeader title="Pages" description="Information pages linked from the footer. Edit the text any time." actions={<Button onClick={() => setAdding(true)}>Add page</Button>} />
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? (
        <LoadingRows />
      ) : data?.length === 0 ? (
        <EmptyState title="No pages yet" action={<Button onClick={() => setAdding(true)}>Add page</Button>} />
      ) : (
        <ul className="divide-y divide-ink/10 rounded-2xl bg-mist ring-1 ring-ink/5">
          {data?.map((p) => (
            <li key={p.id}>
              <Link to={adminPath(`/pages/${p.slug}`)} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 hover:bg-fog/60">
                <span className="font-semibold">{p.title}</span>
                <span className="text-sm text-ink-soft">/pages/{p.slug}</span>
                {!p.isPublished && <Badge>Hidden</Badge>}
                <span className="ml-auto text-xs text-ink-soft">Updated {formatDateTime(p.updatedAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add page"
        footer={
          <>
            <Button variant="quiet" onClick={() => setAdding(false)}>Cancel</Button>
            <Button disabled={title.trim().length < 2} onClick={() => navigate(adminPath(`/pages/${slugifyText(title)}?title=${encodeURIComponent(title.trim())}`))}>
              Continue
            </Button>
          </>
        }
      >
        <Input label="Page title" value={title} onChange={(e) => setTitle(e.target.value)} hint={title ? `Address: /pages/${slugifyText(title)}` : "e.g. Warranty information"} autoFocus />
      </Modal>
    </>
  );
}
