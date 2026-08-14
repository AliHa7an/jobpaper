import { describe, expect, it } from "vitest";

import { decomposeJob, deriveMeasures, findJobType } from "../src/assemblies";
import { getTradeRules } from "../src/rules";
import type { Job } from "../src/types";

const deckJob: Job = {
  trade: "decks",
  jobType: "new-deck",
  inputs: {
    dimensions: { lengthFt: 16, widthFt: 12, railingLinearFt: 40, stairSteps: 4 },
    grade: "mid",
    access: "standard",
    region: "southeast",
  },
};

describe("assemblies: a deck decomposes into its parts", () => {
  const rules = getTradeRules("decks");
  const items = decomposeJob(rules, deckJob);
  const ids = items.map((i) => i.assemblyId);

  it("produces footings, framing, decking, railing, stairs, fasteners", () => {
    expect(ids).toEqual([
      "footings",
      "framing",
      "decking",
      "railing",
      "stairs",
      "fasteners",
    ]);
  });

  it("computes footing count as ceil(area / 20) with a minimum", () => {
    const footings = items.find((i) => i.assemblyId === "footings");
    expect(footings?.qty).toBe(10); // ceil(192 / 20)
  });

  it("applies the 10% waste factor to decking quantity", () => {
    const decking = items.find((i) => i.assemblyId === "decking");
    expect(decking?.qty).toBe(211.2); // 192 x 1.10
  });

  it("region-adjusts unit costs and labor rate (southeast = 0.92x)", () => {
    const decking = items.find((i) => i.assemblyId === "decking");
    expect(decking?.unitCostCents).toBe(483); // 525 x 0.92
    expect(decking?.laborRateCents).toBe(5704); // 6200 x 0.92
  });

  it("computes labor hours from pre-waste quantity and access multiplier", () => {
    const framing = items.find((i) => i.assemblyId === "framing");
    expect(framing?.laborHours).toBe(15.36); // 192 x 0.08 x 1.0
  });

  it("omits conditional assemblies when their gate field is 0", () => {
    const noRail: Job = {
      ...deckJob,
      inputs: {
        ...deckJob.inputs,
        dimensions: { lengthFt: 16, widthFt: 12, railingLinearFt: 0, stairSteps: 0 },
      },
    };
    const bare = decomposeJob(rules, noRail).map((i) => i.assemblyId);
    expect(bare).not.toContain("railing");
    expect(bare).not.toContain("stairs");
  });

  it("scales labor by the access multiplier", () => {
    const hard: Job = { ...deckJob, inputs: { ...deckJob.inputs, access: "difficult" } };
    const hardItems = decomposeJob(rules, hard);
    const framing = hardItems.find((i) => i.assemblyId === "framing");
    expect(framing?.laborHours).toBe(19.2); // 15.36 x 1.25
  });
});

describe("assemblies: derived measures", () => {
  it("derives wall area for paint from perimeter x 8ft ceilings", () => {
    const rules = getTradeRules("interior-paint");
    const items = decomposeJob(rules, {
      trade: "interior-paint",
      jobType: "room-repaint",
      inputs: {
        dimensions: { lengthFt: 12, widthFt: 12, paintCeiling: 1, doorsAndWindows: 3 },
        grade: "mid",
        access: "standard",
        region: "midwest",
      },
    });
    const walls = items.find((i) => i.assemblyId === "walls");
    // perimeter 48 x 8 = 384 sq ft, +5% waste = 403.2
    expect(walls?.qty).toBe(403.2);
  });

  it("approximates perimeter from a direct-area job type", () => {
    const rules = getTradeRules("interior-paint");
    const jt = findJobType(rules, "whole-interior");
    const m = deriveMeasures(jt, { floorAreaSqFt: 1600 });
    expect(m.area).toBe(1600);
    expect(m.perimeter).toBe(160); // 4 x sqrt(1600)
  });

  it("throws on an unknown job type", () => {
    const rules = getTradeRules("decks");
    expect(() => findJobType(rules, "gazebo")).toThrow(/Unknown job type/);
  });
});
