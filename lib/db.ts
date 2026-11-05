import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { validateSql } from "./validate";

export const MAX_ROWS = 200;
export const TIMEOUT_MS = 2000;

let db: DatabaseSync | null = null;
function getDb(): DatabaseSync {
  if (!db) db = new DatabaseSync(path.join(process.cwd(), "data", "shop.db"), { readOnly: true });
  return db;
}

export const SCHEMA = `customers(id INTEGER PK, name TEXT, email TEXT, city TEXT, country TEXT, signup_date TEXT 'YYYY-MM-DD')
products(id INTEGER PK, name TEXT, category TEXT one of Electronics|Home|Stationery|Accessories, price REAL euros, stock INTEGER)
orders(id INTEGER PK, customer_id INTEGER FK customers.id, order_date TEXT 'YYYY-MM-DD' (all in 2026), status TEXT one of pending|shipped|delivered|cancelled)
order_items(id INTEGER PK, order_id INTEGER FK orders.id, product_id INTEGER FK products.id, quantity INTEGER, unit_price REAL euros)`;

export type QueryResult = { columns: string[]; rows: Record<string, unknown>[]; truncated: boolean };

/** Validates, then runs the query on a read-only connection with a row cap and a time budget. */
export function runQuery(sqlInput: string): QueryResult {
  const check = validateSql(sqlInput);
  if (!check.ok) throw new Error(check.error);
  const stmt = getDb().prepare(`SELECT * FROM (${check.sql}) LIMIT ${MAX_ROWS + 1}`);
  const start = Date.now();
  const rows: Record<string, unknown>[] = [];
  for (const row of stmt.iterate()) {
    if (Date.now() - start > TIMEOUT_MS) throw new Error("Query took too long.");
    rows.push(row as Record<string, unknown>);
  }
  const truncated = rows.length > MAX_ROWS;
  if (truncated) rows.length = MAX_ROWS;
  const columns = stmt.columns().map((c) => c.name);
  return { columns, rows, truncated };
}
