import { getSupplyList, type SupplyListInput } from "@/lib/painting-supplies";

/**
 * "You'll also need" shopping list rendered under the calculator result.
 * Pure render from calculator state; Amazon links carry rel="sponsored" and
 * the outbound clicks are picked up by the AnalyticsProvider's retailer-domain
 * delegation (amazon.com is in its list), so no extra tracking is wired here.
 */
export function SuppliesList(props: SupplyListInput) {
  const supplies = getSupplyList(props);

  return (
    <div className="rounded-xl border border-gray-200 p-6 lg:col-span-2">
      <h2 className="text-lg font-semibold text-gray-900">
        You&apos;ll Also Need
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        The supply list for your {props.lengthFt}&prime; &times; {props.widthFt}
        &prime; room — quantities sized from your dimensions, not a generic kit.
      </p>

      <ul className="mt-5 divide-y divide-gray-100">
        {supplies.map((item) => (
          <li
            key={item.name}
            className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="min-w-0">
              <span className="font-medium text-gray-900">{item.name}</span>
              <span className="ml-2 text-sm text-gray-500">
                {item.quantity}
              </span>
              <p className="mt-0.5 text-sm text-gray-600">{item.detail}</p>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              className="shrink-0 text-sm font-medium text-brand-blue hover:underline"
            >
              View on Amazon &rarr;
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-gray-500">
        Supply links go to Amazon search results. As an Amazon Associate, Paint
        Color HQ earns from qualifying purchases — it costs you nothing extra.
        The reusables here (frame, brush, pole, canvas cloth) also stock the
        paint aisle at Home Depot or Lowe&apos;s if you&apos;re headed there for
        the paint anyway.
      </p>
    </div>
  );
}
