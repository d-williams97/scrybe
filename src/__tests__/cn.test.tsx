import React from "react";
// import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("should return a string", () => {
    const result = cn("test");
    expect(result).toBe("test");
  });

  it("should merge class names correctly", () => {
    const result = cn("test", "test2");
    expect(result).toBe("test test2");
  });

  it("should handle undefined values", () => {
    const result = cn(undefined);
    expect(result).toBe("");
  });

  it("should handle null values", () => {
    const result = cn(null);
    expect(result).toBe("");
  });

  it("should handle boolean values", () => {
    const result = cn(true);
    expect(result).toBe("");
  });
});
