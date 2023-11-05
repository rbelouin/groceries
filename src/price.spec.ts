import { getTotalPriceForQuantity, parsePrice, serializeTotalPrice } from "./price";
import { MixedQuantities } from "./quantities";

const error = console.error;
const warn = console.warn;

beforeEach(() => {
  (global as any).MixedQuantities = MixedQuantities;
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  delete (global as any).MixedQuantities;
  console.error = error;
  console.warn = warn;
});

describe("price", () => {
  describe("parsePrice", () => {
    it("should throw an error if the price is invalid", () => {
      expect(() => parsePrice("Coucou !")).toThrow("Invalid price: Coucou !");
    });

    [{
      input: "4kr",
      output: {
        value: 4,
        currency: "kr",
        quantity: MixedQuantities.from(1),
      },
    }, {
      input: "4€",
      output: {
        value: 4,
        currency: "€",
        quantity: MixedQuantities.from(1),
      },
    }, {
      input: "4kr/kg",
      output: {
        value: 4,
        currency: "kr",
        quantity: MixedQuantities.from(1, "kg"),
      },
    }, {
      input: "8kr/12",
      output: {
        value: 8,
        currency: "kr",
        quantity: MixedQuantities.from(12),
      },
    }, {
      input: "16kr/250ml",
      output: {
        value: 16,
        currency: "kr",
        quantity: MixedQuantities.from(250, "ml"),
      },
    }].forEach(({ input, output }) => it(`should parse ${input}`, () => {
      expect(parsePrice(input)).toEqual(output);
    }));
  });

  describe("getTotalPriceForQuantity", () => {
    [{
      priceQuantity: MixedQuantities.from(4),
      quantity: MixedQuantities.from(4, "ml"),
    }, {
      priceQuantity: MixedQuantities.from(5, "ml"),
      quantity: MixedQuantities.from(5, "kg"),
    }, {
      priceQuantity: MixedQuantities.from(6, "mg"),
      quantity: MixedQuantities.from(6),
    }].forEach(({ priceQuantity, quantity }) => {
      it(`should return "undefined" if quantities are not of the same dimension. e.g. ${priceQuantity} != ${quantity}`, () => {
        expect(getTotalPriceForQuantity({ value: 4, currency: "kr", quantity: priceQuantity }, quantity)).toBeUndefined();
      });
    });

    [{
      price: { value: 4, currency: "kr", quantity: MixedQuantities.from(5, "ml")},
      quantity: MixedQuantities.from(10, "ml"),
      expectedPrice: { value: 8, currency: "kr" },
    }, {
      price: { value: 5, currency: "€", quantity: MixedQuantities.from(3, "mg")} as const,
      quantity: MixedQuantities.from(10, "mg"),
      expectedPrice: { value: 16.67, currency: "€" },
    }].forEach(({ price, quantity, expectedPrice }, index) => {
      it(`should return the total price otherwise. #${index}`, () => {
        expect(getTotalPriceForQuantity(price, quantity)).toEqual(expectedPrice);
      });
    });
  });

  describe("serializeTotalPrice", () => {
    [{
      input: { value: 5, currency: "€" },
      output: "5€",
    }, {
      input: { value: 1 / 3, currency: "kr" },
      output: "0.33kr",
    }].forEach(({ input, output }) => it(`should serialize ${JSON.stringify(input)} to ${output}`, () => {
      expect(serializeTotalPrice(input)).toBe(output);
    }));
  });
});
