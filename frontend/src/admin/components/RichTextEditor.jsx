import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";

// Minimal rich-text editor for product descriptions and content pages.
// Stores HTML; the storefront sanitises it again with DOMPurify before showing it.
const TOOLS = [
  ["bold", "B", "Bold", "font-bold"],
  ["italic", "I", "Italic", "italic"],
  ["h2", "H2", "Heading"],
  ["h3", "H3", "Subheading"],
  ["p", "¶", "Paragraph"],
  ["insertUnorderedList", "• List", "Bullet list"],
  ["insertOrderedList", "1. List", "Numbered list"],
  ["link", "Link", "Add link"],
  ["removeFormat", "Clear", "Clear formatting"],
];

export function RichTextEditor({ value, onChange, label, id, minHeight = "14rem" }) {
  const editor = useRef(null);

  // only push outside changes into the DOM (keeps the caret where it is while typing)
  useEffect(() => {
    if (editor.current && editor.current.innerHTML !== (value || "")) editor.current.innerHTML = DOMPurify.sanitize(value || "");
  }, [value]);

  const run = (command) => {
    editor.current?.focus();
    if (command === "h2" || command === "h3" || command === "p") document.execCommand("formatBlock", false, command);
    else if (command === "link") {
      const url = window.prompt("Link address (https://…)");
      if (url) document.execCommand("createLink", false, url);
    } else document.execCommand(command);
    onChange(editor.current.innerHTML);
  };

  return (
    <div>
      {label && <p id={`${id}-label`} className="mb-1.5 text-sm font-semibold">{label}</p>}
      <div className="overflow-hidden rounded-xl border border-ink/20 bg-mist focus-within:border-ink">
        <div className="flex flex-wrap gap-1 border-b border-ink/10 bg-fog/60 p-1.5" role="toolbar" aria-label="Formatting">
          {TOOLS.map(([command, text, title, cls]) => (
            <button
              key={command}
              type="button"
              title={title}
              aria-label={title}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => run(command)}
              className={`h-8 rounded-md px-2.5 text-sm hover:bg-mist ${cls || ""}`}
            >
              {text}
            </button>
          ))}
        </div>
        <div
          ref={editor}
          id={id}
          role="textbox"
          aria-multiline="true"
          aria-labelledby={label ? `${id}-label` : undefined}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange(e.currentTarget.innerHTML)}
          className="prose-shop max-w-none overflow-y-auto px-4 py-3 text-[0.95rem] focus:outline-none"
          style={{ minHeight }}
          data-lenis-prevent
        />
      </div>
    </div>
  );
}
