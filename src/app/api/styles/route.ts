import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";

export const dynamic = "force-dynamic";

function parse(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const instruction = typeof b.instruction === "string" ? b.instruction.trim() : "";
  return { name, instruction, id: typeof b.id === "string" ? b.id : "" };
}

const bad = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });

export function GET() {
  return handle(async () =>
    NextResponse.json(await prisma.answerStyle.findMany({ orderBy: { createdAt: "asc" } }))
  );
}

export function POST(req: Request) {
  return handle(async () => {
    const { name, instruction } = parse(await req.json().catch(() => null));
    if (!name) return bad("Style name is required.");
    const style = await prisma.answerStyle.create({ data: { name, instruction } });
    return NextResponse.json(style, { status: 201 });
  });
}

export function PUT(req: Request) {
  return handle(async () => {
    const { id, name, instruction } = parse(await req.json().catch(() => null));
    if (!id || !name) return bad("Style id and name are required.");
    const style = await prisma.answerStyle.update({ where: { id }, data: { name, instruction } });
    return NextResponse.json(style);
  });
}

export function DELETE(req: Request) {
  return handle(async () => {
    const id = new URL(req.url).searchParams.get("id") ?? parse(await req.json().catch(() => null)).id;
    if (!id) return bad("Style id is required.");
    await prisma.answerStyle.deleteMany({ where: { id } });
    return NextResponse.json({ ok: true });
  });
}
