import { createClient } from "@/lib/supabase/server";
import { updatePasswordAction } from "./actions";

export default async function ContaPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-evolve-900">Minha conta</h1>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>

      <div className="card space-y-4">
        <h2 className="font-medium text-evolve-900">Trocar senha</h2>

        {searchParams.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.error}
          </p>
        )}
        {searchParams.success && (
          <p className="rounded-lg bg-evolve-50 px-3 py-2 text-sm text-evolve-800">
            Senha atualizada com sucesso.
          </p>
        )}

        <form action={updatePasswordAction} className="space-y-4">
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
            Salvar nova senha
          </button>
        </form>
      </div>
    </div>
  );
}
