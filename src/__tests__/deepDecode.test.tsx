import { decode } from "he";
import "@testing-library/jest-dom";

const deepDecode = (s: string): string => {
  let prev = s ?? "";
  for (let i = 0; i < 2; i++) {
    // 2–3 passes are usually enough
    const next = decode(prev);
    if (next === prev) break;
    prev = next;
  }
  return prev;
};

describe("deepDecode function", () => {
  it("should return a string", () => {
    const result = deepDecode("test");
    expect(result).toBe("test");
  });

  it("should return a string with HTML entities", () => {
    const result = deepDecode("&amp;");
    expect(result).toBe("&");
  });

  it("should return a string with multiple HTML entities", () => {
    const result = deepDecode("&amp; &quot; &apos; &lt; &gt;");
    expect(result).toBe("& \" ' < >");
  });
});
