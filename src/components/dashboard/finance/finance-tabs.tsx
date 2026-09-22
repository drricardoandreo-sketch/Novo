"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/financas", label: "Resumo" },
  { href: "/dashboard/financas/lancamentos", label: "Lançamentos" },
  { href: "/dashboard/financas/dividas", label: "Dívidas" },
  { href: "/dashboard/financas/metas", label: "Metas" },
  { href: "/dashboard/financas/relatorios", label: "Relatórios" },
];

export function FinanceTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-evolve-100 pb-2">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/dashboard/financas"
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              isActive
                ? "bg-evolve-600 text-white"
                : "text-gray-600 hover:bg-evolve-50 hover:text-evolve-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
