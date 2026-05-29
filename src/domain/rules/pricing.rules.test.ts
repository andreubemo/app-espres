import { describe, expect, it } from "vitest";

import {
  COMPLEXITY_FACTOR,
  getMinimumByFamily,
  getQuantityByUnit,
  round,
} from "./pricing.rules";

describe("pricing.rules", () => {
  it("mantiene los factores de complejidad esperados", () => {
    expect(COMPLEXITY_FACTOR.low).toBe(1);
    expect(COMPLEXITY_FACTOR.medium).toBe(1.15);
    expect(COMPLEXITY_FACTOR.high).toBe(1.3);
  });

  it("calcula cantidades por unidad con superficie, perimetro o cantidad manual", () => {
    const dimensions = {
      surfaceM2: 24,
      perimeterML: 20,
    };

    expect(getQuantityByUnit("m2", dimensions, 3)).toBe(24);
    expect(getQuantityByUnit("ml", dimensions, 3)).toBe(20);
    expect(getQuantityByUnit("ud", dimensions, 3)).toBe(3);
    expect(getQuantityByUnit("caja", dimensions, 7)).toBe(7);
  });

  it("redondea a dos decimales", () => {
    expect(round(10.234)).toBe(10.23);
    expect(round(10.235)).toBe(10.24);
    expect(round(0.105)).toBe(0.11);
  });

  it("aplica minimos conocidos por familia", () => {
    expect(getMinimumByFamily("tarima")).toBe(10);
    expect(getMinimumByFamily("TARIMA")).toBe(10);
    expect(getMinimumByFamily("muro")).toBe(8);
    expect(getMinimumByFamily("rotulacion")).toBeNull();
  });
});
