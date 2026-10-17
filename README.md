# Deutsch Trainer

Single-user German drill app for iPad (A1–A2, Mongolian → German).
Next.js (App Router, TypeScript) · Tailwind · Supabase Postgres · Vercel.

**Phase 1 is done:** passcode login, JSON import, practice screen with 8 exercise types, floating Wörterliste/Tabellen panels, color code, scoring, exact grading, mistake log, 4 practice modes, stats.

---

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**, paste all of [`supabase/schema.sql`](supabase/schema.sql) and run it.
   This creates every table (including the Phase 2 tables `gender_cards` and `speed_runs`), the `v_mistakes` view, and the `import_set()` function that imports a set atomically.
3. Optional: run [`supabase/seed.sql`](supabase/seed.sql) to add the demo set (one exercise of every type).
   You can also skip this and load the demo set from the **Import** page.
4. **Project Settings → API**: copy the **Project URL** and the **service_role** key.

Security model: RLS is on for every table with no policies, so the public anon key can read nothing.
The app only talks to the database from the server, using the service-role key, behind the passcode.

## 2. Environment variables

Copy `.env.example` to `.env.local`:

| Variable | Required | Meaning |
|---|---|---|
| `APP_PASSCODE` | yes | Passcode for the login screen. Changing it logs out every device. |
| `SUPABASE_URL` | yes | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | service_role key (server only, never exposed to the browser) |
| `APP_TIMEZONE` | no | Fallback time zone for per-day stats (the browser normally sends its own) |
| `DATA_BACKEND` | no | `local` stores everything in `.data/db.json` (dev/testing only). Defaults to `supabase` when `SUPABASE_URL` is set |
| `AI_GRADING` | no | `off` (Phase 1). `on` routes non-matching answers to `lib/grading/ai.ts` (Phase 3) |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | no | Phase 3 only |

## 3. Run locally

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # grading, normalization, validation, case-block tests
```

No Supabase yet? `APP_PASSCODE=test DATA_BACKEND=local npm run dev` runs everything against a local JSON file.

To use it from the iPad on the same Wi-Fi: `npm run dev -- -H 0.0.0.0` and open `http://<your-computer-ip>:3000`.

