import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Simple test component
function TestComponent({ message }: { message: string }) {
  return (
    <div>
      <h1>Test Heading</h1>
      <p data-testid="message">{message}</p>
      <button>Click Me</button>
    </div>
  );
}

describe("Jest and React Testing Library Setup", () => {
  it("should run a basic Jest assertion", () => {
    expect(true).toBe(true);
    expect(2 + 2).toBe(4);
  });

  it("should render a React component", () => {
    render(<TestComponent message="Hello, Jest!" />);

    // Check if the component renders
    const heading = screen.getByRole("heading", { name: /test heading/i });
    expect(heading).toBeInTheDocument();
  });

  it("should find elements by test id", () => {
    render(<TestComponent message="Testing with data-testid" />);

    const messageElement = screen.getByTestId("message");
    expect(messageElement).toHaveTextContent("Testing with data-testid");
  });

  it("should find elements by role", () => {
    render(<TestComponent message="Button test" />);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it("should verify text content", () => {
    const testMessage = "This is a test message";
    render(<TestComponent message={testMessage} />);

    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });

  it("should handle async queries", async () => {
    render(<TestComponent message="Async test" />);

    const heading = await screen.findByRole("heading");
    expect(heading).toHaveTextContent("Test Heading");
  });
});
