import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Nettoyer la BDD
  await prisma.activity.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.settings.deleteMany();

  // Paramètres
  await prisma.settings.create({
    data: {
      userName: "Martin Chevalier",
      userEmail: "martin@dodoCRM.fr",
      companyName: "DODO CRM",
      companyPhone: "+33 6 12 34 56 78",
      companyEmail: "contact@dodoCRM.fr",
      theme: "system",
    },
  });

  // Contacts
  const contactsData = [
    {
      firstName: "Sophie", lastName: "Martin", company: "Agence Web Créa",
      phone: "+33 6 11 22 33 44", email: "sophie.martin@crea.fr",
      status: "client", pipelineStage: "won",
      notes: "Cliente fidèle depuis 2023. Souhaite une refonte de son site en 2024.",
    },
    {
      firstName: "Thomas", lastName: "Bernard", company: "Tech Solutions",
      phone: "+33 7 22 33 44 55", email: "t.bernard@techsolutions.fr",
      status: "prospect", pipelineStage: "meeting_scheduled",
      notes: "Intéressé par notre offre premium. Décideur principal.",
    },
    {
      firstName: "Emma", lastName: "Dubois", company: "Boutique Mode Paris",
      phone: "+33 6 33 44 55 66", email: "emma@boutiqueparis.fr",
      status: "prospect", pipelineStage: "proposal_sent",
      notes: "A demandé un devis pour une boutique en ligne.",
    },
    {
      firstName: "Lucas", lastName: "Moreau", company: "Restaurant Le Terroir",
      phone: "+33 6 44 55 66 77", email: "lucas.moreau@leterroir.fr",
      status: "client", pipelineStage: "won",
      notes: "Propriétaire du restaurant. Gère toute la communication.",
    },
    {
      firstName: "Chloé", lastName: "Petit", company: "Cabinet Comptable CFP",
      phone: "+33 6 55 66 77 88", email: "c.petit@cfp-compta.fr",
      status: "prospect", pipelineStage: "contacted",
      notes: "A répondu positivement à notre email de prospection.",
    },
    {
      firstName: "Antoine", lastName: "Roux", company: "Immobilier Côte Azur",
      phone: "+33 6 66 77 88 99", email: "a.roux@immo-coteazur.fr",
      status: "lost", pipelineStage: "lost",
      notes: "A finalement choisi un concurrent. À retenter dans 6 mois.",
    },
    {
      firstName: "Isabelle", lastName: "Simon", company: "Clinique Bien-Être",
      phone: "+33 6 77 88 99 00", email: "i.simon@clinique-bienetre.fr",
      status: "prospect", pipelineStage: "new_lead",
      notes: "Contact obtenu via le salon professionnel de Lyon.",
    },
    {
      firstName: "Marc", lastName: "Laurent", company: "Startup FinTech",
      phone: "+33 7 88 99 00 11", email: "marc@fintech-startup.io",
      status: "client", pipelineStage: "won",
      notes: "Client très satisfait. A recommandé plusieurs prospects.",
    },
    {
      firstName: "Julie", lastName: "Legrand", company: "École de Yoga",
      phone: "+33 6 99 00 11 22", email: "julie@ecole-yoga.fr",
      status: "prospect", pipelineStage: "new_lead",
      notes: "Cherche une solution simple pour gérer ses réservations.",
    },
    {
      firstName: "Nicolas", lastName: "Garcia", company: "Consulting RH Pro",
      phone: "+33 6 00 11 22 33", email: "n.garcia@rh-pro.fr",
      status: "prospect", pipelineStage: "contacted",
      notes: "Consultant indépendant. Intéressé par le CRM pour 2-3 collaborateurs.",
    },
  ];

  const contacts = [];
  for (const data of contactsData) {
    const contact = await prisma.contact.create({ data });
    contacts.push(contact);
  }

  console.log(`✅ ${contacts.length} contacts créés`);

  // Rendez-vous
  const now = new Date();
  const appointmentsData = [
    {
      title: "Réunion de lancement projet",
      date: addDays(now, 2, 10, 0),
      contactId: contacts[1].id,
      notes: "Présentation complète de notre offre. Apporter les mockups.",
    },
    {
      title: "Démo produit",
      date: addDays(now, 3, 14, 30),
      contactId: contacts[2].id,
      notes: "Démonstration de la boutique en ligne. Thomas sera présent.",
    },
    {
      title: "Revue mensuelle",
      date: addDays(now, 5, 11, 0),
      contactId: contacts[0].id,
      notes: "Point mensuel sur les performances du site.",
    },
    {
      title: "Appel découverte",
      date: addDays(now, 7, 9, 0),
      contactId: contacts[4].id,
      notes: "Premier contact téléphonique pour comprendre les besoins.",
    },
    {
      title: "Signature contrat",
      date: addDays(now, 10, 15, 0),
      contactId: contacts[7].id,
      notes: "Finalisation du contrat annuel.",
    },
    {
      title: "Formation CRM",
      date: addDays(now, -3, 10, 0),
      contactId: contacts[3].id,
      notes: "Formation effectuée avec succès.",
    },
    {
      title: "Présentation commerciale",
      date: addDays(now, 14, 9, 30),
      contactId: contacts[6].id,
      notes: "Première présentation pour la clinique. Préparer cas d'usage santé.",
    },
  ];

  const appointments = [];
  for (const data of appointmentsData) {
    const appt = await prisma.appointment.create({ data });
    appointments.push(appt);
  }

  console.log(`✅ ${appointments.length} rendez-vous créés`);

  // Relances
  const followUpsData = [
    {
      contactId: contacts[4].id,
      dueDate: addDays(now, -1, 9, 0),
      priority: "high",
      status: "pending",
      notes: "Envoyer la proposition commerciale révisée.",
    },
    {
      contactId: contacts[1].id,
      dueDate: addDays(now, 1, 10, 0),
      priority: "high",
      status: "pending",
      notes: "Confirmer le rendez-vous et envoyer l'ordre du jour.",
    },
    {
      contactId: contacts[2].id,
      dueDate: addDays(now, 3, 9, 0),
      priority: "medium",
      status: "pending",
      notes: "Faire un suivi sur la proposition de devis.",
    },
    {
      contactId: contacts[6].id,
      dueDate: addDays(now, 5, 10, 0),
      priority: "medium",
      status: "pending",
      notes: "Envoyer la documentation technique.",
    },
    {
      contactId: contacts[9].id,
      dueDate: addDays(now, 7, 14, 0),
      priority: "low",
      status: "pending",
      notes: "Reprendre contact pour faire le point.",
    },
    {
      contactId: contacts[5].id,
      dueDate: addDays(now, -7, 9, 0),
      priority: "low",
      status: "completed",
      notes: "Envoi d'email de tentative de réactivation.",
    },
    {
      contactId: contacts[0].id,
      dueDate: addDays(now, 15, 9, 0),
      priority: "medium",
      status: "pending",
      notes: "Proposer la nouvelle offre de maintenance.",
    },
    {
      contactId: contacts[8].id,
      dueDate: addDays(now, -2, 10, 0),
      priority: "high",
      status: "pending",
      notes: "Préparer une démonstration personnalisée pour son activité yoga.",
    },
  ];

  const followUps = [];
  for (const data of followUpsData) {
    const fu = await prisma.followUp.create({ data });
    followUps.push(fu);
  }

  console.log(`✅ ${followUps.length} relances créées`);

  // Activités
  const activitiesData = [
    { type: "contact_added", description: "Sophie Martin ajoutée comme cliente", contactId: contacts[0].id, createdAt: addDays(now, -15) },
    { type: "contact_added", description: "Thomas Bernard ajouté comme prospect", contactId: contacts[1].id, createdAt: addDays(now, -10) },
    { type: "appointment_created", description: 'Rendez-vous "Réunion de lancement" créé', contactId: contacts[1].id, createdAt: addDays(now, -8) },
    { type: "status_updated", description: "Statut d'Antoine Roux changé en perdu", contactId: contacts[5].id, createdAt: addDays(now, -6) },
    { type: "contact_added", description: "Emma Dubois ajoutée comme prospect", contactId: contacts[2].id, createdAt: addDays(now, -5) },
    { type: "followup_created", description: "Relance créée pour Chloé Petit", contactId: contacts[4].id, createdAt: addDays(now, -4) },
    { type: "appointment_created", description: 'Rendez-vous "Démo produit" créé', contactId: contacts[2].id, createdAt: addDays(now, -3) },
    { type: "status_updated", description: "Thomas Bernard déplacé vers Réunion Planifiée", contactId: contacts[1].id, createdAt: addDays(now, -2) },
    { type: "followup_completed", description: "Relance complétée pour Antoine Roux", contactId: contacts[5].id, createdAt: addDays(now, -1) },
    { type: "contact_added", description: "Julie Legrand ajoutée comme prospect", contactId: contacts[8].id, createdAt: addDays(now, -1) },
  ];

  for (const data of activitiesData) {
    await prisma.activity.create({ data });
  }

  console.log(`✅ ${activitiesData.length} activités créées`);
  console.log("🎉 Base de données peuplée avec succès !");
}

function addDays(date: Date, days: number, hours = 0, minutes = 0): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
