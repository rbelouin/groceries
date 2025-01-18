import * as fc from "fast-check"
import { Volume } from "./volume";

function vol(constraints?: fc.IntegerConstraints): fc.Arbitrary<Volume> {
  return fc.integer({ min: 0, ...constraints }).map(i => new Volume(i));
}

describe("quantities/volume", () => {
  describe("from", () => {
    it("should just track any given (natural) number of milliliters", () => {
      fc.assert(fc.property(fc.nat(), (milliliters) => {
        expect(Volume.from(milliliters, "ml").milliliters).toBe(milliliters);
      }));
    });

    it("should round the number of milliliters, if a decimal one is given", () => {
      fc.assert(fc.property(fc.nat(), fc.double({ min: 0.01, max: 0.49, noNaN: true }), (milliliters, decimal) => {
        expect(Volume.from(milliliters + decimal, "ml").milliliters).toBe(milliliters);
      }));

      fc.assert(fc.property(fc.nat(), fc.double({ min: 0.50, max: 0.99, noNaN: true }), (milliliters, decimal) => {
        expect(Volume.from(milliliters + decimal, "ml").milliliters).toBe(milliliters + 1);
      }));
    });

    it("should count 5 milliliters for every given c-à-c", () => {
      fc.assert(fc.property(fc.nat(), (teaSpoons) => {
        expect(Volume.from(teaSpoons, "c-à-c").milliliters).toBe(teaSpoons * 5);
      }));
    });

    it("should count 10 milliliters for every given centiliter", () => {
      fc.assert(fc.property(fc.nat(), (centiliters) => {
        expect(Volume.from(centiliters, "cl").milliliters).toBe(centiliters * 10);
      }));
    });

    it("should count 10 milliliters for every given c-à-s", () => {
      fc.assert(fc.property(fc.nat(), (tableSpoons) => {
        expect(Volume.from(tableSpoons, "c-à-s").milliliters).toBe(tableSpoons * 15);
      }));
    });

    it("should count 100 milliliters for every given dl", () => {
      fc.assert(fc.property(fc.nat(), (deciliters) => {
        expect(Volume.from(deciliters, "dl").milliliters).toBe(deciliters * 100);
      }));
    });

    it("should count 1000 milliliters for every given l", () => {
      fc.assert(fc.property(fc.nat(), (liters) => {
        expect(Volume.from(liters, "l").milliliters).toBe(liters * 1000);
      }));
    });
  });

  describe("add", () => {
    it("should have the commutativity property", () => {
      fc.assert(fc.property(vol(), vol(), (a, b) => {
        expect(a.add(b)).toEqual(b.add(a));
      }));
    });

    it("should have the associativity property", () => {
      fc.assert(fc.property(vol(), vol(), vol(), (a, b, c) => {
        expect(a.add(b.add(c))).toEqual(a.add(b).add(c));
      }));
    });

    it("should have zero as an identity element", () => {
      fc.assert(fc.property(vol(), (a) => {
        const zero = new Volume(0);
        expect(a.add(zero)).toEqual(a);
      }));
    });

    it("should have undefined as an identity element", () => {
      fc.assert(fc.property(vol(), (a) => {
        expect(a.add()).toEqual(a);
      }));
    });
  });

  describe("multiply", () => {
    it("should have the commutativity property", () => {
      fc.assert(fc.property(fc.nat(), fc.nat(), (a, b) => {
        const volumeA = new Volume(a);
        const volumeB = new Volume(b);
        expect(volumeA.multiply(b)).toEqual(volumeB.multiply(a));
      }));
    });

    it("should have the associativity property", () => {
      fc.assert(fc.property(vol({ max: 1_000_000 }), fc.nat(1000), fc.nat(1000), (a, b, c) => {
        expect(a.multiply(b * c)).toEqual(a.multiply(b).multiply(c));
      }));
    });

    it("should have the distributivity property", () => {
      fc.assert(fc.property(vol({ max: 1_000_000 }), fc.nat(1000), fc.nat(1000), (a, b, c) => {
        expect(a.multiply(b + c)).toEqual(a.multiply(b).add(a.multiply(c)));
      }));
    });

    it("should have the zero property", () => {
      fc.assert(fc.property(vol(), (a) => {
        expect(a.multiply(0)).toEqual(new Volume(0));
      }));
    });

    it("should have one as an identity element", () => {
      fc.assert(fc.property(vol(), (a) => {
        expect(a.multiply(1)).toEqual(a);
      }));
    });
  });

  describe("divide", () => {
    it("should invert the effect of multiplication", () => {
      fc.assert(fc.property(vol({ min: 1 }), fc.nat(), (a, b) => {
        const product = a.multiply(b);
        expect(product.divide(a)).toBeCloseTo(b);
      }));
    });
  });

  describe("toString", () => {
    it("should render any volume between 0 and 9 milliliters as milliliters", () => {
      fc.assert(fc.property(vol({ min: 0, max: 9 }), (a) => {
        expect(a.toString()).toEqual(expect.stringMatching(/^[0-9.]+ml$/));
      }));
    });

    it("should render the actual number of milliliters", () => {
      fc.assert(fc.property(fc.integer({ min: 0, max: 9 }), (a) => {
        const volumeA = new Volume(a);
        expect(parseFloat(volumeA.toString())).toBeCloseTo(a);
      }));
    });

    it("should render any volume between 10 and 99 milliliters as centiliters", () => {
      fc.assert(fc.property(vol({ min: 10, max: 99 }), (a) => {
        expect(a.toString()).toEqual(expect.stringMatching(/^[0-9.]+cl$/));
      }));
    });

    it("should render a number of centiliters matching the number of milliliters", () => {
      fc.assert(fc.property(fc.integer({ min: 10, max: 99 }), (a) => {
        const volumeA = new Volume(a);
        expect(parseFloat(volumeA.toString()) * 10).toBeCloseTo(a);
      }));
    });

    it("should render any volume between 100 and 999 milliliters as centiliters", () => {
      fc.assert(fc.property(vol({ min: 100, max: 999 }), (a) => {
        expect(a.toString()).toEqual(expect.stringMatching(/^[0-9.]+dl$/));
      }));
    });

    it("should render a number of deciliters matching the number of milliliters", () => {
      fc.assert(fc.property(fc.integer({ min: 100, max: 999 }), (a) => {
        const volumeA = new Volume(a);
        expect(parseFloat(volumeA.toString()) * 100).toBeCloseTo(a);
      }));
    });

    it("should render any volume greater than 1000 milliliters as liters", () => {
      fc.assert(fc.property(vol({ min: 1000 }), (a) => {
        expect(a.toString()).toEqual(expect.stringMatching(/^[0-9.]+l$/));
      }));
    });

    it("should render a number of liters matching the number of milliliters", () => {
      fc.assert(fc.property(fc.integer({ min: 1000 }), (a) => {
        const volumeA = new Volume(a);
        expect(parseFloat(volumeA.toString()) * 1000).toBeCloseTo(a, -2);
      }));
    });
  });
});
