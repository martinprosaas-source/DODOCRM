import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? new Date().getFullYear().toString());

  // Objectifs de l'année
  const goals = await prisma.revenueGoal.findMany({
    where: { year },
    orderBy: { month: "asc" },
  });

  // CA réel : contacts clients avec montant estimé, groupé par mois de création
  const signedContacts = await prisma.contact.findMany({
    where: { status: "client", montantEstime: { not: null } },
    select: { montantEstime: true, createdAt: true },
  });

  // CA prospect : contacts prospects avec montant estimé
  const prospectContacts = await prisma.contact.findMany({
    where: { status: "prospect", montantEstime: { not: null } },
    select: { montantEstime: true, createdAt: true },
  });

  // Agréger par mois pour l'année demandée
  const signedByMonth: Record<number, number> = {};
  const prospectByMonth: Record<number, number> = {};

  for (const c of signedContacts) {
    const d = new Date(c.createdAt);
    if (d.getFullYear() === year) {
      const m = d.getMonth() + 1;
      signedByMonth[m] = (signedByMonth[m] ?? 0) + (c.montantEstime ?? 0);
    }
  }

  for (const c of prospectContacts) {
    const d = new Date(c.createdAt);
    if (d.getFullYear() === year) {
      const m = d.getMonth() + 1;
      prospectByMonth[m] = (prospectByMonth[m] ?? 0) + (c.montantEstime ?? 0);
    }
  }

  // Construire les 12 mois
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const goal = goals.find((g) => g.month === month);
    return {
      month,
      target: goal?.target ?? 0,
      goalId: goal?.id ?? null,
      signed: signedByMonth[month] ?? 0,
      prospect: prospectByMonth[month] ?? 0,
    };
  });

  const totalTarget = months.reduce((s, m) => s + m.target, 0);
  const totalSigned = months.reduce((s, m) => s + m.signed, 0);
  const totalProspect = months.reduce((s, m) => s + m.prospect, 0);

  return NextResponse.json({ year, months, totalTarget, totalSigned, totalProspect });
}

export async function PUT(req: NextRequest) {
  const body = await req.json(); // { year, month, target }
  const goal = await prisma.revenueGoal.upsert({
    where: { year_month: { year: body.year, month: body.month } },
    create: { year: body.year, month: body.month, target: parseFloat(body.target) },
    update: { target: parseFloat(body.target) },
  });
  return NextResponse.json(goal);
}
