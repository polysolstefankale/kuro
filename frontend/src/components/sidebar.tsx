"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LayoutDashboard, LogOut, Users } from "lucide-react";
import { clearAuth, getUsername } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/debitoren", label: "Debitoren", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const username = getUsername();

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white shadow-sm">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 bg-slate-700 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
          <Building2 className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">
          Kuro
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-slate-600 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-800",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-200 bg-slate-50 p-4">
        {username && (
          <p className="mb-3 truncate text-xs text-slate-500">
            Angemeldet als{" "}
            <span className="font-medium text-slate-700">{username}</span>
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start border-slate-300"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </Button>
      </div>
    </aside>
  );
}
