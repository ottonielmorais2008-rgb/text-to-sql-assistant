"use client";
import { useState } from "react";

type Res = { answer: string; sql: string; model: string; result: { columns: string[]; rows: Record<string, unknown>[]; truncated: boolean } };
const EXAMPLES = ["What are the 5 best-selling products by quantity?", "How many orders were cancelled?", "Which country has the most customers?", "What was the total revenue in October 2026?"];

export default function Home() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Res | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(question: string) {
    setLoading(true); setErr(""); setRes(null);
    try {
      const r = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }) });
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? "Request failed"); else setRes(j);
    } catch { setErr("Network error"); } finally { setLoading(false); }
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Text-to-SQL Assistant</h1>
        <p className="text-slate-600">Ask a question about a fictional online shop (customers, products, orders). The AI writes the SQL, the server checks it and runs it on a read-only database.</p>
      </header>
      <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={300} placeholder="e.g. Who are the top 3 customers by spend?" className="flex-1 rounded border border-slate-300 px-3 py-2" />
        <button disabled={loading || q.trim().length < 5} className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50">{loading ? "Thinking…" : "Ask"}</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((e) => (<button key={e} onClick={() => { setQ(e); ask(e); }} className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100">{e}</button>))}
      </div>
      {err && <p className="rounded bg-red-50 p-3 text-red-700">{err}</p>}
      {res && (
        <section className="space-y-4">
          <p className="rounded bg-white p-4 text-lg shadow-sm">{res.answer}</p>
          <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-sm text-slate-100">{res.sql}</pre>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead><tr>{res.result.columns.map((c) => <th key={c} className="border-b px-2 py-1 text-left">{c}</th>)}</tr></thead>
              <tbody>{res.result.rows.map((r, i) => (<tr key={i}>{res.result.columns.map((c) => <td key={c} className="border-b px-2 py-1">{String(r[c])}</td>)}</tr>))}</tbody>
            </table>
            {res.result.truncated && <p className="text-sm text-slate-500">Showing the first 200 rows.</p>}
          </div>
          <p className="text-xs text-slate-500">Model: {res.model}</p>
        </section>
      )}
    </main>
  );
}
