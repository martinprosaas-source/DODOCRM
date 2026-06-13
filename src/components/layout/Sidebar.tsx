"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMobileSidebar } from "./MobileSidebarProvider";
import {
  LayoutDashboard, Users, Kanban, Calendar, Bell, Settings, Zap, BarChart2, X,
} from "lucide-react";

const navItems = [
  { href: "/",          icon: LayoutDashboard, label: "Dashboard" },
  { href: "/contacts",  icon: Users,           label: "Contacts" },
  { href: "/pipeline",  icon: Kanban,          label: "Pipeline" },
  { href: "/calendar",  icon: Calendar,        label: "Calendrier" },
  { href: "/followups", icon: Bell,            label: "Relances" },
  { href: "/gestion",   icon: BarChart2,       label: "Gestion" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useMobileSidebar();

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-[rgb(var(--border))] px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">DODO CRM</span>
        </div>
        {/* Bouton fermer — mobile uniquement */}
        <button
          onClick={close}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--secondary))] lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[rgb(var(--muted-foreground))]">
            Navigation
          </p>
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-orange-600/10 text-orange-600 dark:text-orange-500"
                    : "text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--secondary))] hover:text-[rgb(var(--foreground))]"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-orange-600 dark:text-orange-500")} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Settings */}
      <div className="border-t border-[rgb(var(--border))] p-3">
        <Link
          href="/settings"
          onClick={close}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
            pathname === "/settings"
              ? "bg-orange-600/10 text-orange-600 dark:text-orange-500"
              : "text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--secondary))] hover:text-[rgb(var(--foreground))]"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Paramètres
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar (toujours visible ≥ lg) ──────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--card))] lg:flex">
        {navContent}
      </aside>

      {/* ── Mobile sidebar (drawer) ───────────────────────────────────── */}
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={close}
        />
      )}
      {/* Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
