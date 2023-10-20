import { getTotalPriceForQuantity, parsePrice, serializeTotalPrice } from "./price";
import { parseQuantity } from "./quantity";

const error = console.error;

beforeEach(() => {
  (global as any).parseQuantity = parseQuantity;
  console.error = jest.fn();
});

afterEach(() => {
  delete (global as any).parseQuantity;
  console.error = error;
});

describe("price", () => {
  describe("parsePrice", () => {
    it("should throw an error if the price is invalid", () => {
      expect(() => parsePrice("Coucou !")).toThrow("Invalid price: Coucou !");
    });

    it("should throw an error if the quantity is invalid", () => {
      expect(() => parsePrice("3€/plop")).toThrow("Invalid quantity: plop");
    });

    [{
      input: "4kr",
      output: {
        value: 4,
        currency: "kr",
        quantity: {
          type: "countable",
          count: 1,
          unit: undefined,
        },
      },
    }, {
      input: "4€",
      output: {
        value: 4,
        currency: "€",
        quantity: {
          type: "countable",
          count: 1,
          unit: undefined,
        },
      },
    }, {
      input: "4kr/kg",
      output: {
        value: 4,
        currency: "kr",
        quantity: {
          type: "weight",
          count: 1000000,
          unit: "mg",
        },
      },
    }, {
      input: "8kr/12",
      output: {
        value: 8,
        currency: "kr",
        quantity: {
          type: "countable",
          count: 12,
          unit: undefined,
        },
      },
    }, {
      input: "16kr/250ml",
      output: {
        value: 16,
        currency: "kr",
        quantity: {
          type: "volume",
          count: 250,
          unit: "ml",
        },
      },
    }].forEach(({ input, output }) => it(`should parse ${input}`, () => {
      expect(parsePrice(input)).toStrictEqual(output);
    }));
  });

  describe("getTotalPriceForQuantity", () => {
    [{
      priceQuantity: { type: "countable", count: 4, unit: undefined } as const,
      quantity: { type: "volume", count: 4, unit: "ml" } as const,
    }, {
      priceQuantity: { type: "volume", count: 5, unit: "ml" } as const,
      quantity: { type: "weight", count: 5, unit: "kg" } as const,
    }, {
      priceQuantity: { type: "weight", count: 6, unit: "mg" } as const,
      quantity: { type: "countable", count: 6, unit: undefined } as const,
    }].forEach(({ priceQuantity, quantity }) => {
      it(`should return "undefined" if quantities are not of the same dimension. e.g. ${priceQuantity.type} != ${quantity.type}`, () => {
        expect(getTotalPriceForQuantity({ value: 4, currency: "kr", quantity: priceQuantity }, quantity)).toBeUndefined();
      });
    });

    [{
      priceQuantity: { type: "volume", count: 5, unit: "ml" } as const,
      quantity: { type: "volume", count: 5, unit: "l" } as const,
    }, {
      priceQuantity: { type: "weight", count: 6, unit: "mg" } as const,
      quantity: { type: "weight", count: 6, unit: "kg" } as const,
    }].forEach(({ priceQuantity, quantity }) => {
      it(`should return "undefined" if quantities are not of the same unit. e.g. ${priceQuantity.unit} != ${quantity.unit}`, () => {
        expect(getTotalPriceForQuantity({ value: 4, currency: "kr", quantity: priceQuantity }, quantity)).toBeUndefined();
      });
    });

    [{
      price: { value: 4, currency: "kr", quantity: { type: "volume", count: 5, unit: "ml" }} as const,
      quantity: { type: "volume", count: 10, unit: "ml" } as const,
      expectedPrice: { value: 8, currency: "kr" },
    }, {
      price: { value: 5, currency: "€", quantity: { type: "weight", count: 3, unit: "mg" }} as const,
      quantity: { type: "weight", count: 10, unit: "mg" } as const,
      expectedPrice: { value: 16.67, currency: "€" },
    }].forEach(({ price, quantity, expectedPrice }, index) => {
      it(`should return the total price otherwise. #${index}`, () => {
        expect(getTotalPriceForQuantity(price, quantity)).toStrictEqual(expectedPrice);
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
