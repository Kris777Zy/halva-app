import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handle, serializeMessage } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export function GET(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const chat = await prisma.chatSession.findUnique({
      where: { id: params.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!chat) return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    return NextResponse.json({ ...chat, messages: chat.messages.map(serializeMessage) });
  });
}

export function DELETE(req: Request, { params }: Ctx) {
  return handle(async () => {
    const url = new URL(req.url);
    if (url.searchParams.get("clear") === "1") {
      await prisma.message.deleteMany({ where: { sessionId: params.id } });
      await prisma.chatSession.updateMany({ where: { id: params.id }, data: { title: "New chat" } });
      return NextResponse.json({ ok: true });
    }
    await prisma.chatSession.deleteMany({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}
