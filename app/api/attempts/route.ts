import { NextResponse } from "next/server";
import { repo } from "@/lib/db";
import { computePoints, grade } from "@/lib/grading";
import type { Answer } from "@/lib/types";

interface Body {
  exercise_id: string;
  answer: Answer;
  tables_used?: boolean;
  tables_opened?: string[];
  seconds_taken?: number;
  over_time?: boolean;
  is_retry?: boolean;
  umlautEquivalence?: boolean;
}

/** Grade an answer, score it and store the attempt. */
export async function POST(req: Request) {
  const b = (await req.json()) as Body;
  const db = repo();
  const [ex] = await db.getExercises({ ids: [b.exercise_id] });
  if (!ex) return NextResponse.json({ error: "Exercise not found" }, { status: 404 });

  const result = await grade(ex, b.answer, { umlautEquivalence: b.umlautEquivalence ?? true });
  const tables_used = !!b.tables_used;
  const is_retry = !!b.is_retry;
  const points = computePoints({
    correct: result.correct,
    tables_used,
    is_retry,
    overTime: ex.type === "speed" && !!b.over_time,
  });
  const attempt = await db.insertAttempt({
    exercise_id: ex.id,
    answer: b.answer,
    correct: result.correct,
    points,
    tables_used,
    tables_opened: b.tables_opened ?? [],
    error_categories: result.error_categories,
    seconds_taken: b.seconds_taken ?? null,
    graded_by: result.graded_by,
    flagged: false,
    is_retry,
  });
  return NextResponse.json({ attempt, result });
}
