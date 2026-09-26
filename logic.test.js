import { describe, it, expect } from "vitest";
import { filterProblems, easeOutCubic, easedCounterValue } from "./logic.js";

describe("filterProblems", () => {
  const problems = [
    { id: "PS 01", theme: "agri", title: "Jaggery Heat", valueChain: "Sugarcane.", oneSentence: "Boiling.", techFocus: "Dampers.", bottleneck: "Heat" },
    { id: "PS 02", theme: "aqua", title: "Shrimp Cooling", valueChain: "Fisheries.", oneSentence: "Cold rooms.", techFocus: "Thermal.", bottleneck: "CapEx" },
    { id: "PS 03", theme: "tribal", title: "Millet Hullers", valueChain: "Forest produce.", oneSentence: "Offline diagnostics.", techFocus: "Bluetooth.", bottleneck: "Last-Mile" }
  ];

  it("returns everything when no filters are applied", () => {
    expect(filterProblems(problems, { theme: "all", query: "" })).toHaveLength(3);
  });

  it("filters by theme", () => {
    const result = filterProblems(problems, { theme: "agri", query: "" });
    expect(result.map((p) => p.id)).toEqual(["PS 01"]);
  });

  it("matches case-insensitively across searchable fields", () => {
    expect(filterProblems(problems, { theme: "all", query: "SHRIMP" })).toHaveLength(1);
    expect(filterProblems(problems, { theme: "all", query: "bluetooth" }).map((p) => p.id)).toEqual(["PS 03"]);
    expect(filterProblems(problems, { theme: "all", query: "capex" }).map((p) => p.id)).toEqual(["PS 02"]);
  });

  it("combines theme and query", () => {
    expect(filterProblems(problems, { theme: "agri", query: "shrimp" })).toHaveLength(0);
    expect(filterProblems(problems, { theme: "tribal", query: "huller" })).toHaveLength(1);
  });

  it("ignores whitespace in the query", () => {
    expect(filterProblems(problems, { theme: "all", query: "   shrimp  " })).toHaveLength(1);
  });
});

describe("easedCounterValue / easeOutCubic", () => {
  it("easeOutCubic starts at 0 and ends at 1", () => {
    expect(easeOutCubic(0)).toBeCloseTo(0);
    expect(easeOutCubic(1)).toBeCloseTo(1);
  });

  it("easeOutCubic is monotonically increasing and bounded", () => {
    let prev = -1;
    for (let i = 0; i <= 20; i++) {
      const v = easeOutCubic(i / 20);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it("easedCounterValue interpolates between start and target", () => {
    expect(easedCounterValue(0, 100, 0)).toBeCloseTo(0);
    expect(easedCounterValue(0, 100, 1)).toBeCloseTo(100);
    expect(easedCounterValue(0, 100, 0.5)).toBeCloseTo(87.5, 5);
    expect(easedCounterValue(50, 100, 0.5)).toBeCloseTo(93.75, 5);
  });

  it("easedCounterValue clamps out-of-range progress", () => {
    expect(easedCounterValue(0, 100, -0.5)).toBeCloseTo(0);
    expect(easedCounterValue(0, 100, 1.5)).toBeCloseTo(100);
  });
});
