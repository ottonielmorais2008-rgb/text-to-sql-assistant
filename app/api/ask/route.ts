import { askQuestion, validateQuestion } from "@/lib/ask";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  let body: { question?: unknown };
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  const check = validateQuestion(body.question);
  if (!check.ok) return Response.json({ error: check.error }, { status: 400 });
  try {
    return Response.json(await askQuestion(check.question));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("ask failed:", msg);
    return Response.json({ error: `Could not answer: ${msg.slice(0, 200)}` }, { status: 422 });
  }
}
