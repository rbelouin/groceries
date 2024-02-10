import type { MixedQuantities as MixedQuantitiesClass } from "./quantities";

declare const MixedQuantities: typeof MixedQuantitiesClass;

export type Price = {
  value: number;
  currency: string;
  quantity: MixedQuantitiesClass;
};

export type TotalPrice = {
  value: number;
  currency: string;
};

export function parsePrice(str: string): Price {
  const result = str.match(/^([0-9.]+)([^0-9\/]+)(\/(.*))?$/);
  if (result === null) {
    throw new Error(`Invalid price: ${str}`);
  }

  const [_, valueString, currency, _2, quantityString] = result;
  const value = parseFloat(valueString);

  const quantity = quantityString
    ? MixedQuantities.parse((/^[0-9]/).test(quantityString) ? quantityString : `1${quantityString}`)
    : MixedQuantities.from(1);

  if (typeof quantity === "string") {
    throw new Error(`Invalid quantity: ${quantityString}`);
  }

  return { value, currency, quantity };
}

export function getTotalPriceForQuantity(price: Price, quantity: MixedQuantitiesClass): TotalPrice | undefined {
  try {
    return {
      value: Math.round(quantity.divide(price.quantity) * price.value * 100) / 100,
      currency: price.currency,
    };
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

export function serializeTotalPrice(price: TotalPrice): string {
  return `${Math.round(price.value * 100) / 100}${price.currency}`;
};
