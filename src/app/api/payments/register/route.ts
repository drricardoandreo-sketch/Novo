import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * POST /api/payments/register
 *
 * Registra um pagamento recebido. Aceita como identificador:
 *  - { "payment_id": "uuid" }
 *  - { "client_id": "uuid", "mes_referencia": "YYYY-MM-01" }
 *
 * Body opcional: { "data_pagamento": "YYYY-MM-DD" } (padrão: hoje)
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { payment_id, client_id, mes_referencia, data_pagamento } = body as {
    payment_id?: string;
    client_id?: string;
    mes_referencia?: string;
    data_pagamento?: string;
  };

  if (!payment_id && !(client_id && mes_referencia)) {
    return NextResponse.json(
      {
        error:
          "Informe 'payment_id' ou o par 'client_id' + 'mes_referencia' (YYYY-MM-01)",
      },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  const dataPagamento = data_pagamento ?? new Date().toISOString().slice(0, 10);

  let query = supabase.from("payments").update({ data_pagamento: dataPagamento });

  query = payment_id
    ? query.eq("id", payment_id)
    : query.eq("client_id", client_id!).eq("mes_referencia", mes_referencia!);

  const { data, error } = await query
    .select("*, clients(nome_completo)")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Pagamento não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ payment: data });
}