## 4. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. [vercel.com/new](https://vercel.com/new) → import the repo (framework: Next.js, no build settings to change).
3. Add `APP_PASSCODE`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` under **Settings → Environment Variables**. Do not set `DATA_BACKEND=local` on Vercel, because its filesystem is read-only.
4. Deploy. On the iPad, open the URL in Safari → Share → **Add to Home Screen** for a full-screen app.

---

## How to test Phase 1 (about 10 minutes)

1. **Login.** Open the app. You land on `/login`. A wrong passcode shows "Wrong passcode"; the right one takes you home.
2. **Import.** Go to **Import** → **Load demo JSON** → **Check** ("Looks good: 8 exercises, 22 words") → **Save as new set** → **Practice it now**.
   - To see validation, delete `"tags"` from one exercise, or add a second `___` to the fill_blank text, then press Check. Every error is listed with its path and nothing is saved.
3. **Practice the demo set** (one of each type):
   1. *Mongolian → German*: write `Die Mutter legt den Teppich auf dem Fussboden`. You get ✗ with `dem` struck out in your answer and `den` highlighted in the correct sentence. Nouns appear in gender colors and case blocks are outlined N/A. Tap **I think I was right** (flag), then **Try again**. A correct retry gives 0 points.
   2. *German → Mongolian*: type anything → **Show answer** → **Got it** / **Missed**.
   3. *Fill the gaps*: open **Tabellen** first. The "Tables opened · max 0.5" badge appears. Answer `den` + `n`: you get +0.5.
   4. *Find the mistake*: the field is prefilled. Fix `dem` → `den`.
   5. *Transform*: try `Ich habe nicht einen Bruder.` (wrong, category `ein_kein`).
   6. *Name the case*: tap **D Dativ**. The reason is shown.
   7. *Speed*: an 8-second bar. Type `für den Opa` in time for +1. After the bar runs out you still get feedback, but 0 points.
   8. *Sentence parts*: pick a role (S/V/DO/IO/OWN/WHERE/WHEN), then tap tokens.
4. **Panels.** **Wörter** and **Tabellen** in the top bar. Drag a panel by its header, resize it from the corner or edge, and use ⇤ ❐ ⇥ to dock left, float or dock right. Dragging a panel to a screen edge docks it. In portrait they become slide-over drawers. Opening Wörter is free; opening Tabellen while answering marks `tables_used`.
5. **Modes** (home page): **Mixed**, **Mistakes only** (wrong in the last 7 days and not answered correctly since; the demo run above leaves 2), **Weakest first**.
6. **Stats**: per-day attempts/accuracy/points, the share of correct answers that needed tables, categories worst-first, and flagged attempts. **Accept** marks an attempt correct and adds your answer as an accepted variant, so next time it is graded correct. **Dismiss** removes the flag.
7. **Settings** (home): turn off "ae/oe/ue/ss = ä/ö/ü/ß". `Fussboden` is then wrong, with category `umlaut_spelling`.
8. **Dark mode**: the ◐ button in the top bar (system → light → dark).

---

## Import format

```json
{
  "title": "Übung 11 – Wechselpräpositionen",
  "source_note": "textbook p.25",
  "vocab": [
    { "german": "Teppich", "article": "der", "plural": "Teppiche", "mongolian": "хивс", "kind": "noun" },
    { "german": "legen", "mongolian": "хэвтүүлж тавих", "kind": "verb", "irregular": false }
  ],
  "exercises": [ { "type": "translate_mn_de", "mongolian": "…", "glosses": "…", "answer": "…", "accepted_variants": [], "tags": ["wechsel_case"] } ]
}
```

See [`data/demo-set.json`](data/demo-set.json) for one exercise of every type. Rules:

- `tags` are required and must come from the fixed category list (`lib/types.ts → CATEGORIES`).
- `fill_blank`: `blanks` has one array of accepted answers per `___` gap. A gap can sit inside a word (`Kinder___`).
- `name_case`: `highlight` must appear in `sentence`, and `answer` is `N`/`A`/`D`/`G`.
- `speed`: optional `seconds` (default 8).
- `label_parts`: optional `german` shows the German sentence (colored) in the feedback.
- **Optional on any exercise: `marked`.** This is the correct sentence with exact case blocks, e.g. `"Ich gebe [D:dem Kind] [A:den Ball]."`. Without it, case blocks are guessed from articles, prepositions and the vocab genders. The guess is right for normal A1 sentences but can miss unusual word order.
- Nouns use `"plural": "-"` when they have no plural.

## Grading rules (Phase 1)

`lib/grading/index.ts → grade()` is the single entry point used by `/api/attempts`.

- Normalize: trim, collapse spaces, strip final punctuation, unify quotes, ignore the case of the first character only, optionally ae/oe/ue/ss = ä/ö/ü/ß.
- Correct if the normalized answer equals `answer` or any `accepted_variants`.
- Wrong: `error_categories` = the exercise's tags. Exception: if the only difference is capitalization, the category is `capitalization`; if it is only umlaut spelling (with the setting off), it is `umlaut_spelling`.
- Points: 1 (correct, no tables), 0.5 (correct after opening Tabellen), 0 for wrong answers, retries and over-time speed answers.
- `AI_GRADING=on` sends non-matching free-text answers to `aiGrade()` (a stub that returns `null` until Phase 3).

## For an external assistant: `v_mistakes`

`v_mistakes` = every wrong attempt with set title, type, tags, error categories, your answer, the exercise payload and the expected answer.

```sql
select created_at, type, error_categories, answer->>'text' as mine, expected
from v_mistakes order by created_at desc limit 50;
```

To give an assistant read-only SQL access, create a dedicated login role:

```sql
create role assistant_reader login password 'choose-a-strong-one';
grant usage on schema public to assistant_reader;
grant select on v_mistakes, exercises, exercise_sets, attempts, vocab to assistant_reader;
-- RLS is on, so the role also needs read policies:
create policy assistant_read on attempts      for select to assistant_reader using (true);
create policy assistant_read on exercises     for select to assistant_reader using (true);
create policy assistant_read on exercise_sets for select to assistant_reader using (true);
create policy assistant_read on vocab         for select to assistant_reader using (true);
```

## Project layout

```
app/                 pages (/, /login, /import, /practice, /stats, /tables) + API routes
components/          FloatingPanel, TablesContent, VocabList, AnnotatedSentence, practice/*
lib/grading/         exact.ts (Phase 1), ai.ts (Phase 3 stub), index.ts (entry point + points)
lib/annotate.ts      gender colors + case blocks for the correct sentence
lib/db/              Repo interface → supabase.ts (prod) / local.ts (dev JSON file)
lib/queue.ts         Mixed / Mistakes / Weakest selection
lib/stats.ts         per-day + per-category stats
supabase/            schema.sql, seed.sql (generated by `npm run gen:seed`)
```
