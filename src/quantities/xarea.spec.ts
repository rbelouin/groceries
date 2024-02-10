import * as fc from "fast-check"
import { Area } from "./xarea";

function area(constraints?: fc.IntegerConstraints): fc.Arbitrary<Area> {
  return fc.integer({ min: 0, ...constraints }).map(i => new Area(i));
}

describe("quantities/area", () => {
  describe("from", () => {
    it("should just track any given (natural) number of mm²", () => {
      fc.assert(fc.property(fc.nat(), fc.constantFrom(...["mm2", "mm^2", "mm²"] as const), (mm2, unit) => {
        expect(Area.from(mm2, unit).squaredMillimeters).toBe(mm2);
      }));
    });

    it("should round the number of mm², if a decimal one is given", () => {
      fc.assert(fc.property(fc.nat(), fc.double({ min: 0.01, max: 0.49, noNaN: true }), (mm2, decimal) => {
        expect(Area.from(mm2 + decimal, "mm²").squaredMillimeters).toBe(mm2);
      }));

      fc.assert(fc.property(fc.nat(), fc.double({ min: 0.50, max: 0.99, noNaN: true }), (mm2, decimal) => {
        expect(Area.from(mm2 + decimal, "mm²").squaredMillimeters).toBe(mm2 + 1);
      }));
    });

    it("should count 100 mm² for every given cm²", () => {
      fc.assert(fc.property(fc.nat(), fc.constantFrom(...["cm2", "cm^2", "cm²"] as const), (cm2, unit) => {
        expect(Area.from(cm2, unit).squaredMillimeters).toBe(cm2 * 100);
      }));
    });

    it("should count 10,000 mm² for every given dm²", () => {
      fc.assert(fc.property(fc.nat(), fc.constantFrom(...["dm2", "dm^2", "dm²"] as const), (dm2, unit) => {
        expect(Area.from(dm2, unit).squaredMillimeters).toBe(dm2 * 10_000);
      }));
    });

    it("should count 1,000,000 mm² for every given m²", () => {
      fc.assert(fc.property(fc.nat(), fc.constantFrom(...["m2", "m^2", "m²"] as const), (m2, unit) => {
        expect(Area.from(m2, unit).squaredMillimeters).toBe(m2 * 1_000_000);
      }));
    });

    it("should count 100,000,000 mm² for every given dam²", () => {
      fc.assert(fc.property(fc.nat(), fc.constantFrom(...["dam2", "dam^2", "dam²"] as const), (dam2, unit) => {
        expect(Area.from(dam2, unit).squaredMillimeters).toBe(dam2 * 100_000_000);
      }));
    });

    it("should count 10,000,000,000 mm² for every given hm²", () => {
      fc.assert(fc.property(fc.nat(), fc.constantFrom(...["hm2", "hm^2", "hm²"] as const), (hm2, unit) => {
        expect(Area.from(hm2, unit).squaredMillimeters).toBe(hm2 * 10_000_000_000);
      }));
    });

    it("should count 1,000,000,000,000 mm² for every given kilometer", () => {
      fc.assert(fc.property(fc.nat(), fc.constantFrom(...["km2", "km^2", "km²"] as const), (km2, unit) => {
        expect(Area.from(km2, unit).squaredMillimeters).toBe(km2 * 1_000_000_000_000);
      }));
    });
  });

  describe("add", () => {
    it("should have the commutativity property", () => {
      fc.assert(fc.property(area(), area(), (a, b) => {
        expect(a.add(b)).toEqual(b.add(a));
      }));
    });

    it("should have the associativity property", () => {
      fc.assert(fc.property(area(), area(), area(), (a, b, c) => {
        expect(a.add(b.add(c))).toEqual(a.add(b).add(c));
      }));
    });

    it("should have zero as an identity element", () => {
      fc.assert(fc.property(area(), (a) => {
        const zero = new Area(0);
        expect(a.add(zero)).toEqual(a);
      }));
    });

    it("should have undefined as an identity element", () => {
      fc.assert(fc.property(area(), (a) => {
        expect(a.add()).toEqual(a);
      }));
    });
  });

  describe("multiply", () => {
    it("should have the commutativity property", () => {
      fc.assert(fc.property(fc.nat(), fc.nat(), (a, b) => {
        const areaA = new Area(a);
        const areaB = new Area(b);
        expect(areaA.multiply(b)).toEqual(areaB.multiply(a));
      }));
    });

    it("should have the associativity property", () => {
      fc.assert(fc.property(area({ max: 1_000_000 }), fc.nat(1000), fc.nat(1000), (a, b, c) => {
        expect(a.multiply(b * c)).toEqual(a.multiply(b).multiply(c));
      }));
    });

    it("should have the distributivity property", () => {
      fc.assert(fc.property(area({ max: 1_000_000 }), fc.nat(1000), fc.nat(1000), (a, b, c) => {
        expect(a.multiply(b + c)).toEqual(a.multiply(b).add(a.multiply(c)));
      }));
    });

    it("should have the zero property", () => {
      fc.assert(fc.property(area(), (a) => {
        expect(a.multiply(0)).toEqual(new Area(0));
      }));
    });

    it("should have one as an identity element", () => {
      fc.assert(fc.property(area(), (a) => {
        expect(a.multiply(1)).toEqual(a);
      }));
    });
  });

  describe("divide", () => {
    it("should invert the effect of multiplication", () => {
      fc.assert(fc.property(area({ min: 1 }), fc.nat(), (a, b) => {
        const product = a.multiply(b);
        expect(product.divide(a)).toBeCloseTo(b);
      }));
    });
  });

  describe("toString", () => {
    it("should render any area between 0 and 99 mm² as mm²", () => {
      fc.assert(fc.property(area({ min: 0, max: 99 }), (a) => {
        expect(a.toString()).toEqual(expect.stringMatching(/^[0-9.]+mm²$/));
      }));
    });

    it("should render the actual number of mm²", () => {
      fc.assert(fc.property(fc.integer({ min: 0, max: 99 }), (a) => {
        const areaA = new Area(a);
        expect(parseFloat(areaA.toString())).toBeCloseTo(a);
      }));
    });

    it("should render any area between 100 and 999,999 mm² as cm²", () => {
      fc.assert(fc.property(area({ min: 100, max: 999_999 }), (a) => {
        expect(a.toString()).toEqual(expect.stringMatching(/^[0-9.]+cm²$/));
      }));
    });

    it("should render a number of cm² matching the number of mm²", () => {
      fc.assert(fc.property(fc.integer({ min: 100, max: 999_999 }), (a) => {
        const areaA = new Area(a);
        expect(parseFloat(areaA.toString()) * 100).toBeCloseTo(a);
      }));
    });

    it("should render any area between 1,000,000 and 999,999,999,999 mm² as m²", () => {
      fc.assert(fc.property(area({ min: 1_000_000, max: 999_999_999_999 }), (a) => {
        expect(a.toString()).toEqual(expect.stringMatching(/^[0-9.]+m²$/));
      }));
    });

    it("should render a number of m² matching the number of mm²", () => {
      fc.assert(fc.property(fc.integer({ min: 1_000_000, max: 999_999_999_999 }), (a) => {
        const areaA = new Area(a);
        expect(parseFloat(areaA.toString()) * 1_000_000).toBeCloseTo(a, -5);
      }));
    });

    it("should render any area greater than 1,000,000,000,000 mm² as km²", () => {
      fc.assert(fc.property(area({ min: 1_000_000_000_000, max: Number.MAX_SAFE_INTEGER }), (a) => {
        expect(a.toString()).toEqual(expect.stringMatching(/^[0-9.]+km²/));
      }));
    });

    it("should render a number of kilometers matching the number of millimeters", () => {
      fc.assert(fc.property(fc.integer({ min: 1_000_000_000_000, max: Number.MAX_SAFE_INTEGER }), (a) => {
        const areaA = new Area(a);
        expect(parseFloat(areaA.toString()) * 1_000_000_000_000).toBeCloseTo(a, -11);
      }));
    });
  });
});
