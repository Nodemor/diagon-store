import { useState } from "react";
import { Link } from "react-router-dom";

// Filters for the shop and category pages (proposal §3 Shop page).
// Every filter lives in the URL so results can be shared and the back button works.

function Group({ title, children }) {
  return (
    <fieldset className="border-b border-ink/10 py-5 first:pt-0">
      <legend className="mb-3 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

const check = "dg-check"; // styled in index.css
const radio = "dg-radio"; // styled in index.css

function PriceRange({ min, max, onApply }) {
  const [from, setFrom] = useState(min ?? "");
  const [to, setTo] = useState(max ?? "");
  const input =
    "h-10 w-full rounded-lg border border-ink/20 bg-mist px-3 text-sm tabular-nums focus:border-ink focus:outline-none";

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(from, to);
      }}
    >
      <label className="flex-1 text-xs text-ink-soft">
        From (Rs)
        <input className={`${input} mt-1`} inputMode="numeric" value={from} onChange={(e) => setFrom(e.target.value.replace(/\D/g, ""))} placeholder="0" />
      </label>
      <label className="flex-1 text-xs text-ink-soft">
        To (Rs)
        <input className={`${input} mt-1`} inputMode="numeric" value={to} onChange={(e) => setTo(e.target.value.replace(/\D/g, ""))} placeholder="Any" />
      </label>
      <button type="submit" className="h-10 rounded-lg bg-ink px-3 text-sm font-semibold text-fog hover:bg-night-deep">
        Apply
      </button>
    </form>
  );
}

export function FilterPanel({ params, setParam, categories, currentCategory }) {
  const subcategories = currentCategory?.subcategories?.filter((s) => s.productCount > 0) || [];
  const keep = new URLSearchParams(params);
  keep.delete("subcategory");
  const keepQuery = keep.toString() ? `?${keep}` : "";

  return (
    <div className="text-ink">
      {!currentCategory && categories?.length > 0 && (
        <Group title="Category">
          <ul className="space-y-1.5 text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/category/${c.slug}${keepQuery}`} className="flex justify-between gap-2 rounded-md py-0.5 hover:text-lamp-deep">
                  <span>{c.name}</span>
                  <span className="tabular-nums text-ink-soft">{c.productCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Group>
      )}

      {currentCategory && (
        <Group title={`In ${currentCategory.name}`}>
          <div className="space-y-2 text-sm">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="radio" name="subcategory" className={radio} checked={!params.get("subcategory")} onChange={() => setParam("subcategory", null)} />
              Everything
            </label>
            {subcategories.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="radio"
                  name="subcategory"
                  className={radio}
                  checked={params.get("subcategory") === s.slug}
                  onChange={() => setParam("subcategory", s.slug)}
                />
                <span className="flex-1">{s.name}</span>
                <span className="tabular-nums text-ink-soft">{s.productCount}</span>
              </label>
            ))}
          </div>
          <Link to={`/shop${keepQuery}`} className="mt-3 inline-block text-sm text-ink-soft underline underline-offset-4 hover:text-ink">
            All categories
          </Link>
        </Group>
      )}

      <Group title="Price">
        <PriceRange
          key={`${params.get("minPrice")}-${params.get("maxPrice")}`}
          min={params.get("minPrice")}
          max={params.get("maxPrice")}
          onApply={(from, to) => setParam({ minPrice: from || null, maxPrice: to || null })}
        />
      </Group>

      <Group title="Availability">
        <div className="space-y-2 text-sm">
          {[
            [null, "All products"],
            ["in_stock", "In stock"],
            ["out_of_stock", "Out of stock"],
          ].map(([value, label]) => (
            <label key={label} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="availability"
                className={radio}
                checked={(params.get("availability") || null) === value}
                onChange={() => setParam("availability", value)}
              />
              {label}
            </label>
          ))}
        </div>
      </Group>

      <Group title="Show only">
        <div className="space-y-2 text-sm">
          {[
            ["onSale", "On offer"],
            ["newArrival", "New arrivals"],
            ["featured", "Featured"],
          ].map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                className={check}
                checked={params.get(key) === "true"}
                onChange={(e) => setParam(key, e.target.checked ? "true" : null)}
              />
              {label}
            </label>
          ))}
        </div>
      </Group>
    </div>
  );
}
