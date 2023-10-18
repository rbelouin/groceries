import type { ParsedQuantity, parseQuantity as ParseQuantity } from "./quantity";

declare const parseQuantity: typeof ParseQuantity;

export type Price = {
  value: number;
  currency: string;
  quantity: ParsedQuantity;
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
