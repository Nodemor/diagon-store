import { useState } from "react";

/**
 * <img> that never shows a broken-image icon. If the photo is missing or fails to load
 * (deleted upload, offline image host...), a quiet placeholder with the lamp mark is shown.
 */
export function Img({ src, alt = "", className = "", ...props }) {
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`grid place-items-center bg-fog-deep text-ink-soft/40 ${className}`}
      >
        <svg width="34" height="34" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M12 7h8l-1.2 7h-5.6L12 7Z" fill="currentColor" />
          <path d="M11 7h10M16 3.5V7M14 14l-.6 2h5.2L18 14M16 16v13M12.5 29h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailedSrc(src)} {...props} />;
}
