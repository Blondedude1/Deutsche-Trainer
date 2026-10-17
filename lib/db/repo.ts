import type { Attempt, Exercise, ExerciseSet, ImportInput, NewAttempt, Vocab } from "../types";

export interface AttemptQuery {
  /** ISO timestamp; only attempts at or after it. */
  since?: string;
  /** Newest N attempts. */
  limit?: number;
  flagged?: boolean;
}

export interface Repo {
  listSets(): Promise<(ExerciseSet & { exercise_count: number })[]>;
  getSet(id: string): Promise<ExerciseSet | null>;
  /** All exercises, or those of one set (ordered by position), or by ids. */
  getExercises(filter?: { setId?: string; ids?: string[] }): Promise<Exercise[]>;
  getVocab(setIds?: string[]): Promise<Vocab[]>;
  createSet(input: ImportInput): Promise<string>;
  deleteSet(id: string): Promise<void>;
  updateExercisePayload(id: string, payload: Exercise["payload"]): Promise<void>;
  insertAttempt(a: NewAttempt): Promise<Attempt>;
  updateAttempt(id: string, patch: Partial<NewAttempt>): Promise<Attempt>;
  getAttempt(id: string): Promise<Attempt | null>;
  /** Newest first. */
  getAttempts(q?: AttemptQuery): Promise<Attempt[]>;
}
