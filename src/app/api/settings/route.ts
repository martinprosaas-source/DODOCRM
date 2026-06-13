import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  let settings = await prisma.settings.findFirst();

  if (!settings) {
    settings = await prisma.settings.create({ data: body });
  } else {
    settings = await prisma.settings.update({
      where: { id: settings.id },
      data: {
        userName: body.userName,
        userEmail: body.userEmail,
        companyName: body.companyName,
        companyPhone: body.companyPhone ?? null,
        companyEmail: body.companyEmail ?? null,
        theme: body.theme,
      },
    });
  }

  return NextResponse.json(settings);
}
