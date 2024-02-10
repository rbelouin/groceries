import * as fc from "fast-check"
import { MixedQuantities } from "./mixed-quantities";
import { Volume } from "./volume";
import { Mass } from "./mass";
import { Length } from "./length";
import { Area } from "./xarea";

const warn = console.warn;
beforeEach(() => {
  global.console.warn = jest.fn();
});

afterEach(() => {
  global.console.warn = warn;
});

describe("quantities/mixed-quantities", () => {
  describe("from", () => {
    it("should recognize a volume", () => {
      fc.assert(fc.property(fc.nat(), fc.constantFrom(...Volume.units), (count, unit) => {
        expect(MixedQuantities.from(count, unit).inventory).toEqual({
          volume: Volume.from(count, unit),
        });
      }));
    });

    it("should recognize a mass", () => {
      fc.assert(fc.property(fc.nat(), fc.constantFrom(...Mass.units), (count, unit) => {
        expect(MixedQuantities.from(count, unit).inventory).toEqual({
          mass: Mass.from(count, unit),
        });
      }));
    });

    it("should recognize a length", () => {
      fc.assert(fc.property(fc.nat(), fc.constantFrom(...Length.units), (count, unit) => {
        expect(MixedQuantities.from(count, unit).inventory).toEqual({
          length: Length.from(count, unit),
        });
      }));
    });

    it("should recognize an area", () => {
      fc.assert(fc.property(fc.nat(), fc.constantFrom(...Area.units), (count, unit) => {
        expect(MixedQuantities.from(count, unit).inventory).toEqual({
          area: Area.from(count, unit),
        });
      }));
    });

    it("should track anything else under its own unit", () => {
      fc.assert(fc.property(fc.nat(), otherUnit(), (count, unit) => {
        expect(MixedQuantities.from(count, unit).inventory).toEqual({
          unknown: new Map([[unit, count]]),
        });
      }));
    });

    it("should treat undefined as an empty unit", () => {
      fc.assert(fc.property(fc.nat(), (count) => {
        expect(MixedQuantities.from(count, undefined).inventory).toEqual({
          unknown: new Map([["", count]]),
        });
      }));
    });
  });

  describe("add", () => {
    it("should have the commutativity property", () => {
      fc.assert(fc.property(mixedQuantities(), mixedQuantities(), (a, b) => {
        expect(a.add(b)).toEqual(b.add(a));
      }));
    });

    it("should have the associativity property", () => {
      fc.assert(fc.property(mixedQuantities(), mixedQuantities(), mixedQuantities(), (a, b, c) => {
        expect(a.add(b.add(c))).toEqual(a.add(b).add(c));
      }));
    });

    it("should have zero as an identity element", () => {
      fc.assert(fc.property(mixedQuantities(), (a) => {
        const zero = new MixedQuantities({});
        expect(a.add(zero)).toEqual(a);
      }));
    });

    it("should have undefined as an identity element", () => {
      fc.assert(fc.property(mixedQuantities(), (a) => {
        expect(a.add()).toEqual(a);
      }));
    });
  });

  describe("multiply", () => {
    it("should be equivalent to adding n-times", () => {
      fc.assert(fc.property(mixedQuantities(), fc.nat(100), (a, b) => {
        expect(a.multiply(b)).toEqual(new Array(b).fill(a).reduce((acc, item) => acc.add(item), new MixedQuantities({})));
      }));
    });

    it("should have the associativity property", () => {
      fc.assert(fc.property(mixedQuantities(), fc.nat(1000), fc.nat(1000), (a, b, c) => {
        expect(a.multiply(b * c)).toEqual(a.multiply(b).multiply(c));
      }));
    });

    it("should have the distributivity property", () => {
      fc.assert(fc.property(mixedQuantities(), fc.nat(1000), fc.nat(1000), (a, b, c) => {
        expect(a.multiply(b + c)).toEqual(a.multiply(b).add(a.multiply(c)));
      }));
    });

    it("should have the zero property", () => {
      fc.assert(fc.property(mixedQuantities(), (a) => {
        expect(a.multiply(0)).toEqual(new MixedQuantities({}));
      }));
    });

    it("should have one as an identity element", () => {
      fc.assert(fc.property(mixedQuantities(), (a) => {
        expect(a.multiply(1)).toEqual(a);
      }));
    });
  });

  describe("divide", () => {
    it("should invert the effect of multiplication on a pure volume", () => {
      fc.assert(fc.property(vol({ min: 1 }), fc.nat(), (a, b) => {
        const quantity = new MixedQuantities({ volume: a });
        const product = quantity.multiply(b);
        expect(product.divide(quantity)).toBeCloseTo(b);
      }));
    });

    it("should invert the effect of multiplication on a pure mass", () => {
      fc.assert(fc.property(mass({ min: 1 }), fc.nat(), (a, b) => {
        const quantity = new MixedQuantities({ mass: a });
        const product = quantity.multiply(b);
        expect(product.divide(quantity)).toBeCloseTo(b);
      }));
    });

    it("should invert the effect of multiplication on a pure length", () => {
      fc.assert(fc.property(len({ min: 1 }), fc.nat(), (a, b) => {
        const quantity = new MixedQuantities({ length: a });
        const product = quantity.multiply(b);
        expect(product.divide(quantity)).toBeCloseTo(b);
      }));
    });

    it("should invert the effect of multiplication on a pure area", () => {
      fc.assert(fc.property(area({ min: 1 }), fc.nat(), (a, b) => {
        const quantity = new MixedQuantities({ area: a });
        const product = quantity.multiply(b);
        expect(product.divide(quantity)).toBeCloseTo(b);
      }));
    });

    it("should invert the effect of multiplication on a quantity containing a single unknown unit", () => {
      fc.assert(fc.property(fc.integer({ min: 1 }), otherUnit(), fc.nat(), (a, unit, b) => {
        const quantity = new MixedQuantities({ unknown: new Map([[unit, a]]) });
        const product = quantity.multiply(b);
        expect(product.divide(quantity)).toBeCloseTo(b);
      }));
    });

    it("should throw an exception when dividing volume <-> mass", () => {
      fc.assert(fc.property(vol({ min: 1 }), mass({ min: 1 }), (a, b) => {
        expect(() => new MixedQuantities({ volume: a }).divide(new MixedQuantities({ mass: b }))).toThrow();
      }));

      fc.assert(fc.property(mass({ min: 1 }), vol({ min: 1 }), (a, b) => {
        expect(() => new MixedQuantities({ mass: a }).divide(new MixedQuantities({ volume: b }))).toThrow();
      }));
    });

    it("should throw an exception when dividing volume <-> unknown", () => {
      fc.assert(fc.property(vol({ min: 1 }), unknown(), (a, b) => {
        expect(() => new MixedQuantities({ volume: a }).divide(new MixedQuantities({ unknown: b }))).toThrow();
      }));

      fc.assert(fc.property(unknown(), vol({ min: 1 }), (a, b) => {
        expect(() => new MixedQuantities({ unknown: a }).divide(new MixedQuantities({ volume: b }))).toThrow();
      }));
    });

    it("should throw an exception when dividing mass <-> unknown", () => {
      fc.assert(fc.property(mass({ min: 1 }), unknown(), (a, b) => {
        expect(() => new MixedQuantities({ mass: a }).divide(new MixedQuantities({ unknown: b }))).toThrow();
      }));

      fc.assert(fc.property(unknown(), mass({ min: 1 }), (a, b) => {
        expect(() => new MixedQuantities({ unknown: a }).divide(new MixedQuantities({ mass: b }))).toThrow();
      }));
    });
  });

  describe("toString", () => {
    it("should render an empty quantity as an empty string", () => {
      expect(new MixedQuantities({}).toString()).toEqual("");
    });

    it("should render a pure volume as a volume", () => {
      fc.assert(fc.property(vol(), (v) => {
        expect(new MixedQuantities({ volume: v }).toString()).toEqual(v.toString());
      }));
    });

    it("should render a pure mass as a mass", () => {
      fc.assert(fc.property(mass(), (m) => {
        expect(new MixedQuantities({ mass: m }).toString()).toEqual(m.toString());
      }));
    });

    it("should render a pure length as a length", () => {
      fc.assert(fc.property(len(), (l) => {
        expect(new MixedQuantities({ length: l }).toString()).toEqual(l.toString());
      }));
    });

    it("should render a pure area as an area", () => {
      fc.assert(fc.property(area(), (a) => {
        expect(new MixedQuantities({ area: a }).toString()).toEqual(a.toString());
      }));
    });

    it("should render an illustrative example correctly", () => {
      expect(new MixedQuantities({
        volume: Volume.from(4.2, "cl"),
        mass: Mass.from(300, "g"),
        unknown: new Map([
          ["gousses", 6],
          ["", 4],
          ["pièces", 3],
        ]),
      }).toString()).toEqual("4.2cl|300g|6 gousses|4|3 pièces");
    });
  });

  describe("parse", () => {
    it("should parse numbers", () => {
      fc.assert(fc.property(fc.nat(), (value) => {
        expect(MixedQuantities.parse(value)).toEqual(new MixedQuantities({
          unknown: new Map([["", value]]),
        }));
      }));
    });

    it("should be able to parse any serialization of a MixedQuantities", () => {
      fc.assert(fc.property(mixedQuantities(), (value) => {
        /*
         * Repeating the operation twice mitigates failures caused by rounded values.
         * Example given:
         * 1. 1001 milligrams serialize to 1kg
         * 2. 1kg gets parsed to 1000 milligrams
         * 3. Which serializes to 1kg again
         */
        const roundedValue = MixedQuantities.parse(value.toString());
        const serializedValue = roundedValue.toString();
        expect(serializedValue).toEqual(value.toString());
        expect(MixedQuantities.parse(serializedValue)).toEqual(roundedValue);
      }));
    });
  });
});

