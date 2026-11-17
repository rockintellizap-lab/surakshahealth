import "@testing-library/jest-dom";
import { vi } from "vitest";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, "location", {
  writable: true,
  value: {
    hash: "",
    href: "http://localhost:3000",
    replace: vi.fn(),
  },
});

Object.defineProperty(document, "documentElement", {
  writable: true,
  value: {
    style: {
      fontSize: "",
    },
  },
});