export const MAX_SQL_CHARS = 2000;

const FORBIDDEN = [
  "insert", "update", "delete", "drop", "alter", "create", "replace", "truncate",
  "attach", "detach", "pragma", "vacuum", "reindex", "analyze", "begin", "commit",
  "rollback", "savepoint", "release", "recursive", "load_extension", "randomblob", "zeroblob",
];

export type SqlCheck = { ok: true; sql: string } | { ok: false; error: string };

/** Removes the contents of string literals and quoted identifiers so keyword checks only see SQL code. */
function stripLiterals(sql: string): string {
  return sql.replace(/'(?:[^']|'')*'/g, "''").replace(/"(?:[^"]|"")*"/g, '""').replace(/`[^`]*`/g, "``").replace(/\[[^\]]*\]/g, "[]");
}

export function validateSql(input: unknown): SqlCheck {
  if (typeof input !== "string") return { ok: false, error: "SQL must be a string." };
  let sql = input.trim().replace(/^```(?:sql)?\s*/i, "").replace(/\s*```$/, "").trim();
  if (!sql) return { ok: false, error: "Empty query." };
  if (sql.length > MAX_SQL_CHARS) return { ok: false, error: "Query is too long." };
  sql = sql.replace(/;\s*$/, "");
  const code = stripLiterals(sql);
  if (/'|"/.test(code.replace(/''|""/g, ""))) return { ok: false, error: "Unbalanced quotes." };
  if (code.includes(";")) return { ok: false, error: "Only one statement is allowed." };
  if (code.includes("--") || code.includes("/*")) return { ok: false, error: "Comments are not allowed." };
  const lower = code.toLowerCase();
  if (!/^(select|with)\b/.test(lower)) return { ok: false, error: "Only SELECT queries are allowed." };
  for (const word of FORBIDDEN) {
    if (new RegExp(`\\b${word}\\b`).test(lower)) return { ok: false, error: `Keyword not allowed: ${word.toUpperCase()}` };
  }
  if (/\bsqlite_\w*/.test(lower)) return { ok: false, error: "System tables are not allowed." };
  return { ok: true, sql };
}
