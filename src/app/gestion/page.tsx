"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Plus, Pencil, Trash2, ChevronLeft, ChevronRight,
  Target, TrendingUp, Euro, CheckCircle2, Clock, LayoutGrid
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriceItem {
  id: string;
  category: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
}

interface MonthData {
  month: number;
  target: number;
  goalId: string | null;
  signed: number;
  prospect: number;
}

interface RevenueData {
  year: number;
  months: MonthData[];
  totalTarget: number;
  totalSigned: number;
  totalProspect: number;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "styles", label: "Styles", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { id: "motion", label: "Motion", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { id: "packshot", label: "Packshot", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { id: "retouche", label: "Retouche", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { id: "other", label: "Autre", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
];

const UNITS = [
  { id: "forfait", label: "Forfait" },
  { id: "heure", label: "/ heure" },
  { id: "jour", label: "/ jour" },
  { id: "image", label: "/ image" },
  { id: "video", label: "/ vidéo" },
];

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const emptyPriceForm = { category: "styles", name: "", description: "", price: "", unit: "forfait" };

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function GestionPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"pricing" | "revenue">("revenue");

  // Pricing
  const [items, setItems] = useState<PriceItem[]>([]);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [deletePriceId, setDeletePriceId] = useState<string | null>(null);
  const [priceForm, setPriceForm] = useState(emptyPriceForm);

  // Revenue
  const [year, setYear] = useState(new Date().getFullYear());
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [editingTargets, setEditingTargets] = useState<Record<number, string>>({});
  const [savingMonth, setSavingMonth] = useState<number | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchPricing = useCallback(async () => {
    const res = await fetch("/api/pricing");
    setItems(await res.json());
  }, []);

  const fetchRevenue = useCallback(async () => {
    const res = await fetch(`/api/revenue-goals?year=${year}`);
    const data = await res.json();
    setRevenueData(data);
    const targets: Record<number, string> = {};
    data.months.forEach((m: MonthData) => {
      targets[m.month] = m.target > 0 ? m.target.toString() : "";
    });
    setEditingTargets(targets);
  }, [year]);

  useEffect(() => { fetchPricing(); }, [fetchPricing]);
  useEffect(() => { fetchRevenue(); }, [fetchRevenue]);

  // ── Pricing CRUD ──────────────────────────────────────────────────────────

  const openCreatePrice = () => {
    setEditingPriceId(null);
    setPriceForm(emptyPriceForm);
    setPriceDialogOpen(true);
  };

  const openEditPrice = (item: PriceItem) => {
    setEditingPriceId(item.id);
    setPriceForm({
      category: item.category, name: item.name,
      description: item.description ?? "", price: item.price.toString(), unit: item.unit,
    });
    setPriceDialogOpen(true);
  };

  const handlePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceForm.name || !priceForm.price) { toast("Nom et prix obligatoires", "error"); return; }
    const method = editingPriceId ? "PUT" : "POST";
    const url = editingPriceId ? `/api/pricing/${editingPriceId}` : "/api/pricing";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(priceForm) });
    if (res.ok) {
      toast(editingPriceId ? "Tarif modifié" : "Tarif ajouté");
      setPriceDialogOpen(false);
      fetchPricing();
    } else toast("Erreur lors de la sauvegarde", "error");
  };

  const handleDeletePrice = async () => {
    if (!deletePriceId) return;
    const res = await fetch(`/api/pricing/${deletePriceId}`, { method: "DELETE" });
    if (res.ok) { toast("Tarif supprimé"); setDeletePriceId(null); fetchPricing(); }
  };

  // ── Revenue goals ─────────────────────────────────────────────────────────

  const saveTarget = async (month: number) => {
    const raw = editingTargets[month] ?? "0";
    const target = parseFloat(raw.replace(",", ".")) || 0;
    setSavingMonth(month);
    const res = await fetch("/api/revenue-goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month, target }),
    });
    if (res.ok) { toast(`Objectif ${MONTHS[month - 1]} sauvegardé`); fetchRevenue(); }
    else toast("Erreur lors de la sauvegarde", "error");
    setSavingMonth(null);
  };

  // ── Computed ──────────────────────────────────────────────────────────────

  const groupedItems = CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((i) => i.category === cat.id),
  })).filter((g) => g.items.length > 0);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Gestion" subtitle="Tarifs & Objectifs de CA">
        {tab === "pricing" && (
          <Button size="sm" onClick={openCreatePrice}>
            <Plus className="h-4 w-4" /> Nouveau tarif
          </Button>
        )}
      </TopBar>

      <div className="flex-1 p-3 sm:p-6 animate-fade-in">

        {/* Onglets */}
        <div className="flex gap-1 mb-6 bg-[rgb(var(--secondary))] rounded-xl p-1 w-fit">
          {[
            { id: "revenue", label: "Objectif CA", icon: Target },
            { id: "pricing", label: "Grille tarifaire", icon: LayoutGrid },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as "pricing" | "revenue")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${tab === id ? "bg-[rgb(var(--card))] shadow-sm text-[rgb(var(--foreground))]" : "text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            OBJECTIF CA
        ════════════════════════════════════════════════════════════════════ */}
        {tab === "revenue" && revenueData && (
          <div className="space-y-6">

            {/* Sélecteur d'année */}
            <div className="flex items-center gap-3">
              <button onClick={() => setYear(y => y - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgb(var(--border))] hover:bg-[rgb(var(--secondary))] transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-lg font-bold w-16 text-center">{year}</span>
              <button onClick={() => setYear(y => y + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgb(var(--border))] hover:bg-[rgb(var(--secondary))] transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Résumé annuel */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Objectif annuel */}
              <Card className="border-[rgb(var(--border))]">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-medium text-[rgb(var(--muted-foreground))]">Objectif annuel</p>
                      <p className="text-2xl font-bold mt-0.5">{fmt(revenueData.totalTarget)}</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                      <Target className="h-4 w-4 text-orange-600" />
                    </div>
                  </div>
                  {revenueData.totalTarget > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-[rgb(var(--muted-foreground))] mb-1.5">
                        <span>Signé + Estimé</span>
                        <span>{Math.round((revenueData.totalSigned + revenueData.totalProspect) / revenueData.totalTarget * 100)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[rgb(var(--secondary))] overflow-hidden">
                        <div className="h-full flex">
                          <div className="bg-emerald-500 transition-all duration-500"
                            style={{ width: `${Math.min(100, revenueData.totalSigned / revenueData.totalTarget * 100)}%` }} />
                          <div className="bg-blue-400/60 transition-all duration-500"
                            style={{ width: `${Math.min(100 - (revenueData.totalSigned / revenueData.totalTarget * 100), revenueData.totalProspect / revenueData.totalTarget * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CA signé */}
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-[rgb(var(--muted-foreground))]">CA Signé (clients)</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{fmt(revenueData.totalSigned)}</p>
                      {revenueData.totalTarget > 0 && (
                        <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                          {Math.round(revenueData.totalSigned / revenueData.totalTarget * 100)}% de l'objectif
                        </p>
                      )}
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CA estimé (prospects) */}
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-[rgb(var(--muted-foreground))]">CA Estimé (prospects)</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{fmt(revenueData.totalProspect)}</p>
                      {revenueData.totalTarget > 0 && (
                        <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                          {Math.round(revenueData.totalProspect / revenueData.totalTarget * 100)}% de l'objectif
                        </p>
                      )}
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Légende */}
            <div className="flex items-center gap-4 text-xs text-[rgb(var(--muted-foreground))]">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" /> Signé (clients)</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-400 inline-block" /> Estimé (prospects)</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-orange-500 inline-block" /> Objectif mensuel</span>
            </div>

            {/* Grille mensuelle */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {revenueData.months.map((m) => {
                const isCurrentMonth = m.month === currentMonth && year === currentYear;
                const isPast = year < currentYear || (year === currentYear && m.month < currentMonth);
                const total = m.signed + m.prospect;
                const pctSigned = m.target > 0 ? Math.min(100, (m.signed / m.target) * 100) : 0;
                const pctProspect = m.target > 0 ? Math.min(100 - pctSigned, (m.prospect / m.target) * 100) : 0;
                const achieved = m.target > 0 && m.signed >= m.target;

                return (
                  <Card key={m.month}
                    className={`transition-all ${isCurrentMonth ? "ring-2 ring-orange-500/50 border-orange-500/30" : ""} ${achieved ? "border-emerald-500/30" : ""}`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className={`text-sm font-semibold ${isCurrentMonth ? "text-orange-600 dark:text-orange-400" : ""}`}>
                            {MONTHS[m.month - 1]}
                            {isCurrentMonth && <span className="ml-1.5 text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full">En cours</span>}
                          </p>
                          {achieved && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 mt-0.5">
                              <CheckCircle2 className="h-3 w-3" /> Objectif atteint
                            </span>
                          )}
                        </div>
                        {m.target > 0 && (
                          <span className="text-xs text-[rgb(var(--muted-foreground))]">{fmt(m.target)}</span>
                        )}
                      </div>

                      {/* Barre de progression */}
                      {m.target > 0 ? (
                        <div className="mb-3">
                          <div className="h-2 rounded-full bg-[rgb(var(--secondary))] overflow-hidden">
                            <div className="h-full flex">
                              <div className="bg-emerald-500 rounded-l-full transition-all duration-500" style={{ width: `${pctSigned}%` }} />
                              <div className="bg-blue-400/70 transition-all duration-500" style={{ width: `${pctProspect}%` }} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-2 rounded-full bg-[rgb(var(--secondary))] mb-3" />
                      )}

                      {/* Montants */}
                      <div className="space-y-1 mb-3">
                        {m.signed > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-[rgb(var(--muted-foreground))]">Signé</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(m.signed)}</span>
                          </div>
                        )}
                        {m.prospect > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-[rgb(var(--muted-foreground))]">Estimé</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{fmt(m.prospect)}</span>
                          </div>
                        )}
                        {total === 0 && isPast && (
                          <p className="text-xs text-[rgb(var(--muted-foreground))]/50 text-center">Aucun CA</p>
                        )}
                      </div>

                      {/* Champ objectif */}
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <Euro className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[rgb(var(--muted-foreground))]" />
                          <input
                            type="number"
                            min="0"
                            step="500"
                            placeholder="Objectif"
                            value={editingTargets[m.month] ?? ""}
                            onChange={(e) => setEditingTargets(prev => ({ ...prev, [m.month]: e.target.value }))}
                            onBlur={() => saveTarget(m.month)}
                            onKeyDown={(e) => e.key === "Enter" && saveTarget(m.month)}
                            className="w-full h-7 rounded-md border border-[rgb(var(--border))] bg-transparent pl-6 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/50"
                          />
                        </div>
                        {savingMonth === m.month && (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            GRILLE TARIFAIRE
        ════════════════════════════════════════════════════════════════════ */}
        {tab === "pricing" && (
          <div className="space-y-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgb(var(--secondary))] mb-4">
                  <Euro className="h-6 w-6 text-[rgb(var(--muted-foreground))]" />
                </div>
                <p className="text-sm font-medium">Aucun tarif configuré</p>
                <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">Ajoutez vos prestations et leurs tarifs</p>
                <Button onClick={openCreatePrice} className="mt-4" size="sm">
                  <Plus className="h-4 w-4" /> Ajouter un tarif
                </Button>
              </div>
            ) : (
              <>
                {/* Résumé par catégorie */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {CATEGORIES.map((cat) => {
                    const catItems = items.filter(i => i.category === cat.id);
                    if (catItems.length === 0) return null;
                    const min = Math.min(...catItems.map(i => i.price));
                    const max = Math.max(...catItems.map(i => i.price));
                    return (
                      <Card key={cat.id} className="text-center">
                        <CardContent className="pt-4 pb-4">
                          <Badge className={`${cat.color} mb-2`}>{cat.label}</Badge>
                          <p className="text-xs text-[rgb(var(--muted-foreground))]">{catItems.length} prestation{catItems.length > 1 ? "s" : ""}</p>
                          <p className="text-sm font-semibold mt-1">
                            {min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Tableau par catégorie */}
                {groupedItems.map((group) => (
                  <Card key={group.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Badge className={group.color}>{group.label}</Badge>
                        <span className="text-[rgb(var(--muted-foreground))] font-normal">{group.items.length} prestation{group.items.length > 1 ? "s" : ""}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[rgb(var(--border))]">
                            <th className="pb-2 text-left font-medium text-[rgb(var(--muted-foreground))] text-xs">Prestation</th>
                            <th className="pb-2 text-left font-medium text-[rgb(var(--muted-foreground))] text-xs hidden md:table-cell">Description</th>
                            <th className="pb-2 text-right font-medium text-[rgb(var(--muted-foreground))] text-xs">Tarif</th>
                            <th className="pb-2 text-left font-medium text-[rgb(var(--muted-foreground))] text-xs pl-2 hidden sm:table-cell">Unité</th>
                            <th className="pb-2 w-16" />
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((item) => (
                            <tr key={item.id} className="group border-b border-[rgb(var(--border))] last:border-0 hover:bg-[rgb(var(--secondary))] transition-colors">
                              <td className="py-3 font-medium">{item.name}</td>
                              <td className="py-3 text-[rgb(var(--muted-foreground))] text-xs hidden md:table-cell max-w-[200px] truncate">
                                {item.description || <span className="opacity-30">—</span>}
                              </td>
                              <td className="py-3 text-right">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(item.price)}</span>
                              </td>
                              <td className="py-3 pl-2 text-xs text-[rgb(var(--muted-foreground))] hidden sm:table-cell">
                                {UNITS.find(u => u.id === item.unit)?.label ?? item.unit}
                              </td>
                              <td className="py-3">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" onClick={() => openEditPrice(item)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => setDeletePriceId(item.id)}>
                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Dialog tarif */}
      <Dialog
        open={priceDialogOpen}
        onClose={() => setPriceDialogOpen(false)}
        title={editingPriceId ? "Modifier le tarif" : "Nouveau tarif"}
      >
        <form onSubmit={handlePriceSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select value={priceForm.category} onChange={(e) => setPriceForm({ ...priceForm, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Unité</Label>
              <Select value={priceForm.unit} onChange={(e) => setPriceForm({ ...priceForm, unit: e.target.value })}>
                {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Nom de la prestation *</Label>
            <Input value={priceForm.name} onChange={(e) => setPriceForm({ ...priceForm, name: e.target.value })}
              placeholder="Ex: Shooting packshot simple fond blanc" required />
          </div>
          <div className="space-y-1.5">
            <Label>Prix (€) *</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[rgb(var(--muted-foreground))]" />
              <Input type="number" min="0" step="10" value={priceForm.price}
                onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })}
                placeholder="500" className="pl-8" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={priceForm.description}
              onChange={(e) => setPriceForm({ ...priceForm, description: e.target.value })}
              placeholder="Détails de la prestation, conditions, inclus..." rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setPriceDialogOpen(false)}>Annuler</Button>
            <Button type="submit">{editingPriceId ? "Enregistrer" : "Ajouter"}</Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog suppression tarif */}
      <Dialog open={!!deletePriceId} onClose={() => setDeletePriceId(null)} title="Supprimer ce tarif ?">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Cette action est irréversible.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeletePriceId(null)}>Annuler</Button>
          <Button variant="destructive" onClick={handleDeletePrice}>Supprimer</Button>
        </div>
      </Dialog>
    </div>
  );
}
