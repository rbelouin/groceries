import * as fc from "fast-check"
import { Quantity } from "./quantity";
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

describe("quantities/quantity", () => {
  describe("from", () => {
    it("should recognize a volume", () => {
      fc.assert(fc.property(fc.nat(), fc.constantFrom(...Volume.units()), (count, unit) => {
        expect(Quantity.from(count, unit).q).toEqual({
          type: "volume",
          value: Volume.from(count, unit),
        });
      }));
    });

    it("should recognize a mass", () => {
      fc.assert(fc.property(fc.nat(), fc.constantFrom(...Mass.units()), (count, unit) => {
        expect(Quantity.from(count, unit).q).toEqual({
          type: "mass",
          value: Mass.from(count, unit),
        });
      }));
    });

    it("should recognize a length", () => {
      fc.assert(fc.property(fc.nat(), fc.constantFrom(...Length.units()), (count, unit) => {
        expect(Quantity.from(count, unit).q).toEqual({
          type: "length",
          value: Length.from(count, unit),
        });
      }));
    });

    it("should recognize an area", () => {
      fc.assert(fc.property(fc.nat(), fc.constantFrom(...Area.units()), (count, unit) => {
        expect(Quantity.from(count, unit).q).toEqual({
          type: "area",
          value: Area.from(count, unit),
        });
      }));
    });

    it("should track anything else under its own unit", () => {
      fc.assert(fc.property(fc.nat(), otherUnit(), (count, unit) => {
        expect(Quantity.from(count, unit).q).toEqual({
          type: "unknown",
          unit,
          count,
        });
      }));
    });

    it("should treat undefined as an empty unit", () => {
      fc.assert(fc.property(fc.nat(), (count) => {
        expect(Quantity.from(count, undefined).q).toEqual({
          type: "unknown",
          unit: "",
          count,
        });
      }));
    });
  });

  describe("parse", () => {
    it("should parse numbers", () => {
      fc.assert(fc.property(fc.nat(), (value) => {
        expect(Quantity.parse(value)?.q).toEqual({
          type: "unknown",
          unit: "",
          count: value,
        });
      }));
    });

    it("should be able to parse any serialization of a volume", () => {
      fc.assert(fc.property(vol(), (volume) => {
        /*
         * Repeating the operation twice mitigates failures caused by rounded values.
         * Example given:
         * 1. 1001 milliliters serialize to 1l
         * 2. 1l gets parsed to 1000 milliliters
         * 3. Which serializes to 1l again
         */
        const roundedValue = Quantity.parse(volume.toString());
        expect(roundedValue).toBeDefined();
        expect(roundedValue?.q.type).toEqual("volume");

        const serializedValue = roundedValue?.toString();
        expect(serializedValue).toEqual(volume.toString());
        expect(Quantity.parse(serializedValue)).toEqual(roundedValue);
      }));
    });

    it("should be able to parse any serialization of a mass", () => {
      fc.assert(fc.property(mass(), (mass) => {
        const roundedValue = Quantity.parse(mass.toString());
        expect(roundedValue).toBeDefined();
        expect(roundedValue?.q.type).toEqual("mass");

        const serializedValue = roundedValue?.toString();
        expect(serializedValue).toEqual(mass.toString());
        expect(Quantity.parse(serializedValue)).toEqual(roundedValue);
      }));
    });

    it("should be able to parse any serialization of a length", () => {
      fc.assert(fc.property(len(), (length) => {
        const roundedValue = Quantity.parse(length.toString());
        expect(roundedValue).toBeDefined();
        expect(roundedValue?.q.type).toEqual("length");

        const serializedValue = roundedValue?.toString();
        expect(serializedValue).toEqual(length.toString());
        expect(Quantity.parse(serializedValue)).toEqual(roundedValue);
      }));
    });

    it("should be able to parse any serialization of an area", () => {
      fc.assert(fc.property(area(), (area) => {
        const roundedValue = Quantity.parse(area.toString());
        expect(roundedValue).toBeDefined();
        expect(roundedValue?.q.type).toEqual("area");

        const serializedValue = roundedValue?.toString();
        expect(serializedValue).toEqual(area.toString());
        expect(Quantity.parse(serializedValue)).toEqual(roundedValue);
      }));
    });

    it("should be able to parse a quantity of an unknown unit", () => {
      fc.assert(fc.property(otherUnit(), fc.nat(), (unit, count) => {
        const quantity = Quantity.parse(`${count} ${unit}`);
        expect(quantity).toBeDefined();
        expect(quantity?.q.type).toEqual("unknown");
        expect((quantity as any).q.count).toEqual(count);
        expect((quantity as any).q.unit).toEqual(unit);
      }));
    });
  });
});

function otherUnit() {
  return fc.string()
    .map(str => str.replace(/ /g, ""))
    .filter(str => ([...Volume.units(), ...Mass.units(), ...Length.units()] as readonly string[]).indexOf(str) === -1)
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
