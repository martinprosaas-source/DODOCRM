import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const item = await prisma.priceItem.update({
    where: { id },
    data: {
      category: body.category,
      name: body.name,
      description: body.description ?? null,
      price: parseFloat(body.price),
      unit: body.unit,
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.priceItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
