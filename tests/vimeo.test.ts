import assert from "node:assert/strict";
import test from "node:test";
import { normalizeVimeoUrl } from "../src/lib/vimeo.js";

test("normalizes public Vimeo URLs", () => {
  assert.deepEqual(normalizeVimeoUrl("https://vimeo.com/123456789"), {
    provider: "vimeo",
    videoId: "123456789",
    playerUrl: "https://player.vimeo.com/video/123456789",
  });
});

test("normalizes unlisted and player Vimeo URLs", () => {
  assert.deepEqual(normalizeVimeoUrl("https://vimeo.com/123456789/abcDEF12"), {
    provider: "vimeo",
    videoId: "123456789",
    hash: "abcDEF12",
    playerUrl: "https://player.vimeo.com/video/123456789?h=abcDEF12",
  });
  assert.equal(
    normalizeVimeoUrl("https://player.vimeo.com/video/123456789?h=abcDEF12").videoId,
    "123456789"
  );
});

test("rejects non-Vimeo and malformed URLs", () => {
  assert.throws(() => normalizeVimeoUrl("https://example.com/123456789"), /Vimeo/);
  assert.throws(() => normalizeVimeoUrl("https://vimeo.com/not-a-video"), /Vimeo/);
});
