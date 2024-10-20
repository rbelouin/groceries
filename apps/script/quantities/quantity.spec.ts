import * as fc from "fast-check";
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
      fc.assert(
        fc.property(
          fc.nat(),
          fc.constantFrom(...Volume.units()),
          (count, unit) => {
            expect(Quantity.from(count, unit).q).toEqual({
              type: "volume",
              value: Volume.from(count, unit),
            });
          },
        ),
      );
    });

    it("should recognize a mass", () => {
      fc.assert(
        fc.property(
          fc.nat(),
          fc.constantFrom(...Mass.units()),
          (count, unit) => {
            expect(Quantity.from(count, unit).q).toEqual({
              type: "mass",
              value: Mass.from(count, unit),
            });
          },
        ),
      );
    });

    it("should recognize a length", () => {
      fc.assert(
        fc.property(
          fc.nat(),
          fc.constantFrom(...Length.units()),
          (count, unit) => {
            expect(Quantity.from(count, unit).q).toEqual({
              type: "length",
              value: Length.from(count, unit),
            });
          },
        ),
      );
    });

    it("should recognize an area", () => {
      fc.assert(
        fc.property(
          fc.nat(),
          fc.constantFrom(...Area.units()),
          (count, unit) => {
            expect(Quantity.from(count, unit).q).toEqual({
              type: "area",
              value: Area.from(count, unit),
            });
          },
        ),
      );
    });

    it("should track anything else under its own unit", () => {
      fc.assert(
        fc.property(fc.nat(), otherUnit(), (count, unit) => {
          expect(Quantity.from(count, unit).q).toEqual({
            type: "unknown",
            unit,
            count,
          });
        }),
      );
    });

    it("should treat undefined as an empty unit", () => {
      fc.assert(
        fc.property(fc.nat(), (count) => {
          expect(Quantity.from(count, undefined).q).toEqual({
            type: "unknown",
            unit: "",
            count,
          });
        }),
      );
    });
  });

  describe("parse", () => {
    it("should parse numbers", () => {
      fc.assert(
        fc.property(fc.nat(), (value) => {
          expect(Quantity.parse(value)?.q).toEqual({
            type: "unknown",
            unit: "",
            count: value,
          });
        }),
      );
    });

    it("should be able to parse any serialization of a volume", () => {
      fc.assert(
        fc.property(vol(), (volume) => {
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
        }),
      );
    });

    it("should be able to parse any serialization of a mass", () => {
      fc.assert(
        fc.property(mass(), (mass) => {
          const roundedValue = Quantity.parse(mass.toString());
          expect(roundedValue).toBeDefined();
          expect(roundedValue?.q.type).toEqual("mass");

          const serializedValue = roundedValue?.toString();
          expect(serializedValue).toEqual(mass.toString());
          expect(Quantity.parse(serializedValue)).toEqual(roundedValue);
        }),
      );
    });

    it("should be able to parse any serialization of a length", () => {
      fc.assert(
        fc.property(len(), (length) => {
          const roundedValue = Quantity.parse(length.toString());
          expect(roundedValue).toBeDefined();
          expect(roundedValue?.q.type).toEqual("length");

          const serializedValue = roundedValue?.toString();
          expect(serializedValue).toEqual(length.toString());
          expect(Quantity.parse(serializedValue)).toEqual(roundedValue);
        }),
      );
    });

    it("should be able to parse any serialization of an area", () => {
      fc.assert(
        fc.property(area(), (area) => {
          const roundedValue = Quantity.parse(area.toString());
          expect(roundedValue).toBeDefined();
          expect(roundedValue?.q.type).toEqual("area");

          const serializedValue = roundedValue?.toString();
          expect(serializedValue).toEqual(area.toString());
          expect(Quantity.parse(serializedValue)).toEqual(roundedValue);
        }),
      );
    });

    it("should be able to parse a quantity of an unknown unit", () => {
      fc.assert(
        fc.property(otherUnit(), fc.nat(), (unit, count) => {
          const quantity = Quantity.parse(`${count} ${unit}`);
          expect(quantity).toBeDefined();
          expect(quantity?.q.type).toEqual("unknown");
          expect((quantity as any).q.count).toEqual(count);
          expect((quantity as any).q.unit).toEqual(unit);
        }),
      );
    });

    [
      ["volume", vol(), "mass", mass()] as const,
      ["volume", vol(), "length", len()] as const,
      ["volume", vol(), "area", area()] as const,
      ["mass", mass(), "volume", vol()] as const,
      ["mass", mass(), "length", len()] as const,
      ["mass", mass(), "area", area()] as const,
      ["length", len(), "volume", vol()] as const,
      ["length", len(), "mass", mass()] as const,
      ["length", len(), "area", area()] as const,
      ["area", area(), "volume", vol()] as const,
      ["area", area(), "mass", mass()] as const,
      ["area", area(), "length", len()] as const,
    ].forEach(([type1, quantity1, type2, quantity2]) => {
      it(`should be able to parse a ${type1} -> ${type2} conversion`, () => {
        fc.assert(
          fc.property(quantity1, quantity2, (a, b) => {
            const conversion = `${a.toString()}/${b.toString()}`;
            const [quantity1, quantity2] = Quantity.parseConversion(conversion);
            expect(`${quantity1.toString()}/${quantity2.toString()}`).toEqual(
              conversion,
            );
          }),
        );
      });
    });

    [
      ["volume", vol()] as const,
      ["mass", mass()] as const,
      ["length", len()] as const,
      ["area", area()] as const,
    ].forEach(([type, quantity]) => {
      it(`should be able to parse a ${type} -> unknown conversion`, () => {
        fc.assert(
          fc.property(quantity, fc.nat(), otherUnit().filter(unit => unit !== ""), (a, n, unit) => {
            const conversion = `${a.toString()}/${n} ${unit}`;
            const [quantity1, quantity2] = Quantity.parseConversion(conversion);
            expect(`${quantity1.toString()}/${quantity2.toString()}`).toEqual(
              conversion,
            );
          }),
        );

        fc.assert(
          fc.property(quantity, fc.nat(), (a, n) => {
            const conversion = `${a.toString()}/${n}`;
            const [quantity1, quantity2] = Quantity.parseConversion(conversion);
            expect(`${quantity1.toString()}/${quantity2.toString()}`).toEqual(
              conversion,
            );
          }),
        );
      });

      it(`should be able to parse an unknown -> ${type} conversion`, () => {
        fc.assert(
          fc.property(fc.nat(), otherUnit().filter(unit => unit !== ""), quantity, (n, unit, b) => {
            const conversion = `${n} ${unit}/${b.toString()}`;
            const [quantity1, quantity2] = Quantity.parseConversion(conversion);
            expect(`${quantity1.toString()}/${quantity2.toString()}`).toEqual(
              conversion,
            );
          }),
        );

        fc.assert(
          fc.property(fc.nat(), quantity, (n, b) => {
            const conversion = `${n}/${b.toString()}`;
            const [quantity1, quantity2] = Quantity.parseConversion(conversion);
            expect(`${quantity1.toString()}/${quantity2.toString()}`).toEqual(
              conversion,
            );
          }),
        );
      });
    });
  });

  describe("add", () => {
    describe("compatible types", () => {
      [
        ["volume", vol()] as const,
        ["mass", mass()] as const,
        ["length", len()] as const,
        ["area", area()] as const,
      ].forEach(([type, quantity]) => {
        describe(`${type} + ${type}`, () => {
          it("should be commutative", () => {
            fc.assert(
              fc.property(quantity, quantity, (a, b) => {
                const termA = Quantity.parse(a.toString())!;
                const termB = Quantity.parse(b.toString())!;
                expect(termA.add(termB)).toEqual(termB.add(termA));
              }),
            );
          });

          it("should be associative", () => {
            fc.assert(
              fc.property(quantity, quantity, quantity, (a, b, c) => {
                const termA = Quantity.parse(a.toString())!;
                const termB = Quantity.parse(b.toString())!;
                const termC = Quantity.parse(c.toString())!;
                expect(termA.add(termB.add(termC))).toEqual(
                  termA.add(termB).add(termC),
                );
              }),
            );
          });

          it("should have zero as an identity element", () => {
            fc.assert(
              fc.property(quantity, quantity, (a, b) => {
                const termA = Quantity.parse(a.toString())!;
                const termB = Quantity.parse(b.toString())!.multiply(0);
                expect(termA.add(termB)).toEqual(termA);
              }),
            );
          });
        });
      });

      describe(`unknown + unknown (same unit)`, () => {
        it("should be commutative", () => {
          fc.assert(
            fc.property(fc.nat(), fc.nat(), otherUnit(), (a, b, unit) => {
              const termA = Quantity.from(a, unit);
              const termB = Quantity.from(b, unit);
              expect(termA.add(termB)).toEqual(termB.add(termA));
            }),
          );
        });

        it("should be associative", () => {
          fc.assert(
            fc.property(
              fc.nat(),
              fc.nat(),
              fc.nat(),
              otherUnit(),
              (a, b, c, unit) => {
                const termA = Quantity.from(a, unit);
                const termB = Quantity.from(b, unit);
                const termC = Quantity.from(c, unit);
                expect(termA.add(termB.add(termC))).toEqual(
                  termA.add(termB).add(termC),
                );
              },
            ),
          );
        });

        it("should have zero as an identity element", () => {
          fc.assert(
            fc.property(fc.nat(), otherUnit(), (a, unit) => {
              const termA = Quantity.from(a, unit);
              const termB = Quantity.from(0, unit);
              expect(termA.add(termB)).toEqual(termA);
            }),
          );
        });
      });
    });

    describe("incompatible types with no conversion rules", () => {
      [
        ["volume", vol(), "mass", mass()] as const,
        ["volume", vol(), "length", len()] as const,
        ["volume", vol(), "area", area()] as const,
        ["mass", mass(), "volume", vol()] as const,
        ["mass", mass(), "length", len()] as const,
        ["mass", mass(), "area", area()] as const,
        ["length", len(), "volume", vol()] as const,
        ["length", len(), "mass", mass()] as const,
        ["length", len(), "area", area()] as const,
        ["area", area(), "volume", vol()] as const,
        ["area", area(), "mass", mass()] as const,
        ["area", area(), "length", len()] as const,
      ].forEach(([type1, quantity1, type2, quantity2]) => {
        it(`should crash (${type1} + ${type2})`, () => {
          fc.assert(
            fc.property(quantity1, quantity2, (a, b) => {
              const termA = Quantity.parse(a.toString())!;
              const termB = Quantity.parse(b.toString())!;
              expect(() => termA.add(termB)).toThrow(
                `Incompatible types: ${type1} vs. ${type2}`,
              );
            }),
          );
        });
      });

      [
        ["volume", vol()] as const,
        ["mass", mass()] as const,
        ["length", len()] as const,
        ["area", area()] as const,
      ].forEach(([type, quantity]) => {
        it(`should crash (${type} + unknown)`, () => {
          fc.assert(
            fc.property(quantity, fc.nat(), otherUnit(), (a, b, unit) => {
              const termA = Quantity.parse(a.toString())!;
              const termB = Quantity.from(b, unit);
              expect(() => termA.add(termB)).toThrow(
                `Incompatible types: ${type} vs. unknown`,
              );
            }),
          );
        });

        it(`should crash (unknown + ${type})`, () => {
          fc.assert(
            fc.property(fc.nat(), otherUnit(), quantity, (a, unit, b) => {
              const termA = Quantity.from(a, unit);
              const termB = Quantity.parse(b.toString())!;
              expect(() => termA.add(termB)).toThrow(
                `Incompatible types: unknown vs. ${type}`,
              );
            }),
          );
        });
      });

      it("should crash (unknown of different units)", () => {
        fc.assert(
          fc.property(
            fc.nat(),
            fc.nat(),
            fc.uniqueArray(otherUnit(), { minLength: 2, maxLength: 2 }),
            (a, b, [unitA, unitB]) => {
              const termA = Quantity.from(a, unitA);
              const termB = Quantity.from(b, unitB);
              expect(() => termA.add(termB)).toThrow(
                `Incompatible units: ${unitA} vs. ${unitB}`,
              );
            },
          ),
        );
      });
    });

    describe("incompatible types with conversion rules", () => {
      [
        ["volume", vol({ min: 1 }), "mass", mass({ min: 1 })] as const,
        ["volume", vol({ min: 1 }), "length", len({ min: 1 })] as const,
        ["volume", vol({ min: 1 }), "area", area({ min: 1 })] as const,
        ["mass", mass({ min: 1 }), "volume", vol({ min: 1 })] as const,
        ["mass", mass({ min: 1 }), "length", len({ min: 1 })] as const,
        ["mass", mass({ min: 1 }), "area", area({ min: 1 })] as const,
        ["length", len({ min: 1 }), "volume", vol({ min: 1 })] as const,
        ["length", len({ min: 1 }), "mass", mass({ min: 1 })] as const,
        ["length", len({ min: 1 }), "area", area({ min: 1 })] as const,
        ["area", area({ min: 1 }), "volume", vol({ min: 1 })] as const,
        ["area", area({ min: 1 }), "mass", mass({ min: 1 })] as const,
        ["area", area({ min: 1 }), "length", len({ min: 1 })] as const,
      ].forEach(([type1, quantity1, type2, quantity2]) => {
        it(`should be commutative (${type1} + ${type2})`, () => {
          fc.assert(
            fc.property(quantity1, fc.integer({ min:1, max: 100}), quantity2, fc.integer({ min:1, max: 100}), (a, factorA, b, factorB) => {
              const roundedA = Quantity.parse(a.toString())!;
              const roundedB = Quantity.parse(b.toString())!;
              const conversions = `${roundedA.toString()}/${roundedB.toString()}`;

              const termA = Quantity.parse(a.toString(), conversions)!.multiply(factorA);
              const termB = Quantity.parse(b.toString(), conversions)!.multiply(factorB);

              expect(termA.add(termB)).toEqual(termB.add(termA).tryConvertTo(termA));
            }),
          );
        });

        it(`should be associative (${type1} + ${type2} + ${type2})`, () => {
          fc.assert(
            fc.property(quantity1, fc.integer({ min:1, max: 100}), quantity2, fc.integer({ min:1, max: 100}), fc.integer({ min: 1, max: 100 }), (a, factorA, b, factorB, factorC) => {
              const roundedA = Quantity.parse(a.toString())!;
              const roundedB = Quantity.parse(b.toString())!;
              const conversions = `${roundedA.toString()}/${roundedB.toString()}`;

              const termA = Quantity.parse(a.toString(), conversions)!.multiply(factorA);
              const termB = Quantity.parse(b.toString(), conversions)!.multiply(factorB);
              const termC = Quantity.parse(b.toString(), conversions)!.multiply(factorC);

              expect(termA.add(termB.add(termC))).toEqual(termA.add(termB).add(termC));
            }),
          );
        });

        it(`should have zero as an identity element (${type1} + ${type2})`, () => {
          fc.assert(
            fc.property(quantity1, fc.integer({ min:1, max: 100}), quantity2, (a, factorA, b) => {
              const roundedA = Quantity.parse(a.toString())!;
              const roundedB = Quantity.parse(b.toString())!;
              const conversions = `${roundedA.toString()}/${roundedB.toString()}`;

              const termA = Quantity.parse(a.toString(), conversions)!.multiply(factorA);
              const termB = Quantity.parse(b.toString(), conversions)!.multiply(0);

              expect(termA.add(termB)).toEqual(termA);
            }),
          );
        });
      });

      [
        ["volume", vol({ min: 1 })] as const,
        ["mass", mass({ min: 1 })] as const,
        ["length", len({ min: 1 })] as const,
        ["area", area({ min: 1 })] as const,
      ].forEach(([type1, quantity1]) => {
        it(`should be commutative (${type1} + unknown)`, () => {
          fc.assert(
            fc.property(quantity1, fc.integer({ min:1, max: 100}), fc.integer({ min: 1, max: 100 }), otherUnit(), fc.integer({ min:1, max: 100}), (a, factorA, countB, unitB, factorB) => {
              const roundedA = Quantity.parse(a.toString())!;
              const roundedB = Quantity.from(countB, unitB);
              const conversions = `${roundedA.toString()}/${roundedB.toString()}`;

              const termA = Quantity.parse(roundedA.toString(), conversions)!.multiply(factorA);
              const termB = Quantity.parse(roundedB.toString(), conversions)!.multiply(factorB);

              expect(termA.add(termB)).toEqual(termB.add(termA).tryConvertTo(termA));
            }),
          );
        });

        it(`should be associative (${type1} + unknown + unknown)`, () => {
          fc.assert(
            fc.property(quantity1, fc.integer({ min:1, max: 100}), fc.integer({ min: 1, max: 100 }), otherUnit(), fc.integer({ min:1, max: 100}), fc.integer({ min: 1, max: 100 }), (a, factorA, countB, unitB, factorB, factorC) => {
              const roundedA = Quantity.parse(a.toString())!;
              const roundedB = Quantity.from(countB, unitB);
              const conversions = `${roundedA.toString()}/${roundedB.toString()}`;

              const termA = Quantity.parse(roundedA.toString(), conversions)!.multiply(factorA);
              const termB = Quantity.parse(roundedB.toString(), conversions)!.multiply(factorB);
              const termC = Quantity.parse(roundedB.toString(), conversions)!.multiply(factorC);

              expect(termA.add(termB.add(termC))).toEqual(termA.add(termB).add(termC));
            }),
          );
        });

        it(`should have zero as an identity element (${type1} + unknown)`, () => {
          fc.assert(
            fc.property(quantity1, fc.integer({ min:1, max: 100}), fc.integer({ min: 1, max: 100 }), otherUnit(), (a, factorA, countB, unitB) => {
              const roundedA = Quantity.parse(a.toString())!;
              const roundedB = Quantity.from(countB, unitB);
              const conversions = `${roundedA.toString()}/${roundedB.toString()}`;

              const termA = Quantity.parse(roundedA.toString(), conversions)!.multiply(factorA);
              const termB = Quantity.parse(roundedB.toString(), conversions)!.multiply(0);

              expect(termA.add(termB)).toEqual(termA);
            }),
          );
        });
      });

      it("should be commutative (unknown + unknown)", () => {
        fc.assert(
          fc.property(fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 4, maxLength: 4 }), fc.uniqueArray(otherUnit(), { minLength: 2, maxLength: 2}), ([countA, factorA, countB, factorB], [unitA, unitB]) => {
            const a = Quantity.from(countA, unitA);
            const b = Quantity.from(countB, unitB);
            const conversions = `${a.toString()}/${b.toString()}`;

            const termA = Quantity.parse(a.toString(), conversions)!.multiply(factorA);
            const termB = Quantity.parse(b.toString(), conversions)!.multiply(factorB);

            expect(termA.add(termB)).toEqual(termB.add(termA).tryConvertTo(termA));
          }),
        );
      });
    });
  });

  describe("divide", () => {
    describe("compatible types", () => {
      [
        ["volume", vol({ min: 1, max: 1000000 })] as const,
        ["mass", mass({ min: 1, max: 1000000 })] as const,
        ["length", len({ min: 1, max: 1000000 })] as const,
        ["area", area({ min: 1, max: 1000000 })] as const,
      ].forEach(([type, quantity]) => {
        describe(`${type} ÷ ${type}`, () => {
          it("should be the inverse of multiplication", () => {
            fc.assert(
              fc.property(quantity, fc.integer({ min: 1, max: 1000000 }), (a, n) => {
                const dividend = Quantity.parse(a.multiply(n).toString())!;
                const divisor = Quantity.parse(a.toString())!;
                const quotient = dividend.divide(divisor);
                expect(divisor.multiply(quotient)).toEqual(dividend);
              }),
            );
          });
        });
      });

      describe(`unknown ÷ unknown (same unit)`, () => {
        it("should be the inverse of multiplication", () => {
          fc.assert(
            fc.property(fc.integer({ min: 1 }), fc.integer({ min: 1 }), (a, n) => {
              const dividend = Quantity.from(a * n);
              const divisor = Quantity.from(a);
                const quotient = dividend.divide(divisor);
                expect(divisor.multiply(quotient)).toEqual(dividend);
            }),
          );
        });
      });
    });

    describe("incompatible types with no conversion rules", () => {
      [
        ["volume", vol({ min: 1, max: 1000000 }), "mass", mass({ min: 1, max: 1000000 })] as const,
        ["volume", vol({ min: 1, max: 1000000 }), "length", len({ min: 1, max: 1000000 })] as const,
        ["volume", vol({ min: 1, max: 1000000 }), "area", area({ min: 1, max: 1000000 })] as const,
        ["mass", mass({ min: 1, max: 1000000 }), "volume", vol({ min: 1, max: 1000000 })] as const,
        ["mass", mass({ min: 1, max: 1000000 }), "length", len({ min: 1, max: 1000000 })] as const,
        ["mass", mass({ min: 1, max: 1000000 }), "area", area({ min: 1, max: 1000000 })] as const,
        ["length", len({ min: 1, max: 1000000 }), "volume", vol({ min: 1, max: 1000000 })] as const,
        ["length", len({ min: 1, max: 1000000 }), "mass", mass({ min: 1, max: 1000000 })] as const,
        ["length", len({ min: 1, max: 1000000 }), "area", area({ min: 1, max: 1000000 })] as const,
        ["area", area({ min: 1, max: 1000000 }), "volume", vol({ min: 1, max: 1000000 })] as const,
        ["area", area({ min: 1, max: 1000000 }), "mass", mass({ min: 1, max: 1000000 })] as const,
        ["area", area({ min: 1, max: 1000000 }), "length", len({ min: 1, max: 1000000 })] as const,
      ].forEach(([type1, quantity1, type2, quantity2]) => {
        it(`should crash (${type1} ÷ ${type2})`, () => {
          fc.assert(
            fc.property(quantity1, quantity2, (a, b) => {
              const dividend = Quantity.parse(a.toString())!;
              const divisor = Quantity.parse(b.toString())!;
              expect(() => dividend.divide(divisor)).toThrow(
                `Incompatible types: ${type1} vs. ${type2}`,
              );
            }),
          );
        });
      });

      [
        ["volume", vol({ min: 1, max: 1000000 })] as const,
        ["mass", mass({ min: 1, max: 1000000 })] as const,
        ["length", len({ min: 1, max: 1000000 })] as const,
        ["area", area({ min: 1, max: 1000000 })] as const,
      ].forEach(([type, quantity]) => {
        it(`should crash (${type} ÷ unknown)`, () => {
          fc.assert(
            fc.property(quantity, fc.integer({ min: 1, max: 1000000 }), otherUnit(), (a, b, unit) => {
              const dividend = Quantity.parse(a.toString())!;
              const divisor = Quantity.from(b, unit);
              expect(() => dividend.divide(divisor)).toThrow(
                `Incompatible types: ${type} vs. unknown`,
              );
            }),
          );
        });

        it(`should crash (unknown + ${type})`, () => {
          fc.assert(
            fc.property(fc.integer({ min: 1, max: 1000000 }), otherUnit(), quantity, (a, unit, b) => {
              const dividend = Quantity.from(a, unit);
              const divisor = Quantity.parse(b.toString())!;
              expect(() => dividend.divide(divisor)).toThrow(
                `Incompatible types: unknown vs. ${type}`,
              );
            }),
          );
        });
      });

      it("should crash (unknown of different units)", () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 1000000 }),
            fc.integer({ min: 1, max: 1000000 }),
            fc.uniqueArray(otherUnit(), { minLength: 2, maxLength: 2 }),
            (a, b, [unitA, unitB]) => {
              const dividend = Quantity.from(a, unitA);
              const divisor = Quantity.from(b, unitB);
              expect(() => dividend.divide(divisor)).toThrow(
                `Incompatible units: ${unitA} vs. ${unitB}`,
              );
            },
          ),
        );
      });
    });

    describe("incompatible types with conversion rules", () => {
      [
        ["volume", vol({ min: 1, max: 1000000 }), "mass", mass({ min: 1, max: 1000000 })] as const,
        ["volume", vol({ min: 1, max: 1000000 }), "length", len({ min: 1, max: 1000000 })] as const,
        ["volume", vol({ min: 1, max: 1000000 }), "area", area({ min: 1, max: 1000000 })] as const,
        ["mass", mass({ min: 1, max: 1000000 }), "volume", vol({ min: 1, max: 1000000 })] as const,
        ["mass", mass({ min: 1, max: 1000000 }), "length", len({ min: 1, max: 1000000 })] as const,
        ["mass", mass({ min: 1, max: 1000000 }), "area", area({ min: 1, max: 1000000 })] as const,
        ["length", len({ min: 1, max: 1000000 }), "volume", vol({ min: 1, max: 1000000 })] as const,
        ["length", len({ min: 1, max: 1000000 }), "mass", mass({ min: 1, max: 1000000 })] as const,
        ["length", len({ min: 1, max: 1000000 }), "area", area({ min: 1, max: 1000000 })] as const,
        ["area", area({ min: 1, max: 1000000 }), "volume", vol({ min: 1, max: 1000000 })] as const,
        ["area", area({ min: 1, max: 1000000 }), "mass", mass({ min: 1, max: 1000000 })] as const,
        ["area", area({ min: 1, max: 1000000 }), "length", len({ min: 1, max: 1000000 })] as const,
      ].forEach(([type1, quantity1, type2, quantity2]) => {
        it(`should be the inverse of multiplication (${type1} ÷ ${type2})`, () => {
          fc.assert(
            fc.property(quantity1, fc.integer({ min:1, max: 100}), quantity2, fc.integer({ min:1, max: 100}), (a, factorA, b, factorB) => {
              const roundedA = Quantity.parse(a.toString())!;
              const roundedB = Quantity.parse(b.toString())!;
              const conversions = `${roundedA.toString()}/${roundedB.toString()}`;

              const dividend = Quantity.parse(a.toString(), conversions)!.multiply(factorA);
              const divisor = Quantity.parse(b.toString(), conversions)!.multiply(factorB);

              expect(dividend.divide(divisor)).toEqual(factorA / factorB);
            }),
          );
        });
      });

      [
        ["volume", vol({ min: 1, max: 1000000 })] as const,
        ["mass", mass({ min: 1, max: 1000000 })] as const,
        ["length", len({ min: 1, max: 1000000 })] as const,
        ["area", area({ min: 1, max: 1000000 })] as const,
      ].forEach(([type1, quantity1]) => {
        it(`should be the inverse of multiplication (${type1} + unknown)`, () => {
          fc.assert(
            fc.property(quantity1, fc.integer({ min:1, max: 100}), fc.integer({ min: 1, max: 100 }), otherUnit(), fc.integer({ min:1, max: 100}), (a, factorA, countB, unitB, factorB) => {
              const roundedA = Quantity.parse(a.toString())!;
              const roundedB = Quantity.from(countB, unitB);
              const conversions = `${roundedA.toString()}/${roundedB.toString()}`;

              const dividend = Quantity.parse(roundedA.toString(), conversions)!.multiply(factorA);
              const divisor = Quantity.parse(roundedB.toString(), conversions)!.multiply(factorB);

              expect(dividend.divide(divisor)).toEqual(factorA / factorB);
            }),
          );
        });
      });

      it("should be the inverse of multiplication (unknown + unknown)", () => {
        fc.assert(
          fc.property(fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 4, maxLength: 4 }), fc.uniqueArray(otherUnit(), { minLength: 2, maxLength: 2}), ([countA, factorA, countB, factorB], [unitA, unitB]) => {
            const a = Quantity.from(countA, unitA);
            const b = Quantity.from(countB, unitB);
            const conversions = `${a.toString()}/${b.toString()}`;

            const dividend = Quantity.parse(a.toString(), conversions)!.multiply(factorA);
            const divisor = Quantity.parse(b.toString(), conversions)!.multiply(factorB);

            expect(dividend.divide(divisor)).toEqual(factorA / factorB);
          }),
        );
      });
    });
  });
});

