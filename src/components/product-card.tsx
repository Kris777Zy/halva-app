import { AlertTriangle } from "lucide-react";
import type { ProductDto } from "./types";

export function ProductCard({ product: p }: { product: ProductDto }) {
  return (
    <div className="rounded-lg border border-sesame bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-caramel">{p.flavour}</h4>
        <span className="rounded-full bg-sesame px-2 py-0.5 text-xs font-semibold text-caramel-dark">
          €{p.priceEur.toFixed(2)}
        </span>
      </div>
      <p className="mt-1 text-xs text-gray-600">{p.ingredients}</p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-md bg-gray-50 py-1.5">
          <dt className="text-gray-500">Sugar</dt>
          <dd className="font-medium">{p.sugarPer100g} g/100 g</dd>
        </div>
        <div className="rounded-md bg-gray-50 py-1.5">
          <dt className="text-gray-500">Energy</dt>
          <dd className="font-medium">{p.kcalPer100g} kcal/100 g</dd>
        </div>
        <div className="rounded-md bg-gray-50 py-1.5">
          <dt className="text-gray-500">Weight</dt>
          <dd className="font-medium">{p.weightG} g</dd>
        </div>
      </dl>
      <p className="mt-2 flex items-start gap-1 text-xs text-amber-700">
        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
        <span>Allergens: {p.allergens}</span>
      </p>
    </div>
  );
}
