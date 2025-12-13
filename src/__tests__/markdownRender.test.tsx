import "@testing-library/jest-dom";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { fireEvent, render, screen } from "@testing-library/react";

describe("MarkdownRenderer component", () => {
  it("should render the markdown correctly", () => {
    render(<MarkdownRenderer content="Hello, world!" />);
    expect(screen.getByText("Hello, world!")).toBeInTheDocument();
  });

  it("should convert timestamps to clickable links", () => {
    render(<MarkdownRenderer content="Hello, world! (04:23)" />);
    const timestampLink = screen.getByRole("link", { name: "(04:23)" });
    expect(timestampLink).toHaveAttribute("href", "#timestamp-263");
  });

  it("should call the onTimestampClick callback when a timestamp is clicked", () => {
    const onTimestampClick = jest.fn();
    render(
      <MarkdownRenderer
        content="Hello, world! (04:23)"
        onTimestampClick={onTimestampClick}
      />
    );
    const timestampButton = screen.getByRole("button", { name: "(04:23)" });
    fireEvent.click(timestampButton);
    expect(onTimestampClick).toHaveBeenCalledWith(263);
  });
});
