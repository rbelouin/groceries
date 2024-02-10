import { Length } from "./length";
import type { PhysicalQuantity } from "./types";

type Squared<Units> = Units extends readonly [infer Unit, ...(infer OtherUnits)]
  ? Unit extends string
    ? [`${Unit}2`, `${Unit}^2`, `${Unit}²`, ...Squared<OtherUnits>]
    : Unit
  : Units;

function squaredUnits<Units extends readonly string[]>(units: Units): Squared<Units> {
  return units.flatMap(unit => [`${unit}2`, `${unit}^2`, `${unit}²`]) as Squared<Units>;
}

export type AreaUnit = (typeof Area.units)[number];
export class Area implements PhysicalQuantity {
  static units = squaredUnits(Length.units);

  squaredMillimeters: number;

  constructor(squaredMillimeters: number) {
    this.squaredMillimeters = Math.round(squaredMillimeters);
  }

  static supportsUnit(unit: string): unit is AreaUnit {
    return (Area.units as readonly string[]).indexOf(unit) >= 0;
  }

  static from(count: number, unit: AreaUnit): Area {
    switch (unit) {
      case "mm2":
      case "mm^2":
      case "mm²":
        return new Area(count);
      case "cm2":
      case "cm^2":
      case "cm²":
        return new Area(count * 100);
      case "dm2":
      case "dm^2":
      case "dm²":
        return new Area(count * 10_000);
      case "m2":
      case "m^2":
      case "m²":
        return new Area(count * 1_000_000);
      case "dam2":
      case "dam^2":
      case "dam²":
        return new Area(count * 100_000_000);
      case "hm2":
      case "hm^2":
      case "hm²":
        return new Area(count * 10_000_000_000);
      case "km2":
      case "km^2":
      case "km²":
        return new Area(count * 1_000_000_000_000);
    }
  }

  add(length?: Area): Area {
    if (!length) return this;
    return new Area(this.squaredMillimeters + length.squaredMillimeters);
  }

  multiply(factor: number): Area {
    return new Area(this.squaredMillimeters * factor);
  }

  divide(length: Area): number {
    return this.squaredMillimeters / length.squaredMillimeters;
  }

  toString(): string {
    let divisor: number = 1;
    let unit: AreaUnit = "mm²";

    if (this.squaredMillimeters >= 1_000_000_000_000) {
      divisor = 1_000_000_000_000;
      unit = "km²";
    } else if (this.squaredMillimeters >= 1_000_000) {
      divisor = 1_000_000;
      unit = "m²";
    } else if (this.squaredMillimeters >= 100) {
      divisor = 100;
      unit = "cm²";
    }

    const count = Math.ceil(this.squaredMillimeters * 100 / divisor) / 100;
    return `${count}${unit}`;
  }
}
