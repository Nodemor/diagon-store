import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { adminApi } from "../api";
import { useConfirm, useToast } from "../context";
import { usePageTitle } from "../../hooks/usePageTitle";
import { RichTextEditor } from "../components/RichTextEditor";
import { Button, ErrorBox, Input, LoadingRows, PageHeader, Panel, Textarea, Toggle, useAdminData } from "../ui";

export default function PageEditor() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, error, loading } = useAdminData(
    () => adminApi.pages.get(slug).catch((err) => (err.status === 404 ? null : Promise.reject(err))),
    [slug],
  );
  const [form, setForm] = useState({ title: params.get("title") || "", content: "", metaTitle: "", metaDescription: "", isPublished: true });
  const [busy, setBusy] = useState(false);
  const isNew = !loading && !data;
  usePageTitle(form.title || "Page");

  useEffect(() => {
    if (data) setForm({ title: data.title, content: data.content, metaTitle: data.metaTitle || "", metaDescription: data.metaDescription || "", isPublished: data.isPublished });
  }, [data]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Add a title.");
    setBusy(true);
    try {
      await adminApi.pages.save(slug, {
        title: form.title.trim(),
        content: form.content || "",
        metaTitle: form.metaTitle.trim() || null,
        metaDescription: form.metaDescription.trim() || null,
        isPublished: form.isPublished,
      });
      toast.success("Page saved");
      if (isNew) navigate(`/admin/pages/${slug}`, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!(await confirm({ title: `Delete “${form.title}”?`, body: "Links to this page will show “page not found”.", confirmText: "Delete page", danger: true }))) return;
    try {
      await adminApi.pages.remove(slug);
      toast.success("Page deleted");
      navigate("/admin/pages");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <LoadingRows rows={6} />;
  if (error) return <ErrorBox error={error} />;

  return (
    <>
      <PageHeader
        back={<Link to="/admin/pages" className="mb-2 inline-block text-sm text-ink-soft hover:text-ink">← All pages</Link>}
        title={form.title || "New page"}
        description={`Address: /pages/${slug}`}
        actions={!isNew && <a href={`/pages/${slug}`} target="_blank" rel="noreferrer" className="text-sm font-semibold underline underline-offset-4">View page</a>}
      />
      <form onSubmit={save} className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Panel>
            <Input label="Title" value={form.title} onChange={(e) => set("title", e.target.value)} />
            <div className="mt-5">
              <RichTextEditor id="page-content" label="Content" value={form.content} onChange={(v) => set("content", v)} minHeight="22rem" />
            </div>
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Publish">
            <Toggle label="Visible on the website" checked={form.isPublished} onChange={(v) => set("isPublished", v)} />
            <Button type="submit" className="mt-5 w-full" disabled={busy}>{busy ? "Saving…" : "Save page"}</Button>
          </Panel>
          <Panel title="Search engines">
            <div className="space-y-4">
              <Input label="Page title" optional value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} />
              <Textarea label="Meta description" optional rows={3} value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} />
            </div>
          </Panel>
          {!isNew && <button type="button" onClick={remove} className="text-sm font-semibold text-oxblood underline underline-offset-4">Delete this page</button>}
        </div>
      </form>
    </>
  );
}
