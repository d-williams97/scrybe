import "@testing-library/jest-dom";

function getKValue(query: string): number {
  if (typeof query !== "string") {
    return 0;
  }
  const lowerQuery = query.toLowerCase();

  // explanation, comparison, comprehensive, summary/overview, how, why words are indicators of high complexity.
  const highComplexityKeywords = [
    "explain",
    "analyze",
    "analyse",
    "break down",
    "describe",
    "elaborate",
    "compare",
    "contrast",
    "difference",
    "similarities",
    "relationship",
    "all",
    "everything",
    "list",
    "multiple",
    "various",
    "every",
    "how",
    "why",
    "what causes",
    "process",
    "steps",
    "method",
    "summarize",
    "summarise",
    "overview",
    "summary",
    "recap",
    "main points",
    "complete",
    "full",
    "entire",
    "comprehensive",
    "thorough",
  ];

  // Medium complexity indicators
  const mediumComplexityKeywords = [
    "what",
    "tell me",
    "give me",
    "show me",
    "examples",
    "instances",
    "cases",
  ];

  // Check for high complexity
  const isHighComplexity = highComplexityKeywords.some((keyword) =>
    lowerQuery.includes(keyword)
  );

  // Check for medium complexity
  const isMediumComplexity = mediumComplexityKeywords.some((keyword) =>
    lowerQuery.includes(keyword)
  );

  let kValue: number = 0;
  // Determine k value
  if (isHighComplexity) {
    kValue = 10; // More chunks for complex queries
  } else if (isMediumComplexity) {
    kValue = 7; // Medium chunks
  } else {
    kValue = 5; // Default for simple queries
  }

  // override the k value if the query is too long. need to be improved.
  const queryLength = query.split(" ").length;
  if (queryLength > 20) kValue = 10;
  return kValue;
}

describe("getKValue function", () => {
  it("should return 7 for medium complexity queries", () => {
    const result = getKValue("What is the capital of France?");
    expect(result).toBe(7);
  });

  it("should return 10 for high complexity queries", () => {
    const result = getKValue("Explain the capital of France?!");
    expect(result).toBe(10);
  });

  it("should return 5 for simple queries", () => {
    const result = getKValue("where is the capital of Texas?");
    expect(result).toBe(5);
  });

  it("it is more than 20 words, it should return 10", () => {
    const result = getKValue(
      "This is a very very very very very very very very very very very very very very long query that should return 10"
    );
    expect(result).toBe(10);
  });

  it("should return 0 if the query is not a string", () => {
    const result = getKValue(123 as unknown as string);
    expect(result).toBe(0);
  });
});
