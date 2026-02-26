import { describe, expect, it } from "vitest";
import { add } from "../../add";

describe("src/features/sample/calculation/add.ts add TestCases", () => {
  interface TestTable {
    readonly a: number;
    readonly b: number;
    readonly expected: number;
  }

  it.each`
    a      | b      | expected
    ${1}   | ${2}   | ${3}
    ${0}   | ${0}   | ${0}
    ${-1}  | ${1}   | ${0}
    ${-5}  | ${-3}  | ${-8}
    ${1.5} | ${2.5} | ${4}
  `(
    "should return $expected when a is $a and b is $b",
    ({ a, b, expected }: TestTable) => {
      expect(add(a, b)).toBe(expected);
    }
  );
});
