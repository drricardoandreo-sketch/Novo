import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type ApiAuthResult =
  | { authorized: true; via: "api-key" | "session" }
  | { authorized: false; via: null };

/**
 * Autenticação dual para as rotas de API:
 *  - header `x-api-key` (integrações externas, ex: n8n)
 *  - cookie de sessão do Supabase Auth (chamadas feitas pelo dashboard)
 */
export async function authenticateApiRequest(
  request: NextRequest
): Promise<ApiAuthResult> {
  const apiKey = request.headers.get("x-api-key");

  if (apiKey) {
    const expected = process.env.EVOLVE_API_KEY;
    if (expected && apiKey === expected) {
      return { authorized: true, via: "api-key" };
    }
    return { authorized: false, via: null };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { authorized: true, via: "session" };
  }

  return { authorized: false, via: null };
}
