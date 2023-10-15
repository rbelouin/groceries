import { reduceQuantities, serializeMilligrams, serializeMilliliters } from "./quantity";

const error = console.error;

beforeEach(() => {
  global.console.error = jest.fn();
});

afterEach(() => {
  global.console.error = error;
});

describe("quantity", () => {
  describe("reduceQuantities", () => {
    it("Nothin’ from nothin’ leaves nothin’", () => {
      expect(reduceQuantities("", "")).toBe("");
    });

    it("Nothin’ plus something is something", () => {
      expect(reduceQuantities("", "450g")).toBe("450g");
    });

    it("should sum up two countables", () => {
      expect(reduceQuantities("4", "5")).toBe("9");
    });

    it("should sum up two volumes", () => {
      expect(reduceQuantities("4l", "0.5l")).toBe("4.5l");
    });

    it("should sum up two volumes of different units", () => {
      expect(reduceQuantities("4cl", "1 c-à-s")).toBe("5.5cl");
    });

    it("should sum up two weights", () => {
      expect(reduceQuantities("4mg", "9mg")).toBe("13mg");
    });

    it("should sum up two weights of different units", () => {
      expect(reduceQuantities("4mg", "9g")).toBe("9.01g");
    });

    it("should combine two quantities of different types", () => {
      expect(reduceQuantities("4l", "3g")).toBe("4l|3g");
    });

    it("should handle unknown units", () => {
      expect(reduceQuantities("4l|3 pieces", "8 parts")).toBe("4l|3 pieces|8 parts");
    });

    it("should add to the correct existing unit", () => {
      expect(reduceQuantities("1l|32g|5|12 pieces", "540mg")).toBe("1l|32.54g|5|12 pieces");
    });
  });

  describe("serializeMilliliters", () => {
    ([
      [0.01, "0.01ml"],
      [0.1, "0.1ml"],
      [1, "1ml"],
      [10, "1cl"],
      [100, "1dl"],
      [1000, "1l"],
      [10000, "10l"],
      [100000, "100l"],
    ] as const).forEach(([input, output]) => it(`should serialize ${input} to ${output}`, () => {
      expect(serializeMilliliters(input)).toBe(output);
    }));

    ([
      [0.001, "0.01ml"],
      [0.123, "0.13ml"],
      [1.345, "1.35ml"],
      [10.67, "1.07cl"],
      [100.4, "1.01dl"],
      [1038, "1.04l"],
      [10026, "10.03l"],
      [100123, "100.13l"],
    ] as const).forEach(([input, output]) => it(`should serialize ${input} to ${output} (keep 2 digits after the decimal point)`, () => {
      expect(serializeMilliliters(input)).toBe(output);
    }));
  });

  describe("serializeMilligrams", () => {
    ([
      [0.01, "0.01mg"],
      [0.1, "0.1mg"],
      [1, "1mg"],
      [10, "10mg"],
      [100, "100mg"],
      [1000, "1g"],
      [10000, "10g"],
      [100000, "100g"],
      [1000000, "1kg"],
      [10000000, "10kg"],
      [100000000, "100kg"],
    ] as const).forEach(([input, output]) => it(`should serialize ${input} to ${output}`, () => {
      expect(serializeMilligrams(input)).toBe(output);
    }));

    ([
      [0.001, "0.01mg"],
      [0.123, "0.13mg"],
      [1.345, "1.35mg"],
      [10.674, "10.68mg"],
      [100.4, "100.4mg"],
      [1038, "1.04g"],
      [10026, "10.03g"],
      [100123, "100.13g"],
      [1012141, "1.02kg"],
    ] as const).forEach(([input, output]) => it(`should serialize ${input} to ${output} (keep 2 digits after the decimal point)`, () => {
      expect(serializeMilligrams(input)).toBe(output);
    }));
  });
});
