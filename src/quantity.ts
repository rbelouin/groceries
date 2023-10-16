export type Quantity = number | string;

type Countable = {
  type: "countable";
  count: number;
  unit: undefined;
};

const volumeUnits = ["ml", "c-à-c", "cl", "c-à-s", "dl", "l"] as const;

type VolumeUnit = (typeof volumeUnits)[number];
type Volume = {
  type: "volume";
  count: number;
  unit: VolumeUnit;
};

const weightUnits = ["mg", "g", "kg"] as const;

type WeightUnit = (typeof weightUnits)[number];
type Weight = {
  type: "weight";
  count: number;
  unit: WeightUnit;
};

type ParsedQuantity = Countable | Volume | Weight;
type ParsedQuantities = Record<ParsedQuantity["type"], number> & {
  unknown?: string[];
};

export function reduceQuantities(acc: string, quantity: Quantity): string {
  const quantities = addQuantity(parseQuantities(acc), parseQuantity(quantity));
  return Object.entries(quantities).flatMap(([key, value]) => {
    switch (key) {
      case "countable":
        return [(value as ParsedQuantities["countable"]).toString()];
      case "volume":
        return [serializeMilliliters(value as ParsedQuantities["volume"])];
      case "weight":
        return [serializeMilligrams(value as ParsedQuantities["weight"])];
      case "unknown":
        return (value as ParsedQuantities["unknown"]);
    }
  })
    .filter(item => item)
    .join("|");
}

function parseQuantities(value: string): ParsedQuantities {
  return value.split("|").reduce((acc, item) => addQuantity(acc, parseQuantity(item)), {} as ParsedQuantities);
}

function addQuantity(quantities: ParsedQuantities, quantity: ParsedQuantity | string): ParsedQuantities {
  if (typeof quantity === "string") {
    return {
      ...quantities,
      unknown: (quantities.unknown || []).concat(quantity),
    };
  }

  switch (quantity.type) {
    case "countable":
      return {
        ...quantities,
        countable: (quantities.countable || 0) + quantity.count,
      };
    case "volume":
      return {
        ...quantities,
        volume: (quantities.volume || 0) + quantity.count,
      };
    case "weight":
      return {
        ...quantities,
        weight: (quantities.weight || 0) + quantity.count,
      };
  }
}

function toMilliliters(count: number, unit: VolumeUnit): number {
  switch (unit) {
    case "ml":
      return count;
    case "c-à-c":
      return count * 5;
    case "cl":
      return count * 10;
    case "c-à-s":
      return count * 15;
    case "dl":
      return count * 100;
    case "l":
      return count * 1000;
  }
}

export function serializeMilliliters(count: number): string {
  if (count >= 1000) {
    return `${Math.ceil(count / 10) / 100}l`;
  }

  if (count >= 100) {
    return `${Math.ceil(count) / 100}dl`;
  }

  if (count >= 10) {
    return `${Math.ceil(count * 10) / 100}cl`;
  }

  return `${Math.ceil(count * 100) / 100}ml`;
}

function toMilligrams(count: number, unit: WeightUnit): number {
  switch (unit) {
    case "mg":
      return count;
    case "g":
      return 1000 * count;
    case "kg":
      return 1000000 * count;
  }
}

export function serializeMilligrams(count: number): string {
  if (count >= 1000000) {
    return `${Math.ceil(100 * count / 1000 / 1000) / 100}kg`;
  }

  if (count >= 1000) {
    return `${Math.ceil(100 * count / 1000) / 100}g`;
  }

  return `${Math.ceil(100 * count) / 100}mg`;
}

function parseQuantity(value: Quantity): string | ParsedQuantity {
  if (typeof value === "number") {
    return { type: "countable", count: value, unit: undefined };
  }

  if (value === "") {
    return "";
  }

  const result = value.match(/^([0-9.]+)\s*(\S*)$/);

  if (result === null) {
    console.warn(`Unrecognized quantity: ${value}.`);
    return value;
  }

  const [_, countString, unit] = result;
  const count = parseFloat(countString);

  if (unit === "") {
    return { type: "countable", count, unit: undefined };
  }

  if (isVolumeUnit(unit)) {
    return { type: "volume", count: toMilliliters(count, unit), unit: "ml" };
  }

  if (isWeightUnit(unit)) {
    return { type: "weight", count: toMilligrams(count, unit), unit: "mg" };
  }

  console.error(`Unrecognized unit: ${unit}.`);
  return value;
}

function isVolumeUnit(unit: string): unit is VolumeUnit {
  return (volumeUnits as readonly string[]).indexOf(unit) >= 0;
}

function isWeightUnit(unit: string): unit is WeightUnit {
  return (weightUnits as readonly string[]).indexOf(unit) >= 0;
}
