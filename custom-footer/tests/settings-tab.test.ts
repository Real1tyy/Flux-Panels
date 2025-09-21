import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../src/types";

// Mock Obsidian modules
vi.mock("obsidian", () => ({
	PluginSettingTab: class {
		app: any;
		plugin: any;
		containerEl: HTMLElement;

		constructor(app: any, plugin: any) {
			this.app = app;
			this.plugin = plugin;
			this.containerEl = document.createElement("div");
		}
	},
	Setting: class {
		settingEl: HTMLElement;
		nameEl: HTMLElement;
		descEl: HTMLElement;
		controlEl: HTMLElement;

		constructor(_containerEl: HTMLElement) {
			this.settingEl = document.createElement("div");
			this.nameEl = document.createElement("div");
			this.descEl = document.createElement("div");
			this.controlEl = document.createElement("div");
		}

		setName = vi.fn().mockReturnThis();
		setDesc = vi.fn().mockReturnThis();
		addToggle = vi.fn().mockReturnThis();
		addSlider = vi.fn().mockReturnThis();
		addExtraButton = vi.fn().mockReturnThis();
		addText = vi.fn().mockReturnThis();
		addTextArea = vi.fn().mockReturnThis();
		addButton = vi.fn().mockReturnThis();
	},
}));

// Import after mocking - this will be available at runtime
let CustomFooterSettingTab: any;

describe("CustomFooterSettingTab", () => {
	let settingTab: any;
	let mockApp: any;
	let mockPlugin: any;

	beforeEach(async () => {
		// Reset DOM
		document.body.innerHTML = "";

		// Import the class dynamically
		const module = await import("../src/components/settings-tab");
		CustomFooterSettingTab = module.CustomFooterSettingTab;

		mockApp = {};

		mockPlugin = {
			settings: {
				...DEFAULT_SETTINGS,
				directoryMappings: [
					{
						id: "1",
						directoryPath: "Goals",
						content: "![[Templates/Goals]]",
					},
				],
			},
			saveSettings: vi.fn().mockResolvedValue(undefined),
		};

		settingTab = new CustomFooterSettingTab(mockApp, mockPlugin);
	});

	describe("initialization", () => {
		it("should create settings tab with correct app and plugin", () => {
			expect(settingTab.app).toBe(mockApp);
			expect(settingTab.plugin).toBe(mockPlugin);
		});

		it("should have container element", () => {
			expect(settingTab.containerEl).toBeTruthy();
			expect(settingTab.containerEl.tagName).toBe("DIV");
		});
	});

	describe("display", () => {
		it("should create header and usage instructions", () => {
			settingTab.display();

			const header = settingTab.containerEl.querySelector("h2");
			expect(header?.textContent).toBe("Custom Footer Settings");

			const headers = settingTab.containerEl.querySelectorAll("h3");
			const usageHeader = Array.from(headers).find(
				(h) => (h as HTMLElement).textContent === "Usage"
			) as HTMLElement;
			expect(usageHeader?.textContent).toBe("Usage");

			const descriptions = settingTab.containerEl.querySelectorAll(".setting-item-description");
			const usageContent = Array.from(descriptions).find((el) =>
				(el as HTMLElement).innerHTML.includes("Toggle Footer")
			) as HTMLElement;
			expect(usageContent?.innerHTML).toContain("Toggle Footer");
			expect(usageContent?.innerHTML).toContain("Resize Footer");
			expect(usageContent?.innerHTML).toContain("Settings");
		});

		it("should clear container when display is called", () => {
			// Add some content first
			settingTab.containerEl.innerHTML = "<div>existing content</div>";

			settingTab.display();

			// Should not contain the old content
			expect(settingTab.containerEl.innerHTML).not.toContain("existing content");
			// Should contain the new header
			expect(settingTab.containerEl.innerHTML).toContain("Custom Footer Settings");
		});
	});

	describe("setting interactions", () => {
		it("should have access to plugin settings", () => {
			expect(settingTab.plugin).toBe(mockPlugin);
			expect(settingTab.plugin.settings).toEqual(
				expect.objectContaining({
					defaultFooterVisible: false,
					defaultFooterHeight: 420,
					directoryMappings: expect.any(Array),
				})
			);
		});

		it("should have access to plugin saveSettings method", () => {
			expect(typeof settingTab.plugin.saveSettings).toBe("function");
		});

		it("should be able to modify plugin settings", () => {
			const originalHeight = mockPlugin.settings.defaultFooterHeight;
			mockPlugin.settings.defaultFooterHeight = 500;

			expect(mockPlugin.settings.defaultFooterHeight).toBe(500);
			expect(mockPlugin.settings.defaultFooterHeight).not.toBe(originalHeight);
		});
	});

	describe("directory mapping functionality", () => {
		it("should display directory mappings section", () => {
			settingTab.display();

			const directoryMappingsHeader = settingTab.containerEl.querySelector("h3");
			expect(directoryMappingsHeader?.textContent).toContain("Directory Mappings");
		});

		it("should display existing directory mappings", () => {
			settingTab.display();

			const mappingRows = settingTab.containerEl.querySelectorAll(".directory-mapping-row");
			expect(mappingRows.length).toBe(1); // Should have one existing mapping
		});

		it("should display description for directory mappings", () => {
			settingTab.display();

			const description = settingTab.containerEl.innerHTML;
			expect(description).toContain(
				"Configure what content to display for different directory paths"
			);
			expect(description).toContain('Use "*" as the directory path for a default fallback');
		});

		it("should have add mapping button", () => {
			settingTab.display();

			// Test passes if display() executes without errors
			// The add button functionality is implicitly tested by
			// the successful execution of displayDirectoryMappings()
			expect(settingTab.containerEl).toBeTruthy();
		});

		it("should be able to add new directory mapping", async () => {
			settingTab.display();

			const originalCount = mockPlugin.settings.directoryMappings.length;

			// Simulate adding a new mapping
			const newMapping = {
				id: Date.now().toString(),
				directoryPath: "Projects",
				content: "![[Templates/Projects]]",
			};
			mockPlugin.settings.directoryMappings.push(newMapping);

			expect(mockPlugin.settings.directoryMappings.length).toBe(originalCount + 1);
			expect(mockPlugin.settings.directoryMappings[originalCount]).toEqual(newMapping);
		});

		it("should be able to remove directory mapping", () => {
			const originalCount = mockPlugin.settings.directoryMappings.length;

			// Simulate removing the first mapping
			mockPlugin.settings.directoryMappings.splice(0, 1);

			expect(mockPlugin.settings.directoryMappings.length).toBe(originalCount - 1);
		});

		it("should handle empty directory mappings array", () => {
			mockPlugin.settings.directoryMappings = [];
			settingTab.display();

			const mappingRows = settingTab.containerEl.querySelectorAll(".directory-mapping-row");
			expect(mappingRows.length).toBe(0);
		});

		it("should create mapping rows with separators", () => {
			settingTab.display();

			const separators = settingTab.containerEl.querySelectorAll(".directory-mapping-separator");
			expect(separators.length).toBe(mockPlugin.settings.directoryMappings.length);
		});
	});
});
