// Cleans rich text (product descriptions, content pages) before it is saved.
// The storefront cleans it again with DOMPurify before showing it: two layers, so a
// compromised admin account or a bug in one layer can't inject scripts into the shop.
const sanitize = require("sanitize-html");

const OPTIONS = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3", "h4", "ul", "ol", "li", "a", "blockquote", "hr", "span", "div", "img"],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "width", "height"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  transformTags: {
    // links that open a new tab can't control the shop page
    a: (tagName, attribs) => ({
      tagName,
      attribs: attribs.target === "_blank" ? { ...attribs, rel: "noopener noreferrer" } : attribs,
    }),
  },
};

const sanitizeHtml = (html) => (html == null ? html : sanitize(String(html), OPTIONS));

module.exports = { sanitizeHtml };
