// Runs each question through the real pipeline (needs GOOGLE_GENERATIVE_AI_API_KEY) and checks
// that the expected value (from a reference query) appears in the first row of the result.
import { readFileSync } from "node:fs";
import { askQuestion } from "../lib/ask";
import { runQuery } from "../lib/db";

const qs: { q: string; ref: string }[] = JSON.parse(readFileSync(new URL("./questions.json", import.meta.url), "utf8"));
const norm = (v: unknown) => (typeof v === "number" ? String(Math.round(v * 100) / 100) : String(v).trim().toLowerCase());
let pass = 0;
for (const { q, ref } of qs) {
  const expected = norm(Object.values(runQuery(ref).rows[0])[0]);
  let ok = false, got = "";
  try {
    const r = await askQuestion(q);
    const first = r.result.rows[0] ?? {};
    got = Object.values(first).map(norm).join(" | ");
    ok = Object.values(first).map(norm).includes(expected);
  } catch (e) { got = `error: ${(e as Error).message}`; }
  if (ok) pass++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${q}  expected=${expected}  got=${got}`);
  await new Promise((r) => setTimeout(r, 9000));
}
console.log(`\nScore: ${pass}/${qs.length}`);
