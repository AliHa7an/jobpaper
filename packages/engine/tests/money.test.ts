import { describe, expect, it } from "vitest";

import {
  addCents,
  applyBps,
  assertCents,
  formatCents,
  formatCentsWholeDollars,
  mulQtyCents,
  roundHalfAwayFromZero,
  roundHours,
  scaleByBps,
} from "../src/money";

describe("money: rounding", () => {
  it("rounds half away from zero in both directions", () => {
    expect(roundHalfAwayFromZero(2.5)).toBe(3);
    expect(roundHalfAwayFromZero(-2.5)).toBe(-3);
    expect(roundHalfAwayFromZero(2.4)).toBe(2);
    expect(roundHalfAwayFromZero(0)).toBe(0);
  });

  it("rounds hours to 2 decimals", () => {
    expect(roundHours(15.3651)).toBe(15.37);
    expect(roundHours(0.005)).toBe(0.01);
  });
});

describe("money: integer-cent guards", () => {
  it("rejects fractional cents", () => {
    expect(() => assertCents(100.5)).toThrow(/integer cents/);
    expect(() => assertCents(Number.NaN)).toThrow();
    expect(() => addCents(100, 0.5)).toThrow();
  });

  it("accepts and sums integer cents", () => {
    expect(addCents(100, 250, 3)).toBe(353);
  });
});

describe("money: qty x unit cost", () => {
  it("prices fractional quantities to the nearest cent", () => {
    // 211.2 sq ft x $5.25 = $1,108.80
    expect(mulQtyCents(211.2, 525)).toBe(110880);
    // half-cent rounds away from zero: 1.5 x 1 cent -> 2
    expect(mulQtyCents(1.5, 1)).toBe(2);
  });
});

describe("money: basis points", () => {
  it("applies bps as a percentage of an amount", () => {
    expect(applyBps(10000, 1500)).toBe(1500); // 15% of $100
    expect(applyBps(9999, 1000)).toBe(1000); // 10% of $99.99 rounds to $10.00
  });

  it("scales by a bps multiplier (10000 = identity)", () => {
    expect(scaleByBps(123456, 10000)).toBe(123456);
    expect(scaleByBps(100000, 9200)).toBe(92000);
    expect(scaleByBps(100000, 11800)).toBe(118000);
  });

  it("rejects fractional bps", () => {
    expect(() => applyBps(100, 10.5)).toThrow(/basis points/);
  });
});

describe("money: formatting", () => {
  it("formats cents deterministically", () => {
    expect(formatCents(110880)).toBe("$1,108.80");
    expect(formatCents(-5)).toBe("-$0.05");
    expect(formatCentsWholeDollars(840049)).toBe("$8,400");
    expect(formatCentsWholeDollars(840050)).toBe("$8,401");
  });
});
