import { Mass } from "./mass";
import { Volume } from "./volume";
import { Length } from "./length";
import { Area } from "./xarea";
import { PhysicalQuantity } from "./types";

export class Quantity implements PhysicalQuantity {

  q: {
    type: "volume";
    value: Volume;
  } | {
    type: "mass";
    value: Mass;
  } | {
    type: "length";
    value: Length;
  } | {
    type: "area";
    value: Area;
  } | {
    type: "unknown";
    unit: string;
    count: number;
  };

  constructor(q: typeof Quantity.prototype.q) {
    this.q = q;
  }

  static parse(value: number | string = ""): Quantity | undefined {
    if (typeof value === "number") {
      return Quantity.from(value);
    }

    const result = value.match(/^([0-9.]+)\s*(\S*)$/);
    if (!result) return undefined;

    return Quantity.from(parseFloat(result[1]), result[2]);
  }

  static from(count: number, unit: string = ""): Quantity {
    if (Volume.supportsUnit(unit)) {
      return new Quantity({
        type: "volume",
        value: Volume.from(count, unit)
      });
    }

    if (Mass.supportsUnit(unit)) {
      return new Quantity({
        type: "mass",
        value: Mass.from(count, unit)
      });
    }

    if (Length.supportsUnit(unit)) {
      return new Quantity({
        type: "length",
        value: Length.from(count, unit)
      });
    }

    if (Area.supportsUnit(unit)) {
      return new Quantity({
        type: "area",
        value: Area.from(count, unit)
      });
    }

    const trimmedUnit = unit.trim();
    if (["", "p"].indexOf(trimmedUnit) < 0) {
      console.warn(`Unrecognized unit: ${trimmedUnit}`);
    }

    return new Quantity({
      type: "unknown",
      unit: trimmedUnit,
      count,
    });
  }

  add(quantity?: Quantity): Quantity {
    if (!quantity) return this;

    switch (this.q.type) {
      case "volume":
        if (quantity.q.type === "volume") {
          return new Quantity({
            type: "volume",
            value: this.q.value.add(quantity.q.value),
          });
        }
        break;
      case "mass":
        if (quantity.q.type === "mass") {
          return new Quantity({
            type: "mass",
            value: this.q.value.add(quantity.q.value),
          });
        }
        break;
      case "length":
        if (quantity.q.type === "length") {
          return new Quantity({
            type: "length",
            value: this.q.value.add(quantity.q.value),
          });
        }
        break;
      case "area":
        if (quantity.q.type === "area") {
          return new Quantity({
            type: "area",
            value: this.q.value.add(quantity.q.value),
          });
        }
        break;
      case "unknown":
        if (quantity.q.type === "unknown") {
          if (this.q.unit !== quantity.q.unit) {
            throw new Error(`Incompatible units: ${this.q.unit} vs. ${quantity.q.unit}`);
          }

          return new Quantity({
            type: "unknown",
            unit: this.q.unit,
            count: this.q.count + quantity.q.count,
          });
        }
    }

    throw new Error(`Incompatible types: ${this.q.type} vs. ${quantity.q.type}`);
  }

  multiply(factor: number): Quantity {
    switch (this.q.type) {
      case "volume":
        return new Quantity({
          type: this.q.type,
          value: this.q.value.multiply(factor),
        });
      case "mass":
        return new Quantity({
          type: this.q.type,
          value: this.q.value.multiply(factor),
        });
      case "length":
        return new Quantity({
          type: this.q.type,
          value: this.q.value.multiply(factor),
        });
      case "area":
        return new Quantity({
          type: this.q.type,
          value: this.q.value.multiply(factor),
        });
      case "unknown":
        return new Quantity({
          type: this.q.type,
          unit: this.q.unit,
          count: this.q.count * factor,
        });
    }
  }

  divide(quantity: Quantity): number {
    switch (this.q.type) {
      case "volume":
        if (quantity.q.type === "volume") {
          return this.q.value.divide(quantity.q.value);
        }
        break;
      case "mass":
        if (quantity.q.type === "mass") {
          return this.q.value.divide(quantity.q.value);
        }
        break;
      case "length":
        if (quantity.q.type === "length") {
          return this.q.value.divide(quantity.q.value);
        }
        break;
      case "area":
        if (quantity.q.type === "area") {
          return this.q.value.divide(quantity.q.value);
        }
        break;
      case "unknown":
        if (quantity.q.type === "unknown") {
          if (this.q.unit !== quantity.q.unit) {
            throw new Error(`Incompatible units: ${this.q.unit} vs. ${quantity.q.unit}`);
          }

          return this.q.count / quantity.q.count;
        }
    }

    throw new Error(`Incompatible types: ${this.q.type} vs. ${quantity.q.type}`);
  }

  toString(): string {
    switch (this.q.type) {
      case "volume":
      case "mass":
      case "length":
      case "area":
        return this.q.value.toString();
      case "unknown":
        return `${this.q.count} ${this.q.unit}`;
    }
  }
}
