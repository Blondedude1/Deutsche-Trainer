import { NextResponse } from "next/server";
import { repo } from "@/lib/db";
import { parseJson, validateImport } from "@/lib/validate";

/** POST raw JSON text. ?dry=1 only validates. */
export async function POST(req: Request) {
  const text = await req.text();
  const parsed = parseJson(text);
  if (parsed.error) return NextResponse.json({ ok: false, errors: [parsed.error], warnings: [] }, { status: 400 });
  const v = validateImport(parsed.value);
  if (!v.ok || !v.value) return NextResponse.json({ ok: false, errors: v.errors, warnings: v.warnings }, { status: 400 });
  if (new URL(req.url).searchParams.get("dry")) {
    return NextResponse.json({ ok: true, errors: [], warnings: v.warnings, summary: { vocab: v.value.vocab.length, exercises: v.value.exercises.length } });
  }
  try {
    const id = await repo().createSet(v.value);
    return NextResponse.json({ ok: true, id, warnings: v.warnings });
  } catch (e) {
    return NextResponse.json({ ok: false, errors: [`Database error: ${(e as Error).message}`], warnings: v.warnings }, { status: 500 });
  }
}
