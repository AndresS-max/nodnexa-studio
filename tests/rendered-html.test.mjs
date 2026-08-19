import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the public MVP and its complete input flow", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>NodNexa Studio — De referencia a guion<\/title>/i);
  assert.match(html, /De referencia a guion/);
  assert.match(html, /Texto de la referencia/);
  assert.match(html, /Crear mi primer guion/);
  assert.match(html, /¿Qué falta, sobra o no funciona\?/);
  assert.match(html, /Tu referencia se procesa en este navegador/);
});

test("keeps validation data separate from source content", async () => {
  const [studio, feedbackRoute, eventsRoute, schema, hosting] = await Promise.all([
    readFile(new URL("../app/studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/feedback/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/events/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);
  assert.match(studio, /workflow_started/);
  assert.match(studio, /workflow_completed/);
  assert.doesNotMatch(feedbackRoute, /reference|script/);
  assert.match(eventsRoute, /ALLOWED/);
  assert.match(schema, /sqliteTable\("feedback"/);
  assert.match(schema, /sqliteTable\("events"/);
  assert.match(hosting, /"d1": "DB"/);
});
