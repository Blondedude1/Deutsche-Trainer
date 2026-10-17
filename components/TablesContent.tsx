"use client";
import { useEffect, useState } from "react";
import { CASE_NAMES, PART_LABELS, PARTS, type Case } from "@/lib/types";
import { CASE_VAR, PART_VAR } from "./colors";

export const TABLE_TABS = [
  { id: "verben", label: "Verben" },
  { id: "artikel", label: "Artikel" },
  { id: "ein_kein", label: "ein / kein" },
  { id: "praepositionen", label: "Präpositionen" },
  { id: "wechsel", label: "Wechsel" },
  { id: "adjektive", label: "Adjektive" },
  { id: "kein_nicht", label: "kein / nicht" },
  { id: "fragen", label: "W-Fragen" },
  { id: "satz", label: "Satzbau" },
] as const;
export type TableTab = (typeof TABLE_TABS)[number]["id"];

const M = ({ children }: { children: React.ReactNode }) => <b style={{ color: "var(--der)" }}>{children}</b>;
const F = ({ children }: { children: React.ReactNode }) => <b style={{ color: "var(--die)" }}>{children}</b>;
const N = ({ children }: { children: React.ReactNode }) => <b style={{ color: "var(--das)" }}>{children}</b>;
const P = ({ children }: { children: React.ReactNode }) => <b style={{ color: "var(--pl)" }}>{children}</b>;
const E = ({ children }: { children: React.ReactNode }) => <u className="decoration-2 underline-offset-2">{children}</u>;

function CaseHead({ c }: { c: Case }) {
  return (
    <th className="whitespace-nowrap text-left">
      <span className="mr-1.5 inline-flex h-6 w-6 items-center justify-center rounded border-2 text-xs font-extrabold" style={{ borderColor: CASE_VAR[c], color: CASE_VAR[c] }}>
        {c}
      </span>
      <span className="font-semibold">{CASE_NAMES[c].de}</span>
      <span className="block pl-7 text-xs font-normal text-muted">{CASE_NAMES[c].mn}</span>
    </th>
  );
}

