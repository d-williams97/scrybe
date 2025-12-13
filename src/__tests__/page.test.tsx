import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

// Mock nanoid
jest.mock("nanoid", () => ({
  nanoid: () => "test-id-123",
}));

// Mock MarkdownRenderer to avoid react-markdown issues
jest.mock("@/components/MarkdownRenderer", () => ({
  MarkdownRenderer: ({ content }: any) => <div>{content}</div>,
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
