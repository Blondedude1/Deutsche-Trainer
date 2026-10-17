import "server-only";
import { localRepo } from "./local";
import type { Repo } from "./repo";
import { supabaseRepo } from "./supabase";

export type { Repo, AttemptQuery } from "./repo";

export const backend = (): "supabase" | "local" =>
  (process.env.DATA_BACKEND as "supabase" | "local" | undefined) ?? (process.env.SUPABASE_URL ? "supabase" : "local");

export function repo(): Repo {
  return backend() === "supabase" ? supabaseRepo : localRepo;
}
