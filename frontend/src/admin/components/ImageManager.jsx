import { useRef, useState } from "react";
import { Reorder } from "motion/react";
import { imageAt } from "../../lib/format";
import { Img } from "../../components/ui/Img";
import { CloseIcon } from "../../components/ui/icons";
import { DragIcon, UploadIcon } from "../icons";

const MAX_MB = 5;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/**
 * Product images (proposal §5): drop or pick several files, drag to reorder
 * (first = main image), edit alt text, remove.
 *
 * Saved product: pass `images` + handlers: onUpload(files), onReorder(nextList) while dragging,
 * onReorderEnd() to save the order, onAltChange(id, text), onDelete(image).
 * New product: pass `pending` + `setPending`; files are uploaded right after the product is created.
 */
export function ImageManager({ images = [], onUpload, onReorder, onReorderEnd, onAltChange, onDelete, pending, setPending, busy }) {
  const input = useRef(null);
  const [drag, setDrag] = useState(false);
  const [problem, setProblem] = useState(null);
  const isNew = Boolean(setPending);

  const accept = (fileList) => {
    const files = [...fileList];
    const bad = files.filter((f) => !TYPES.includes(f.type) || f.size > MAX_MB * 1024 * 1024);
    const good = files.filter((f) => !bad.includes(f)).slice(0, 10);
    setProblem(bad.length ? `${bad.length} file${bad.length > 1 ? "s were" : " was"} skipped. Use JPG, PNG, WEBP, GIF or AVIF up to ${MAX_MB} MB.` : null);
    if (!good.length) return;
    if (isNew) setPending((list) => [...list, ...good.map((file) => ({ id: `${file.name}-${file.size}-${Math.random()}`, file, preview: URL.createObjectURL(file) }))]);
    else onUpload(good);
  };

  const list = isNew ? pending : images;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          accept(e.dataTransfer.files);
        }}
        className={`grid place-items-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${drag ? "border-lamp bg-lamp/10" : "border-ink/20"}`}
      >
        <UploadIcon width={28} height={28} className="text-ink-soft" />
        <p className="mt-2 text-sm">
          Drop photos here or{" "}
          <button type="button" onClick={() => input.current?.click()} className="font-semibold underline underline-offset-4" disabled={busy}>
            choose files
          </button>
        </p>
        <p className="mt-1 text-xs text-ink-soft">Up to 10 at a time, {MAX_MB} MB each. The first photo is the main image.</p>
        <input ref={input} type="file" accept={TYPES.join(",")} multiple hidden onChange={(e) => accept(e.target.files)} />
      </div>
      {problem && <p className="mt-2 text-sm text-oxblood">{problem}</p>}
      {busy && <p className="mt-2 text-sm text-ink-soft" aria-live="polite">Uploading…</p>}

      {list.length > 0 && (
        <Reorder.Group
          axis="y"
          values={list}
          onReorder={(next) => (isNew ? setPending(next) : onReorder(next))}
          className="mt-4 space-y-2"
        >
          {list.map((image, index) => (
            <Reorder.Item key={image.id} value={image} onDragEnd={() => !isNew && onReorderEnd?.()} className="flex cursor-grab items-center gap-3 rounded-xl bg-fog p-2 active:cursor-grabbing">
              <DragIcon className="shrink-0 text-ink-soft" />
              <Img src={isNew ? image.preview : imageAt(image.url, 160)} alt="" className="h-16 w-13 shrink-0 rounded-lg object-cover" draggable={false} />
              <div className="min-w-0 flex-1">
                {index === 0 && <span className="mb-1 inline-block rounded-full bg-lamp/25 px-2 py-0.5 text-[0.7rem] font-semibold text-lamp-deep">Main image</span>}
                {isNew ? (
                  <p className="truncate text-sm">{image.file.name}</p>
                ) : (
                  <label className="block text-xs text-ink-soft">
                    Alt text (describes the photo for search engines and screen readers)
                    <input
                      defaultValue={image.altText || ""}
                      onBlur={(e) => e.target.value !== (image.altText || "") && onAltChange(image.id, e.target.value)}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="mt-1 h-9 w-full rounded-lg border border-ink/15 bg-mist px-2.5 text-sm text-ink focus:border-ink focus:outline-none"
                    />
                  </label>
                )}
              </div>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => (isNew ? setPending((l) => l.filter((p) => p.id !== image.id)) : onDelete(image))}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-oxblood/10 hover:text-oxblood"
                aria-label="Remove photo"
              >
                <CloseIcon width={18} height={18} />
              </button>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}
