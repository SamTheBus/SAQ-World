// Presentation accepts only a read port and an explicitly supplied DOM element.
export function mountWorldBrowserClient({ view, statusElement }) {
  if (typeof view?.getInspection !== "function") {
    throw new TypeError("A World inspection read port is required.");
  }
  if (!statusElement || typeof statusElement.textContent !== "string") {
    throw new TypeError("A browser status element is required.");
  }

  function refresh() {
    const inspection = view.getInspection();
    statusElement.textContent =
      `Empty simulation: tick ${inspection.tick}; no active space.`;
  }

  refresh();
  return Object.freeze({ refresh });
}
