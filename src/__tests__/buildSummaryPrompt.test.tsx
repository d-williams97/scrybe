import "@testing-library/jest-dom";
import { SummaryDepth, Style } from "@/app/types";

function buildSummaryPrompt(
  text: string,
  depth: SummaryDepth,
  style: Style,
  includeTimestamps: boolean,
  videoTitle: string
): string {
  const depthText = depth === "brief" ? "120–180 words" : "250–400 words";
  return `
You are an expert note taker. Create a final summary from the below notes extracted from the transcript of a Youtube video titled "${videoTitle}". 

**Output your response in well-formatted Markdown.**

- Use British English. 
- No invented facts.
- Ignore any notes that do not relevant to the overarching theme of the video i.e jokes, etc.
- Target length: ${depthText}.
- Style: ${style}.
- ${
    includeTimestamps
      ? "If a point maps to a provided timestamp, include it exactly as (mm:ss). Do NOT use square brackets. Do NOT invent times."
      : "Do not include timestamps."
  }
- No meta text; output only the formatted summary.
- Use headings (##), bullet points, **bold** for key terms, and other Markdown formatting as appropriate.
${videoTitle && `- Title: ${videoTitle}.`}
- Structured notes: ${text}
`.trim();
}

describe("buildSummaryPrompt function", () => {
  it("should return a string with timestamps", () => {
    const result = buildSummaryPrompt(
      "test",
      "brief",
      "academic",
      true,
      "videoTitle"
    );
    expect(result)
      .toBe(`You are an expert note taker. Create a final summary from the below notes extracted from the transcript of a Youtube video titled "videoTitle". 

**Output your response in well-formatted Markdown.**

- Use British English. 
- No invented facts.
- Ignore any notes that do not relevant to the overarching theme of the video i.e jokes, etc.
- Target length: 120–180 words.
- Style: academic.
- If a point maps to a provided timestamp, include it exactly as (mm:ss). Do NOT use square brackets. Do NOT invent times.
- No meta text; output only the formatted summary.
- Use headings (##), bullet points, **bold** for key terms, and other Markdown formatting as appropriate.
- Title: videoTitle.
- Structured notes: test`);
  });

  it("should return a string without timestamps", () => {
    const result = buildSummaryPrompt(
      "test",
      "brief",
      "academic",
      false,
      "videoTitle"
    );
    expect(result)
      .toBe(`You are an expert note taker. Create a final summary from the below notes extracted from the transcript of a Youtube video titled "videoTitle". 

**Output your response in well-formatted Markdown.**

- Use British English. 
- No invented facts.
- Ignore any notes that do not relevant to the overarching theme of the video i.e jokes, etc.
- Target length: 120–180 words.
- Style: academic.
- Do not include timestamps.
- No meta text; output only the formatted summary.
- Use headings (##), bullet points, **bold** for key terms, and other Markdown formatting as appropriate.
- Title: videoTitle.
- Structured notes: test`);
  });
});
