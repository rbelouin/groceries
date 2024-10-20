import {
  getTotalPriceForQuantity,
  parsePrice,
  serializeTotalPrice,
} from "./price";
import { MixedQuantities, Quantity } from "./quantities";

const error = console.error;
const warn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = error;
  console.warn = warn;
});

describe("price", () => {
  describe("parsePrice", () => {
    it("should throw an error if the price is invalid", () => {
      expect(() => parsePrice("Coucou !")).toThrow("Invalid price: Coucou !");
    });

    [
      {
        input: "4kr",
        conversions: undefined,
        output: {
          value: 4,
          currency: "kr",
          quantity: Quantity.from(1),
        },
      },
      {
        input: "4€",
        conversions: "450g/1",
        output: {
          value: 4,
          currency: "€",
          quantity: Quantity.from(
            1,
            "",
            new Map([
              [
                "mass",
                new Map([["", [Quantity.from(450, "g"), Quantity.from(1)]]]),
              ],
            ]),
          ),
        },
      },
      {
        input: "4kr/kg",
        conversions: "100ml/150g",
        output: {
          value: 4,
          currency: "kr",
          quantity: Quantity.from(1, "kg", new Map([
            ["volume", new Map([
              ["mass", [Quantity.from(100, "ml"), Quantity.from(150, "g")]],
            ])],
          ])),
        },
      },
      {
        input: "8kr/12",
        conversions: "10ml/50g\n10ml/1",
        output: {
          value: 8,
          currency: "kr",
          quantity: Quantity.from(12, "", new Map([
            ["volume", new Map([
              ["mass", [Quantity.from(10, "ml"), Quantity.from(50, "g")]],
              ["", [Quantity.from(10, "ml"), Quantity.from(1)]],
            ])],
          ])),
        },
      },
      {
        input: "16kr/250ml",
        conversions: "83g/70ml\n50ml/2",
        output: {
          value: 16,
          currency: "kr",
          quantity: Quantity.from(250, "ml", new Map([
            ["mass", new Map([
              ["volume", [Quantity.from(83, "g"), Quantity.from(70, "ml")]],
            ])],
            ["volume", new Map([
              ["", [Quantity.from(50, "ml"), Quantity.from(2)]],
            ])],
          ])),
        },
      },
    ].forEach(({ input, conversions, output }) =>
      it(`should parse ${input}`, () => {
        expect(parsePrice(input, conversions)).toEqual(output);
      }),
    );
  });

  describe("getTotalPriceForQuantity", () => {
    [
      {
        price: {
          value: 4,
          currency: "kr",
          quantity: Quantity.from(5, "ml"),
        },
        quantity: MixedQuantities.from(10, "ml"),
        expectedPrice: { value: 8, currency: "kr" },
      },
      {
        price: {
          value: 5,
          currency: "€",
          quantity: Quantity.from(3, "mg"),
        } as const,
        quantity: MixedQuantities.from(10, "mg"),
        expectedPrice: { value: 16.67, currency: "€" },
      },
    ].forEach(({ price, quantity, expectedPrice }, index) => {
      it(`should return the total price for compatible types. #${index}`, () => {
        expect(getTotalPriceForQuantity(price, quantity)).toEqual(
          expectedPrice,
        );
      });
    });

    [
      {
        price: {
          value: 4,
          currency: "kr",
          quantity: Quantity.parse("1", "2ml/1")!,
        },
        quantity: MixedQuantities.from(4, "ml"),
        expectedPrice: { value: 8, currency: "kr" },
      },
      {
        price: {
          value: 5,
          currency: "€",
          quantity: Quantity.parse("1l", "200g/1l")!,
        },
        quantity: MixedQuantities.from(5, "kg"),
        expectedPrice: { value: 125, currency: "€" },
      },
      {
        price: {
          value: 10,
          currency: "$",
          quantity: Quantity.parse("50cl", "1cl/10g")!,
        },
        quantity: MixedQuantities.parse("1l|1kg"),
        expectedPrice: { value: 40, currency: "$" },
      },
    ].forEach(({ price, quantity, expectedPrice }) => {
      it(`should return the total price for incompatible types with conversion rule. e.g. ${price.quantity} != ${quantity}`, () => {
        expect(
          getTotalPriceForQuantity(
            price,
            quantity,
          ),
        ).toEqual(expectedPrice);
      });
    });

    [
      {
        priceQuantity: Quantity.from(4),
        quantity: MixedQuantities.from(4, "ml"),
      },
      {
        priceQuantity: Quantity.from(5, "ml"),
        quantity: MixedQuantities.from(5, "kg"),
      },
      {
        priceQuantity: Quantity.from(6, "mg"),
        quantity: MixedQuantities.from(6),
      },
    ].forEach(({ priceQuantity, quantity }) => {
      it(`should return "undefined" otherwise. e.g. ${priceQuantity} != ${quantity}`, () => {
        expect(
          getTotalPriceForQuantity(
            { value: 4, currency: "kr", quantity: priceQuantity },
            quantity,
          ),
        ).toBeUndefined();
      });
    });
  });

  describe("serializeTotalPrice", () => {
    [
      {
        input: { value: 5, currency: "€" },
        output: "5€",
      },
      {
        input: { value: 1 / 3, currency: "kr" },
        output: "0.33kr",
      },
    ].forEach(({ input, output }) =>
      it(`should serialize ${JSON.stringify(input)} to ${output}`, () => {
        expect(serializeTotalPrice(input)).toBe(output);
      }),
    );
  });
});
