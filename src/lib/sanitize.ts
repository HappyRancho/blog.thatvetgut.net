import DOMPurify from "dompurify";
import { safeUrl } from "./domain";
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.nodeType !== 1) return;
  const el = node as Element;
  for (const attr of ["href", "src"])
    if (
      el.hasAttribute(attr) &&
      !safeUrl(el.getAttribute(attr) || "", attr === "src")
    )
      el.removeAttribute(attr);
  if (el.hasAttribute("class")) {
    const allowed = (el.getAttribute("class") || "")
      .split(/\s+/)
      .filter((c) =>
        [
          "clinical-alert",
          "pro-tip",
          "dosage-warning",
          "key-takeaways",
        ].includes(c),
      );
    if (allowed.length) el.setAttribute("class", allowed.join(" "));
    else el.removeAttribute("class");
  }
  if (el.tagName === "IMG") {
    el.setAttribute("loading", "lazy");
    el.setAttribute("decoding", "async");
  }
  if (el.tagName === "A") el.setAttribute("rel", "noopener noreferrer");
});
export const sanitize = (html: string) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "h2",
      "h3",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "figure",
      "img",
      "figcaption",
      "aside",
      "div",
    ],
    ALLOWED_ATTR: [
      "href",
      "src",
      "alt",
      "class",
      "scope",
      "colspan",
      "rowspan",
      "width",
      "height",
      "loading",
      "decoding",
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["style", "script", "iframe", "form"],
    FORBID_ATTR: ["style", "id"],
  });
export const plain = (html: string) =>
  DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
