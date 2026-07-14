import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { newsSchema } from "../src/validators.js";

function parseContent(content: string) {
  return newsSchema.parse({
    id: randomUUID(),
    title: "Tiêu đề",
    titleEn: "Title",
    slug: "tieu-de",
    date: "2026-07-14",
    category: "Công ty",
    categoryEn: "Company",
    thumbnail: "https://example.com/thumbnail.jpg",
    content,
  }).content;
}

test("preserves professional rich-text formatting", () => {
  const content = parseContent(
    '<h2 style="text-align:center">Heading</h2><p><strong>Bold</strong></p>' +
    '<ul><li>Item</li></ul><table><tbody><tr><td>Cell</td></tr></tbody></table>'
  );

  assert.match(content, /<h2 style="text-align:center">/);
  assert.match(content, /<strong>Bold<\/strong>/);
  assert.match(content, /<table>/);
});

test("removes scripts, event handlers, iframes, and unsafe URLs", () => {
  const content = parseContent(
    '<script>alert(1)</script><p onclick="steal()">Safe</p>' +
    '<a href="javascript:alert(1)">bad link</a><iframe src="https://evil.example"></iframe>'
  );

  assert.doesNotMatch(content, /script|onclick|javascript:|iframe/i);
  assert.match(content, /<p>Safe<\/p>/);
});

test("hardens external links and lazy-loads images", () => {
  const content = parseContent(
    '<a href="https://example.com" target="_blank">Link</a>' +
    '<img src="https://example.com/image.jpg" alt="Image">'
  );

  assert.match(content, /rel="noopener noreferrer"/);
  assert.match(content, /loading="lazy"/);
});
