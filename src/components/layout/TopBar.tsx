"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobileSidebar } from "./MobileSidebarProvider";

interface TopBarProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function TopBar({ title, subtitle, children }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const { toggle } = useMobileSidebar();

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[rgb(var(--border))] bg-[rgb(var(--card))]/90 px-4 backdrop-blur-md sm:px-6 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        {/* Bouton hamburger mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="shrink-0 lg:hidden"
          title="Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold leading-none sm:text-base truncate">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 hidden text-xs text-[rgb(var(--muted-foreground))] sm:block truncate">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {children}
        <Button variant="ghost" size="icon" onClick={cycleTheme} title="Changer le thème">
          <ThemeIcon className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
