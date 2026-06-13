import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      appointments: { orderBy: { date: "asc" } },
      followUps: { orderBy: { dueDate: "asc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contact);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      company: body.company ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      website: body.website ?? null,
      linkedin: body.linkedin ?? null,
      source: body.source ?? null,
      montantEstime: body.montantEstime ? parseFloat(body.montantEstime) : null,
      status: body.status,
      notes: body.notes ?? null,
      pipelineStage: body.pipelineStage,
    },
  });

  if (body.status !== existing.status) {
    await prisma.activity.create({
      data: {
        type: "status_updated",
        description: `Statut de ${contact.firstName} ${contact.lastName} changé en ${contact.status}`,
        contactId: contact.id,
      },
    });
  }

  return NextResponse.json(contact);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
