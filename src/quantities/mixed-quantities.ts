import type { PhysicalQuantity } from "./types";
import { Mass } from "./mass";
import { Volume } from "./volume";
import { Length } from "./length";
import { Area } from "./xarea";

export class MixedQuantities implements PhysicalQuantity {

  inventory: {
    volume?: Volume;
    mass?: Mass;
    length?: Length;
    area?: Area;
    unknown?: Map<string, number>;
  };

  constructor(inventory: (typeof MixedQuantities.prototype.inventory)) {
    // TODO: validate the inventory: no space or pipes in the units
    this.inventory = inventory;
  }

  static parse(value: number | string = ""): MixedQuantities {
    if (typeof value === "number") {
      return MixedQuantities.from(value);
    }

    return value.split("|")
      .flatMap(entries => {
        const result = entries.match(/^([0-9.]+)\s*(\S*)$/);
        if (!result) return [];
        return [MixedQuantities.from(parseFloat(result[1]), result[2])];
      })
      .reduce((acc, item) => acc.add(item), new MixedQuantities({}));
  }

  static from(count: number, unit: string = ""): MixedQuantities {
    if (Volume.supportsUnit(unit)) {
      return new MixedQuantities({
        volume: Volume.from(count, unit),
      });
    }

    if (Mass.supportsUnit(unit)) {
      return new MixedQuantities({
        mass: Mass.from(count, unit),
      });
    }

    if (Length.supportsUnit(unit)) {
      return new MixedQuantities({
        length: Length.from(count, unit),
      });
    }

    if (Area.supportsUnit(unit)) {
      return new MixedQuantities({
        area: Area.from(count, unit),
      });
    }

    const trimmedUnit = unit.trim();
    if (trimmedUnit !== "") {
      console.warn(`Unrecognized unit: ${trimmedUnit}`);
    }

    return new MixedQuantities({
      unknown: new Map([[trimmedUnit, count]]),
    });
  }

  add(quantities?: MixedQuantities): MixedQuantities {
    if (!quantities) return this;

    return new MixedQuantities({
      volume: !this.inventory.volume ? quantities.inventory.volume : this.inventory.volume.add(quantities.inventory.volume),
      mass: !this.inventory.mass ? quantities.inventory.mass : this.inventory.mass.add(quantities.inventory.mass),
      length: !this.inventory.length ? quantities.inventory.length : this.inventory.length.add(quantities.inventory.length),
      area: !this.inventory.area ? quantities.inventory.area : this.inventory.area.add(quantities.inventory.area),
      unknown: !this.inventory.unknown ? quantities.inventory.unknown : [...(quantities.inventory.unknown?.entries() || [])].reduce((acc, [key, value]) => {
        const previousValue = acc.get(key);
        if (previousValue) {
          acc.set(key, previousValue + value);
        } else {
          acc.set(key, value);
        }
        return acc;
      }, new Map(this.inventory.unknown)),
    });
  }

  multiply(factor: number): MixedQuantities {
    if (factor === 0) return new MixedQuantities({});

    return new MixedQuantities({
      volume: this.inventory.volume?.multiply(factor),
      mass: this.inventory.mass?.multiply(factor),
      length: this.inventory.length?.multiply(factor),
      area: this.inventory.area?.multiply(factor),
      unknown: !this.inventory.unknown ? undefined : [...(this.inventory.unknown.entries())].reduce((acc, [key, value]) => {
        acc.set(key, value * factor);
        return acc;
      }, new Map()),
    });
  }

  divide(quantities: MixedQuantities): number {
    const theseDimensions = this.dimensions();
    const thoseDimensions = quantities.dimensions();

    if (theseDimensions.length === 0 && thoseDimensions.length > 0) {
      return 0;
    }

    if (theseDimensions.length === 1 && thoseDimensions.length === 1 && theseDimensions[0] === thoseDimensions[0]) {
      switch (theseDimensions[0]) {
        case "volume":
          return this.inventory.volume!.divide(quantities.inventory.volume!);
        case "mass":
          return this.inventory.mass!.divide(quantities.inventory.mass!);
        case "length":
          return this.inventory.length!.divide(quantities.inventory.length!);
        case "area":
          return this.inventory.area!.divide(quantities.inventory.area!);
        default:
          return this.inventory.unknown!.get(theseDimensions[0])! / quantities.inventory.unknown!.get(thoseDimensions[0])!;
      }
    }

    throw new Error(`Division unsupported for these quantities: ${this} / ${quantities}`);
  }

  dimensions(): string[] {
    return Object.keys(this.inventory)
      .filter((key) => this.inventory[key])
      .flatMap((key) => key === "unknown" ? Array.from(this.inventory.unknown!.keys()) : [key]);
  }

  toString(): string {
    return [
      this.inventory.volume?.toString(),
      this.inventory.mass?.toString(),
      this.inventory.length?.toString(),
      this.inventory.area?.toString(),
      ...getEntries(this.inventory.unknown || new Map())
        .map(([key, value]) => key === "" ? value.toString() : `${value} ${key}`),
    ]
      .filter(item => item !== undefined)
      .join("|");
  }
}

// Map.prototype.entries does not seem to function as expected on Google Apps Scripts
function getEntries(m: Map<string, number>): [string, number][] {
  let entries = [] as [string, number][];

  m.forEach((value, key) => {
    entries.push([key, value]);
  });

  return entries;
}
