import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { pool } from "../src/db/pool.js";

test("Vimeo normalize endpoint enforces authentication and content permission", async () => {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert(address && typeof address === "object");
  const endpoint = `http://127.0.0.1:${address.port}/api/media/vimeo/normalize`;

  const request = (token?: string, url = "https://vimeo.com/1210381764") => fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ url }),
  });

  try {
    assert.equal((await request()).status, 401);

    const viewerToken = jwt.sign({ sub: "viewer-id", role: "viewer" }, env.jwtSecret);
    assert.equal((await request(viewerToken)).status, 403);

    const editorToken = jwt.sign({ sub: "editor-id", role: "editor" }, env.jwtSecret);
    const valid = await request(editorToken);
    assert.equal(valid.status, 200);
    assert.deepEqual(await valid.json(), {
      provider: "vimeo",
      videoId: "1210381764",
      playerUrl: "https://player.vimeo.com/video/1210381764",
    });

    assert.equal((await request(editorToken, "https://example.com/1210381764")).status, 400);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())
    );
    await pool.end();
  }
});
