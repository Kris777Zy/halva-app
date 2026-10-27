import type { AnswerStyle, KnowledgeItem, Product } from "@prisma/client";

const STOP = new Set(
  "the are was were does did you for and your our any some there this that tell please can how what which when where why about with".split(" ")
);

const tokens = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t))
    .map((t) => t.replace(/(ies|es|s)$/, (m) => (m === "ies" ? "y" : "")));

const ALLERGY_RE = /\b(nuts?|sesame|peanuts?|allerg\w*|tahini)\b/i;
const PRODUCT_RE =
  /\b(flavou?rs?|products?|vanilla|cocoa|pistachio|sunflower|reduced|price|prices|cost|buy|menu|range)\b/i;
const GREETING_RE = /^\s*(hi|hello|hey|good (morning|afternoon|evening))\b/i;

export const ALLERGY_NOTE =
  "Allergy note: halva contains sesame and may contain nuts or traces of peanuts. Please always check the label, and ask your doctor if you have an allergy.";

export const OFF_TOPIC =
  "I'm sorry, I only know about halva and our products. Try asking me what halva is made of, which flavour to choose, or how to store it!";

const sentences = (t: string) =>
  t.match(/[^.!?]+[.!?]+(\s|$)/g)?.map((s) => s.trim()) ?? [t];

function styleKind(style: Pick<AnswerStyle, "name" | "instruction"> | null) {
  const s = `${style?.name ?? ""} ${style?.instruction ?? ""}`.toLowerCase();
  if (/bak|cook|chef|recipe/.test(s)) return "baker";
  if (/simple|short|brief/.test(s)) return "simple";
  return "detailed";
}

export interface Reply {
  content: string;
  productIds: number[];
}

export function buildReply(
  text: string,
  style: Pick<AnswerStyle, "name" | "instruction"> | null,
  knowledge: KnowledgeItem[],
  products: Product[]
): Reply {
  const qTokens = new Set(tokens(text));
  const lower = text.toLowerCase();

  const scored = knowledge
    .map((k) => {
      const qt = tokens(k.question);
      const tt = tokens(k.topic);
      const at = new Set(tokens(k.answer));
      let score = 0;
      qTokens.forEach((t) => {
        if (qt.includes(t)) score += 2;
        if (tt.includes(t)) score += 2;
        if (at.has(t)) score += 0.5;
      });
      if (lower.includes(k.question.toLowerCase().replace(/\?$/, ""))) score += 10;
      return { k, score };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score);

  const wantsProducts = PRODUCT_RE.test(text);
  const mentioned = products.filter((p) =>
    p.flavour
      .toLowerCase()
      .split(/[\s-]+/)
      .some((w) => w.length > 3 && lower.includes(w))
  );
  const shown = wantsProducts ? (mentioned.length ? mentioned : products) : [];
  const best = scored[0]?.k;

  if (GREETING_RE.test(text) && !best && !wantsProducts) {
    return {
      content:
        "Hello! I'm Halvi, your halva guide. Ask me anything about halva: ingredients, flavours, allergens or storage.",
      productIds: [],
    };
  }

  const parts: string[] = [];
  const kind = styleKind(style);

  if (best) {
    if (kind === "simple") {
      parts.push(sentences(best.answer).slice(0, 2).join(" "));
    } else if (kind === "baker") {
      parts.push(best.answer);
      parts.push(
        "Tip for cooks and bakers: halva is lovely crumbled into brownies, cookies or ice cream, and it melts nicely into warm sauces. Keep it at room temperature for easy slicing."
      );
    } else {
      parts.push(best.answer);
      const related = scored.slice(1, 3).filter((x) => x.score >= 3);
      if (related.length) {
        parts.push("Related: " + related.map((x) => sentences(x.k.answer)[0]).join(" "));
      }
    }
    if (shown.length) parts.push("Here are some of our products:");
  } else if (shown.length) {
    parts.push(mentioned.length ? "Here is what we have for that flavour:" : "Here are our halva flavours:");
  } else {
    return { content: OFF_TOPIC, productIds: [] };
  }

  const full = parts.join("\n\n");
  return {
    content: ALLERGY_RE.test(text) ? `${full}\n\n${ALLERGY_NOTE}` : full,
    productIds: shown.map((p) => p.id),
  };
}
