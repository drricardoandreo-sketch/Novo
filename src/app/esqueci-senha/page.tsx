import Link from "next/link";
import { requestPasswordResetAction } from "./actions";

export default function EsqueciSenhaPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-evolve-950 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-1 text-center text-2xl font-semibold text-evolve-900">
          Esqueci minha senha
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>

        {searchParams.error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.error}
          </p>
        )}
        {searchParams.success && (
          <p className="mb-4 rounded-lg bg-evolve-50 px-3 py-2 text-sm text-evolve-800">
            Se esse e-mail estiver cadastrado, você vai receber um link em
            instantes. Verifique também a caixa de spam.
          </p>
        )}

        <form action={requestPasswordResetAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="input"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Enviar link
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-evolve-700 hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </main>
  );
}
