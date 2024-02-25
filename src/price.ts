import { MixedQuantities, Quantity } from "./quantities";

export type Price = {
  value: number;
  currency: string;
  quantity: Quantity;
};

export type TotalPrice = {
  value: number;
  currency: string;
};

export function parsePrice(str: string, conversions: string = ""): Price {
  const result = str.match(/^([0-9.]+)([^0-9\/]+)(\/(.*))?$/);
  if (result === null) {
    throw new Error(`Invalid price: ${str}`);
  }

  const [_, valueString, currency, _2, quantityString] = result;
  const value = parseFloat(valueString);

  const quantity = quantityString
    ? Quantity.parse((/^[0-9]/).test(quantityString) ? quantityString : `1${quantityString}`, conversions)
    : Quantity.parse("1", conversions);

  if (typeof quantity === "undefined") {
    throw new Error(`Invalid quantity: ${quantityString}`);
  }

  return { value, currency, quantity };
}

export function getTotalPriceForQuantity(price: Price, quantity: MixedQuantities): TotalPrice | undefined {
  try {
    return {
      value: Math.round(quantity.divide(MixedQuantities.parse(price.quantity.toString())!) * price.value * 100) / 100,
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
