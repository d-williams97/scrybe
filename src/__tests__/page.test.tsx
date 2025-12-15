import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TextDecoder } from "util";

// Mock nanoid
jest.mock("nanoid", () => ({
  nanoid: () => "test-id-123",
}));

// Mock MarkdownRenderer to avoid react-markdown issues
jest.mock("@/components/MarkdownRenderer", () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div>{content}</div>,
}));

import Home from "@/app/page";

describe("Home page", () => {
  it("should render the home page", () => {
    render(<Home />);
    expect(
      screen.getByText("turn youtube videos into notes in seconds")
    ).toBeInTheDocument();
  });
});

describe("youtube url input", () => {
  it("should update the youtube url state when the input changes", () => {
    render(<Home />);
    const input = screen.getByPlaceholderText("Paste a youtube link here");
    fireEvent.change(input, {
      target: { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    });
    expect(input).toHaveValue("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });
});

describe("summary depth selection", () => {
  it("should update the summary depth state when the selection changes", () => {
    render(<Home />);
    const briefButton = screen.getByRole("button", { name: "Brief" });
    fireEvent.click(briefButton);
    expect(briefButton).toHaveClass("bg-primary");

    const inDepthButton = screen.getByRole("button", { name: "In-depth" });
    fireEvent.click(inDepthButton);
    expect(inDepthButton).toHaveClass("bg-primary");
  });
});

describe("style selection", () => {
  it("should update the style state when the selection changes", () => {
    render(<Home />);
    const academicButton = screen.getByRole("button", { name: "Academic" });
    fireEvent.click(academicButton);
    expect(academicButton).toHaveClass("bg-primary");

    const casualButton = screen.getByRole("button", { name: "Casual" });
    fireEvent.click(casualButton);
    expect(casualButton).toHaveClass("bg-primary");

    const bulletPointsButton = screen.getByRole("button", {
      name: "Bullet Points",
    });
    fireEvent.click(bulletPointsButton);
    expect(bulletPointsButton).toHaveClass("bg-primary");

    const revisionNotesButton = screen.getByRole("button", {
      name: "Revision Notes",
    });
    fireEvent.click(revisionNotesButton);
    expect(revisionNotesButton).toHaveClass("bg-primary");

    const paragraphButton = screen.getByRole("button", { name: "Paragraph" });
    fireEvent.click(paragraphButton);
    expect(paragraphButton).toHaveClass("bg-primary");
  });
});

describe("timestamp checkbox", () => {
  it("should update the include timestamps state when the checkbox changes", () => {
    render(<Home />);
    const checkbox = screen.getByRole("checkbox", {
      name: "Include clickable timestamps",
    });
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});

describe("summarise button", () => {
  it("should be disabled when the input is empty and enabled when the input is not empty", () => {
    render(<Home />);
    const button = screen.getByRole("button", { name: "Summarise" });
    const input = screen.getByPlaceholderText("Paste a youtube link here");
    expect(button).toBeDisabled();
    fireEvent.change(input, {
      target: { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    });
    expect(button).not.toBeDisabled();
    fireEvent.change(input, {
      target: { value: "" },
    });
    expect(button).toBeDisabled();
  });
});

describe("handleSummarise function", () => {
  it("shows loading, calls the API, and renders returned notes", async () => {
    // JSDOM doesn't always provide TextDecoder; Home() uses it for streaming.
    // @ts-expect-error - allow setting global for test environment
    global.TextDecoder = TextDecoder;

    const textChunk = "Generated notes chunk";
    const encoded = Buffer.from(textChunk, "utf-8");

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: jest
            .fn()
            .mockResolvedValueOnce({ done: false, value: encoded })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
    });

    global.fetch = mockFetch;

    render(<Home />);

    const input = screen.getByPlaceholderText("Paste a youtube link here");
    const button = screen.getByRole("button", { name: "Summarise" });

    fireEvent.change(input, {
      target: { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    });
    fireEvent.click(button);

    // Loading state
    expect(button).toHaveTextContent("Summarising...");

    // Fetch called with expected endpoint
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/youtubeSummary",
        expect.objectContaining({ method: "POST" })
      )
    );

    // Notes rendered via MarkdownRenderer mock
    await waitFor(() =>
      expect(screen.getByText(textChunk)).toBeInTheDocument()
    );
  });
});
