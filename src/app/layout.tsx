import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { MobileSidebarProvider } from "@/components/layout/MobileSidebarProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "DODO CRM",
  description: "CRM simple et efficace pour petites entreprises",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ToastProvider>
            <MobileSidebarProvider>
              <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex-1 min-w-0 lg:ml-60">
                  {children}
                </main>
              </div>
            </MobileSidebarProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
