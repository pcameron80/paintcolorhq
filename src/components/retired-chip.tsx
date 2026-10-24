import { availabilityLabel, availabilityTooltip } from "@/lib/availability";
import type { ColorAvailability } from "@/lib/types";

// "Retired" / "Discontinued" chip for a match in the tools and the widget.
// Renders nothing for a current color (or when availability is unknown, which
// is every color while the v1 matcher RPC is answering).
export function RetiredChip({
  availability,
  className = "rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-outline",
}: {
  availability: ColorAvailability | undefined | null;
  className?: string;
}) {
  const label = availabilityLabel(availability);
  if (!label) return null;
  return (
    <span title={availabilityTooltip(availability) ?? undefined} className={`inline-block shrink-0 ${className}`}>
      {label}
    </span>
  );
}
