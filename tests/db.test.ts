import { test } from "node:test";
import assert from "node:assert/strict";
import { runQuery, MAX_ROWS } from "../lib/db";
import { validateQuestion } from "../lib/ask";

test("counts seeded rows", () => {
  assert.equal(runQuery("SELECT COUNT(*) AS n FROM customers").rows[0].n, 60);
  assert.equal(runQuery("SELECT COUNT(*) AS n FROM order_items").rows[0].n, 306);
});
test("caps rows at MAX_ROWS", () => {
  const r = runQuery("SELECT * FROM order_items");
  assert.equal(r.rows.length, MAX_ROWS);
  assert.equal(r.truncated, true);
  assert.ok(r.columns.includes("quantity"));
});
test("refuses writes before reaching the database", () => {
  assert.throws(() => runQuery("DELETE FROM orders"));
});
test("connection itself is read-only", async () => {
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync("data/shop.db", { readOnly: true });
  assert.throws(() => db.exec("DELETE FROM orders"));
});
test("question limits", () => {
  assert.equal(validateQuestion("hi").ok, false);
  assert.equal(validateQuestion("x".repeat(301)).ok, false);
  assert.equal(validateQuestion("How many customers?").ok, true);
});
