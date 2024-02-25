import { Mass } from "./mass";
import { Volume } from "./volume";
import { Length } from "./length";
import { Area } from "./xarea";
import { PhysicalQuantity } from "./types";

export type QuantityType = (typeof Quantity.prototype.q)["type"];
export type QuantityConversions = Map<String, Map<String, [Quantity, Quantity]>>;

export class Quantity implements PhysicalQuantity {
  q:
    | {
        type: "volume";
        value: Volume;
      }
    | {
        type: "mass";
        value: Mass;
      }
    | {
        type: "length";
        value: Length;
      }
    | {
        type: "area";
        value: Area;
      }
    | {
        type: "unknown";
        unit: string;
        count: number;
      };

  conversions: QuantityConversions;

  constructor(
    q: typeof Quantity.prototype.q,
    conversions?: QuantityConversions,
  ) {
    this.q = q;
    this.conversions = conversions || new Map();
  }

  static parse(
    value: number | string = "",
    conversions: string = "",
  ): Quantity | undefined {
    const parsedConversions = Quantity.parseConversions(conversions);

    if (typeof value === "number") {
      return Quantity.from(value, "", parsedConversions);
    }

    const result = value.match(/^([0-9.]+)\s*(\S*)$/);
    if (!result) return undefined;

    return Quantity.from(parseFloat(result[1]), result[2], parsedConversions);
  }

  static parseConversions(conversions: string = ""): QuantityConversions {
    const acc = new Map();

    conversions.split("\n").forEach((conversion) => {
      if (!conversion) return;

      const [quantity1, quantity2] = Quantity.parseConversion(conversion);
      const innerMap = acc.get(quantity1.getUnitKey()) ?? new Map();
      innerMap.set(quantity2.getUnitKey(), [quantity1, quantity2]);
      acc.set(quantity1.getUnitKey(), innerMap);
    });

    return acc;
  }

  static parseConversion(conversion: string = ""): [Quantity, Quantity] {
    const result = conversion.split("/");
    if (result.length !== 2) {
      throw new Error(`Invalid conversion rule: ${conversion}`);
    }

    const [quantity1, quantity2] = result.map((quantity) => {
      const parsed = Quantity.parse(quantity);
      if (!parsed) {
        throw new Error(`Invalid quantity: ${quantity}`);
      }
      return parsed;
    });

    return [quantity1, quantity2];
  }

  static from(
    count: number,
    unit: string = "",
    conversions?: QuantityConversions,
  ): Quantity {
    if (Volume.supportsUnit(unit)) {
      return new Quantity(
        {
          type: "volume",
          value: Volume.from(count, unit),
        },
        conversions,
      );
    }

    if (Mass.supportsUnit(unit)) {
      return new Quantity(
        {
          type: "mass",
          value: Mass.from(count, unit),
        },
        conversions,
      );
    }

    if (Length.supportsUnit(unit)) {
      return new Quantity(
        {
          type: "length",
          value: Length.from(count, unit),
        },
        conversions,
      );
    }

    if (Area.supportsUnit(unit)) {
      return new Quantity(
        {
          type: "area",
          value: Area.from(count, unit),
        },
        conversions,
      );
    }

    const trimmedUnit = unit.trim();
    if (["", "p"].indexOf(trimmedUnit) < 0) {
      console.warn(`Unrecognized unit: ${trimmedUnit}`);
    }

    return new Quantity(
      {
        type: "unknown",
        unit: trimmedUnit,
        count,
      },
      conversions,
    );
  }

  tryConvertTo(quantity: Quantity): Quantity {
    const rule1 = this.conversions.get(this.getUnitKey())?.get(quantity.getUnitKey());
    if (rule1) {
      const [quantity1, quantity2] = rule1;
      return new Quantity(quantity2.q, this.conversions).multiply(this.divide(quantity1));
    }

    const rule2 = this.conversions.get(quantity.getUnitKey())?.get(this.getUnitKey());
    if (rule2) {
      const [quantity2, quantity1] = rule2;
      return new Quantity(quantity2.q, this.conversions).multiply(this.divide(quantity1));
    }

    return this;
  }

