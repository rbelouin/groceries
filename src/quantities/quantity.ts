import { Mass } from "./mass";
import { Volume } from "./volume";
import { Length } from "./length";
import { Area } from "./xarea";
import { PhysicalQuantity } from "./types";

export type QuantityType = (typeof Quantity.prototype.q)["type"];
export type QuantityConversions = {
  [K1 in QuantityType]?: {
    [K2 in QuantityType]?: [Quantity, Quantity];
  };
};

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
    this.conversions = conversions || {};
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
    return conversions.split("\n").reduce((acc, conversion) => {
      if (!conversion) return acc;
      const [quantity1, quantity2] = Quantity.parseConversion(conversion);
      return {
        ...acc,
        [quantity1.q.type]: {
          ...acc[quantity1.q.type],
          [quantity2.q.type]: [quantity1, quantity2],
        },
      };
    }, {} as QuantityConversions);
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
            throw new Error(
              `Incompatible units: ${this.q.unit} vs. ${quantity.q.unit}`,
            );
          }

          return new Quantity({
            type: "unknown",
            unit: this.q.unit,
            count: this.q.count + quantity.q.count,
          });
        }
    }

    throw new Error(
      `Incompatible types: ${this.q.type} vs. ${quantity.q.type}`,
    );
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
            throw new Error(
              `Incompatible units: ${this.q.unit} vs. ${quantity.q.unit}`,
            );
          }

          return this.q.count / quantity.q.count;
        }
    }

    throw new Error(
      `Incompatible types: ${this.q.type} vs. ${quantity.q.type}`,
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
        return `${this.q.count} ${this.q.unit}`;
    }
  }
}
