import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { parseFinanceMessage } from "@/lib/finance/parse-message";
import { formatCurrency } from "@/lib/format";

/**
 * POST /api/financas/whatsapp
 *
 * Porta de entrada pra automação de WhatsApp (via n8n): recebe o texto cru
 * da mensagem, interpreta e lança em finance_transactions. Autenticação
 * própria (FINANCE_API_KEY) — nunca aceita sessão de cookie, já que isso
 * daria acesso a qualquer usuário logado no dashboard do estúdio.
 *
 * Body: { "texto": "gastei 50 no mercado" }
 */
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  const expected = process.env.FINANCE_API_KEY;
  if (!expected || apiKey !== expected) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userId = process.env.FINANCE_OWNER_USER_ID;
  if (!userId) {
    return NextResponse.json(
      { error: "FINANCE_OWNER_USER_ID não configurado no servidor" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const texto = body?.texto;
  if (!texto || typeof texto !== "string") {
    return NextResponse.json({ error: "Informe 'texto' no corpo da requisição" }, { status: 400 });
  }

  const parsed = parseFinanceMessage(texto);
  if ("error" in parsed) {
    return NextResponse.json({ ok: false, reply: parsed.error }, { status: 200 });
  }

  const supabase = createServiceRoleClient();

  let categoriaId: string | null = null;
  if (parsed.categoria) {
    const { data: categoria } = await supabase
      .from("finance_categories")
      .select("id")
      .eq("user_id", userId)
      .eq("nome", parsed.categoria)
      .eq("tipo", parsed.tipo)
      .maybeSingle();
    categoriaId = categoria?.id ?? null;
  }

  const { error } = await supabase.from("finance_transactions").insert({
    user_id: userId,
    data: new Date().toISOString().slice(0, 10),
    tipo: parsed.tipo,
    valor: parsed.valor,
    categoria_id: categoriaId,
    descricao: parsed.descricao,
    forma_pagamento: "pix",
  });

  if (error) {
    return NextResponse.json({ ok: false, reply: `Erro ao salvar: ${error.message}` }, { status: 500 });
  }

  const sinal = parsed.tipo === "receita" ? "+" : "-";
  const reply = `Anotado ✅ ${sinal}${formatCurrency(parsed.valor)}${
    parsed.categoria ? ` em ${parsed.categoria}` : ""
  }${parsed.descricao ? ` (${parsed.descricao})` : ""}`;

  return NextResponse.json({
    ok: true,
    reply,
    tipo: parsed.tipo,
    valor: parsed.valor,
    categoria: parsed.categoria,
    descricao: parsed.descricao,
  });
}
