"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { User, Building2, Palette, Download, Sun, Moon, Monitor, Save } from "lucide-react";

interface Settings {
  id: string;
  userName: string;
  userEmail: string;
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  theme: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState({
    userName: "", userEmail: "", companyName: "",
    companyPhone: "", companyEmail: "", theme: "system",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setForm({
          userName: data.userName,
          userEmail: data.userEmail,
          companyName: data.companyName,
          companyPhone: data.companyPhone ?? "",
          companyEmail: data.companyEmail ?? "",
          theme: data.theme ?? "system",
        });
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setTheme(form.theme);
      toast("Paramètres sauvegardés");
    } else {
      toast("Erreur lors de la sauvegarde", "error");
    }
    setIsSaving(false);
  };

  const handleThemeChange = (newTheme: string) => {
    setForm((f) => ({ ...f, theme: newTheme }));
    setTheme(newTheme);
  };

  const handleExport = async () => {
    const res = await fetch("/api/export");
    if (!res.ok) { toast("Erreur lors de l'export", "error"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Export CSV téléchargé");
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Paramètres" subtitle="Configuration de l'application">
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </TopBar>

      <div className="flex-1 p-3 sm:p-6 animate-fade-in">
        <form onSubmit={handleSave} className="max-w-2xl space-y-4 sm:space-y-6">
          {/* Profil utilisateur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" /> Profil utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-[rgb(var(--border))]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-900/20 text-orange-600 text-xl font-bold">
                  {form.userName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "U"}
                </div>
                <div>
                  <p className="font-semibold">{form.userName || "Utilisateur"}</p>
                  <p className="text-sm text-[rgb(var(--muted-foreground))]">{form.userEmail || ""}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="userName">Nom complet</Label>
                  <Input
                    id="userName"
                    value={form.userName}
                    onChange={(e) => setForm({ ...form, userName: e.target.value })}
                    placeholder="Marie Dupont"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="userEmail">Email</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={form.userEmail}
                    onChange={(e) => setForm({ ...form, userEmail: e.target.value })}
                    placeholder="marie@example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations entreprise */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Informations entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="DODO CRM"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="companyPhone">Téléphone</Label>
                  <Input
                    id="companyPhone"
                    value={form.companyPhone}
                    onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="companyEmail">Email entreprise</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={form.companyEmail}
                    onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
                    placeholder="contact@entreprise.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Apparence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-4 w-4" /> Apparence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[rgb(var(--muted-foreground))] mb-4">Choisissez le thème de l&apos;application.</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "light", label: "Clair", icon: Sun, desc: "Fond blanc" },
                  { value: "dark", label: "Sombre", icon: Moon, desc: "Fond noir" },
                  { value: "system", label: "Système", icon: Monitor, desc: "Auto" },
                ].map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleThemeChange(value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all
                      ${form.theme === value
                        ? "border-orange-600 bg-orange-600/5"
                        : "border-[rgb(var(--border))] hover:border-[rgb(var(--muted-foreground))]/30"
                      }`}
                  >
                    <Icon className={`h-5 w-5 ${form.theme === value ? "text-orange-600" : "text-[rgb(var(--muted-foreground))]"}`} />
                    <div className="text-center">
                      <p className={`text-sm font-medium ${form.theme === value ? "text-orange-600" : ""}`}>{label}</p>
                      <p className="text-xs text-[rgb(var(--muted-foreground))]">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export de données */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-4 w-4" /> Export de données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[rgb(var(--muted-foreground))] mb-4">
                Exportez tous vos contacts en format CSV pour une utilisation dans Excel, Google Sheets ou tout autre outil.
              </p>
              <Button type="button" variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Exporter les contacts (CSV)
              </Button>
            </CardContent>
          </Card>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} size="lg">
              <Save className="h-4 w-4" />
              {isSaving ? "Sauvegarde..." : "Sauvegarder les paramètres"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
