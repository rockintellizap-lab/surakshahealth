import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ViewProvider, useView } from "@/context/ViewContext";

function TestComponent() {
  const { view, setView } = useView();
  return (
    <div>
      <span data-testid="current-view">{view}</span>
      <button onClick={() => setView("profile")} data-testid="set-profile">
        Set Profile
      </button>
      <button onClick={() => setView("status")} data-testid="set-status">
        Set Status
      </button>
    </div>
  );
}

describe("ViewContext", () => {
  it("provides initial view as auth", () => {
    render(
      <ViewProvider>
        <TestComponent />
      </ViewProvider>
    );
    expect(screen.getByTestId("current-view").textContent).toBe("auth");
  });

  it("updates view when setView is called", () => {
    render(
      <ViewProvider>
        <TestComponent />
      </ViewProvider>
    );

    fireEvent.click(screen.getByTestId("set-profile"));
    expect(screen.getByTestId("current-view").textContent).toBe("profile");

    fireEvent.click(screen.getByTestId("set-status"));
    expect(screen.getByTestId("current-view").textContent).toBe("status");
  });
});