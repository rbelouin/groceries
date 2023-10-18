import { parsePrice } from "./price";
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
});