  private getUnitKey(): string {
    return this.q.type === "unknown" ? this.q.unit : this.q.type;
  }

  add(quantity?: Quantity): Quantity {
    if (!quantity) return this;

    const convertedQuantity = quantity.tryConvertTo(this);

    switch (this.q.type) {
      case "volume":
        if (convertedQuantity.q.type === "volume") {
          return new Quantity({
            type: "volume",
            value: this.q.value.add(convertedQuantity.q.value),
          }, this.conversions);
        }
        break;
      case "mass":
        if (convertedQuantity.q.type === "mass") {
          return new Quantity({
            type: "mass",
            value: this.q.value.add(convertedQuantity.q.value),
          }, this.conversions);
        }
        break;
      case "length":
        if (convertedQuantity.q.type === "length") {
          return new Quantity({
            type: "length",
            value: this.q.value.add(convertedQuantity.q.value),
          }, this.conversions);
        }
        break;
      case "area":
        if (convertedQuantity.q.type === "area") {
          return new Quantity({
            type: "area",
            value: this.q.value.add(convertedQuantity.q.value),
          }, this.conversions);
        }
        break;
      case "unknown":
        if (convertedQuantity.q.type === "unknown") {
          if (this.q.unit !== convertedQuantity.q.unit) {
            throw new Error(
              `Incompatible units: ${this.q.unit} vs. ${convertedQuantity.q.unit}`,
            );
          }

          return new Quantity({
            type: "unknown",
            unit: this.q.unit,
            count: this.q.count + convertedQuantity.q.count,
          }, this.conversions);
        }
    }

    throw new Error(
      `Incompatible types: ${this.q.type} vs. ${convertedQuantity.q.type}`,
    );
  }

  multiply(factor: number): Quantity {
    switch (this.q.type) {
      case "volume":
        return new Quantity({
          type: this.q.type,
          value: this.q.value.multiply(factor),
        }, this.conversions);
      case "mass":
        return new Quantity({
          type: this.q.type,
          value: this.q.value.multiply(factor),
        }, this.conversions);
      case "length":
        return new Quantity({
          type: this.q.type,
          value: this.q.value.multiply(factor),
        }, this.conversions);
      case "area":
        return new Quantity({
          type: this.q.type,
          value: this.q.value.multiply(factor),
        }, this.conversions);
      case "unknown":
        return new Quantity({
          type: this.q.type,
          unit: this.q.unit,
          count: this.q.count * factor,
        }, this.conversions);
    }
  }

  divide(quantity: Quantity): number {
    const convertedQuantity = quantity.tryConvertTo(this);

    switch (this.q.type) {
      case "volume":
        if (convertedQuantity.q.type === "volume") {
          return this.q.value.divide(convertedQuantity.q.value);
        }
        break;
      case "mass":
        if (convertedQuantity.q.type === "mass") {
          return this.q.value.divide(convertedQuantity.q.value);
        }
        break;
      case "length":
        if (convertedQuantity.q.type === "length") {
          return this.q.value.divide(convertedQuantity.q.value);
        }
        break;
      case "area":
        if (convertedQuantity.q.type === "area") {
          return this.q.value.divide(convertedQuantity.q.value);
        }
        break;
      case "unknown":
        if (convertedQuantity.q.type === "unknown") {
          if (this.q.unit !== convertedQuantity.q.unit) {
            throw new Error(
              `Incompatible units: ${this.q.unit} vs. ${convertedQuantity.q.unit}`,
            );
          }

          return this.q.count / convertedQuantity.q.count;
        }
    }

    throw new Error(
      `Incompatible types: ${this.q.type} vs. ${convertedQuantity.q.type}`,
    );
  }

  toString(): string {
    switch (this.q.type) {
      case "volume":
      case "mass":
      case "length":
      case "area":
        return this.q.value.toString();
      case "unknown":
        return this.q.unit === "" ? this.q.count.toString() : `${this.q.count} ${this.q.unit}`;
    }
  }
}
