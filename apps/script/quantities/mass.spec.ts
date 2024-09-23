import * as fc from "fast-check"
import { Mass } from "./mass";

function mass(constraints?: fc.IntegerConstraints): fc.Arbitrary<Mass> {
  return fc.integer({ min: 0, ...constraints }).map(i => new Mass(i));
}

describe("quantities/mass", () => {
  describe("from", () => {
    it("should just track any given (natural) number of milligrams", () => {
      fc.assert(fc.property(fc.nat(), (milligrams) => {
        expect(Mass.from(milligrams, "mg").milligrams).toBe(milligrams);
      }));
    });

    it("should round the number of milligrams, if a decimal one is given", () => {
      fc.assert(fc.property(fc.nat(), fc.double({ min: 0.01, max: 0.49, noNaN: true }), (milligrams, decimal) => {
        expect(Mass.from(milligrams + decimal, "mg").milligrams).toBe(milligrams);
      }));

      fc.assert(fc.property(fc.nat(), fc.double({ min: 0.50, max: 0.99, noNaN: true }), (milligrams, decimal) => {
        expect(Mass.from(milligrams + decimal, "mg").milligrams).toBe(milligrams + 1);
      }));
    });

    it("should count 1000 milligrams for every given g", () => {
      fc.assert(fc.property(fc.nat(), (grams) => {
        expect(Mass.from(grams, "g").milligrams).toBe(1000 * grams);
      }));
    });

    it("should count 100,000 milligrams for every given hg", () => {
      fc.assert(fc.property(fc.nat(), (hectograms) => {
        expect(Mass.from(hectograms, "hg").milligrams).toBe(100_000 * hectograms);
      }));
    });

    it("should count 1,000,000 milligrams for every given kg", () => {
      fc.assert(fc.property(fc.nat(), (kilograms) => {
        expect(Mass.from(kilograms, "kg").milligrams).toBe(1_000_000 * kilograms);
      }));
    });
  });

  describe("add", () => {
    it("should have the commutativity property", () => {
      fc.assert(fc.property(mass(), mass(), (a, b) => {
        expect(a.add(b)).toEqual(b.add(a));
      }));
    });

    it("should have the associativity property", () => {
      fc.assert(fc.property(mass(), mass(), mass(), (a, b, c) => {
        expect(a.add(b.add(c))).toEqual(a.add(b).add(c));
      }));
    });

    it("should have zero as an identity element", () => {
      fc.assert(fc.property(mass(), (a) => {
        const zero = new Mass(0);
        expect(a.add(zero)).toEqual(a);
      }));
    });

    it("should have undefined as an identity element", () => {
      fc.assert(fc.property(mass(), (a) => {
        expect(a.add()).toEqual(a);
      }));
    });
  });

  describe("multiply", () => {
    it("should have the commutativity property", () => {
      fc.assert(fc.property(fc.nat(), fc.nat(), (a, b) => {
        const volumeA = new Mass(a);
        const volumeB = new Mass(b);
        expect(volumeA.multiply(b)).toEqual(volumeB.multiply(a));
      }));
    });

    it("should have the associativity property", () => {
      fc.assert(fc.property(mass({ max: 1_000_000 }), fc.nat(1000), fc.nat(1000), (a, b, c) => {
        expect(a.multiply(b * c)).toEqual(a.multiply(b).multiply(c));
      }));
    });

    it("should have the distributivity property", () => {
      fc.assert(fc.property(mass({ max: 1_000_000 }), fc.nat(1000), fc.nat(1000), (a, b, c) => {
        expect(a.multiply(b + c)).toEqual(a.multiply(b).add(a.multiply(c)));
      }));
    });

    it("should have the zero property", () => {
      fc.assert(fc.property(mass(), (a) => {
        expect(a.multiply(0)).toEqual(new Mass(0));
      }));
    });

    it("should have one as an identity element", () => {
      fc.assert(fc.property(mass(), (a) => {
        expect(a.multiply(1)).toEqual(a);
      }));
    });
  });

  describe("divide", () => {
    it("should invert the effect of multiplication", () => {
      fc.assert(fc.property(mass({ min: 1 }), fc.nat(), (a, b) => {
        const product = a.multiply(b);
        expect(product.divide(a)).toBeCloseTo(b);
      }));
    });
  });

  describe("toString", () => {
    it("should render any mass between 0 and 999 milligrams as milligrams", () => {
      fc.assert(fc.property(mass({ min: 0, max: 999 }), (a) => {
        expect(a.toString()).toEqual(expect.stringMatching(/^[0-9.]+mg$/));
      }));
    });

    it("should render the actual number of milligrams", () => {
      fc.assert(fc.property(fc.integer({ min: 0, max: 999 }), (a) => {
        const massA = new Mass(a);
        expect(parseFloat(massA.toString())).toBeCloseTo(a);
      }));
    });

    it("should render any mass between 1,000 and 999,999 milligrams as grams", () => {
      fc.assert(fc.property(mass({ min: 1_000, max: 999_999 }), (a) => {
        expect(a.toString()).toEqual(expect.stringMatching(/^[0-9.]+g$/));
      }));
    });

    it("should render a number of grams matching the number of milligrams", () => {
      fc.assert(fc.property(fc.integer({ min: 1_000, max: 999_999 }), (a) => {
        const massA = new Mass(a);
        expect(parseFloat(massA.toString()) * 1_000).toBeCloseTo(a, -2);
      }));
    });

    it("should render any mass greater than 1,000,000 as kilograms", () => {
      fc.assert(fc.property(mass({ min: 1_000_000 }), (a) => {
        expect(a.toString()).toEqual(expect.stringMatching(/^[0-9.]+kg$/));
      }));
    });

    it("should render a number of kilograms matching the number of milligrams", () => {
      fc.assert(fc.property(fc.integer({ min: 1_000_000 }), (a) => {
        const massA = new Mass(a);
        expect(parseFloat(massA.toString()) * 1_000_000).toBeCloseTo(a, -5);
      }));
    });
  });
});
