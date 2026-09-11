"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Visão geral", icon: "📊" },
  { href: "/dashboard/clientes", label: "Clientes", icon: "🧑‍🤝‍🧑" },
  { href: "/dashboard/pagamentos", label: "Pagamentos", icon: "💳" },
  { href: "/dashboard/turmas", label: "Turmas", icon: "🗓️" },
  { href: "/dashboard/frequencia", label: "Frequência", icon: "✅" },
  { href: "/dashboard/conta", label: "Minha conta", icon: "⚙️" },
];

export function Sidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-evolve-100 bg-white">
      <div className="border-b border-evolve-100 px-6 py-5">
        <p className="text-lg font-semibold text-evolve-900">Evolve</p>
        <p className="text-xs text-gray-500">Gestão do estúdio</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-evolve-600 text-white"
                  : "text-gray-600 hover:bg-evolve-50 hover:text-evolve-800"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-evolve-100 px-4 py-4">
        {userEmail && (
          <p className="mb-2 truncate text-xs text-gray-500">{userEmail}</p>
        )}
        <form action={logout}>
          <button type="submit" className="btn-secondary w-full text-sm">
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
