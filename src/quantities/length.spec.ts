import * as fc from "fast-check"
import { Length } from "./length";

function len(constraints?: fc.IntegerConstraints): fc.Arbitrary<Length> {
  return fc.integer({ min: 0, ...constraints }).map(i => new Length(i));
}

describe("quantities/length", () => {
  describe("from", () => {
    it("should just track any given (natural) number of millimeters", () => {
      fc.assert(fc.property(fc.nat(), (millimeters) => {
        expect(Length.from(millimeters, "mm").millimeters).toBe(millimeters);
      }));
    });

    it("should round the number of millimeters, if a decimal one is given", () => {
      fc.assert(fc.property(fc.nat(), fc.double({ min: 0.01, max: 0.49, noNaN: true }), (millimeters, decimal) => {
        expect(Length.from(millimeters + decimal, "mm").millimeters).toBe(millimeters);
      }));

      fc.assert(fc.property(fc.nat(), fc.double({ min: 0.50, max: 0.99, noNaN: true }), (millimeters, decimal) => {
        expect(Length.from(millimeters + decimal, "mm").millimeters).toBe(millimeters + 1);
      }));
    });

    it("should count 10 millimeters for every given centimeter", () => {
      fc.assert(fc.property(fc.nat(), (centimeters) => {
        expect(Length.from(centimeters, "cm").millimeters).toBe(centimeters * 10);
      }));
    });

    it("should count 100 millimeters for every given decimeter", () => {
      fc.assert(fc.property(fc.nat(), (decimeters) => {
        expect(Length.from(decimeters, "dm").millimeters).toBe(decimeters * 100);
      }));
    });

    it("should count 1,000 millimeters for every given meter", () => {
      fc.assert(fc.property(fc.nat(), (meters) => {
        expect(Length.from(meters, "m").millimeters).toBe(meters * 1_000);
      }));
    });

    it("should count 10,000 millimeters for every given decameter", () => {
      fc.assert(fc.property(fc.nat(), (meters) => {
        expect(Length.from(meters, "dam").millimeters).toBe(meters * 10_000);
      }));
    });

    it("should count 100,000 millimeters for every given hectometer", () => {
      fc.assert(fc.property(fc.nat(), (meters) => {
        expect(Length.from(meters, "hm").millimeters).toBe(meters * 100_000);
      }));
    });

    it("should count 1,000,000 millimeters for every given kilometer", () => {
      fc.assert(fc.property(fc.nat(), (meters) => {
        expect(Length.from(meters, "km").millimeters).toBe(meters * 1_000_000);
      }));
    });
  });

  describe("add", () => {
    it("should have the commutativity property", () => {
      fc.assert(fc.property(len(), len(), (a, b) => {
        expect(a.add(b)).toEqual(b.add(a));
      }));
    });

    it("should have the associativity property", () => {
      fc.assert(fc.property(len(), len(), len(), (a, b, c) => {
        expect(a.add(b.add(c))).toEqual(a.add(b).add(c));
      }));
    });

    it("should have zero as an identity element", () => {
      fc.assert(fc.property(len(), (a) => {
        const zero = new Length(0);
        expect(a.add(zero)).toEqual(a);
      }));
    });

    it("should have undefined as an identity element", () => {
      fc.assert(fc.property(len(), (a) => {
        expect(a.add()).toEqual(a);
      }));
    });
  });

  describe("multiply", () => {
    it("should have the commutativity property", () => {
      fc.assert(fc.property(fc.nat(), fc.nat(), (a, b) => {
        const lengthA = new Length(a);
        const lengthB = new Length(b);
        expect(lengthA.multiply(b)).toEqual(lengthB.multiply(a));
      }));
    });

    it("should have the associativity property", () => {
      fc.assert(fc.property(len({ max: 1_000_000 }), fc.nat(1000), fc.nat(1000), (a, b, c) => {
        expect(a.multiply(b * c)).toEqual(a.multiply(b).multiply(c));
      }));
    });

    it("should have the distributivity property", () => {
      fc.assert(fc.property(len({ max: 1_000_000 }), fc.nat(1000), fc.nat(1000), (a, b, c) => {
        expect(a.multiply(b + c)).toEqual(a.multiply(b).add(a.multiply(c)));
      }));
    });

    it("should have the zero property", () => {
      fc.assert(fc.property(len(), (a) => {
        expect(a.multiply(0)).toEqual(new Length(0));
      }));
    });

    it("should have one as an identity element", () => {
      fc.assert(fc.property(len(), (a) => {
        expect(a.multiply(1)).toEqual(a);
      }));
    });
  });

  describe("divide", () => {
    it("should invert the effect of multiplication", () => {
      fc.assert(fc.property(len({ min: 1 }), fc.nat(), (a, b) => {
        const product = a.multiply(b);
        expect(product.divide(a)).toBeCloseTo(b);
      }));
    });
  });

  describe("toString", () => {
    it("should render any length between 0 and 9 millimeters as millimeters", () => {
      fc.assert(fc.property(len({ min: 0, max: 9 }), (a) => {
        expect(a.toString()).toEqual(expect.stringMatching(/^[0-9.]+mm$/));
      }));
    });

    it("should render the actual number of millimeters", () => {
      fc.assert(fc.property(fc.integer({ min: 0, max: 9 }), (a) => {
        const lengthA = new Length(a);
        expect(parseFloat(lengthA.toString())).toBeCloseTo(a);
      }));
    });

    it("should render any length between 10 and 99 millimeters as centimeters", () => {
      fc.assert(fc.property(len({ min: 10, max: 99 }), (a) => {
        expect(a.toString()).toEqual(expect.stringMatching(/^[0-9.]+cm$/));
      }));
    });

    it("should render a number of centimeters matching the number of millimeters", () => {
      fc.assert(fc.property(fc.integer({ min: 10, max: 999 }), (a) => {
        const lengthA = new Length(a);
        expect(parseFloat(lengthA.toString()) * 10).toBeCloseTo(a);
      }));
    });

    it("should render any length between 1,000 and 9,999 millimeters as meters", () => {
      fc.assert(fc.property(len({ min: 1_000, max: 999_999 }), (a) => {
        expect(a.toString()).toEqual(expect.stringMatching(/^[0-9.]+m$/));
      }));
    });

    it("should render a number of meters matching the number of millimeters", () => {
      fc.assert(fc.property(fc.integer({ min: 1_000, max: 999_999 }), (a) => {
        const lengthA = new Length(a);
        expect(parseFloat(lengthA.toString()) * 1_000).toBeCloseTo(a, -2);
      }));
    });

    it("should render any length greater than 1,000,000 millimeters as kilometers", () => {
      fc.assert(fc.property(len({ min: 1_000_000 }), (a) => {
        expect(a.toString()).toEqual(expect.stringMatching(/^[0-9.]+km/));
      }));
    });

    it("should render a number of kilometers matching the number of millimeters", () => {
      fc.assert(fc.property(fc.integer({ min: 1_000_000 }), (a) => {
        const lengthA = new Length(a);
        expect(parseFloat(lengthA.toString()) * 1_000_000).toBeCloseTo(a, -5);
      }));
    });
  });
});
