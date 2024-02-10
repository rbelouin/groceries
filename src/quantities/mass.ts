import type { PhysicalQuantity } from "./types";

export type MassUnit = (typeof Mass.units)[number];
export class Mass implements PhysicalQuantity {
  static units = ["mg", "g", "hg", "kg"] as const;

  milligrams: number;

  constructor(milligrams: number) {
    this.milligrams = Math.round(milligrams);
  }

  static supportsUnit(unit: string): unit is MassUnit {
    return (Mass.units as readonly string[]).indexOf(unit) >= 0;
  }

  static from(count: number, unit: MassUnit): Mass {
    switch (unit) {
      case "mg":
        return new Mass(count);
      case "g":
        return new Mass(count * 1_000);
      case "hg":
        return new Mass(count * 100_000);
      case "kg":
        return new Mass(count * 1_000_000);
    }
  }

  add(mass?: Mass): Mass {
    if (!mass) return this;
    return new Mass(this.milligrams + mass.milligrams);
  }

  multiply(factor: number): Mass {
    return new Mass(this.milligrams * factor);
  }

  divide(mass: Mass): number {
    return this.milligrams / mass.milligrams;
  }

  toString(): string {
    let divisor: number = 1;
    let unit: MassUnit = "mg";

    if (this.milligrams >= 1_000_000) {
      divisor = 1_000_000;
      unit = "kg";
    } else if (this.milligrams >= 1_000) {
      divisor = 1_000;
      unit = "g";
    }

    const count = Math.ceil(this.milligrams * 100 / divisor) / 100;
    return `${count}${unit}`;
  }
}
