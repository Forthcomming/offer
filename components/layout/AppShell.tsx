"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type NavItem = {
  href: string;
  label: string;
  subLabel: string;
};

const NAV: NavItem[] = [
  { href: "/", label: "看板", subLabel: "Dashboard" },
  { href: "/schedule", label: "日程", subLabel: "Schedule" },
  { href: "/materials", label: "材料中心", subLabel: "Materials" },
  { href: "/email", label: "邮箱中心", subLabel: "Email" },
];

type AppShellProps = {
  title?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ title, headerRight, children }: AppShellProps) {
  const pathname = usePathname() ?? "/";

  return (
    <div className="relative z-10 min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 px-3 py-3 sm:gap-6 sm:px-6 sm:py-6">
        <aside className="hidden w-64 shrink-0 sm:block">
          <div className="sticky top-6">
            <div className="rounded-2xl border border-white/25 bg-[var(--glass-bg)] shadow-[var(--glass-shadow)] backdrop-blur-2xl">
              <div className="border-b border-white/15 px-4 py-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-600">
                  Job Dashboard
                </p>
                <p className="text-base font-semibold text-slate-900">
                  今天你拿offer了吗？
                </p>
              </div>
              <nav className="p-2">
                {NAV.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center justify-between rounded-xl border px-3 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
                        active
                          ? "border-indigo-300/55 bg-indigo-500/10 text-slate-900 shadow-sm"
                          : "border-transparent bg-white/0 text-slate-800 hover:border-white/25 hover:bg-white/15",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {item.label}
                        </span>
                        <span className="block text-[11px] text-slate-600">
                          {item.subLabel}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full transition",
                          active ? "bg-indigo-500" : "bg-slate-300/70 group-hover:bg-slate-400/70",
                        )}
                        aria-hidden="true"
                      />
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="sticky top-0 z-30 -mx-3 border-b border-white/25 bg-[var(--glass-bg)] shadow-[var(--glass-shadow)] backdrop-blur-2xl sm:hidden">
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {title ?? "今天你拿offer了吗？"}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  {NAV.map((item) => {
                    const active = isActivePath(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "rounded-lg border px-2 py-1 text-[11px] font-medium transition",
                          active
                            ? "border-indigo-300/55 bg-indigo-500/10 text-indigo-950"
                            : "border-white/25 bg-white/10 text-slate-800 hover:bg-white/20",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
              {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
            </div>
          </div>

          <main className="pt-3 sm:pt-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

