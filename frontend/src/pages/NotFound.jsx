import { ButtonLink } from "../components/ui/Button";
import { usePageTitle } from "../hooks/usePageTitle";

export default function NotFound() {
  usePageTitle("Page not found");
  return (
    <section className="bg-night text-moon">
      <div className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center px-4 py-24 text-center">
        <div>
          <h1 className="text-[clamp(2.75rem,7vw,4.5rem)]">This street doesn't lead anywhere</h1>
          <p className="mx-auto mt-5 max-w-md text-moon-soft">
            The page you were looking for has moved or never existed. Head back to the shops.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/">Go to the home page</ButtonLink>
            <ButtonLink to="/shop" variant="outline-night">
              Shop all products
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
