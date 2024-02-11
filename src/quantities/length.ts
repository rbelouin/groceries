import type { PhysicalQuantity } from "./types";

const units = ["mm", "cm", "dm", "m", "dam", "hm", "km"] as const;
export type LengthUnit = (typeof units)[number];

export class Length implements PhysicalQuantity {
  millimeters: number;

  constructor(millimeters: number) {
    this.millimeters = Math.round(millimeters);
  }

  static units(): typeof units {
    return units;
  }

  static supportsUnit(unit: string): unit is LengthUnit {
    return (Length.units() as readonly string[]).indexOf(unit) >= 0;
  }

  static from(count: number, unit: LengthUnit): Length {
    switch (unit) {
      case "mm":
        return new Length(count);
      case "cm":
        return new Length(count * 10);
      case "dm":
        return new Length(count * 100);
      case "m":
        return new Length(count * 1_000);
      case "dam":
        return new Length(count * 10_000);
      case "hm":
        return new Length(count * 100_000);
      case "km":
        return new Length(count * 1_000_000);
    }
  }

  add(length?: Length): Length {
    if (!length) return this;
    return new Length(this.millimeters + length.millimeters);
  }

  multiply(factor: number): Length {
    return new Length(this.millimeters * factor);
  }

  divide(length: Length): number {
    return this.millimeters / length.millimeters;
  }

  toString(): string {
    let divisor: number = 1;
    let unit: LengthUnit = "mm";

    if (this.millimeters >= 1_000_000) {
      divisor = 1_000_000;
      unit = "km";
    } else if (this.millimeters >= 1_000) {
      divisor = 1_000;
      unit = "m";
    } else if (this.millimeters >= 10) {
      divisor = 10;
      unit = "cm";
    }

    const count = Math.ceil(this.millimeters * 100 / divisor) / 100;
    return `${count}${unit}`;
  }
}
