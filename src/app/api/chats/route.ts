import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(async () => {
    const chats = await prisma.chatSession.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, style: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json(chats);
  });
}

export function POST(req: Request) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const chat = await prisma.chatSession.create({
      data: { style: typeof body.style === "string" && body.style ? body.style : "Simple" },
    });
    return NextResponse.json(chat, { status: 201 });
  });
}
