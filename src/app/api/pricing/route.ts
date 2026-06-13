import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.priceItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.priceItem.create({
    data: {
      category: body.category,
      name: body.name,
      description: body.description ?? null,
      price: parseFloat(body.price),
      unit: body.unit ?? "forfait",
    },
  });
  return NextResponse.json(item, { status: 201 });
}
