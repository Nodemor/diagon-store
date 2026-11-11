import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { getPage } from "../services/store";
import { useAsync } from "../hooks/useAsync";
import { useSeo } from "../hooks/useSeo";
import { ButtonLink } from "../components/ui/Button";

// /pages/:slug — About, Privacy, Terms, Delivery, Returns… (proposal §27), edited in Admin → Pages.

const RELATED = [
  ["about", "About us"],
  ["delivery-information", "Delivery information"],
  ["return-policy", "Returns & refunds"],
  ["privacy-policy", "Privacy policy"],
  ["terms", "Terms & conditions"],
];

const updated = new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "long", year: "numeric" });

export default function ContentPage() {
  const { slug } = useParams();
  const { data: page, error, loading } = useAsync((signal) => getPage(slug, { signal }), [slug]);
  const html = useMemo(() => (page ? DOMPurify.sanitize(page.content) : ""), [page]);

  useSeo({
    title: page ? page.metaTitle || page.title : loading ? "Loading" : "Page not found",
    // the page body usually starts with its own heading: leave headings out of the description
    description: page?.metaDescription || page?.content?.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, " "),
    noindex: !loading && !page,
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse px-4 py-20" aria-hidden="true">
        <div className="h-12 w-2/3 rounded bg-fog-deep" />
        <div className="mt-8 space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-4 rounded bg-fog-deep" />)}
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <section className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 py-24 text-center">
        <div>
          <h1 className="text-5xl">This page isn't here</h1>
          <p className="mt-4 text-ink-soft">It may have moved. The links below the shop have everything else.</p>
          <ButtonLink to="/" className="mt-8">Go to the home page</ButtonLink>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-night text-moon">
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-14 sm:px-6">
          <nav aria-label="Breadcrumb" className="text-sm text-moon-soft">
            <Link to="/" className="hover:text-lamp">Home</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span aria-current="page" className="text-moon">{page.title}</span>
          </nav>
          <h1 className="mt-4 text-[clamp(2.6rem,6vw,4.5rem)]">{page.title}</h1>
          <p className="mt-3 text-sm text-moon-soft">Last updated {updated.format(new Date(page.updatedAt))}</p>
        </div>
      </section>

      <section className="bg-fog">
        <div className="mx-auto grid max-w-5xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_14rem]">
          <article className="prose-shop max-w-prose text-[1.05rem]" dangerouslySetInnerHTML={{ __html: html }} />
          <aside aria-label="More information" className="lg:pt-2">
            <p className="text-sm font-semibold">More information</p>
            <ul className="mt-3 space-y-2 text-sm">
              {RELATED.filter(([s]) => s !== slug).map(([s, label]) => (
                <li key={s}>
                  <Link to={`/pages/${s}`} className="text-ink-soft underline-offset-4 hover:text-ink hover:underline">{label}</Link>
                </li>
              ))}
              <li>
                <Link to="/contact" className="text-ink-soft underline-offset-4 hover:text-ink hover:underline">Contact us</Link>
              </li>
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
