import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    include: { contact: { select: { firstName: true, lastName: true } } },
  });
  return NextResponse.json(activities);
}
