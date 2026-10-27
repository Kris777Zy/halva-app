import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handle, serializeMessage, withProducts } from "@/lib/api";
import { buildReply } from "@/lib/ai";

export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const styleName = typeof body.style === "string" ? body.style : "Simple";
    if (!text) return NextResponse.json({ error: "Message is empty." }, { status: 400 });

    const chat = await prisma.chatSession.findUnique({ where: { id: params.id } });
    if (!chat) return NextResponse.json({ error: "Chat not found." }, { status: 404 });

    const userMsg = await prisma.message.create({
      data: { sessionId: chat.id, role: "user", content: text },
    });

    // Mock AI: simulate thinking time, then answer from the knowledge base.
    await sleep(1500);
    const [style, knowledge, products] = await Promise.all([
      prisma.answerStyle.findFirst({ where: { name: styleName } }),
      prisma.knowledgeItem.findMany(),
      prisma.product.findMany({ orderBy: { id: "asc" } }),
    ]);
    const reply = buildReply(text, style, knowledge, products);

    const assistantMsg = await prisma.message.create({
      data: {
        sessionId: chat.id,
        role: "assistant",
        content: withProducts(reply.content, reply.productIds),
      },
    });

    const isFirst = (await prisma.message.count({ where: { sessionId: chat.id } })) <= 2;
    const title = isFirst ? (text.length > 40 ? `${text.slice(0, 40)}…` : text) : chat.title;
    await prisma.chatSession.update({
      where: { id: chat.id },
      data: { style: styleName, title },
    });

    return NextResponse.json({
      title,
      messages: [serializeMessage(userMsg), serializeMessage(assistantMsg)],
    });
  });
}
