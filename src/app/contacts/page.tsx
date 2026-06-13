"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { STATUS_COLORS, STATUS_LABELS, SOURCE_LABELS, formatDate } from "@/lib/utils";
import {
  Plus, Search, Pencil, Trash2, ChevronRight, Building2, Phone, Mail,
  User, Globe, Link2, GitBranch
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
  createdAt: string;
}

const STAGES = [
  { id: "new_lead",           label: "Nouveau Lead" },
  { id: "contacted",          label: "Contacté" },
  { id: "meeting_scheduled",  label: "Réunion Planifiée" },
  { id: "proposal_sent",      label: "Devis Envoyé" },
  { id: "won",                label: "Gagné" },
  { id: "lost",               label: "Perdu" },
];

const emptyForm = {
  firstName: "", lastName: "", company: "", phone: "",
  email: "", website: "", linkedin: "", source: "",
  montantEstime: "", status: "prospect", notes: "",
  pipelineStage: "",
};

export default function ContactsPage() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addToPipeline, setAddToPipeline] = useState(false);

  const fetchContacts = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/contacts?${params}`);
    const data = await res.json();
    setContacts(data);
    setIsLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(fetchContacts, 300);
    return () => clearTimeout(timeout);
  }, [fetchContacts]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setAddToPipeline(false);
    setDialogOpen(true);
  };

  const openEdit = (c: Contact & { pipelineStage?: string }) => {
    setEditingId(c.id);
    const inPipeline = !!c.pipelineStage && c.pipelineStage !== "";
    setAddToPipeline(inPipeline);
    setForm({
      firstName: c.firstName, lastName: c.lastName, company: c.company ?? "",
      phone: c.phone ?? "", email: c.email ?? "",
      website: c.website ?? "", linkedin: c.linkedin ?? "",
      source: c.source ?? "", montantEstime: c.montantEstime?.toString() ?? "",
      status: c.status, notes: c.notes ?? "",
      pipelineStage: c.pipelineStage ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) {
      toast("Prénom et nom obligatoires", "error");
      return;
    }
    const payload = {
      ...form,
      pipelineStage: addToPipeline ? (form.pipelineStage || "new_lead") : "",
    };
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/contacts/${editingId}` : "/api/contacts";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (res.ok) {
      toast(editingId ? "Contact modifié" : "Contact créé");
      setDialogOpen(false);
      fetchContacts();
    } else {
      toast("Erreur lors de la sauvegarde", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/contacts/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast("Contact supprimé");
      setDeleteId(null);
      fetchContacts();
    } else {
      toast("Erreur lors de la suppression", "error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Contacts" subtitle={`${contacts.length} contact${contacts.length > 1 ? "s" : ""}`}>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4" />
          Nouveau contact
        </Button>
      </TopBar>

      <div className="flex-1 p-3 sm:p-6 animate-fade-in">
        {/* Filtres */}
        <div className="mb-4 flex flex-wrap gap-2 sm:mb-5 sm:gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--muted-foreground))]" />
            <Input
              placeholder="Rechercher un contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
            <option value="">Tous les statuts</option>
            <option value="prospect">Prospect</option>
            <option value="client">Client</option>
            <option value="lost">Perdu</option>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden overflow-x-auto card-elevated">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <User className="h-10 w-10 text-[rgb(var(--muted-foreground))] mb-3" />
              <p className="text-sm font-medium">Aucun contact trouvé</p>
              <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                {search || statusFilter ? "Essayez d'ajuster vos filtres" : "Créez votre premier contact"}
              </p>
              {!search && !statusFilter && (
                <Button onClick={openCreate} className="mt-4" size="sm">
                  <Plus className="h-4 w-4" /> Créer un contact
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--secondary))]">
                  <th className="px-4 py-3 text-left font-medium text-[rgb(var(--muted-foreground))]">Nom</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-[rgb(var(--muted-foreground))] sm:table-cell">Entreprise</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-[rgb(var(--muted-foreground))] md:table-cell">Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-[rgb(var(--muted-foreground))]">Statut</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-[rgb(var(--muted-foreground))] xl:table-cell">Source</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-[rgb(var(--muted-foreground))] xl:table-cell">Montant</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-[rgb(var(--muted-foreground))] lg:table-cell">Créé le</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact, i) => (
                  <tr
                    key={contact.id}
                    className="group border-b border-[rgb(var(--border))] last:border-0 hover:bg-[rgb(var(--secondary))] transition-colors"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/contacts/${contact.id}`} className="flex items-start gap-2 group/link">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 text-xs font-bold mt-0.5">
                          {contact.firstName[0]}{contact.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium group-hover/link:text-orange-600 transition-colors">
                            {contact.firstName} {contact.lastName}
                          </p>
                          {contact.notes && (
                            <p className="mt-0.5 text-xs text-[rgb(var(--muted-foreground))] line-clamp-2 max-w-[220px]">
                              {contact.notes}
                            </p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-[rgb(var(--muted-foreground))] sm:table-cell">
                      {contact.company ? (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          {contact.company}
                        </span>
                      ) : <span className="text-[rgb(var(--muted-foreground))]/40">—</span>}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="space-y-0.5">
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-foreground))] hover:text-orange-600 transition-colors">
                            <Phone className="h-3 w-3 shrink-0" />{contact.phone}
                          </a>
                        )}
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-foreground))] hover:text-orange-600 transition-colors">
                            <Mail className="h-3 w-3 shrink-0" />{contact.email}
                          </a>
                        )}
                        <div className="flex items-center gap-2 pt-0.5">
                          {contact.website && (
                            <a href={contact.website.startsWith("http") ? contact.website : `https://${contact.website}`} target="_blank" rel="noopener noreferrer"
                              className="text-[rgb(var(--muted-foreground))] hover:text-blue-500 transition-colors" title="Site web" onClick={(e) => e.stopPropagation()}>
                              <Globe className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {contact.linkedin && (
                            <a href={contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`} target="_blank" rel="noopener noreferrer"
                              className="text-[rgb(var(--muted-foreground))] hover:text-blue-600 transition-colors" title="LinkedIn" onClick={(e) => e.stopPropagation()}>
                              <Link2 className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_COLORS[contact.status]}>
                        {STATUS_LABELS[contact.status] ?? contact.status}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 xl:table-cell">
                      {contact.source ? (
                        <span className="text-xs text-[rgb(var(--muted-foreground))]">{SOURCE_LABELS[contact.source] ?? contact.source}</span>
                      ) : <span className="text-[rgb(var(--muted-foreground))]/40">—</span>}
                    </td>
                    <td className="hidden px-4 py-3 xl:table-cell">
                      {contact.montantEstime != null ? (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {contact.montantEstime.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
                        </span>
                      ) : <span className="text-[rgb(var(--muted-foreground))]/40">—</span>}
                    </td>
                    <td className="hidden px-4 py-3 text-[rgb(var(--muted-foreground))] text-xs lg:table-cell">
                      {formatDate(contact.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(contact)} title="Modifier">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(contact.id)} title="Supprimer">
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                        <Link href={`/contacts/${contact.id}`}>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Dialog création/édition */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? "Modifier le contact" : "Nouveau contact"}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input id="firstName" value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Marie" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Nom *</Label>
              <Input id="lastName" value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Dupont" required />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="company">Entreprise</Label>
              <Input id="company" value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Acme Corp" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source">Source</Label>
              <Select id="source" value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}>
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
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+33 6 12 34 56 78" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="marie@example.com" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="website">Site web</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[rgb(var(--muted-foreground))]" />
                <Input id="website" value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://exemple.com" className="pl-8" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[rgb(var(--muted-foreground))]" />
                <Input id="linkedin" value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/..." className="pl-8" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="status">Statut</Label>
              <Select id="status" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="prospect">Prospect</option>
                <option value="client">Client</option>
                <option value="lost">Perdu</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="montantEstime">Montant estimé (€)</Label>
              <Input id="montantEstime" type="number" min="0" step="100"
                value={form.montantEstime}
                onChange={(e) => setForm({ ...form, montantEstime: e.target.value })}
                placeholder="5000" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notes sur ce contact..." rows={3} />
          </div>

          {/* Bloc pipeline */}
          <div className="rounded-xl border border-[rgb(var(--border))] p-4 space-y-3">
            <button
              type="button"
              onClick={() => setAddToPipeline(!addToPipeline)}
              className="flex w-full items-center justify-between"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <GitBranch className="h-4 w-4 text-orange-500" />
                Ajouter au pipeline
              </span>
              <div className={`relative h-5 w-9 rounded-full transition-colors ${addToPipeline ? "bg-orange-500" : "bg-[rgb(var(--secondary))] border border-[rgb(var(--border))]"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${addToPipeline ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </button>
            {addToPipeline && (
              <div className="space-y-1.5">
                <Label>Étape du pipeline</Label>
                <Select value={form.pipelineStage || "new_lead"} onChange={e => setForm({ ...form, pipelineStage: e.target.value })}>
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button type="submit">{editingId ? "Enregistrer" : "Créer"}</Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog confirmation suppression */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer le contact ?">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Cette action est irréversible. Le contact et toutes ses données associées seront supprimés.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
          <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
        </div>
      </Dialog>
    </div>
  );
}
