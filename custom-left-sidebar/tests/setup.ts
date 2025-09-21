import { beforeEach, vi } from "vitest";

// Setup DOM environment
beforeEach(() => {
	// Reset DOM
	document.body.innerHTML = "";
	document.body.className = "";

	// Mock console methods to reduce noise in tests
	vi.spyOn(console, "error").mockImplementation(() => {});
	vi.spyOn(console, "warn").mockImplementation(() => {});
	vi.spyOn(console, "log").mockImplementation(() => {});
});

// Mock HTMLElement methods that might not be available in test environment
Object.defineProperty(HTMLElement.prototype, "addClass", {
	value: function (className: string) {
		this.classList.add(className);
	},
	writable: true,
});

Object.defineProperty(HTMLElement.prototype, "removeClass", {
	value: function (className: string) {
		this.classList.remove(className);
	},
	writable: true,
});

Object.defineProperty(HTMLElement.prototype, "empty", {
	value: function () {
		this.innerHTML = "";
	},
	writable: true,
});

Object.defineProperty(HTMLElement.prototype, "createEl", {
	value: function (tagName: string, options?: { text?: string; cls?: string }) {
		const el = document.createElement(tagName);
		if (options?.text) {
			el.textContent = options.text;
		}
		if (options?.cls) {
			el.className = options.cls;
		}
		this.appendChild(el);
		return el;
	},
	writable: true,
});
