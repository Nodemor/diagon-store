import { MinusIcon, PlusIcon } from "./icons";

/** − 2 + stepper. `tone` "fog" (light backgrounds) or "night". */
export function QuantityStepper({ value, onChange, min = 1, max = 99, label = "Quantity", size = "md", tone = "fog" }) {
  const box = size === "sm" ? "h-9" : "h-12";
  const btn = size === "sm" ? "w-9" : "w-12";
  const colors =
    tone === "night" ? "border-cobble-line text-moon" : "border-ink/20 bg-mist text-ink";

  return (
    <div className={`inline-flex items-center rounded-full border ${colors} ${box}`} role="group" aria-label={label}>
      <button
        type="button"
        className={`grid h-full ${btn} place-items-center rounded-full transition-colors hover:text-lamp-deep disabled:opacity-35`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <MinusIcon width={16} height={16} />
      </button>
      <output className="min-w-8 text-center font-semibold tabular-nums" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className={`grid h-full ${btn} place-items-center rounded-full transition-colors hover:text-lamp-deep disabled:opacity-35`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <PlusIcon width={16} height={16} />
      </button>
    </div>
  );
}
