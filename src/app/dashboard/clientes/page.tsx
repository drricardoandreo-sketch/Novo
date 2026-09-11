import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/roles";
import { CLIENT_STATUS_LABEL, type ClientStatus } from "@/types/database";
import { formatCurrency } from "@/lib/format";

const STATUS_BADGE: Record<ClientStatus, string> = {
  ativo: "bg-evolve-100 text-evolve-800",
  trancado: "bg-amber-100 text-amber-800",
  cancelado: "bg-red-100 text-red-700",
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const supabase = createClient();
  const role = await getCurrentUserRole();
  const isAdmin = role === "admin";

  let query = supabase
    .from("clients")
    .select("id, nome_completo, telefone_whatsapp, status, valor_plano, forma_pagamento")
    .order("nome_completo");

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }
  if (searchParams.q) {
    query = query.ilike("nome_completo", `%${searchParams.q}%`);
  }

  const { data: clients } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-evolve-900">Clientes</h1>
          <p className="text-sm text-gray-500">
            {clients?.length ?? 0} cliente(s) encontrados
          </p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/clientes/novo" className="btn-primary">
            + Novo cliente
          </Link>
        )}
      </div>

      <form className="flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          placeholder="Buscar por nome..."
          defaultValue={searchParams.q}
          className="input max-w-xs"
        />
        <select name="status" defaultValue={searchParams.status ?? ""} className="input max-w-xs">
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="trancado">Trancado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <button type="submit" className="btn-secondary">
          Filtrar
        </button>
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-evolve-100 bg-evolve-50/60 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">WhatsApp</th>
              {isAdmin && <th className="px-4 py-3">Plano</th>}
              {isAdmin && <th className="px-4 py-3">Pagamento</th>}
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(clients ?? []).map((client) => (
              <tr key={client.id} className="hover:bg-evolve-50/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/clientes/${client.id}`}
                    className="font-medium text-evolve-700 hover:underline"
                  >
                    {client.nome_completo}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {client.telefone_whatsapp}
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-gray-600">
                    {formatCurrency(Number(client.valor_plano))}
                  </td>
                )}
                {isAdmin && (
                  <td className="px-4 py-3 text-gray-600 capitalize">
                    {client.forma_pagamento}
                  </td>
                )}
                <td className="px-4 py-3">
                  <span
                    className={`badge ${STATUS_BADGE[client.status as ClientStatus]}`}
                  >
                    {CLIENT_STATUS_LABEL[client.status as ClientStatus]}
                  </span>
                </td>
              </tr>
            ))}
            {(!clients || clients.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
