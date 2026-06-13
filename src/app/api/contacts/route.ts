import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";

  const contacts = await prisma.contact.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { company: { contains: search } },
                { email: { contains: search } },
              ],
            }
          : {},
        status ? { status } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contact = await prisma.contact.create({
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
      status: body.status ?? "prospect",
      notes: body.notes ?? null,
      pipelineStage: body.pipelineStage ?? "new_lead",
    },
  });

  await prisma.activity.create({
    data: {
      type: "contact_added",
      description: `${contact.firstName} ${contact.lastName} ajouté comme ${contact.status}`,
      contactId: contact.id,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
