import { useEffect, useRef, useState } from "react";
import { adminApi } from "../api";
import { CloseIcon, PlusIcon } from "../../components/ui/icons";
import { imageAt } from "../../lib/format";
import { Img } from "../../components/ui/Img";
import { UploadIcon } from "../icons";

// ---- specifications (proposal §4): rows of label / value -----------------------------------

export function SpecsEditor({ value = [], onChange }) {
  const rows = value.length ? value : [];
  const set = (i, key, v) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  const input = "h-10 w-full rounded-lg border border-ink/20 bg-mist px-3 text-sm focus:border-ink focus:outline-none";

  return (
    <div>
      {rows.length > 0 && (
        <div className="mb-3 space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
              <input className={input} placeholder="e.g. Battery" value={row.label} onChange={(e) => set(i, "label", e.target.value)} aria-label={`Specification ${i + 1} name`} />
              <input className={input} placeholder="e.g. 40 hours" value={row.value} onChange={(e) => set(i, "value", e.target.value)} aria-label={`Specification ${i + 1} value`} />
              <button type="button" onClick={() => onChange(rows.filter((_, idx) => idx !== i))} className="grid h-10 w-10 place-items-center rounded-lg text-ink-soft hover:bg-oxblood/10 hover:text-oxblood" aria-label={`Remove specification ${i + 1}`}>
                <CloseIcon width={16} height={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={() => onChange([...rows, { label: "", value: "" }])} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-lamp-deep">
        <PlusIcon width={16} height={16} /> Add specification
      </button>
    </div>
  );
}

// ---- tags (used by search) -------------------------------------------------------------------

export function TagInput({ value = [], onChange, id }) {
  const [text, setText] = useState("");
  const add = (raw) => {
    const tags = raw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (tags.length) onChange([...new Set([...value, ...tags])].slice(0, 30));
    setText("");
  };

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-ink/20 bg-mist px-2 py-1.5 focus-within:border-ink">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-ink/10 py-0.5 pl-2.5 pr-1 text-sm">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} className="grid h-5 w-5 place-items-center rounded-full hover:bg-ink/15" aria-label={`Remove tag ${tag}`}>
            <CloseIcon width={12} height={12} />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={text}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setText(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(text);
          } else if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => text && add(text)}
        placeholder={value.length ? "" : "Type a tag and press Enter"}
        className="h-8 min-w-32 flex-1 bg-transparent px-1 text-sm focus:outline-none"
      />
    </div>
  );
}

// ---- related products picker (proposal §20 "selected products") -------------------------------

export function RelatedPicker({ value = [], onChange, excludeId }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return undefined;
    }
    const t = setTimeout(() => {
      adminApi.products
        .list({ search: query.trim(), limit: 6 })
        .then((res) => setResults(res.items.filter((p) => p.id !== excludeId && !value.some((v) => v.id === p.id))))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [query, excludeId, value]);

  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {value.map((p) => (
            <li key={p.id} className="inline-flex items-center gap-1.5 rounded-full bg-ink/10 py-1 pl-3 pr-1 text-sm">
              {p.name}
              <button type="button" onClick={() => onChange(value.filter((v) => v.id !== p.id))} className="grid h-6 w-6 place-items-center rounded-full hover:bg-ink/15" aria-label={`Remove ${p.name}`}>
                <CloseIcon width={12} height={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products to add"
          aria-label="Search products to add as related"
          className="h-11 w-full rounded-xl border border-ink/20 bg-mist px-3.5 text-sm focus:border-ink focus:outline-none"
        />
        {results.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl bg-mist shadow-lg ring-1 ring-ink/10">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange([...value, { id: p.id, name: p.name }]);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-fog"
                >
                  <Img src={imageAt(p.images?.[0]?.url, 80)} alt="" className="h-9 w-8 rounded object-cover" />
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-ink-soft">{p.sku}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---- one image (category / banner): upload or paste a URL -----------------------------------------

export function SingleImageField({ value, onChange, folder, label = "Image", hint }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { url } = await adminApi.upload(folder, file);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap items-center gap-4">
        <Img src={imageAt(value, 400)} alt="" className="h-24 w-32 shrink-0 rounded-xl object-cover ring-1 ring-ink/10" />
        <div className="space-y-2">
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-full border border-ink/20 px-4 text-sm font-semibold hover:border-ink disabled:opacity-50">
            <UploadIcon width={16} height={16} /> {busy ? "Uploading…" : value ? "Replace image" : "Upload image"}
          </button>
          {value && (
            <button type="button" onClick={() => onChange(null)} className="ml-2 text-sm text-ink-soft underline underline-offset-4 hover:text-oxblood">
              Remove
            </button>
          )}
          <input ref={input} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
          {hint && <p className="text-xs text-ink-soft">{hint}</p>}
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-oxblood">{error}</p>}
    </div>
  );
}