function T({ head, rows, caption }: { head: React.ReactNode[]; rows: React.ReactNode[][]; caption?: string }) {
  return (
    <div className="mb-5 overflow-x-auto">
      {caption && <h4 className="mb-1.5 text-sm font-bold uppercase tracking-wide text-muted">{caption}</h4>}
      <table className="tbl w-full">
        <thead>
          <tr>{head.map((h, i) => (typeof h === "string" ? <th key={i}>{h}</th> : <th key={i}>{h}</th>))}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (j === 0 && typeof c === "string" ? <th key={j}>{c}</th> : <td key={j}>{c}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Note = ({ children }: { children: React.ReactNode }) => <p className="mb-4 rounded-xl bg-surface-2 px-3 py-2 text-[15px] leading-relaxed">{children}</p>;
const caseRow = (c: Case, cells: React.ReactNode[]) => [<CaseHead key={c} c={c} />, ...cells];

function Verben() {
  return (
    <>
      <T caption="Endings" head={["", "ending", "machen"]} rows={[
        ["ich", "-e", <>mach<E>e</E></>],
        ["du", "-st", <>mach<E>st</E></>],
        ["er / sie / es", "-t", <>mach<E>t</E></>],
        ["wir", "-en", <>mach<E>en</E></>],
        ["ihr", "-t", <>mach<E>t</E></>],
        ["sie / Sie", "-en", <>mach<E>en</E></>],
      ]} />
      <T caption="5 regular types" head={["", "1 normal", "2 -s/ß/z/x", "3 -t/-d", "4 cons.+n/m", "5 -ern / -eln"]} rows={[
        ["", "machen", "heißen", "arbeiten", "öffnen", "wandern · sammeln"],
        ["ich", "mache", "heiße", "arbeite", "öffne", <>wandere · <E>sammle</E></>],
        ["du", "machst", <>heiß<E>t</E></>, <>arbeit<E>e</E>st</>, <>öffn<E>e</E>st</>, "wanderst · sammelst"],
        ["er/sie/es", "macht", "heißt", <>arbeit<E>e</E>t</>, <>öffn<E>e</E>t</>, "wandert · sammelt"],
        ["wir", "machen", "heißen", "arbeiten", "öffnen", <>wander<E>n</E> · sammel<E>n</E></>],
        ["ihr", "macht", "heißt", <>arbeit<E>e</E>t</>, <>öffn<E>e</E>t</>, "wandert · sammelt"],
        ["sie/Sie", "machen", "heißen", "arbeiten", "öffnen", "wandern · sammeln"],
      ]} />
      <Note>
        <b>2</b> stem ends in -s, -ß, -z, -x → du = er (du tanzt, du reist). <b>3</b> stem ends in -t/-d → extra -e- (du findest, er wartet).{" "}
        <b>4</b> consonant + n/m → extra -e- (du atmest, es regnet). <b>5</b> -ern/-eln: wir/sie only add -n; with -eln, ich drops the e (ich lächle).
      </Note>
      <T caption="Vowel change — only du + er/sie/es" head={["", "du", "er/sie/es", "verbs"]} rows={[
        ["a → ä", "fährst", "fährt", "fahren, schlafen, tragen, waschen, fallen, lassen, halten (hältst, hält), laufen (läufst, läuft)"],
        ["e → i", "gibst", "gibt", "geben, essen (isst), helfen, sprechen, treffen, vergessen (vergisst), werfen, nehmen*"],
        ["e → ie", "liest", "liest", "lesen, sehen (siehst, sieht), empfehlen, stehlen"],
      ]} />
      <T caption="Irregular" head={["", "sein", "haben", "werden", "wissen", "nehmen"]} rows={[
        ["ich", "bin", "habe", "werde", "weiß", "nehme"],
        ["du", "bist", "hast", "wirst", "weißt", "nimmst"],
        ["er/sie/es", "ist", "hat", "wird", "weiß", "nimmt"],
        ["wir", "sind", "haben", "werden", "wissen", "nehmen"],
        ["ihr", "seid", "habt", "werdet", "wisst", "nehmt"],
        ["sie/Sie", "sind", "haben", "werden", "wissen", "nehmen"],
      ]} />
      <Note>Verb is always in <b>slot 2</b>. Plural subject (die Kinder, meine Eltern) → verb like <i>sie</i>: Die Kinder spiel<E>en</E>.</Note>
    </>
  );
}

function Artikel() {
  return (
    <>
      <T caption="der · die · das · plural" head={["", <M key="m">m</M>, <F key="f">f</F>, <N key="n">n</N>, <P key="p">pl</P>]} rows={[
        caseRow("N", [<M key="1">der</M>, <F key="2">die</F>, <N key="3">das</N>, <P key="4">die</P>]),
        caseRow("A", [<M key="1">den</M>, <F key="2">die</F>, <N key="3">das</N>, <P key="4">die</P>]),
        caseRow("D", [<M key="1">dem</M>, <F key="2">der</F>, <N key="3">dem</N>, <P key="4">den …-n</P>]),
        caseRow("G", [<M key="1">des …-(e)s</M>, <F key="2">der</F>, <N key="3">des …-(e)s</N>, <P key="4">der</P>]),
      ]} />
      <Note>
        Only <b>masculine</b> changes in Akkusativ (der → den). Plural Dativ: <b>den</b> + noun <b>-n</b> (den Kinder<E>n</E>) — not if the plural already ends in -n or -s (den Frauen, den Autos).
      </Note>
      <T caption="Genitiv + alternatives" head={["", "example"]} rows={[
        ["des + -s / -es", <>das Auto <b>des</b> Vater<E>s</E> · das Buch <b>des</b> Kind<E>es</E></>],
        ["der (f, pl)", <>die Tasche <b>der</b> Mutter · die Spielsachen <b>der</b> Kinder</>],
        ["von + Dativ", <>das Auto <b>von dem</b> (vom) Vater · von der Mutter</>],
        ["name + s", <>Peter<E>s</E> Auto · Anna<E>s</E> Buch</>],
        ["name in s/ß/x/z", <>Han<E>s&apos;</E> Auto · Max&apos; Buch · Fritz&apos; Hund</>],
      ]} />
    </>
  );
}

function EinKein() {
  return (
    <T caption="ein / kein" head={["", <M key="m">m</M>, <F key="f">f</F>, <N key="n">n</N>, <P key="p">pl</P>]} rows={[
      caseRow("N", [<M key="1">(k)ein</M>, <F key="2">(k)eine</F>, <N key="3">(k)ein</N>, <P key="4">— / keine</P>]),
      caseRow("A", [<M key="1">(k)einen</M>, <F key="2">(k)eine</F>, <N key="3">(k)ein</N>, <P key="4">— / keine</P>]),
      caseRow("D", [<M key="1">(k)einem</M>, <F key="2">(k)einer</F>, <N key="3">(k)einem</N>, <P key="4">— / keinen …-n</P>]),
      caseRow("G", [<M key="1">(k)eines …-(e)s</M>, <F key="2">(k)einer</F>, <N key="3">(k)eines …-(e)s</N>, <P key="4">— / keiner</P>]),
    ]} />
  );
}

function Praepositionen() {
  return (
    <>
      <T caption="Akkusativ prepositions" head={["", "example"]} rows={[
        [<CaseHead key="a" c="A" />, <span key="1" className="text-lg font-semibold">für · um · gegen · durch · ohne · bis</span>],
        ["", <>für <b>den</b> Opa · durch <b>den</b> Park · ohne Zucker (often no article)</>],
      ]} />
      <T caption="Dativ prepositions" head={["", "example"]} rows={[
        [<CaseHead key="d" c="D" />, <span key="1" className="text-lg font-semibold">ab · aus · bei · mit · nach · seit · von · zu</span>],
        ["", <>mit <b>dem</b> Bus · aus <b>der</b> Schule · seit <b>einem</b> Jahr</>],
      ]} />
      <T caption="Contractions (Dativ)" head={["", "", ""]} rows={[
        ["zu + dem", <b key="1">zum</b>, "zum Arzt, zum Kino"],
        ["zu + der", <b key="1">zur</b>, "zur Schule, zur Post"],
        ["von + dem", <b key="1">vom</b>, "vom Bahnhof"],
        ["bei + dem", <b key="1">beim</b>, "beim Arzt"],
      ]} />
    </>
  );
}

function Wechsel() {
  return (
    <>
      <T caption="Wechselpräpositionen" head={["", ""]} rows={[
        ["", <span key="1" className="text-lg font-semibold">an · auf · hinter · in · neben · über · unter · vor · zwischen</span>],
        [<span key="wo">Wo? (хаана?) — position</span>, <><CaseHead c="D" /> Das Buch liegt auf <b>dem</b> Tisch.</>],
        [<span key="wohin">Wohin? (хаашаа?) — movement</span>, <><CaseHead c="A" /> Ich lege das Buch auf <b>den</b> Tisch.</>],
      ]} />
      <T caption="Contractions" head={["", "", ""]} rows={[
        ["in + dem", <b key="1">im</b>, <>Wo? — <i>im</i> Park</>],
        ["in + das", <b key="1">ins</b>, <>Wohin? — <i>ins</i> Kino</>],
        ["an + dem", <b key="1">am</b>, <>Wo? — <i>am</i> Fenster</>],
        ["an + das", <b key="1">ans</b>, <>Wohin? — <i>ans</i> Fenster</>],
      ]} />
      <T caption="Verb pairs" head={["Wo? → Dativ (state)", "Wohin? → Akkusativ (action)"]} rows={[
        [<>liegen — Das Buch <b>liegt</b> auf dem Tisch.</>, <>legen — Ich <b>lege</b> das Buch auf den Tisch.</>],
        [<>stehen — Die Flasche <b>steht</b> auf dem Tisch.</>, <>stellen — Ich <b>stelle</b> die Flasche auf den Tisch.</>],
        [<>sitzen — Das Kind <b>sitzt</b> auf dem Stuhl.</>, <>setzen — Ich <b>setze</b> das Kind auf den Stuhl.</>],
        [<>hängen — Das Bild <b>hängt</b> an der Wand.</>, <>hängen — Ich <b>hänge</b> das Bild an die Wand.</>],
      ]} />
    </>
  );
}

function Adjektive() {
  return (
    <>
      <T caption="After der / die / das" head={["", <M key="m">m</M>, <F key="f">f</F>, <N key="n">n</N>, <P key="p">pl</P>]} rows={[
        caseRow("N", [<M key="1">der alt<E>e</E> Mann</M>, <F key="2">die alt<E>e</E> Frau</F>, <N key="3">das alt<E>e</E> Haus</N>, <P key="4">die alt<E>en</E> Häuser</P>]),
        caseRow("A", [<M key="1">den alt<E>en</E> Mann</M>, <F key="2">die alt<E>e</E> Frau</F>, <N key="3">das alt<E>e</E> Haus</N>, <P key="4">die alt<E>en</E> Häuser</P>]),
        caseRow("D", [<M key="1">dem alt<E>en</E> Mann</M>, <F key="2">der alt<E>en</E> Frau</F>, <N key="3">dem alt<E>en</E> Haus</N>, <P key="4">den alt<E>en</E> Häusern</P>]),
        caseRow("G", [<M key="1">des alt<E>en</E> Mannes</M>, <F key="2">der alt<E>en</E> Frau</F>, <N key="3">des alt<E>en</E> Hauses</N>, <P key="4">der alt<E>en</E> Häuser</P>]),
      ]} />
      <Note><b>-e</b> only in the 5 spots: Nominativ singular (m, f, n) + Akkusativ singular (f, n). Everywhere else <b>-en</b>.</Note>
    </>
  );
}

function KeinNicht() {
  return (
    <T caption="kein vs nicht" head={["use", "when", "example"]} rows={[
      [<b key="k">kein</b>, "noun with ein / no article", <>Ich habe ein Auto. → Ich habe <b>kein</b> Auto. · Ich trinke Kaffee. → Ich trinke <b>keinen</b> Kaffee.</>],
      [<b key="n1">nicht</b>, "verb", <>Ich komme <b>nicht</b>.</>],
      ["", "adjective / adverb", <>Das ist <b>nicht</b> gut. · Er wohnt <b>nicht</b> hier.</>],
      ["", "noun with der/die/das, mein…", <>Ich sehe den Film <b>nicht</b>. · Das ist <b>nicht</b> mein Buch.</>],
      ["", "name", <>Das ist <b>nicht</b> Peter.</>],
    ]} />
  );
}

function Fragen() {
  return (
    <>
      <T caption="W-question words" head={["", "", "Mongolian", "example"]} rows={[
        ["wer?", <CaseHead key="c" c="N" />, "хэн?", "Wer kommt?"],
        ["wen?", <CaseHead key="c" c="A" />, "хэнийг?", "Wen siehst du?"],
        ["wem?", <CaseHead key="c" c="D" />, "хэнд?", "Wem hilfst du?"],
        ["wessen?", <CaseHead key="c" c="G" />, "хэний?", "Wessen Buch ist das?"],
        ["was?", "", "юу?", "Was machst du?"],
        ["wie?", "", "яаж? ямар?", "Wie heißt du?"],
        ["wo?", "", "хаана?", "Wo wohnst du?"],
        ["wohin?", "", "хаашаа?", "Wohin fährst du?"],
        ["wann?", "", "хэзээ?", "Wann kommst du?"],
        ["warum?", "", "яагаад?", "Warum lernst du Deutsch?"],
      ]} />
      <Note>W-question: W-word in slot 1, verb in slot 2 (<i>Wohin <b>fährst</b> du?</i>). Yes/no question: verb first (<i><b>Fährst</b> du nach Berlin?</i>).</Note>
    </>
  );
}

function Satz() {
  const mn: Record<string, string> = {
    S: "хэн? юу? — нэрлэхийн",
    V: "үйл үг — slot 2",
    DO: "хэнийг? юуг? — заахын (-ийг/-ыг/-г)",
    IO: "хэнд? юунд? — өгөх-оршихын (-д/-т)",
    OWN: "хэний? — харьяалахын (-ийн/-ын/-н)",
    WHERE: "хаана? хаашаа?",
    WHEN: "хэзээ?",
  };
  const de: Record<string, React.ReactNode> = {
    S: <><CaseHead c="N" /></>,
    V: "conjugated, slot 2",
    DO: <><CaseHead c="A" /></>,
    IO: <><CaseHead c="D" /></>,
    OWN: <><CaseHead c="G" /></>,
    WHERE: "prepositions",
    WHEN: "time words",
  };
  return (
    <>
      <T caption="Module 0 — sentence anatomy" head={["part", "Mongolian question", "German"]} rows={PARTS.map((p) => [
        <span key={p} className="inline-flex items-center gap-2">
          <span className="inline-flex h-7 min-w-10 items-center justify-center rounded-md px-1.5 text-xs font-extrabold text-white" style={{ background: PART_VAR[p] }}>{p}</span>
          {PART_LABELS[p]}
        </span>,
        mn[p],
        de[p],
      ])} />
      <Note>
        Mongolian: <i>Ах <b>эмээд</b> сонин авчирч байна.</i> (S · IO · DO · V — verb at the end)
        <br />
        German: <i>Der Bruder <b>bringt</b> der Oma eine Zeitung.</i> (S · V · IO · DO — verb in slot 2)
      </Note>
      <T caption="Word order: time → how → place" head={["slot 1", "slot 2 (verb)", "", "time", "how", "place"]} rows={[
        ["Ich", "fahre", "", "morgen", "mit dem Zug", "nach Berlin."],
        ["Morgen", "fahre", "ich", "", "mit dem Zug", "nach Berlin."],
        ["Wohin", "fährst", "du", "morgen?", "", ""],
      ]} />
    </>
  );
}

const CONTENT: Record<TableTab, () => React.ReactElement> = {
  verben: Verben,
  artikel: Artikel,
  ein_kein: EinKein,
  praepositionen: Praepositionen,
  wechsel: Wechsel,
  adjektive: Adjektive,
  kein_nicht: KeinNicht,
  fragen: Fragen,
  satz: Satz,
};

export function TablesContent({ onTab }: { onTab?: (tab: TableTab) => void }) {
  const [tab, setTab] = useState<TableTab>("verben");
  useEffect(() => {
    try {
      const t = localStorage.getItem("dt-tables-tab") as TableTab | null;
      if (t && t in CONTENT) setTab(t);
    } catch {}
  }, []);
  useEffect(() => {
    onTab?.(tab);
    try {
      localStorage.setItem("dt-tables-tab", tab);
    } catch {}
  }, [tab, onTab]);
  const Body = CONTENT[tab];
  return (
    <div>
      <div className="sticky top-0 z-10 flex shrink-0 gap-1.5 overflow-x-auto border-b border-border bg-surface p-2">
        {TABLE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className="tb-btn shrink-0 whitespace-nowrap border-border text-[15px]"
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-3 text-[16px]">
        <Body />
      </div>
    </div>
  );
}
