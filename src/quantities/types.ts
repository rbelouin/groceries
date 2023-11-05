export interface PhysicalQuantity {
  add(quantity?: typeof this): typeof this;
  multiply(factor: number): typeof this;
  divide(quantity?: typeof this): number;
  toString(): string;
}
