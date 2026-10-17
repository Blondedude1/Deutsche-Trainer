import type { Exercise } from "./types";

/** One-line description of an exercise for lists. */
export function promptOf(ex: Exercise): string {
  switch (ex.type) {
    case "translate_mn_de": return ex.payload.mongolian;
    case "translate_de_mn": return ex.payload.german;
    case "fill_blank": return ex.payload.text;
    case "error_hunt": return ex.payload.sentence;
    case "transform": return `${ex.payload.instruction}: ${ex.payload.source}`;
    case "name_case": return `${ex.payload.sentence} [${ex.payload.highlight}]`;
    case "speed": return ex.payload.prompt;
    case "label_parts": return ex.payload.mongolian;
  }
}
