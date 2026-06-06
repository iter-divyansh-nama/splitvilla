"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Activity, User, Plus, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Groups", icon: Users },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/account", label: "Account", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur"
      style={{ paddingBottom: "var(--sab)" }}
    >
      <div className="relative mx-auto flex max-w-lg items-stretch justify-around px-2">
        {tabs.slice(0, 2).map((t) => (
          <NavItem key={t.href} {...t} active={isActive(pathname, t.href)} />
        ))}

        {/* Center FAB */}
        <div className="relative flex w-20 items-start justify-center">
          <Link
            href="/expense/new"
            aria-label="Add expense"
            className="teal-gradient -mt-6 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-float transition-all duration-75 active:scale-95"
          >
            <Plus size={26} strokeWidth={2.6} />
          </Link>
        </div>

        {tabs.slice(2).map((t) => (
          <NavItem key={t.href} {...t} active={isActive(pathname, t.href)} />
        ))}
      </div>
    </nav>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard")
    return pathname === "/dashboard" || pathname.startsWith("/groups");
  return pathname.startsWith(href);
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-all duration-75 active:scale-95",
        active ? "text-teal-600" : "text-muted"
      )}
    >
      <Icon size={22} strokeWidth={active ? 2.6 : 2} />
      {label}
    </Link>
  );
}
