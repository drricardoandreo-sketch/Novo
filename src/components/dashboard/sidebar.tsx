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

export function Sidebar({
  userEmail,
  open,
  onNavigate,
  onClose,
}: {
  userEmail?: string | null;
  open: boolean;
  onNavigate: () => void;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] shrink-0 flex-col border-r border-evolve-100 bg-white transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:transition-none ${
        open ? "translate-x-0 shadow-xl" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-evolve-100 px-6 py-5">
        <div>
          <p className="text-lg font-semibold text-evolve-900">Evolve</p>
          <p className="text-xs text-gray-500">Gestão do estúdio</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar menu"
          className="rounded-lg p-1.5 text-gray-400 hover:bg-evolve-50 hover:text-evolve-700 lg:hidden"
        >
          <CloseIcon />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
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

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
