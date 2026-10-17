// Regenerates supabase/seed.sql from data/demo-set.json (npm run gen:seed).
import { readFileSync, writeFileSync } from "node:fs";
import { validateImport } from "../lib/validate";

const raw = JSON.parse(readFileSync("data/demo-set.json", "utf8"));
const v = validateImport(raw);
if (!v.ok) throw new Error(v.errors.join("\n"));
const sql = `-- Demo set: one exercise of every type. Run after schema.sql.
-- Generated from data/demo-set.json by \`npm run gen:seed\`.
select import_set($json$${JSON.stringify(v.value, null, 2)}$json$::jsonb);
`;
writeFileSync("supabase/seed.sql", sql);
console.log("wrote supabase/seed.sql");
