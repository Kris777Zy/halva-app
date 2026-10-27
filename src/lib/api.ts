import { NextResponse } from "next/server";
import { ensureSeeded } from "./seed";

export const DB_ERROR =
  "Halvi can't reach its database right now. Please try again in a moment.";

/** Runs a handler after seeding; any failure becomes a friendly 503 instead of a crash. */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    await ensureSeeded();
    return await fn();
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: DB_ERROR }, { status: 503 });
  }
}

const PRODUCT_TAG = /\n*\[\[products:([\d,]*)\]\]\s*$/;

/** Product card ids are stored as a trailing tag in the message content. */
export function withProducts(content: string, ids: number[]) {
  return ids.length ? `${content}\n\n[[products:${ids.join(",")}]]` : content;
}

export function serializeMessage(m: { id: string; role: string; content: string; createdAt: Date }) {
  const match = m.content.match(PRODUCT_TAG);
  return {
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content.replace(PRODUCT_TAG, ""),
    createdAt: m.createdAt.toISOString(),
    productIds: match ? match[1].split(",").filter(Boolean).map(Number) : [],
  };
}
