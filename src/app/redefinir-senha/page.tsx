import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePasswordAfterResetAction } from "./actions";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/esqueci-senha?error=${encodeURIComponent("Link inválido ou expirado. Solicite um novo.")}`
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-evolve-950 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-1 text-center text-2xl font-semibold text-evolve-900">
          Nova senha
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Defina sua nova senha de acesso ao painel.
        </p>

        {searchParams.error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.error}
          </p>
        )}

        <form action={updatePasswordAfterResetAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="nova_senha">
              Nova senha
            </label>
            <input
              id="nova_senha"
              name="nova_senha"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="confirmar_senha">
              Confirmar nova senha
            </label>
            <input
              id="confirmar_senha"
              name="confirmar_senha"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="input"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Salvar e entrar
          </button>
        </form>
      </div>
    </main>
  );
}
