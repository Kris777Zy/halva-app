import { readFileSync } from "fs";
import path from "path";
import { prisma } from "./db";
import { parseCsv } from "./csv";

const DEFAULT_STYLES = [
  { name: "Simple", instruction: "Short and simple: one or two sentences." },
  { name: "Detailed", instruction: "Detailed: full explanation with related facts." },
  { name: "For bakers and cooks", instruction: "Practical answer with cooking and baking tips." },
];

function readData(file: string) {
  return parseCsv(readFileSync(path.join(process.cwd(), "data", file), "utf8"));
}

async function seed() {
  if ((await prisma.answerStyle.count()) === 0) {
    await prisma.answerStyle.createMany({ data: DEFAULT_STYLES });
  }
  if ((await prisma.knowledgeItem.count()) === 0) {
    const rows = readData("knowledge.csv");
    await prisma.knowledgeItem.createMany({
      data: rows.map((r) => ({ topic: r.topic, question: r.question, answer: r.answer })),
    });
  }
  if ((await prisma.product.count()) === 0) {
    const rows = readData("products.csv");
    await prisma.product.createMany({
      data: rows.map((r) => ({
        flavour: r.flavour,
        ingredients: r.ingredients,
        sugarPer100g: Number(r.sugarPer100g),
        kcalPer100g: Number(r.kcalPer100g),
        weightG: Number(r.weightG),
        priceEur: Number(r.priceEur),
        allergens: r.allergens,
      })),
    });
  }
}

let seeding: Promise<void> | null = null;

/** Seeds empty tables once per process; retried if the database was unreachable. */
export function ensureSeeded(): Promise<void> {
  if (!seeding) {
    seeding = seed().catch((err) => {
      seeding = null;
      throw err;
    });
  }
  return seeding;
}
