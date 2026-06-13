"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS,
  SOURCE_LABELS, formatDate, formatDateTime
} from "@/lib/utils";
import {
  Building2, Phone, GripVertical, Euro, X, Mail, Globe, Link2,
  Calendar, Bell, Clock, Plus, Trash2, ExternalLink,
  UserPlus, CalendarPlus, RefreshCw, CheckCircle, Tag, Search, UserCheck
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactFull {
  id: string;
  firstName: string; lastName: string;
  company?: string; phone?: string; email?: string;
  website?: string; linkedin?: string; source?: string;
  montantEstime?: number; notes?: string;
  status: string; pipelineStage: string;
  createdAt: string; updatedAt: string;
  appointments: Array<{ id: string; title: string; date: string; color: string; type: string }>;
  followUps: Array<{ id: string; dueDate: string; priority: string; status: string; notes?: string }>;
  activities: Array<{ id: string; type: string; description: string; createdAt: string }>;
}

interface ContactCard {
  id: string; firstName: string; lastName: string;
  company?: string; phone?: string; montantEstime?: number;
  pipelineStage: string; status: string; updatedAt: string;
}

const STAGES = [
  { id: "new_lead",           label: "Nouveau Lead",     color: "border-blue-500/30 bg-blue-500/5",     dot: "bg-blue-500" },
  { id: "contacted",          label: "Contacté",         color: "border-purple-500/30 bg-purple-500/5", dot: "bg-purple-500" },
  { id: "meeting_scheduled",  label: "Réunion Planifiée",color: "border-amber-500/30 bg-amber-500/5",   dot: "bg-amber-500" },
  { id: "proposal_sent",      label: "Devis Envoyé",     color: "border-orange-500/30 bg-orange-500/5", dot: "bg-orange-500" },
  { id: "won",                label: "Gagné",            color: "border-emerald-500/30 bg-emerald-500/5",dot: "bg-emerald-500" },
  { id: "lost",               label: "Perdu",            color: "border-red-500/30 bg-red-500/5",       dot: "bg-red-500" },
] as const;

const STAGE_BADGE_COLORS: Record<string, string> = {
  new_lead:          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  contacted:         "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  meeting_scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  proposal_sent:     "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  won:               "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  lost:              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const activityIconMap: Record<string, React.ElementType> = {
  contact_added: UserPlus, appointment_created: CalendarPlus,
  status_updated: RefreshCw, followup_created: Bell, followup_completed: CheckCircle,
};

const emptyForm = {
  firstName: "", lastName: "", company: "", phone: "",
  email: "", status: "prospect", notes: "", pipelineStage: "new_lead",
};

function ensureUrl(url: string) { return url.startsWith("http") ? url : `https://${url}`; }

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ContactCard[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const dragMovedRef = useRef(false);

  // Drawer détail
  const [selectedContact, setSelectedContact] = useState<ContactFull | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Dialog création
  const [createOpen, setCreateOpen] = useState(false);
  const [createStage, setCreateStage] = useState("new_lead");
  const [createMode, setCreateMode] = useState<"new" | "existing">("new");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Sélection contact existant
  const [existingContacts, setExistingContacts] = useState<ContactCard[]>([]);
  const [existingSearch, setExistingSearch] = useState("");
  const [addingExistingId, setAddingExistingId] = useState<string | null>(null);

  // Dialog suppression
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchContacts = useCallback(async () => {
    const res = await fetch("/api/pipeline");
    setContacts(await res.json());
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const openDetail = async (contactId: string) => {
    if (dragMovedRef.current) return;
    setDrawerOpen(true);
    setLoadingDetail(true);
    const res = await fetch(`/api/contacts/${contactId}`);
    const data = await res.json();
    setSelectedContact(data);
    setLoadingDetail(false);
  };

  const closeDrawer = () => { setDrawerOpen(false); setTimeout(() => setSelectedContact(null), 300); };

  // ── Drag & Drop ──────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, contactId: string) => {
    dragMovedRef.current = false; // reset : sera mis à true seulement si l'utilisateur déplace vraiment
    setDraggingId(contactId);
    e.dataTransfer.setData("contactId", contactId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrag = () => {
    dragMovedRef.current = true; // déclenché uniquement lors d'un vrai déplacement, jamais sur un clic
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStage(null);
    setTimeout(() => { dragMovedRef.current = false; }, 100);
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const contactId = e.dataTransfer.getData("contactId");
    if (!contactId) return;
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact || contact.pipelineStage === stageId) { setDragOverStage(null); return; }

    setContacts((prev) => prev.map((c) => c.id === contactId ? { ...c, pipelineStage: stageId } : c));
    setDragOverStage(null);

    const res = await fetch("/api/pipeline", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contactId, pipelineStage: stageId }),
    });
    if (res.ok) toast(`Déplacé vers "${STAGES.find(s => s.id === stageId)?.label}"`);
    else { toast("Erreur lors du déplacement", "error"); fetchContacts(); }
  };

  // ── Création ─────────────────────────────────────────────────────────────

  const openCreate = async (stageId: string) => {
    setCreateStage(stageId);
    setForm({ ...emptyForm, pipelineStage: stageId });
    setCreateMode("new");
    setExistingSearch("");
    setCreateOpen(true);
    // Précharger contacts hors pipeline
    const res = await fetch("/api/contacts");
    const all: ContactCard[] = await res.json();
    setExistingContacts(all.filter(c => !c.pipelineStage || c.pipelineStage === ""));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) { toast("Prénom et nom obligatoires", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, pipelineStage: createStage }),
    });
    if (res.ok) {
      toast("Contact créé et ajouté au pipeline");
      setCreateOpen(false);
      fetchContacts();
    } else toast("Erreur lors de la création", "error");
    setSaving(false);
  };

  const handleAddExisting = async (contactId: string) => {
    setAddingExistingId(contactId);
    const res = await fetch("/api/pipeline", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contactId, pipelineStage: createStage }),
    });
    if (res.ok) {
      toast(`Contact ajouté dans "${STAGES.find(s => s.id === createStage)?.label}"`);
      setCreateOpen(false);
      fetchContacts();
    } else toast("Erreur lors de l'ajout", "error");
    setAddingExistingId(null);
  };

  // ── Retrait du pipeline ───────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch("/api/pipeline", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteId, pipelineStage: "" }),
    });
    if (res.ok) {
      toast("Contact retiré du pipeline");
      setDeleteId(null);
      closeDrawer();
      fetchContacts();
    } else toast("Erreur lors du retrait", "error");
  };

  const totalContacts = contacts.length;
  const c = selectedContact;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Pipeline" subtitle={`${totalContacts} contact${totalContacts > 1 ? "s" : ""} au total`} />

      <div className="flex-1 overflow-x-auto p-3 sm:p-6 animate-fade-in">
        <div className="flex gap-3 sm:gap-4 min-w-[640px]">
          {STAGES.map((stage) => {
            const stageContacts = contacts.filter(c => c.pipelineStage === stage.id);
            const isOver = dragOverStage === stage.id;

            return (
              <div key={stage.id} className="flex-1 min-w-[150px] sm:min-w-[170px]"
                onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
                onDrop={(e) => handleDrop(e, stage.id)}
                onDragLeave={() => setDragOverStage(null)}
              >
                {/* Header */}
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${stage.dot}`} />
                    <h3 className="text-sm font-semibold">{stage.label}</h3>
                    <span className="rounded-full bg-[rgb(var(--secondary))] px-1.5 py-0.5 text-[10px] font-medium text-[rgb(var(--muted-foreground))]">
                      {stageContacts.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openCreate(stage.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--secondary))] hover:text-[rgb(var(--foreground))] transition-colors"
                    title={`Ajouter dans ${stage.label}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Colonne */}
                <div className={`min-h-[400px] rounded-xl border-2 p-2 transition-all duration-150 space-y-2
                  ${isOver ? "border-orange-500/60 bg-orange-500/5 scale-[1.01]" : `border-dashed ${stage.color}`}`}>

                  {stageContacts.length === 0 && (
                    <button
                      onClick={() => openCreate(stage.id)}
                      className="flex w-full items-center justify-center gap-1.5 h-20 text-xs text-[rgb(var(--muted-foreground))]/50 hover:text-[rgb(var(--muted-foreground))] transition-colors rounded-lg hover:bg-[rgb(var(--secondary))]/50"
                    >
                      <Plus className="h-3.5 w-3.5" /> Ajouter un contact
                    </button>
                  )}

                  {stageContacts.map((contact) => (
                    <div
                      key={contact.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, contact.id)}
                      onDrag={handleDrag}
                      onDragEnd={handleDragEnd}
                      onClick={() => openDetail(contact.id)}
                      className={`group cursor-pointer rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 shadow-sm transition-all
                        hover:shadow-lg hover:-translate-y-0.5 hover:border-orange-500/30
                        ${draggingId === contact.id ? "opacity-40 scale-95" : ""}
                        ${selectedContact?.id === contact.id && drawerOpen ? "border-orange-500/50 ring-1 ring-orange-500/20" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 mt-0.5 text-[rgb(var(--muted-foreground))]/25 group-hover:text-[rgb(var(--muted-foreground))]/50 shrink-0 transition-colors" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-sm font-semibold truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                              {contact.firstName} {contact.lastName}
                            </p>
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-50 text-orange-500 transition-opacity" />
                          </div>
                          {contact.company && (
                            <p className="flex items-center gap-1 text-xs text-[rgb(var(--muted-foreground))] truncate">
                              <Building2 className="h-3 w-3 shrink-0" />{contact.company}
                            </p>
                          )}
                          {contact.phone && (
                            <p className="flex items-center gap-1 text-xs text-[rgb(var(--muted-foreground))]">
                              <Phone className="h-3 w-3 shrink-0" />{contact.phone}
                            </p>
                          )}
                          {contact.montantEstime != null && (
                            <p className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <Euro className="h-3 w-3 shrink-0" />
                              {contact.montantEstime.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
                            </p>
                          )}
                          <div className="flex items-center justify-between gap-1 flex-wrap pt-0.5">
                            <Badge className={STAGE_BADGE_COLORS[contact.pipelineStage] ?? ""}>
                              {STAGES.find(s => s.id === contact.pipelineStage)?.label}
                            </Badge>
                            <span className="text-[10px] text-[rgb(var(--muted-foreground))]">{formatDate(contact.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          DRAWER DÉTAIL CONTACT
      ══════════════════════════════════════════════════════════════════════ */}
      {drawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={closeDrawer}
          />

          {/* Panel */}
          <div
            className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-2xl transition-transform duration-300 ease-out
              ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
          >
            {/* Header du drawer */}
            <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-5 py-4">
              <div className="flex items-center gap-3">
                {c && (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-600 text-sm font-bold">
                    {c.firstName[0]}{c.lastName[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold">{c ? `${c.firstName} ${c.lastName}` : "Chargement..."}</p>
                  {c?.company && <p className="text-xs text-[rgb(var(--muted-foreground))]">{c.company}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {c && (
                  <>
                    <Link href={`/contacts/${c.id}`} onClick={closeDrawer}>
                      <Button variant="ghost" size="icon" title="Ouvrir la fiche complète">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" title="Retirer du pipeline"
                      onClick={() => setDeleteId(c.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" onClick={closeDrawer}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto">
              {loadingDetail ? (
                <div className="flex items-center justify-center h-40">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
                </div>
              ) : c ? (
                <div className="divide-y divide-[rgb(var(--border))]">

                  {/* Statut + étape */}
                  <div className="px-5 py-4 flex items-center gap-2 flex-wrap">
                    <Badge className={STATUS_COLORS[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                    <Badge className={STAGE_BADGE_COLORS[c.pipelineStage] ?? ""}>
                      {STAGES.find(s => s.id === c.pipelineStage)?.label}
                    </Badge>
                    {c.source && (
                      <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {SOURCE_LABELS[c.source] ?? c.source}
                      </Badge>
                    )}
                  </div>

                  {/* Coordonnées */}
                  <div className="px-5 py-4 space-y-3">
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-3 text-sm hover:text-orange-600 transition-colors group">
                        <Phone className="h-4 w-4 text-[rgb(var(--muted-foreground))] shrink-0 group-hover:text-orange-600" />
                        {c.phone}
                      </a>
                    )}
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-3 text-sm hover:text-orange-600 transition-colors group truncate">
                        <Mail className="h-4 w-4 text-[rgb(var(--muted-foreground))] shrink-0 group-hover:text-orange-600" />
                        <span className="truncate">{c.email}</span>
                      </a>
                    )}
                    {c.website && (
                      <a href={ensureUrl(c.website)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm hover:text-blue-500 transition-colors group truncate">
                        <Globe className="h-4 w-4 text-[rgb(var(--muted-foreground))] shrink-0 group-hover:text-blue-500" />
                        <span className="truncate">{c.website.replace(/^https?:\/\//, "")}</span>
                      </a>
                    )}
                    {c.linkedin && (
                      <a href={ensureUrl(c.linkedin)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm hover:text-blue-700 transition-colors group truncate">
                        <Link2 className="h-4 w-4 text-[rgb(var(--muted-foreground))] shrink-0 group-hover:text-blue-700" />
                        <span className="truncate">{c.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}</span>
                      </a>
                    )}
                    <div className="flex items-center gap-3 text-xs text-[rgb(var(--muted-foreground))]">
                      <Clock className="h-4 w-4 shrink-0" />
                      Créé le {formatDate(c.createdAt)}
                    </div>
                  </div>

                  {/* Montant estimé */}
                  {c.montantEstime != null && (
                    <div className="px-5 py-4">
                      <div className="flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/40 px-4 py-3">
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <Euro className="h-3.5 w-3.5" /> Montant estimé
                        </span>
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {c.montantEstime.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {c.notes && (
                    <div className="px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" /> Notes
                      </p>
                      <p className="text-sm text-[rgb(var(--foreground))] whitespace-pre-wrap leading-relaxed">{c.notes}</p>
                    </div>
                  )}

                  {/* Rendez-vous */}
                  {c.appointments.length > 0 && (
                    <div className="px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted-foreground))] mb-3 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> Rendez-vous ({c.appointments.length})
                      </p>
                      <div className="space-y-2">
                        {c.appointments.slice(0, 3).map(a => (
                          <div key={a.id} className="flex items-start gap-2 rounded-lg bg-[rgb(var(--secondary))] p-2.5">
                            <Calendar className="h-3.5 w-3.5 text-purple-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-medium">{a.title}</p>
                              <p className="text-[10px] text-[rgb(var(--muted-foreground))]">{formatDateTime(a.date)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Relances */}
                  {c.followUps.filter(f => f.status === "pending").length > 0 && (
                    <div className="px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted-foreground))] mb-3 flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5" /> Relances en attente
                      </p>
                      <div className="space-y-2">
                        {c.followUps.filter(f => f.status === "pending").map(f => (
                          <div key={f.id} className="flex items-center gap-2 rounded-lg bg-[rgb(var(--secondary))] p-2.5">
                            <Bell className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <Badge className={`text-[10px] ${PRIORITY_COLORS[f.priority]}`}>{PRIORITY_LABELS[f.priority]}</Badge>
                              <p className="text-[10px] text-[rgb(var(--muted-foreground))] mt-0.5">{formatDate(f.dueDate)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activité récente */}
                  {c.activities.length > 0 && (
                    <div className="px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted-foreground))] mb-3">
                        Activité récente
                      </p>
                      <div className="space-y-3">
                        {c.activities.slice(0, 4).map(activity => {
                          const Icon = activityIconMap[activity.type] ?? RefreshCw;
                          return (
                            <div key={activity.id} className="flex items-start gap-2.5">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--secondary))]">
                                <Icon className="h-3 w-3 text-[rgb(var(--muted-foreground))]" />
                              </div>
                              <div>
                                <p className="text-xs leading-snug">{activity.description}</p>
                                <p className="text-[10px] text-[rgb(var(--muted-foreground))]">{formatDateTime(activity.createdAt)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              ) : null}
            </div>

            {/* Footer */}
            {c && (
              <div className="border-t border-[rgb(var(--border))] px-5 py-3">
                <Link href={`/contacts/${c.id}`} onClick={closeDrawer}>
                  <Button variant="outline" className="w-full" size="sm">
                    <ExternalLink className="h-3.5 w-3.5" /> Ouvrir la fiche complète
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      {/* Dialog création */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={`Ajouter dans "${STAGES.find(s => s.id === createStage)?.label}"`}
        className="max-w-lg"
      >
        {/* Sélecteur de mode */}
        <div className="mb-5 flex rounded-lg border border-[rgb(var(--border))] p-1 gap-1">
          <button
            type="button"
            onClick={() => setCreateMode("new")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-all
              ${createMode === "new" ? "bg-orange-500 text-white shadow-sm" : "text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"}`}
          >
            <UserPlus className="h-3.5 w-3.5" /> Nouveau contact
          </button>
          <button
            type="button"
            onClick={() => setCreateMode("existing")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-all
              ${createMode === "existing" ? "bg-orange-500 text-white shadow-sm" : "text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"}`}
          >
            <UserCheck className="h-3.5 w-3.5" /> Contact existant
          </button>
        </div>

        {createMode === "new" ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Prénom *</Label>
                <Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="Marie" required />
              </div>
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Dupont" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Entreprise</Label>
              <Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Acme Corp" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Téléphone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+33 6 12 34 56 78" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="marie@example.com" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="prospect">Prospect</option>
                  <option value="client">Client</option>
                  <option value="lost">Perdu</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Montant estimé (€)</Label>
                <Input type="number" min="0" step="100" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="5000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes sur ce contact..." rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? "Création..." : "Créer et ajouter"}</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--muted-foreground))]" />
              <Input
                value={existingSearch}
                onChange={e => setExistingSearch(e.target.value)}
                placeholder="Rechercher un contact..."
                className="pl-9"
                autoFocus
              />
            </div>

            {/* Liste */}
            <div className="max-h-72 overflow-y-auto space-y-1 rounded-lg border border-[rgb(var(--border))] p-1">
              {existingContacts.length === 0 ? (
                <p className="py-8 text-center text-sm text-[rgb(var(--muted-foreground))]">
                  Tous les contacts sont déjà dans le pipeline
                </p>
              ) : (() => {
                const q = existingSearch.toLowerCase();
                const filtered = existingContacts.filter(c =>
                  `${c.firstName} ${c.lastName} ${c.company ?? ""}`.toLowerCase().includes(q)
                );
                return filtered.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[rgb(var(--muted-foreground))]">Aucun résultat</p>
                ) : filtered.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={addingExistingId === c.id}
                    onClick={() => handleAddExisting(c.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[rgb(var(--secondary))] disabled:opacity-50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 text-xs font-bold">
                      {c.firstName[0]}{c.lastName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{c.firstName} {c.lastName}</p>
                      {c.company && <p className="text-xs text-[rgb(var(--muted-foreground))] truncate">{c.company}</p>}
                    </div>
                    {addingExistingId === c.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                    ) : (
                      <Plus className="h-4 w-4 shrink-0 text-[rgb(var(--muted-foreground))] opacity-0 group-hover:opacity-100" />
                    )}
                  </button>
                ));
              })()}
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Fermer</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog suppression */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Retirer du pipeline ?">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Le contact sera retiré du pipeline mais restera accessible dans la section Contacts.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
          <Button variant="destructive" onClick={handleDelete}>Retirer du pipeline</Button>
        </div>
      </Dialog>
    </div>
  );
}
