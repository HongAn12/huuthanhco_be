import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import jwt from "jsonwebtoken";
import pg from "pg";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

test("news create, update, detail, and CMS preserve sanitized Vimeo nodes", {
  skip: !testDatabaseUrl,
  timeout: 60_000,
}, async () => {
  const schemaName = `news_vimeo_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const admin = new pg.Client({ connectionString: testDatabaseUrl });
  await admin.connect();

  try {
    await admin.query(`CREATE SCHEMA ${schemaName}`);
    await admin.query(`SET search_path TO ${schemaName}, public`);
    const schemaSql = (await readFile("database/schema.sql", "utf8"))
      .replaceAll("table_schema = 'public'", `table_schema = '${schemaName}'`);
    await admin.query(schemaSql);

    const apiUrl = new URL(testDatabaseUrl!);
    apiUrl.searchParams.set("options", `-csearch_path=${schemaName},public`);
    process.env.DATABASE_URL = apiUrl.toString();
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "news-vimeo-integration-secret-32-chars";

    const [{ app }, { pool }] = await Promise.all([
      import("../src/app.js"),
      import("../src/db/pool.js"),
    ]);
    const server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    assert(address && typeof address === "object");
    const baseUrl = `http://127.0.0.1:${address.port}/api`;
    const token = jwt.sign(
      { sub: "00000000-0000-4000-8000-000000000099", role: "editor" },
      process.env.JWT_SECRET
    );
    const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
    const vimeoFigure = '<figure class="ignored" data-provider="vimeo" data-video-id="1210381764" onclick="bad()"><iframe src="https://evil.example"></iframe><figcaption>Video: Hạ thủy sà lan.</figcaption></figure>';
    const payload = {
      title: "Tin Vimeo",
      titleEn: "Vimeo news",
      slug: "tin-vimeo",
      date: "2026-07-16",
      category: "Công ty",
      categoryEn: "Company",
      thumbnail: "https://example.com/thumbnail.jpg",
      excerpt: "Mô tả",
      excerptEn: "Description",
      content: `<p>Mở đầu</p>${vimeoFigure}`,
      contentEn: "<p>Introduction</p>",
    };

    const create = await fetch(`${baseUrl}/news`, { method: "POST", headers, body: JSON.stringify(payload) });
    assert.equal(create.status, 201);
    const created = await create.json() as { id: string; content: string };
    assert.match(created.content, /class="news-video news-video--vimeo"/);
    assert.match(created.content, /data-video-id="1210381764"/);
    assert.doesNotMatch(created.content, /iframe|onclick|evil\.example/i);

    const update = await fetch(`${baseUrl}/news/${created.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ ...payload, title: "Tin Vimeo cập nhật" }),
    });
    assert.equal(update.status, 200);
    assert.match(((await update.json()) as { content: string }).content, /data-video-id="1210381764"/);

    const detail = await fetch(`${baseUrl}/news/tin-vimeo`);
    assert.equal(detail.status, 200);
    assert.match(((await detail.json()) as { content: string }).content, /data-video-id="1210381764"/);

    const cms = await fetch(`${baseUrl}/cms`);
    assert.equal(cms.status, 200);
    const cmsBody = await cms.json() as { news: Array<{ content: string }> };
    assert.match(cmsBody.news[0].content, /data-video-id="1210381764"/);

    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await pool.end();
  } finally {
    await admin.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    await admin.end();
  }
});
