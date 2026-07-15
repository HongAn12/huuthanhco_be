import sanitizeHtml from "sanitize-html";
import { isVimeoHash, isVimeoVideoId } from "./vimeo.js";

export const MAX_RICH_TEXT_LENGTH = 1_000_000;

/**
 * Sanitize editor HTML before it is persisted or returned by the API.
 * The allow-list covers common document formatting without permitting scripts,
 * embedded frames, inline event handlers, or unsafe URL schemes.
 */
export function sanitizeRichText(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: [
      "p", "br", "h1", "h2", "h3", "h4", "h5", "h6",
      "strong", "b", "em", "i", "u", "s", "del", "mark", "code", "pre",
      "blockquote", "ul", "ol", "li", "hr", "a", "img", "figure", "figcaption",
      "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
      "div", "span", "sub", "sup",
    ],
    allowedAttributes: {
      "*": ["class", "style"],
      a: ["href", "target", "title", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      figure: ["class", "data-provider", "data-video-id", "data-video-hash"],
      ol: ["start", "type"],
      li: ["value"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowedStyles: {
      "*": {
        "text-align": [/^(left|right|center|justify)$/],
        color: [/^#[0-9a-f]{3,8}$/i, /^rgb\([\d\s,%.]+\)$/i],
        "background-color": [/^#[0-9a-f]{3,8}$/i, /^rgb\([\d\s,%.]+\)$/i],
      },
      span: {
        "font-size": [/^(0\.75|0\.875|1|1\.125|1\.25|1\.5|2|2\.5)rem$/],
      },
      img: {
        width: [/^\d{1,4}(px|%)$/],
        height: [/^\d{1,4}(px|%)$/],
      },
    },
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: attribs.target === "_blank"
          ? { ...attribs, rel: "noopener noreferrer" }
          : attribs,
      }),
      img: (_tagName, attribs) => ({
        tagName: "img",
        attribs: { ...attribs, loading: "lazy" },
      }),
      figure: (_tagName, attribs) => {
        if (attribs["data-provider"] !== "vimeo" || !isVimeoVideoId(attribs["data-video-id"])) {
          return { tagName: "figure", attribs: { class: attribs.class ?? "" } };
        }

        const hash = attribs["data-video-hash"];
        return {
          tagName: "figure",
          attribs: {
            class: "news-video news-video--vimeo",
            "data-provider": "vimeo",
            "data-video-id": attribs["data-video-id"],
            ...(isVimeoHash(hash) ? { "data-video-hash": hash } : {}),
          },
        };
      },
    },
  }).trim();
}
