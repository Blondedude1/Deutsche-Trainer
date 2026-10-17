import { NextResponse } from "next/server";
import { repo } from "@/lib/db";
import { computePoints } from "@/lib/grading";
import type { Exercise } from "@/lib/types";

/**
 * { flagged: boolean }  — "I think I was right" / dismiss a flag
 * { accept: true }      — review decision: mark correct and add my answer as an accepted variant
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { flagged?: boolean; accept?: boolean };
  const db = repo();
  const att = await db.getAttempt(id);
  if (!att) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });

  if (!body.accept) {
    return NextResponse.json({ attempt: await db.updateAttempt(id, { flagged: !!body.flagged }) });
  }

  const [ex] = await db.getExercises({ ids: [att.exercise_id] });
  if (ex) {
    const payload = learnVariant(ex, att.answer);
    if (payload) await db.updateExercisePayload(ex.id, payload);
  }
  const attempt = await db.updateAttempt(id, {
    correct: true,
    graded_by: "manual",
    error_categories: [],
    points: computePoints({ correct: true, tables_used: att.tables_used, is_retry: att.is_retry }),
  });
  return NextResponse.json({ attempt });
}

/** Return an updated payload that accepts this answer next time, or null if nothing to learn. */
function learnVariant(ex: Exercise, answer: unknown): Exercise["payload"] | null {
  const a = answer as { text?: string; blanks?: string[] };
  switch (ex.type) {
    case "translate_mn_de":
    case "error_hunt":
    case "transform":
    case "speed": {
      const t = a.text?.trim();
      if (!t) return null;
      const variants = ex.payload.accepted_variants ?? [];
      if (t === ex.payload.answer || variants.includes(t)) return null;
      return { ...ex.payload, accepted_variants: [...variants, t] };
    }
    case "fill_blank": {
      if (!a.blanks) return null;
      const blanks = ex.payload.blanks.map((acc, i) => {
        const g = a.blanks![i]?.trim();
        return g && !acc.includes(g) ? [...acc, g] : acc;
      });
      return { ...ex.payload, blanks };
    }
    default:
      return null;
  }
}
