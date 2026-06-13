import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const followUp = await prisma.followUp.update({
    where: { id },
    data: {
      contactId: body.contactId ?? null,
      dueDate: new Date(body.dueDate),
      priority: body.priority,
      notes: body.notes ?? null,
      status: body.status,
    },
    include: { contact: { select: { firstName: true, lastName: true, company: true } } },
  });

  if (body.status === "completed") {
    await prisma.activity.create({
      data: {
        type: "followup_completed",
        description: `Relance complétée pour ${followUp.contact ? `${followUp.contact.firstName} ${followUp.contact.lastName}` : "contact inconnu"}`,
        contactId: followUp.contactId,
      },
    });
  }

  return NextResponse.json(followUp);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.followUp.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
