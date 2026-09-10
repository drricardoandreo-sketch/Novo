export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const [year, month, day] = value.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
