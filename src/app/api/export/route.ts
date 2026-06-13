import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const contacts = await prisma.contact.findMany({ orderBy: { createdAt: "desc" } });

  const headers = ["Prénom", "Nom", "Entreprise", "Téléphone", "Email", "Statut", "Notes", "Créé le"];
  const rows = contacts.map((c) => [
    c.firstName,
    c.lastName,
    c.company ?? "",
    c.phone ?? "",
    c.email ?? "",
    c.status,
    (c.notes ?? "").replace(/"/g, '""'),
    new Date(c.createdAt).toLocaleDateString("fr-FR"),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contacts-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
