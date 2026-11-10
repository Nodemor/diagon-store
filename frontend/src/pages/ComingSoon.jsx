import { ButtonLink } from "../components/ui/Button";
import { usePageTitle } from "../hooks/usePageTitle";

/** Placeholder for storefront pages scheduled in later phases (see docs/ROADMAP.md). */
export default function ComingSoon({ title, phase }) {
  usePageTitle(title);
  return (
    <section className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-4 py-24 text-center">
      <div>
        <h1 className="text-[clamp(2.5rem,6vw,4rem)]">{title}</h1>
        <p className="mx-auto mt-4 max-w-md text-ink-soft">
          This shop is still being fitted out{phase ? ` (roadmap phase ${phase})` : ""}. In the meantime you can browse
          everything from the home page.
        </p>
        <ButtonLink to="/" className="mt-8">
          Back to the home page
        </ButtonLink>
      </div>
    </section>
  );
}
