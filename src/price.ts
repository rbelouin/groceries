import type { ParsedQuantity, parseQuantity as ParseQuantity } from "./quantity";

declare const parseQuantity: typeof ParseQuantity;

export type Price = {
  value: number;
  currency: string;
  quantity: ParsedQuantity;
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
    ? parseQuantity((/^[0-9]/).test(quantityString) ? quantityString : `1${quantityString}`)
    : { type: "countable" as const, count: 1, unit: undefined };

  if (typeof quantity === "string") {
    throw new Error(`Invalid quantity: ${quantityString}`);
  }

  return { value, currency, quantity };
}

export function getTotalPriceForQuantity(price: Price, quantity: ParsedQuantity): TotalPrice | undefined {
  if (price.quantity.type !== quantity.type) {
    console.error(`Incompatible quantity types: ${price.quantity.type} != ${quantity.type}`);
    return undefined;
  }

  if (price.quantity.unit !== quantity.unit) {
    console.error(`Unit conversion is not yet supported by getTotalPriceForQuantity: ${price.quantity.unit} != ${quantity.unit}`);
    return undefined;
  }

  return {
    value: Math.round(price.value / price.quantity.count * quantity.count * 100) / 100,
    currency: price.currency,
  };
}

export function serializeTotalPrice(price: TotalPrice): string {
  return `${Math.round(price.value * 100) / 100}${price.currency}`;
};