function otherUnit() {
  return fc
    .string()
    .map((str) => str.replace(/ /g, ""))
    .filter(
      (str) =>
        (
          [
            "volume",
            ...Volume.units(),
            "mass",
            ...Mass.units(),
            "length",
            ...Length.units(),
            "area",
            ...Area.units(),
          ] as readonly string[]
        ).indexOf(str) === -1,
    )
    .filter((str) => str.indexOf("|") === -1)
    .filter((str) => str.indexOf("/") === -1);
}

function vol(constraints?: fc.IntegerConstraints): fc.Arbitrary<Volume> {
  return fc
    .integer({ min: 0, ...constraints })
    .map((milliliters) => new Volume(milliliters));
}

function mass(constraints?: fc.IntegerConstraints): fc.Arbitrary<Mass> {
  return fc
    .integer({ min: 0, ...constraints })
    .map((milligrams) => new Mass(milligrams));
}

function len(constraints?: fc.IntegerConstraints): fc.Arbitrary<Length> {
  return fc
    .integer({ min: 0, ...constraints })
    .map((millimeters) => new Length(millimeters));
}

function area(constraints?: fc.IntegerConstraints): fc.Arbitrary<Area> {
  return fc
    .integer({ min: 0, ...constraints })
    .map((squaredMillimeters) => new Area(squaredMillimeters));
}
