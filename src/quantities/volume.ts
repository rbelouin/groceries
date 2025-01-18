import type { PhysicalQuantity } from "./types";

const units = ["ml", "c-à-c", "cl", "c-à-s", "dl", "l"] as const;
export type VolumeUnit = (typeof units)[number];

export class Volume implements PhysicalQuantity {
  milliliters: number;

  constructor(milliliters: number) {
    this.milliliters = Math.round(milliliters);
  }

  static units(): typeof units {
    return units;
  };

  static supportsUnit(unit: string): unit is VolumeUnit {
    return (Volume.units() as readonly string[]).indexOf(unit) >= 0;
  }

  static from(count: number, unit: VolumeUnit): Volume {
    switch (unit) {
      case "ml":
        return new Volume(count);
      case "c-à-c":
        return new Volume(count * 5);
      case "cl":
        return new Volume(count * 10);
      case "c-à-s":
        return new Volume(count * 15);
      case "dl":
        return new Volume(count * 100);
      case "l":
        return new Volume(count * 1000);
    }
  }

  add(volume?: Volume): Volume {
    if (!volume) return this;
    return new Volume(this.milliliters + volume.milliliters);
  }

  multiply(factor: number): Volume {
    return new Volume(this.milliliters * factor);
  }

  divide(volume: Volume): number {
    return this.milliliters / volume.milliliters;
  }

  toString(): string {
    let divisor: number = 1;
    let unit: VolumeUnit = "ml";

    if (this.milliliters >= 1000) {
      divisor = 1000;
      unit = "l";
    } else if (this.milliliters >= 100) {
      divisor = 100;
      unit = "dl";
    } else if (this.milliliters >= 10) {
      divisor = 10;
      unit = "cl";
    }

    const count = Math.ceil(this.milliliters * 100 / divisor) / 100;
    return `${count}${unit}`;
  }
}
