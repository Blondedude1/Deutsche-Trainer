import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Attempt, Exercise, ExerciseSet, Vocab } from "../types";
import type { Repo } from "./repo";

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

const PAGE = 1000;
/** PostgREST caps rows per request; page through. */
async function all<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const rows = check(await build(from, from + PAGE - 1));
    out.push(...rows);
    if (rows.length < PAGE) return out;
  }
}

const num = (a: Attempt): Attempt => ({ ...a, points: Number(a.points) });

export const supabaseRepo: Repo = {
  async listSets() {
    const sets = check(await db().from("exercise_sets").select("*, exercises(count)").order("created_at", { ascending: false }));
    return (sets as (ExerciseSet & { exercises: { count: number }[] })[]).map(({ exercises, ...s }) => ({
      ...s,
      exercise_count: exercises?.[0]?.count ?? 0,
    }));
  },
  async getSet(id) {
    return check(await db().from("exercise_sets").select("*").eq("id", id).maybeSingle()) as ExerciseSet | null;
  },
  async getExercises(filter) {
    if (filter?.ids && filter.ids.length === 0) return [];
    return all<Exercise>((from, to) => {
      let q = db().from("exercises").select("*").order("set_id").order("position").range(from, to);
      if (filter?.setId) q = q.eq("set_id", filter.setId);
      if (filter?.ids) q = q.in("id", filter.ids);
      return q;
    });
  },
  async getVocab(setIds) {
    return all<Vocab>((from, to) => {
      let q = db().from("vocab").select("*").order("german").range(from, to);
      if (setIds) q = q.in("set_id", setIds);
      return q;
    });
  },
  async createSet(input) {
    return check(await db().rpc("import_set", { p: input })) as string;
  },
  async deleteSet(id) {
    check(await db().from("exercise_sets").delete().eq("id", id));
  },
  async updateExercisePayload(id, payload) {
    check(await db().from("exercises").update({ payload }).eq("id", id));
  },
  async insertAttempt(a) {
    return num(check(await db().from("attempts").insert(a).select().single()) as Attempt);
  },
  async updateAttempt(id, patch) {
    return num(check(await db().from("attempts").update(patch).eq("id", id).select().single()) as Attempt);
  },
  async getAttempt(id) {
    const a = check(await db().from("attempts").select("*").eq("id", id).maybeSingle()) as Attempt | null;
    return a && num(a);
  },
  async getAttempts(q = {}) {
    const fetchRange = (from: number, to: number) => {
      let query = db().from("attempts").select("*").order("created_at", { ascending: false }).range(from, to);
      if (q.since) query = query.gte("created_at", q.since);
      if (q.flagged !== undefined) query = query.eq("flagged", q.flagged);
      return query;
    };
    if (q.limit) return (check(await fetchRange(0, q.limit - 1)) as Attempt[]).map(num);
    return (await all<Attempt>(fetchRange)).map(num);
  },
};
