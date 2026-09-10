import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

function addDays(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * GET /api/clients/due-soon?days=3
 *
 * Retorna clientes com pagamento pendente vencendo exatamente em `days`
 * dias a partir de hoje. Pensado para disparo automático de lembrete via
 * WhatsApp (n8n).
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const daysParam = request.nextUrl.searchParams.get("days");
  const days = Number.isFinite(Number(daysParam)) ? Number(daysParam) : 3;
  const targetDate = addDays(days);

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, valor, data_vencimento, mes_referencia, clients(id, nome_completo, telefone_whatsapp)"
    )
    .eq("status", "pendente")
    .eq("data_vencimento", targetDate);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = (data ?? []).map((p: any) => ({
    payment_id: p.id,
    client_id: p.clients?.id,
    nome_completo: p.clients?.nome_completo,
    telefone_whatsapp: p.clients?.telefone_whatsapp,
    valor: p.valor,
    data_vencimento: p.data_vencimento,
    mes_referencia: p.mes_referencia,
    dias_para_vencer: days,
  }));

  return NextResponse.json({ days, count: result.length, clients: result });
}
