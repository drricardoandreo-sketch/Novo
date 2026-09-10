import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-evolve-950 px-4 text-center text-white">
      <h1 className="text-4xl font-semibold tracking-tight">Evolve</h1>
      <p className="max-w-md text-evolve-100">
        Sistema de gestão para o estúdio de pilates Evolve: clientes, turmas,
        frequência, pagamentos e financeiro em um só lugar.
      </p>
      <Link
        href="/login"
        className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-evolve-900 transition hover:bg-evolve-100"
      >
        Entrar no painel
      </Link>
    </main>
  );
}
