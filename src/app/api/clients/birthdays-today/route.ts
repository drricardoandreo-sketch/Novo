import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * GET /api/clients/birthdays-today
 *
 * Retorna os clientes ativos que fazem aniversário hoje (dia/mês, sem
 * considerar o ano de nascimento).
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("clients")
    .select("id, nome_completo, telefone_whatsapp, data_nascimento, status")
    .neq("status", "cancelado");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const today = new Date();
  const todayMonth = today.getUTCMonth() + 1;
  const todayDay = today.getUTCDate();

  const aniversariantes = (data ?? []).filter((client) => {
    const [, month, day] = client.data_nascimento.split("-").map(Number);
    return month === todayMonth && day === todayDay;
  });

  return NextResponse.json({
    count: aniversariantes.length,
    clients: aniversariantes.map((c) => ({
      client_id: c.id,
      nome_completo: c.nome_completo,
      telefone_whatsapp: c.telefone_whatsapp,
      data_nascimento: c.data_nascimento,
    })),
  });
}
