import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(async () =>
    NextResponse.json(await prisma.product.findMany({ orderBy: { id: "asc" } }))
  );
}
