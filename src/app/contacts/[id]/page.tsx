"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS,
  SOURCE_LABELS, formatDate, formatDateTime
} from "@/lib/utils";
import {
  ArrowLeft, Building2, Phone, Mail, Calendar, Bell,
  Pencil, Trash2, UserPlus, CalendarPlus, RefreshCw, CheckCircle,
  Clock, Globe, Link2, Euro, Tag
} from "lucide-react";
import Link from "next/link";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  email?: string;
  website?: string;
  linkedin?: string;
  source?: string;
  montantEstime?: number;
  status: string;
  notes?: string;
  pipelineStage: string;
  createdAt: string;
  appointments: Array<{ id: string; title: string; date: string; notes?: string }>;
  followUps: Array<{ id: string; dueDate: string; priority: string; notes?: string; status: string }>;
  activities: Array<{ id: string; type: string; description: string; createdAt: string }>;
}

const activityIconMap: Record<string, React.ElementType> = {
  contact_added: UserPlus,
  appointment_created: CalendarPlus,
  status_updated: RefreshCw,
  followup_created: Bell,
  followup_completed: CheckCircle,
};

function ensureUrl(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
}

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", company: "", phone: "",
    email: "", website: "", linkedin: "", source: "",
    montantEstime: "", status: "prospect", notes: "",
  });

  const fetchContact = async () => {
    const res = await fetch(`/api/contacts/${id}`);
    if (!res.ok) { router.push("/contacts"); return; }
    const data = await res.json();
    setContact(data);
    setForm({
      firstName: data.firstName, lastName: data.lastName,
      company: data.company ?? "", phone: data.phone ?? "",
      email: data.email ?? "", website: data.website ?? "",
      linkedin: data.linkedin ?? "", source: data.source ?? "",
      montantEstime: data.montantEstime?.toString() ?? "",
      status: data.status, notes: data.notes ?? "",
    });
  };

  useEffect(() => { fetchContact(); }, [id]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, pipelineStage: contact?.pipelineStage }),
    });
    if (res.ok) {
      toast("Contact modifié");
      setEditOpen(false);
      fetchContact();
    } else {
      toast("Erreur lors de la modification", "error");
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Contact supprimé");
      router.push("/contacts");
    } else {
      toast("Erreur lors de la suppression", "error");
    }
  };

  if (!contact) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar
        title={`${contact.firstName} ${contact.lastName}`}
        subtitle={contact.company ?? "Contact"}
      >
        <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} title="Modifier">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)} title="Supprimer">
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </TopBar>

      <div className="flex-1 p-3 sm:p-6 animate-fade-in">
        <div className="mb-4 sm:mb-5">
          <Link href="/contacts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Retour aux contacts
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Infos principales */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="pt-5">
                <div className="flex flex-col items-center text-center gap-3 pb-4 border-b border-[rgb(var(--border))]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-900/20 text-orange-600 text-xl font-bold">
                    {contact.firstName[0]}{contact.lastName[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{contact.firstName} {contact.lastName}</h2>
                    {contact.company && (
                      <p className="text-sm text-[rgb(var(--muted-foreground))]">{contact.company}</p>
                    )}
                    <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                      <Badge className={STATUS_COLORS[contact.status]}>
                        {STATUS_LABELS[contact.status]}
                      </Badge>
                      {contact.source && (
                        <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {SOURCE_LABELS[contact.source] ?? contact.source}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-3 text-sm hover:text-orange-600 transition-colors group">
                      <Phone className="h-4 w-4 text-[rgb(var(--muted-foreground))] shrink-0 group-hover:text-orange-600" />
                      {contact.phone}
                    </a>
                  )}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-sm hover:text-orange-600 transition-colors group truncate">
                      <Mail className="h-4 w-4 text-[rgb(var(--muted-foreground))] shrink-0 group-hover:text-orange-600" />
                      <span className="truncate">{contact.email}</span>
                    </a>
                  )}
                  {contact.website && (
                    <a href={ensureUrl(contact.website)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:text-blue-600 transition-colors group truncate">
                      <Globe className="h-4 w-4 text-[rgb(var(--muted-foreground))] shrink-0 group-hover:text-blue-600" />
                      <span className="truncate">{contact.website.replace(/^https?:\/\//, "")}</span>
                    </a>
                  )}
                  {contact.linkedin && (
                    <a href={ensureUrl(contact.linkedin)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:text-blue-700 transition-colors group truncate">
                      <Link2 className="h-4 w-4 text-[rgb(var(--muted-foreground))] shrink-0 group-hover:text-blue-700" />
                      <span className="truncate">{contact.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}</span>
                    </a>
                  )}
                  {contact.company && (
                    <div className="flex items-center gap-3 text-sm text-[rgb(var(--muted-foreground))]">
                      <Building2 className="h-4 w-4 shrink-0" />
                      {contact.company}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-[rgb(var(--muted-foreground))]">
                    <Clock className="h-4 w-4 shrink-0" />
                    Créé le {formatDate(contact.createdAt)}
                  </div>
                </div>

                {/* Montant estimé */}
                {contact.montantEstime != null && (
                  <div className="mt-4 pt-4 border-t border-[rgb(var(--border))]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium text-[rgb(var(--muted-foreground))]">
                        <Euro className="h-3.5 w-3.5" />
                        Montant estimé
                      </div>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {contact.montantEstime.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>

          {/* Rendez-vous & Relances & Activités */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notes — en premier et bien en évidence */}
            {contact.notes && (
              <Card className="border-amber-200/60 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-900/10">
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                      <Tag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-2">Notes</p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{contact.notes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Rendez-vous
                  </CardTitle>
                  <Link href="/calendar">
                    <Button variant="outline" size="sm">
                      <CalendarPlus className="h-3.5 w-3.5" /> Ajouter
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {contact.appointments.length === 0 ? (
                  <p className="text-sm text-[rgb(var(--muted-foreground))] py-2">Aucun rendez-vous</p>
                ) : (
                  <div className="space-y-2">
                    {contact.appointments.map((appt) => (
                      <div key={appt.id} className="flex items-start gap-3 rounded-lg bg-[rgb(var(--secondary))] p-3">
                        <Calendar className="h-4 w-4 mt-0.5 text-purple-600 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{appt.title}</p>
                          <p className="text-xs text-[rgb(var(--muted-foreground))]">{formatDateTime(appt.date)}</p>
                          {appt.notes && <p className="text-xs text-[rgb(var(--muted-foreground))] mt-0.5">{appt.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-4 w-4" /> Relances
                  </CardTitle>
                  <Link href="/followups">
                    <Button variant="outline" size="sm">
                      <Bell className="h-3.5 w-3.5" /> Ajouter
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {contact.followUps.length === 0 ? (
                  <p className="text-sm text-[rgb(var(--muted-foreground))] py-2">Aucune relance</p>
                ) : (
                  <div className="space-y-2">
                    {contact.followUps.map((fu) => (
                      <div key={fu.id} className="flex items-start gap-3 rounded-lg bg-[rgb(var(--secondary))] p-3">
                        <Bell className="h-4 w-4 mt-0.5 text-orange-600 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={PRIORITY_COLORS[fu.priority]}>{PRIORITY_LABELS[fu.priority]}</Badge>
                            {fu.status === "completed" && (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Complétée</Badge>
                            )}
                          </div>
                          <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">{formatDateTime(fu.dueDate)}</p>
                          {fu.notes && <p className="text-xs text-[rgb(var(--muted-foreground))] mt-0.5">{fu.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historique des activités</CardTitle>
              </CardHeader>
              <CardContent>
                {contact.activities.length === 0 ? (
                  <p className="text-sm text-[rgb(var(--muted-foreground))] py-2">Aucune activité</p>
                ) : (
                  <div className="relative space-y-4 before:absolute before:left-3.5 before:top-0 before:h-full before:w-px before:bg-[rgb(var(--border))]">
                    {contact.activities.map((activity) => {
                      const Icon = activityIconMap[activity.type] ?? RefreshCw;
                      return (
                        <div key={activity.id} className="flex items-start gap-4 pl-1">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--secondary))] border border-[rgb(var(--border))] z-10">
                            <Icon className="h-3.5 w-3.5 text-[rgb(var(--muted-foreground))]" />
                          </div>
                          <div>
                            <p className="text-sm">{activity.description}</p>
                            <p className="text-xs text-[rgb(var(--muted-foreground))]">{formatDateTime(activity.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog modification */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Modifier le contact" className="max-w-2xl">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Prénom *</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Entreprise</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                <option value="">— Sélectionner —</option>
                <option value="website">Site web</option>
                <option value="event">Événement</option>
                <option value="referral">Référence</option>
                <option value="other">Autre</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Site web</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[rgb(var(--muted-foreground))]" />
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://exemple.com" className="pl-8" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>LinkedIn</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[rgb(var(--muted-foreground))]" />
                <Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/..." className="pl-8" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="prospect">Prospect</option>
                <option value="client">Client</option>
                <option value="lost">Perdu</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Montant estimé (€)</Label>
              <Input type="number" min="0" step="100" value={form.montantEstime}
                onChange={(e) => setForm({ ...form, montantEstime: e.target.value })}
                placeholder="5000" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Supprimer le contact ?">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Cette action est irréversible. Le contact et toutes ses données seront supprimés.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteOpen(false)}>Annuler</Button>
          <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
        </div>
      </Dialog>
    </div>
  );
}
