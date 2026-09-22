export function ProgressBar({
  value,
  max,
  tone = "evolve",
}: {
  value: number;
  max: number;
  tone?: "evolve" | "red" | "amber";
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  const barTone =
    tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-500" : "bg-evolve-600";

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full ${barTone}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