function otherUnit() {
  return fc.string()
    .map(str => str.replace(/ /g, ""))
    .filter(str => ([...Volume.units, ...Mass.units, ...Length.units] as readonly string[]).indexOf(str) === -1)
    .filter(str => str.indexOf("|") === -1);
}

function vol(constraints?: fc.IntegerConstraints): fc.Arbitrary<Volume> {
  return fc.integer({ min: 0, ...constraints }).map(milliliters => new Volume(milliliters));
}

function mass(constraints?: fc.IntegerConstraints): fc.Arbitrary<Mass> {
  return fc.integer({ min: 0, ...constraints }).map(milligrams => new Mass(milligrams));
}

function len(constraints?: fc.IntegerConstraints): fc.Arbitrary<Length> {
  return fc.integer({ min: 0, ...constraints }).map(millimeters => new Length(millimeters));
}

function area(constraints?: fc.IntegerConstraints): fc.Arbitrary<Area> {
  return fc.integer({ min: 0, ...constraints }).map(squaredMillimeters => new Area(squaredMillimeters));
}

function unknown(): fc.Arbitrary<Map<string, number>> {
  return fc.dictionary(otherUnit(), fc.nat())
    .filter(dict => Object.keys(dict).length > 0)
    .map(dict => new Map(Object.entries(dict)));
}

function mixedQuantities(): fc.Arbitrary<MixedQuantities> {
  return fc.record({
    volume: fc.option(vol(), { nil: undefined }),
    mass: fc.option(mass(), { nil: undefined }),
    length: fc.option(len(), { nil: undefined }),
    area: fc.option(area(), { nil: undefined }),
    unknown: fc.option(unknown(), { nil: undefined }),
  }).map((inventory) => new MixedQuantities(inventory));
}
