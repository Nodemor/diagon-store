import { useSeo } from "./useSeo";

/**
 * Simple pages: sets the title (and resets description / previews to the store defaults).
 * Pass { noindex: true } for private pages such as the cart or checkout.
 */
export function usePageTitle(title, options = {}) {
  useSeo({ title, ...options });
}
