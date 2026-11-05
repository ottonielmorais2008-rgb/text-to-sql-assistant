import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSql } from "../lib/validate";

test("accepts simple SELECT and WITH", () => {
  assert.equal(validateSql("SELECT * FROM products").ok, true);
  assert.equal(validateSql("WITH t AS (SELECT 1 AS x) SELECT x FROM t;").ok, true);
  assert.equal(validateSql("```sql\nSELECT name FROM customers\n```").ok, true);
});
test("keywords inside string literals are fine", () => {
  assert.equal(validateSql("SELECT * FROM orders WHERE status = 'delete; drop'").ok, true);
});
for (const bad of [
  "DELETE FROM orders", "DROP TABLE products", "UPDATE products SET price = 0", "INSERT INTO orders VALUES (1)",
  "PRAGMA table_info(orders)", "ATTACH DATABASE 'x.db' AS x", "SELECT 1; DROP TABLE orders", "SELECT 1 -- hi",
  "SELECT /* x */ 1", "SELECT * FROM sqlite_master", "WITH RECURSIVE r(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM r) SELECT * FROM r",
  "SELECT 'unclosed", "", "VACUUM", "SELECT load_extension('x')", "REPLACE INTO products VALUES (1)",
]) {
  test(`rejects: ${bad || "(empty)"}`, () => assert.equal(validateSql(bad).ok, false));
}
test("rejects non-strings and long queries", () => {
  assert.equal(validateSql(42).ok, false);
  assert.equal(validateSql("SELECT " + "1,".repeat(1500) + "1").ok, false);
});
