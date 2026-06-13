import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const upcoming = searchParams.get("upcoming");

  let where = {};
  if (from && to) {
    where = { date: { gte: new Date(from), lte: new Date(to) } };
  } else if (upcoming) {
    where = { date: { gte: new Date() } };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { contact: { select: { firstName: true, lastName: true, company: true } } },
    orderBy: { date: "asc" },
    take: upcoming ? 10 : undefined,
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const appointment = await prisma.appointment.create({
    data: {
      title: body.title,
      date: new Date(body.date),
      endDate: body.endDate ? new Date(body.endDate) : null,
      type: body.type ?? "rdv",
      color: body.color ?? "orange",
      notes: body.notes ?? null,
      contactId: body.contactId ?? null,
    },
    include: { contact: { select: { firstName: true, lastName: true, company: true } } },
  });

  await prisma.activity.create({
    data: {
      type: "appointment_created",
      description: `"${appointment.title}" ajouté au calendrier`,
      contactId: appointment.contactId,
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}
