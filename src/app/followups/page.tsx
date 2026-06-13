"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { PRIORITY_COLORS, PRIORITY_LABELS, formatDate, isOverdue } from "@/lib/utils";
import { Plus, CheckCircle2, Pencil, Trash2, Bell, AlertTriangle, Filter } from "lucide-react";
import Link from "next/link";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
}

interface FollowUp {
  id: string;
  contactId?: string;
  contact?: { firstName: string; lastName: string; company?: string };
  dueDate: string;
  priority: string;
  notes?: string;
  status: string;
}

const emptyForm = { contactId: "", dueDate: "", priority: "medium", notes: "", status: "pending" };

export default function FollowUpsPage() {
  const { toast } = useToast();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFollowUps = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/followups?${params}`);
    const data = await res.json();
    setFollowUps(data);
    setIsLoading(false);
  }, [statusFilter]);

  const fetchContacts = useCallback(async () => {
    const res = await fetch("/api/contacts");
    const data = await res.json();
    setContacts(data);
  }, []);

  useEffect(() => {
    fetchFollowUps();
    fetchContacts();
  }, [fetchFollowUps, fetchContacts]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, dueDate: new Date().toISOString().slice(0, 10) });
    setDialogOpen(true);
  };

  const openEdit = (fu: FollowUp) => {
    setEditingId(fu.id);
    setForm({
      contactId: fu.contactId ?? "",
      dueDate: new Date(fu.dueDate).toISOString().slice(0, 10),
      priority: fu.priority,
      notes: fu.notes ?? "",
      status: fu.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.dueDate) {
      toast("Date obligatoire", "error");
      return;
    }
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/followups/${editingId}` : "/api/followups";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, contactId: form.contactId || null }),
    });
    if (res.ok) {
      toast(editingId ? "Relance modifiée" : "Relance créée");
      setDialogOpen(false);
      fetchFollowUps();
    } else {
      toast("Erreur lors de la sauvegarde", "error");
    }
  };

  const markCompleted = async (fu: FollowUp) => {
    const res = await fetch(`/api/followups/${fu.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fu, status: "completed", contactId: fu.contactId || null }),
    });
    if (res.ok) {
      toast("Relance marquée comme complétée ✓");
      fetchFollowUps();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/followups/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast("Relance supprimée");
      setDeleteId(null);
      fetchFollowUps();
    }
  };

  // Trier: en retard d'abord, puis par date
  const sortedFollowUps = [...followUps].sort((a, b) => {
    const aOver = isOverdue(a.dueDate);
    const bOver = isOverdue(b.dueDate);
    if (aOver && !bOver) return -1;
    if (!aOver && bOver) return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const overdueCount = followUps.filter((fu) => fu.status === "pending" && isOverdue(fu.dueDate)).length;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar
        title="Relances"
        subtitle={`${followUps.length} relance${followUps.length > 1 ? "s" : ""}`}
      >
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nouvelle relance
        </Button>
      </TopBar>

      <div className="flex-1 p-3 sm:p-6 animate-fade-in">
        {/* Alerte retard */}
        {overdueCount > 0 && (
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {overdueCount} relance{overdueCount > 1 ? "s" : ""} en retard
            </p>
          </div>
        )}

        {/* Filtres */}
        <div className="mb-5 flex items-center gap-3">
          <Filter className="h-4 w-4 text-[rgb(var(--muted-foreground))]" />
          <div className="flex gap-1.5">
            {[
              { value: "", label: "Toutes" },
              { value: "pending", label: "En attente" },
              { value: "completed", label: "Complétées" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all
                  ${statusFilter === opt.value
                    ? "bg-orange-600 text-white shadow-sm"
                    : "bg-[rgb(var(--secondary))] text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
          </div>
        ) : sortedFollowUps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-10 w-10 text-[rgb(var(--muted-foreground))] mb-3" />
            <p className="text-sm font-medium">Aucune relance</p>
            <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
              {statusFilter === "pending" ? "Toutes vos relances sont à jour" : "Créez votre première relance"}
            </p>
            <Button onClick={openCreate} className="mt-4" size="sm">
              <Plus className="h-4 w-4" /> Créer une relance
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedFollowUps.map((fu, i) => {
              const overdue = fu.status === "pending" && isOverdue(fu.dueDate);
              const completed = fu.status === "completed";

              return (
                <div
                  key={fu.id}
                  className={`group flex items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-sm
                    ${overdue ? "border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/5" :
                      completed ? "border-[rgb(var(--border))] bg-[rgb(var(--secondary))]/30 opacity-60" :
                      "border-[rgb(var(--border))] bg-[rgb(var(--card))]"}`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {/* Bouton compléter */}
                  {!completed && (
                    <button
                      onClick={() => markCompleted(fu)}
                      className="mt-0.5 shrink-0 text-[rgb(var(--muted-foreground))]/40 hover:text-emerald-500 transition-colors"
                      title="Marquer comme complétée"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                  )}
                  {completed && (
                    <div className="mt-0.5 shrink-0 text-emerald-500">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {fu.contact ? (
                        <Link
                          href={`/contacts/${fu.contactId}`}
                          className="text-sm font-semibold hover:text-orange-600 transition-colors"
                        >
                          {fu.contact.firstName} {fu.contact.lastName}
                          {fu.contact.company && (
                            <span className="font-normal text-[rgb(var(--muted-foreground))]"> · {fu.contact.company}</span>
                          )}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-[rgb(var(--muted-foreground))]">Contact non défini</span>
                      )}
                      <Badge className={PRIORITY_COLORS[fu.priority]}>
                        {PRIORITY_LABELS[fu.priority]}
                      </Badge>
                      {completed && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Complétée
                        </Badge>
                      )}
                    </div>

                    <p className={`text-xs font-medium ${overdue ? "text-red-600 dark:text-red-400" : "text-[rgb(var(--muted-foreground))]"}`}>
                      {overdue ? "⚠ En retard — " : ""}{formatDate(fu.dueDate)}
                    </p>

                    {fu.notes && (
                      <p className="mt-1.5 text-sm text-[rgb(var(--muted-foreground))] line-clamp-2">{fu.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(fu)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(fu.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? "Modifier la relance" : "Nouvelle relance"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Contact (optionnel)</Label>
            <Select
              value={form.contactId}
              onChange={(e) => setForm({ ...form, contactId: e.target.value })}
            >
              <option value="">Aucun contact</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}{c.company ? ` — ${c.company}` : ""}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Date d&apos;échéance *</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priorité</Label>
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </Select>
            </div>
          </div>
          {editingId && (
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="pending">En attente</option>
                <option value="completed">Complétée</option>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notes sur cette relance..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button type="submit">{editingId ? "Enregistrer" : "Créer"}</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer cette relance ?">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Cette action est irréversible.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
          <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
        </div>
      </Dialog>
    </div>
  );
}
