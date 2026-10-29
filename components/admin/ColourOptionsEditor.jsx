'use client';

export default function ColourOptionsEditor({ variants, basePrice, onChange }) {
  const change = (index, fields) => onChange(variants.map((variant, i) => i === index ? { ...variant, ...fields } : variant));
  return <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4" aria-label="Colour options and prices">
    <h2 className="text-lg font-bold">Colours & Separate Prices</h2>
    <p className="text-sm text-gray-600">Enter the final selling price for each colour, not an extra charge. Colours share the product&apos;s total stock. Unavailable colours cannot be ordered.</p>
    {variants.map((variant, index) => <fieldset key={variant.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
      <legend className="px-1 font-bold">Colour {index + 1}</legend>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm font-semibold">Colour name
          <input aria-label={`Colour ${index + 1} name`} maxLength={40} value={variant.color} onChange={e => change(index, { color: e.target.value })} className="mt-1 w-full rounded-lg border p-2.5" />
        </label>
        <label className="text-sm font-semibold">Final price (PKR)
          <input aria-label={`Colour ${index + 1} final price`} type="number" min="0.01" max="1000000" step="0.01" disabled={variant.useBasePrice} value={variant.useBasePrice ? basePrice : variant.price ?? ''} onChange={e => change(index, { price: e.target.value === '' ? null : Number(e.target.value) })} placeholder="Enter selling price" className="mt-1 w-full rounded-lg border p-2.5 disabled:bg-gray-100" />
        </label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input aria-label={`Colour ${index + 1} use base price`} type="checkbox" checked={variant.useBasePrice} onChange={e => change(index, { useBasePrice: e.target.checked, price: e.target.checked ? null : Number(basePrice) || null })} />Use product base price</label>
        <label className="flex items-center gap-2"><input aria-label={`Colour ${index + 1} available`} type="checkbox" checked={variant.enabled} onChange={e => change(index, { enabled: e.target.checked })} />Available to order</label>
        <button type="button" disabled={variants.length <= 1} onClick={() => onChange(variants.filter((_, i) => i !== index))} className="text-red-700 underline disabled:opacity-40">Remove colour</button>
      </div>
    </fieldset>)}
    <button type="button" disabled={variants.length >= 12} className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-40" onClick={() => onChange([...variants, { id: 'colour-' + crypto.randomUUID().slice(0, 8), color: '', price: null, useBasePrice: false, enabled: false }])}>Add colour</button>
  </section>;
}
