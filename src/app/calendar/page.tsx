"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock } from "lucide-react";

// ─── Palette de couleurs ──────────────────────────────────────────────────────

export const EVENT_COLORS = [
  { id: "orange",  label: "Orange",   bg: "bg-orange-500",   light: "bg-orange-100 dark:bg-orange-900/40",   text: "text-orange-700 dark:text-orange-300",   border: "border-orange-400/60",   hex: "#f97316" },
  { id: "red",     label: "Rouge",    bg: "bg-red-500",      light: "bg-red-100 dark:bg-red-900/40",         text: "text-red-700 dark:text-red-300",         border: "border-red-400/60",      hex: "#ef4444" },
  { id: "pink",    label: "Rose",     bg: "bg-pink-500",     light: "bg-pink-100 dark:bg-pink-900/40",       text: "text-pink-700 dark:text-pink-300",       border: "border-pink-400/60",     hex: "#ec4899" },
  { id: "purple",  label: "Violet",   bg: "bg-purple-500",   light: "bg-purple-100 dark:bg-purple-900/40",   text: "text-purple-700 dark:text-purple-300",   border: "border-purple-400/60",   hex: "#a855f7" },
  { id: "indigo",  label: "Indigo",   bg: "bg-indigo-500",   light: "bg-indigo-100 dark:bg-indigo-900/40",   text: "text-indigo-700 dark:text-indigo-300",   border: "border-indigo-400/60",   hex: "#6366f1" },
  { id: "blue",    label: "Bleu",     bg: "bg-blue-500",     light: "bg-blue-100 dark:bg-blue-900/40",       text: "text-blue-700 dark:text-blue-300",       border: "border-blue-400/60",     hex: "#3b82f6" },
  { id: "cyan",    label: "Cyan",     bg: "bg-cyan-500",     light: "bg-cyan-100 dark:bg-cyan-900/40",       text: "text-cyan-700 dark:text-cyan-300",       border: "border-cyan-400/60",     hex: "#06b6d4" },
  { id: "teal",    label: "Teal",     bg: "bg-teal-500",     light: "bg-teal-100 dark:bg-teal-900/40",       text: "text-teal-700 dark:text-teal-300",       border: "border-teal-400/60",     hex: "#14b8a6" },
  { id: "green",   label: "Vert",     bg: "bg-green-500",    light: "bg-green-100 dark:bg-green-900/40",     text: "text-green-700 dark:text-green-300",     border: "border-green-400/60",    hex: "#22c55e" },
  { id: "amber",   label: "Ambre",    bg: "bg-amber-500",    light: "bg-amber-100 dark:bg-amber-900/40",     text: "text-amber-700 dark:text-amber-300",     border: "border-amber-400/60",    hex: "#f59e0b" },
] as const;

