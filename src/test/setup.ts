import "@testing-library/jest-dom/vitest";

HTMLMediaElement.prototype.play = () => Promise.resolve();
