-- Demo set: one exercise of every type. Run after schema.sql.
-- Generated from data/demo-set.json by `npm run gen:seed`.
select import_set($json${
  "title": "Demo – one of every type",
  "source_note": "built-in demo set",
  "vocab": [
    {
      "german": "Mutter",
      "article": "die",
      "plural": "Mütter",
      "mongolian": "ээж",
      "kind": "noun",
      "irregular": false
    },
    {
      "german": "Teppich",
      "article": "der",
      "plural": "Teppiche",
      "mongolian": "хивс",
      "kind": "noun",
      "irregular": false
    },
    {
      "german": "Fußboden",
      "article": "der",
      "plural": "Fußböden",
      "mongolian": "шал",
      "kind": "noun",
      "irregular": false
    },
    {
      "german": "Zug",
      "article": "der",
      "plural": "Züge",
      "mongolian": "галт тэрэг",
      "kind": "noun",
      "irregular": false
    },
    {
      "german": "Kind",
      "article": "das",
      "plural": "Kinder",
      "mongolian": "хүүхэд",
      "kind": "noun",
      "irregular": false
    },
    {
      "german": "Park",
      "article": "der",
      "plural": "Parks",
      "mongolian": "цэцэрлэгт хүрээлэн",
      "kind": "noun",
      "irregular": false
    },
    {
      "german": "Bruder",
      "article": "der",
      "plural": "Brüder",
      "mongolian": "ах, эрэгтэй дүү",
      "kind": "noun",
      "irregular": false
    },
    {
      "german": "Katze",
      "article": "die",
      "plural": "Katzen",
      "mongolian": "муур",
      "kind": "noun",
      "irregular": false
    },
    {
      "german": "Tisch",
      "article": "der",
      "plural": "Tische",
      "mongolian": "ширээ",
      "kind": "noun",
      "irregular": false
    },
    {
      "german": "Opa",
      "article": "der",
      "plural": "Opas",
      "mongolian": "өвөө",
      "kind": "noun",
      "irregular": false
    },
    {
      "german": "Oma",
      "article": "die",
      "plural": "Omas",
      "mongolian": "эмээ",
      "kind": "noun",
      "irregular": false
    },
    {
      "german": "Zeitung",
      "article": "die",
      "plural": "Zeitungen",
      "mongolian": "сонин",
      "kind": "noun",
      "irregular": false
    },
    {
      "german": "legen",
      "mongolian": "хэвтүүлж тавих",
      "kind": "verb",
      "irregular": false
    },
    {
      "german": "liegen",
      "mongolian": "хэвтэх",
      "kind": "verb",
      "irregular": false
    },
    {
      "german": "helfen",
      "mongolian": "туслах (+ Dativ)",
      "kind": "verb",
      "irregular": true
    },
    {
      "german": "fahren",
      "mongolian": "(унаагаар) явах",
      "kind": "verb",
      "irregular": true
    },
    {
      "german": "haben",
      "mongolian": "байх, эзэмших",
      "kind": "verb",
      "irregular": true
    },
    {
      "german": "gehen",
      "mongolian": "явах (явганаар)",
      "kind": "verb",
      "irregular": false
    },
    {
      "german": "bringen",
      "mongolian": "авчрах",
      "kind": "verb",
      "irregular": false
    },
    {
      "german": "unter",
      "mongolian": "доор",
      "kind": "other",
      "irregular": false
    },
    {
      "german": "durch",
      "mongolian": "дундуур, нэвт",
      "kind": "other",
      "irregular": false
    },
    {
      "german": "bis",
      "mongolian": "хүртэл",
      "kind": "other",
      "irregular": false
    }
  ],
  "exercises": [
    {
      "type": "translate_mn_de",
      "mongolian": "Ээж хивсийг шалан дээр дэвсэж байна.",
      "glosses": "die Mutter · legen · der Teppich · auf · der Fußboden",
      "answer": "Die Mutter legt den Teppich auf den Fußboden.",
      "accepted_variants": [],
      "tags": [
        "wechsel_case",
        "verb_pair"
      ]
    },
    {
      "type": "translate_de_mn",
      "german": "Der Zug fährt bis Berlin.",
      "answer": "Галт тэрэг Берлин хүртэл явна.",
      "tags": [
        "prep_akk"
      ]
    },
    {
      "type": "fill_blank",
      "text": "Ich helfe ___ Kinder___.",
      "blanks": [
        [
          "den"
        ],
        [
          "n"
        ]
      ],
      "mongolian": "Би хүүхдүүдэд тусалж байна.",
      "tags": [
        "plural_dativ"
      ]
    },
    {
      "type": "error_hunt",
      "sentence": "Wir gehen durch dem Park.",
      "answer": "Wir gehen durch den Park.",
      "tags": [
        "prep_akk"
      ]
    },
    {
      "type": "transform",
      "instruction": "make it negative",
      "source": "Ich habe einen Bruder.",
      "answer": "Ich habe keinen Bruder.",
      "accepted_variants": [],
      "tags": [
        "ein_kein"
      ]
    },
    {
      "type": "name_case",
      "sentence": "Die Katze liegt unter dem Tisch.",
      "highlight": "unter dem Tisch",
      "answer": "D",
      "reason": "liegt = no movement (Wo?) → Dativ (өгөх-оршихын)",
      "tags": [
        "wechsel_case"
      ]
    },
    {
      "type": "speed",
      "prompt": "für + der Opa",
      "answer": "für den Opa",
      "accepted_variants": [],
      "tags": [
        "prep_akk"
      ]
    },
    {
      "type": "label_parts",
      "mongolian": "Ах эмээд сонин авчирч байна.",
      "german": "Der Bruder bringt der Oma eine Zeitung.",
      "tokens": [
        {
          "text": "Ах",
          "part": "S"
        },
        {
          "text": "эмээд",
          "part": "IO"
        },
        {
          "text": "сонин",
          "part": "DO"
        },
        {
          "text": "авчирч байна",
          "part": "V"
        }
      ],
      "tags": [
        "sentence_parts"
      ]
    }
  ]
}$json$::jsonb);
