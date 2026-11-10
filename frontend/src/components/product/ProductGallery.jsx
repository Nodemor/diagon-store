import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { imageAt } from "../../lib/format";
import { Img } from "../ui/Img";

/**
 * Product image gallery (proposal §5): large image with hover-zoom on desktop,
 * thumbnails to switch, and a swipeable strip on touch screens.
 */
export function ProductGallery({ images = [], name, badges }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(null); // { x, y } in % while hovering
  const strip = useRef(null);
  const list = images.length ? images : [{ id: "none", url: null }];
  const current = list[Math.min(active, list.length - 1)];

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  const onStripScroll = () => {
    const el = strip.current;
    if (el) setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div>
      {/* desktop: zoomable main image */}
      <div
        className="relative hidden aspect-[4/5] cursor-zoom-in overflow-hidden rounded-[1.5rem] bg-fog-deep md:block"
        onMouseMove={onMove}
        onMouseLeave={() => setZoom(null)}
      >
        <AnimatePresence initial={false}>
          {current.url && (
            <motion.img
              key={current.id}
              src={imageAt(current.url, 1200)}
              alt={current.altText || name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out"
              style={zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          )}
        </AnimatePresence>
        {badges}
      </div>

      {/* mobile: swipe strip */}
      <div className="relative md:hidden">
        <div ref={strip} onScroll={onStripScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-[1.25rem]">
          {list.map((image, i) => (
            <div key={image.id} className="aspect-[4/5] w-full shrink-0 snap-center bg-fog-deep">
              {image.url && <Img src={imageAt(image.url, 800)} alt={image.altText || name} loading={i === 0 ? "eager" : "lazy"} className="h-full w-full object-cover" />}
            </div>
          ))}
        </div>
        {badges}
        {list.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden="true">
            {list.map((image, i) => (
              <span key={image.id} className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-ink" : "w-1.5 bg-ink/30"}`} />
            ))}
          </div>
        )}
      </div>

      {list.length > 1 && (
        <div className="mt-3 hidden grid-cols-5 gap-3 md:grid" role="group" aria-label="Product images">
          {list.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1} of ${list.length}`}
              aria-current={i === active}
              className={`aspect-square overflow-hidden rounded-xl bg-fog-deep ring-offset-2 ring-offset-fog transition ${i === active ? "ring-2 ring-ink" : "opacity-70 hover:opacity-100"}`}
            >
              {image.url && <Img src={imageAt(image.url, 200)} alt="" className="h-full w-full object-cover" loading="lazy" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
