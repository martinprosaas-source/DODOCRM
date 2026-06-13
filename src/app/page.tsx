import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, TrendingUp, Calendar, Bell,
  UserPlus, CalendarPlus, RefreshCw, CheckCircle
} from "lucide-react";
import { formatDateTime, PRIORITY_COLORS, PRIORITY_LABELS, ACTIVITY_LABELS } from "@/lib/utils";
import Link from "next/link";

async function getDashboardData() {
  const now = new Date();
  const [
    totalContacts,
    activeProspects,
    upcomingAppointments,
    pendingFollowUps,
    nextAppointments,
    nextFollowUps,
    recentActivities,
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.contact.count({ where: { status: "prospect" } }),
    prisma.appointment.count({ where: { date: { gte: now } } }),
    prisma.followUp.count({ where: { status: "pending" } }),
    prisma.appointment.findMany({
      where: { date: { gte: now } },
      orderBy: { date: "asc" },
      take: 5,
      include: { contact: { select: { firstName: true, lastName: true, company: true } } },
    }),
    prisma.followUp.findMany({
      where: { status: "pending" },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: { contact: { select: { firstName: true, lastName: true, company: true } } },
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { contact: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  return {
    totalContacts, activeProspects, upcomingAppointments, pendingFollowUps,
    nextAppointments, nextFollowUps, recentActivities,
  };
}

const activityIconMap: Record<string, React.ElementType> = {
  contact_added: UserPlus,
  appointment_created: CalendarPlus,
  status_updated: RefreshCw,
  followup_created: Bell,
  followup_completed: CheckCircle,
};

const activityColorMap: Record<string, string> = {
  contact_added: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  appointment_created: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  status_updated: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  followup_created: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  followup_completed: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  const stats = [
    { label: "Total Contacts", value: data.totalContacts, icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20" },
    { label: "Prospects Actifs", value: data.activeProspects, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/20" },
    { label: "RDV à venir", value: data.upcomingAppointments, icon: Calendar, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/20" },
    { label: "Relances en attente", value: data.pendingFollowUps, icon: Bell, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/20" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Dashboard" subtitle={`Bienvenue — ${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`} />

      <div className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-[rgb(var(--muted-foreground))]">{stat.label}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`rounded-lg p-2 ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Prochains RDV */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Prochains Rendez-vous</CardTitle>
                <Link href="/calendar" className="text-xs text-orange-600 hover:text-orange-700 font-medium">Voir tout →</Link>
              </div>
            </CardHeader>
            <CardContent>
              {data.nextAppointments.length === 0 ? (
                <p className="text-sm text-[rgb(var(--muted-foreground))] py-4 text-center">Aucun rendez-vous planifié</p>
              ) : (
                <div className="space-y-3">
                  {data.nextAppointments.map((appt) => (
                    <div key={appt.id} className="flex items-start gap-3 rounded-lg bg-[rgb(var(--secondary))] p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{appt.title}</p>
                        {appt.contact && (
                          <p className="text-xs text-[rgb(var(--muted-foreground))] truncate">
                            {appt.contact.firstName} {appt.contact.lastName}
                            {appt.contact.company && ` · ${appt.contact.company}`}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-[rgb(var(--muted-foreground))]">{formatDateTime(appt.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Relances en attente */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Relances à Faire</CardTitle>
                <Link href="/followups" className="text-xs text-orange-600 hover:text-orange-700 font-medium">Voir tout →</Link>
              </div>
            </CardHeader>
            <CardContent>
              {data.nextFollowUps.length === 0 ? (
                <p className="text-sm text-[rgb(var(--muted-foreground))] py-4 text-center">Aucune relance en attente</p>
              ) : (
                <div className="space-y-3">
                  {data.nextFollowUps.map((fu) => {
                    const isOver = new Date(fu.dueDate) < new Date();
                    return (
                      <div key={fu.id} className={`flex items-start gap-3 rounded-lg p-3 ${isOver ? "bg-red-50 dark:bg-red-900/10" : "bg-[rgb(var(--secondary))]"}`}>
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isOver ? "bg-red-100 dark:bg-red-900/30" : "bg-orange-100 dark:bg-orange-900/30"}`}>
                          <Bell className={`h-4 w-4 ${isOver ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {fu.contact && (
                              <p className="text-sm font-medium truncate">
                                {fu.contact.firstName} {fu.contact.lastName}
                              </p>
                            )}
                            <Badge className={`shrink-0 ${PRIORITY_COLORS[fu.priority]}`}>
                              {PRIORITY_LABELS[fu.priority]}
                            </Badge>
                          </div>
                          <p className={`text-xs ${isOver ? "text-red-600 dark:text-red-400 font-medium" : "text-[rgb(var(--muted-foreground))]"}`}>
                            {isOver ? "En retard · " : ""}{formatDateTime(fu.dueDate)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activité récente */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentActivities.length === 0 ? (
                <p className="text-sm text-[rgb(var(--muted-foreground))] py-4 text-center">Aucune activité récente</p>
              ) : (
                <div className="space-y-3">
                  {data.recentActivities.map((activity) => {
                    const Icon = activityIconMap[activity.type] ?? RefreshCw;
                    const colorClass = activityColorMap[activity.type] ?? "bg-gray-100 text-gray-600";
                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug truncate">{activity.description}</p>
                          <p className="text-xs text-[rgb(var(--muted-foreground))]">
                            {formatDateTime(activity.createdAt)}
                          </p>
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
  );
}
