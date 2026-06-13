import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const upcoming = searchParams.get("upcoming");

  const followUps = await prisma.followUp.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(upcoming ? { status: "pending" } : {}),
    },
    include: { contact: { select: { firstName: true, lastName: true, company: true } } },
    orderBy: [{ dueDate: "asc" }],
    take: upcoming ? 5 : undefined,
  });

  return NextResponse.json(followUps);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const followUp = await prisma.followUp.create({
    data: {
      contactId: body.contactId ?? null,
      dueDate: new Date(body.dueDate),
      priority: body.priority ?? "medium",
      notes: body.notes ?? null,
      status: "pending",
    },
    include: { contact: { select: { firstName: true, lastName: true, company: true } } },
  });

  await prisma.activity.create({
    data: {
      type: "followup_created",
      description: `Relance créée pour ${followUp.contact ? `${followUp.contact.firstName} ${followUp.contact.lastName}` : "contact inconnu"}`,
      contactId: followUp.contactId,
    },
  });

  return NextResponse.json(followUp, { status: 201 });
}