export const EVENT_TYPES = [
  { id: "rdv",      label: "Rendez-vous",  icon: "📅" },
  { id: "task",     label: "Tâche",        icon: "✅" },
  { id: "call",     label: "Appel",        icon: "📞" },
  { id: "reminder", label: "Rappel",       icon: "🔔" },
  { id: "lunch",    label: "Déjeuner",     icon: "🍽️" },
  { id: "other",    label: "Autre",        icon: "📌" },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contact { id: string; firstName: string; lastName: string; company?: string; }
interface Appointment {
  id: string; title: string; date: string; endDate?: string;
  type: string; color: string; notes?: string; contactId?: string;
  contact?: { firstName: string; lastName: string; company?: string };
}

const DAYS    = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS  = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const emptyForm = { title: "", date: "", time: "09:00", endTime: "", type: "rdv", color: "orange", contactId: "", notes: "" };

function getColor(id: string) {
  return EVENT_COLORS.find(c => c.id === id) ?? EVENT_COLORS[0];
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { toast } = useToast();
  const [view, setView] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchAppointments = useCallback(async () => {
    const res = await fetch("/api/appointments");
    setAppointments(await res.json());
  }, []);

  const fetchContacts = useCallback(async () => {
    const res = await fetch("/api/contacts");
    setContacts(await res.json());
  }, []);

  useEffect(() => { fetchAppointments(); fetchContacts(); }, [fetchAppointments, fetchContacts]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const navigate = (dir: -1 | 1) => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + 7 * dir);
    setCurrentDate(d);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    let startDow = firstDay.getDay();
    if (startDow === 0) startDow = 7;
    const days: (Date | null)[] = Array(startDow - 1).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  };

  const getWeekDays = () => {
    const d = new Date(currentDate);
    const dow = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    return Array.from({ length: 7 }, (_, i) => { const day = new Date(monday); day.setDate(monday.getDate() + i); return day; });
  };

  const getApptForDay = (date: Date) => {
    const ds = date.toISOString().slice(0, 10);
    return appointments.filter(a => a.date.slice(0, 10) === ds);
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const openCreate = (dateStr?: string) => {
    setEditingId(null);
    setForm({ ...emptyForm, date: dateStr ?? new Date().toISOString().slice(0, 10) });
    setDialogOpen(true);
  };

  const openEdit = (appt: Appointment) => {
    setEditingId(appt.id);
    const d = new Date(appt.date);
    setForm({
      title: appt.title,
      date: d.toISOString().slice(0, 10),
      time: d.toTimeString().slice(0, 5),
      endTime: appt.endDate ? new Date(appt.endDate).toTimeString().slice(0, 5) : "",
      type: appt.type ?? "rdv",
      color: appt.color ?? "orange",
      contactId: appt.contactId ?? "",
      notes: appt.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date) { toast("Titre et date obligatoires", "error"); return; }
    const dateTime = new Date(`${form.date}T${form.time || "09:00"}`);
    const endDateTime = form.endTime ? new Date(`${form.date}T${form.endTime}`) : null;
    const payload = {
      title: form.title, date: dateTime.toISOString(),
      endDate: endDateTime?.toISOString() ?? null,
      type: form.type, color: form.color,
      notes: form.notes || null, contactId: form.contactId || null,
    };
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/appointments/${editingId}` : "/api/appointments";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      toast(editingId ? "Événement modifié" : "Événement créé");
      setDialogOpen(false);
      fetchAppointments();
    } else toast("Erreur lors de la sauvegarde", "error");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/appointments/${deleteId}`, { method: "DELETE" });
    if (res.ok) { toast("Événement supprimé"); setDeleteId(null); fetchAppointments(); }
  };

  // ─────────────────────────────────────────────────────────────────────────

  const today = new Date().toISOString().slice(0, 10);
  const monthDays = getMonthDays();
  const weekDays = getWeekDays();
  const selectedColor = getColor(form.color);
  const headerTitle = view === "month"
    ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : `Semaine du ${formatDate(weekDays[0])} au ${formatDate(weekDays[6])}`;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Calendrier" subtitle={headerTitle}>
        {/* Contrôles compacts sur mobile */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="hidden sm:flex items-center gap-1 rounded-lg border border-[rgb(var(--border))] p-0.5">
          <Button variant={view === "month" ? "default" : "ghost"} size="sm" onClick={() => setView("month")}>Mois</Button>
          <Button variant={view === "week" ? "default" : "ghost"} size="sm" onClick={() => setView("week")}>Semaine</Button>
        </div>
        <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => setCurrentDate(new Date())}>Aujourd&apos;hui</Button>
        <Button size="sm" onClick={() => openCreate()}>
          <Plus className="h-4 w-4" /><span className="hidden sm:inline"> Nouvel événement</span>
        </Button>
      </TopBar>

      <div className="flex-1 p-3 sm:p-6 animate-fade-in">

        {/* Barre d'outils mobile */}
        <div className="mb-3 flex items-center gap-2 sm:hidden">
          <div className="flex flex-1 items-center gap-1 rounded-lg border border-[rgb(var(--border))] p-0.5">
            <button onClick={() => setView("month")} className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${view === "month" ? "bg-orange-500 text-white" : "text-[rgb(var(--muted-foreground))]"}`}>Mois</button>
            <button onClick={() => setView("week")} className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${view === "week" ? "bg-orange-500 text-white" : "text-[rgb(var(--muted-foreground))]"}`}>Semaine</button>
          </div>
          <button onClick={() => setCurrentDate(new Date())} className="rounded-lg border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--secondary))]">
            Aujourd&apos;hui
          </button>
        </div>

        {/* Légende types */}
        <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
          {EVENT_TYPES.map(t => (
            <span key={t.id} className="flex items-center gap-1 text-xs text-[rgb(var(--muted-foreground))]">
              <span>{t.icon}</span><span className="hidden sm:inline">{t.label}</span>
            </span>
          ))}
          <span className="mx-1 text-[rgb(var(--border))]">|</span>
          {EVENT_COLORS.map(c => (
            <span key={c.id} className={`h-2.5 w-2.5 rounded-full ${c.bg}`} title={c.label} />
          ))}
        </div>

        {/* ── VUE MOIS ── */}
        {view === "month" && (
          <div className="overflow-x-auto rounded-xl border border-[rgb(var(--border))]">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-7 border-b border-[rgb(var(--border))] bg-[rgb(var(--secondary))]">
                {DAYS.map(d => (
                  <div key={d} className="py-2 text-center text-[10px] sm:text-xs font-semibold text-[rgb(var(--muted-foreground))] uppercase tracking-wide">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthDays.map((date, i) => {
                  if (!date) return (
                    <div key={`e-${i}`} className="min-h-[70px] sm:min-h-[110px] border-b border-r border-[rgb(var(--border))] bg-[rgb(var(--secondary))]/20 last:border-r-0" />
                  );
                  const ds = date.toISOString().slice(0, 10);
                  const isToday = ds === today;
                  const dayAppts = getApptForDay(date);
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                  return (
                    <div
                      key={ds}
                      className={`group min-h-[70px] sm:min-h-[110px] border-b border-r border-[rgb(var(--border))] p-1 sm:p-1.5 transition-colors hover:bg-[rgb(var(--secondary))]/50 cursor-pointer
                        ${!isCurrentMonth ? "opacity-35" : ""}
                        ${(i + 1) % 7 === 0 ? "border-r-0" : ""}
                        ${i >= monthDays.length - 7 ? "border-b-0" : ""}`}
                      onClick={() => openCreate(ds)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[11px] sm:text-xs font-medium transition-colors
                          ${isToday ? "bg-orange-600 text-white font-bold" : "hover:bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))]"}`}>
                          {date.getDate()}
                        </span>
                        {dayAppts.length > 0 && (
                          <span className="opacity-0 group-hover:opacity-100 text-[rgb(var(--muted-foreground))] transition-opacity">
                            <Plus className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      {/* Mobile : points colorés seulement */}
                      <div className="flex flex-wrap gap-0.5 sm:hidden">
                        {dayAppts.slice(0, 4).map(appt => {
                          const c = getColor(appt.color);
                          return <span key={appt.id} className={`h-1.5 w-1.5 rounded-full ${c.bg}`} />;
                        })}
                      </div>
                      {/* Desktop : libellés */}
                      <div className="hidden sm:block space-y-0.5 overflow-hidden">
                        {dayAppts.slice(0, 3).map(appt => {
                          const c = getColor(appt.color);
                          const type = EVENT_TYPES.find(t => t.id === appt.type);
                          return (
                            <div
                              key={appt.id}
                              className={`flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium border cursor-pointer
                                hover:opacity-80 transition-opacity ${c.light} ${c.text} ${c.border}`}
                              onClick={e => { e.stopPropagation(); openEdit(appt); }}
                              title={appt.title}
                            >
                              <span className="shrink-0 text-[9px]">{type?.icon ?? "📅"}</span>
                              <span className="truncate">
                                {new Date(appt.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} {appt.title}
                              </span>
                            </div>
                          );
                        })}
                        {dayAppts.length > 3 && (
                          <p className="pl-1.5 text-[10px] text-[rgb(var(--muted-foreground))]">
                            +{dayAppts.length - 3} autre{dayAppts.length - 3 > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── VUE SEMAINE ── */}
        {view === "week" && (
          <div className="overflow-x-auto rounded-xl border border-[rgb(var(--border))]">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-7 border-b border-[rgb(var(--border))] bg-[rgb(var(--secondary))]">
                {weekDays.map(date => {
                  const ds = date.toISOString().slice(0, 10);
                  const isToday = ds === today;
                  return (
                    <div key={ds} className={`py-2 sm:py-3 text-center ${isToday ? "bg-orange-600/5" : ""}`}>
                      <p className="text-[10px] sm:text-xs text-[rgb(var(--muted-foreground))] font-medium">
                        {DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]}
                      </p>
                      <div className={`mx-auto mt-1 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs sm:text-sm font-semibold
                        ${isToday ? "bg-orange-600 text-white" : ""}`}>
                        {date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-7 min-h-[400px] sm:min-h-[480px]">
                {weekDays.map((date, i) => {
                  const ds = date.toISOString().slice(0, 10);
                  const isToday = ds === today;
                  const dayAppts = getApptForDay(date);

                  return (
                    <div
                      key={ds}
                      className={`border-r border-[rgb(var(--border))] last:border-r-0 p-1 sm:p-2 cursor-pointer hover:bg-[rgb(var(--secondary))]/30 transition-colors
                        ${isToday ? "bg-orange-600/3" : ""}
                        ${i >= 5 ? "bg-[rgb(var(--secondary))]/20" : ""}`}
                      onClick={() => openCreate(ds)}
                    >
                      {dayAppts.length === 0 ? (
                        <div className="flex h-12 items-center justify-center text-xs text-[rgb(var(--muted-foreground))]/30">+</div>
                      ) : (
                        <div className="space-y-1">
                          {dayAppts.map(appt => {
                            const c = getColor(appt.color);
                            const type = EVENT_TYPES.find(t => t.id === appt.type);
                            return (
                              <div
                                key={appt.id}
                                className={`rounded-lg border p-1.5 sm:p-2 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${c.light} ${c.border}`}
                                onClick={e => { e.stopPropagation(); openEdit(appt); }}
                              >
                                <div className={`flex items-center gap-1 text-[10px] font-semibold mb-0.5 ${c.text}`}>
                                  <span>{type?.icon ?? "📅"}</span>
                                  <span className="hidden sm:inline">{new Date(appt.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                                  {appt.endDate && (
                                    <span className="hidden sm:inline opacity-60">→ {new Date(appt.endDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                                  )}
                                </div>
                                <p className={`text-[10px] sm:text-xs font-medium truncate ${c.text}`}>{appt.title}</p>
                                {appt.contact && (
                                  <p className="hidden sm:block text-[10px] text-[rgb(var(--muted-foreground))] truncate mt-0.5">
                                    {appt.contact.firstName} {appt.contact.lastName}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── DIALOG ── */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? "Modifier l'événement" : "Nouvel événement"}
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Titre */}
          <div className="space-y-1.5">
            <Label>Titre *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Nom de l'événement..." required autoFocus />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_TYPES.map(t => (
                <button key={t.id} type="button"
                  onClick={() => setForm({ ...form, type: t.id })}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all
                    ${form.type === t.id
                      ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                      : "border-[rgb(var(--border))] hover:bg-[rgb(var(--secondary))] text-[rgb(var(--muted-foreground))]"}`}>
                  <span>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Couleur */}
          <div className="space-y-1.5">
            <Label>Couleur</Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_COLORS.map(c => (
                <button key={c.id} type="button"
                  onClick={() => setForm({ ...form, color: c.id })}
                  title={c.label}
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${c.bg}
                    ${form.color === c.id ? "ring-2 ring-offset-2 ring-offset-[rgb(var(--card))] ring-[rgb(var(--foreground))] scale-110" : "opacity-70 hover:opacity-100 hover:scale-105"}`}>
                  {form.color === c.id && <span className="text-white text-xs font-bold">✓</span>}
                </button>
              ))}
            </div>
            {/* Prévisualisation */}
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${selectedColor.light} ${selectedColor.text} ${selectedColor.border}`}>
              <span>{EVENT_TYPES.find(t => t.id === form.type)?.icon ?? "📅"}</span>
              <span>{form.title || "Aperçu de l'événement"}</span>
            </div>
          </div>

          {/* Date & Heures */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-1">
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Début</Label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[rgb(var(--muted-foreground))]" />
                <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="pl-8" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Fin</Label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[rgb(var(--muted-foreground))]" />
                <Input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="pl-8" />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-1.5">
            <Label>Contact (optionnel)</Label>
            <Select value={form.contactId} onChange={e => setForm({ ...form, contactId: e.target.value })}>
              <option value="">Aucun contact lié</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.company ? ` — ${c.company}` : ""}</option>
              ))}
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Description, lieu, informations utiles..." rows={2} />
          </div>

          <div className="flex justify-between pt-2">
            <div>
              {editingId && (
                <Button type="button" variant="destructive" size="sm"
                  onClick={() => { setDeleteId(editingId); setDialogOpen(false); }}>
                  <Trash2 className="h-3.5 w-3.5" /> Supprimer
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit">{editingId ? "Enregistrer" : "Créer"}</Button>
            </div>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer cet événement ?">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Cette action est irréversible.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
          <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
        </div>
      </Dialog>
    </div>
  );
}
