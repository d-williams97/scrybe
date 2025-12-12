import "@testing-library/jest-dom";

function extractKeywords(query: string): string[] {
  if (!query) {
    return [];
  }

  if (query.length === 0) {
    return [];
  }

  if (typeof query !== "string") {
    return [];
  }

  // Common English stop words to filter out
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "he",
    "in",
    "is",
    "it",
    "its",
    "of",
    "on",
    "that",
    "the",
    "to",
    "was",
    "were",
    "will",
    "with",
    "about",
    "can",
    "could",
    "do",
    "does",
    "did",
    "have",
    "had",
    "how",
    "i",
    "if",
    "into",
    "may",
    "might",
    "should",
    "this",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "would",
    "you",
    "your",
    "me",
    "my",
    "or",
    "but",
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/) // Split on whitespace
    .filter(
      (word) =>
        word.length > 2 && // Keep words longer than 2 chars
        !stopWords.has(word) // Remove stop words
    );
}

describe("extractKeywords function", () => {
  it("should return a an array of key words from a query", () => {
    const result = extractKeywords("What is the capital of France?");
    expect(result).toEqual(["capital", "france"]);
  });

  it("should return an empty array if the query is empty", () => {
    const result = extractKeywords("");
    expect(result).toEqual([]);
  });

  it("should return an empty array if the query is not a string", () => {
    const result = extractKeywords(123 as unknown as string);
    expect(result).toEqual([]);
  });

  it("should return an empty array if the query is not an array", () => {
    const result = extractKeywords(false as unknown as string);
    expect(result).toEqual([]);
  });

  it("should handle punctuation correctly", () => {
    const result = extractKeywords("What is the capital of France?!");
    expect(result).toEqual(["capital", "france"]);
  });

  it("should handle multiple spaces correctly", () => {
    const result = extractKeywords("What  is the capital of France?");
    expect(result).toEqual(["capital", "france"]);
  });
});
