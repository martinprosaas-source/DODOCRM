import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const contacts = await prisma.contact.findMany({
    where: { pipelineStage: { not: "" } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(contacts);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const contact = await prisma.contact.update({
    where: { id: body.id },
    data: { pipelineStage: body.pipelineStage },
  });

  await prisma.activity.create({
    data: {
      type: "status_updated",
      description: `${contact.firstName} ${contact.lastName} déplacé vers "${body.pipelineStage}"`,
      contactId: contact.id,
    },
  });

  return NextResponse.json(contact);
}
