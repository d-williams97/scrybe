// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock react-youtube component
jest.mock("react-youtube", () => ({
  __esModule: true,
  default: ({ videoId, onReady, opts }) => (
    <div data-testid="youtube-player" data-videoid={videoId}>
      YouTube Player Mock
    </div>
  ),
}));

// Mock window.scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock URL.createObjectURL and URL.revokeObjectURL for download tests
global.URL.createObjectURL = jest.fn(() => "mock-url");
global.URL.revokeObjectURL = jest.fn();

// Mock document.createElement for download tests
const originalCreateElement = document.createElement.bind(document);
document.createElement = jest.fn((tagName) => {
  const element = originalCreateElement(tagName);
  if (tagName === "a") {
    element.click = jest.fn();
  }
  return element;
});
