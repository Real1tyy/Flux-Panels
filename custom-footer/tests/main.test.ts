import { beforeEach, describe, expect, it, vi } from "vitest";
import CustomFooterPlugin from "../src/main";
import { DEFAULT_SETTINGS } from "../src/types";

// Mock the FooterManager
vi.mock("../src/components/footer-manager", () => ({
	FooterManager: vi.fn().mockImplementation(() => ({
		show: vi.fn(),
		hide: vi.fn(),
		updateContent: vi.fn(),
	})),
}));

// Mock the CustomFooterSettingTab
vi.mock("../src/components/settings-tab", () => ({
	CustomFooterSettingTab: vi.fn().mockImplementation(() => ({})),
}));

// Mock Obsidian modules
vi.mock("obsidian", () => ({
	Plugin: class {
		app: any;
		addCommand = vi.fn();
		addSettingTab = vi.fn();
		registerEvent = vi.fn();
		loadData = vi.fn().mockResolvedValue({});
		saveData = vi.fn().mockResolvedValue(undefined);
		registerDomEvent = vi.fn();

		constructor(app: any, _manifest: any) {
			this.app = app;
		}
	},
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
		setName = vi.fn().mockReturnThis();
		setDesc = vi.fn().mockReturnThis();
		addToggle = vi.fn().mockReturnThis();
		addSlider = vi.fn().mockReturnThis();
		addExtraButton = vi.fn().mockReturnThis();
	},
}));

describe("CustomFooterPlugin", () => {
	let plugin: CustomFooterPlugin;
	let mockApp: any;

	beforeEach(async () => {
		mockApp = {
			workspace: {
				on: vi.fn(),
				getActiveFile: vi.fn().mockReturnValue({ path: "test.md" }),
			},
		};

		plugin = new CustomFooterPlugin(mockApp, {} as any);
		await plugin.loadSettings();
	});

	describe("initialization", () => {
		it("should initialize with default settings", async () => {
			expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
		});

		it("should initialize runtime state from settings on load", async () => {
			// Mock loadData to return custom settings
			plugin.loadData = vi.fn().mockResolvedValue({
				defaultFooterVisible: true,
				defaultFooterHeight: 500,
			});

			await plugin.onload();

			const runtimeState = (plugin as any).runtimeState;
			expect(runtimeState.isVisible).toBe(true);
			expect(runtimeState.currentHeight).toBe(500);
		});

		it("should create FooterManager with runtime state and settings", async () => {
			const { FooterManager } = await import("../src/components/footer-manager");

			await plugin.onload();

			expect(FooterManager).toHaveBeenCalledWith(
				mockApp,
				expect.objectContaining({
					isVisible: plugin.settings.defaultFooterVisible,
					currentHeight: plugin.settings.defaultFooterHeight,
				}),
				plugin,
				expect.any(Function) // settings getter function
			);
		});

		it("should add settings tab", async () => {
			const { CustomFooterSettingTab } = await import("../src/components/settings-tab");

			await plugin.onload();

			expect(plugin.addSettingTab).toHaveBeenCalled();
			expect(CustomFooterSettingTab).toHaveBeenCalledWith(mockApp, plugin);
		});
	});

	describe("commands", () => {
		it("should register toggle command", async () => {
			await plugin.onload();

			expect(plugin.addCommand).toHaveBeenCalledWith({
				id: "toggle-custom-footer",
				name: "Toggle Custom Footer",
				callback: expect.any(Function),
			});
		});

		it("should toggle runtime state without affecting settings", async () => {
			await plugin.onload();
			const mockFooterManager = (plugin as any).footerManager;
			const initialSettings = { ...plugin.settings };

			// Get the toggle callback
			const toggleCallback = (plugin.addCommand as any).mock.calls[0][0].callback;

			// Initial state should be false (default)
			expect((plugin as any).runtimeState.isVisible).toBe(false);

			// Toggle to show
			toggleCallback();
			expect((plugin as any).runtimeState.isVisible).toBe(true);
			expect(mockFooterManager.show).toHaveBeenCalled();

			// Toggle to hide
			toggleCallback();
			expect((plugin as any).runtimeState.isVisible).toBe(false);
			expect(mockFooterManager.hide).toHaveBeenCalled();

			// Settings should remain unchanged
			expect(plugin.settings).toEqual(initialSettings);
			expect(plugin.saveData).not.toHaveBeenCalled();
		});
	});

	describe("workspace events", () => {
		it("should register workspace event listener", async () => {
			await plugin.onload();

			expect(plugin.registerEvent).toHaveBeenCalled();
			expect(mockApp.workspace.on).toHaveBeenCalledWith("active-leaf-change", expect.any(Function));
		});

		it("should update footer content when visible", async () => {
			await plugin.onload();
			const mockFooterManager = (plugin as any).footerManager;

			// Set runtime state to visible
			(plugin as any).runtimeState.isVisible = true;

			const eventCallback = (mockApp.workspace.on as any).mock.calls[0][1];
			eventCallback();

			expect(mockFooterManager.updateContent).toHaveBeenCalled();
		});

		it("should not update footer content when not visible", async () => {
			await plugin.onload();
			const mockFooterManager = (plugin as any).footerManager;

			// Ensure runtime state is not visible
			(plugin as any).runtimeState.isVisible = false;

			const eventCallback = (mockApp.workspace.on as any).mock.calls[0][1];
			eventCallback();

			expect(mockFooterManager.updateContent).not.toHaveBeenCalled();
		});
	});

	describe("startup behavior", () => {
		it("should show footer on startup if defaultFooterVisible is true", async () => {
			plugin.loadData = vi.fn().mockResolvedValue({
				defaultFooterVisible: true,
				defaultFooterHeight: 420,
			});

			await plugin.onload();
			const mockFooterManager = (plugin as any).footerManager;

			expect(mockFooterManager.show).toHaveBeenCalled();
		});

		it("should not show footer on startup if defaultFooterVisible is false", async () => {
			plugin.settings.defaultFooterVisible = false;

			await plugin.onload();
			const mockFooterManager = (plugin as any).footerManager;

			expect(mockFooterManager.show).not.toHaveBeenCalled();
		});
	});

	describe("settings management", () => {
		it("should load custom settings from storage", async () => {
			const customSettings = {
				defaultFooterVisible: true,
				defaultFooterHeight: 600,
			};
			plugin.loadData = vi.fn().mockResolvedValue(customSettings);

			await plugin.loadSettings();

			expect(plugin.settings).toEqual({
				...DEFAULT_SETTINGS,
				...customSettings,
			});
		});

		it("should save settings to storage", async () => {
			plugin.settings = {
				defaultFooterVisible: true,
				defaultFooterHeight: 500,
				directoryMappings: [
					{
						id: "1",
						directoryPath: "Goals",
						content: "![[Templates/Goals]]",
					},
				],
			};

			await plugin.saveSettings();

			expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
		});

		it("should include directory mappings in default settings", async () => {
			expect(plugin.settings).toHaveProperty("directoryMappings");
			expect(Array.isArray(plugin.settings.directoryMappings)).toBe(true);
		});

		it("should separate runtime state from saved settings", async () => {
			// Mock loadData to return custom settings
			plugin.loadData = vi.fn().mockResolvedValue({
				defaultFooterVisible: false,
				defaultFooterHeight: 300,
			});

			await plugin.onload();

			// Runtime state should match settings initially
			expect((plugin as any).runtimeState.isVisible).toBe(false);
			expect((plugin as any).runtimeState.currentHeight).toBe(300);

			// Change runtime state
			(plugin as any).runtimeState.isVisible = true;
			(plugin as any).runtimeState.currentHeight = 500;

			// Settings should remain unchanged
			expect(plugin.settings.defaultFooterVisible).toBe(false);
			expect(plugin.settings.defaultFooterHeight).toBe(300);
		});
	});

	describe("onunload", () => {
		it("should hide footer on unload", async () => {
			await plugin.onload();
			const mockFooterManager = (plugin as any).footerManager;

			await plugin.onunload();

			expect(mockFooterManager.hide).toHaveBeenCalled();
		});

		it("should handle unload when footerManager is not initialized", async () => {
			expect(() => plugin.onunload()).not.toThrow();
		});
	});

	describe("integration scenarios", () => {
		it("should maintain runtime state independently of settings changes", async () => {
			// Start with default settings
			await plugin.onload();

			// Toggle footer to show (runtime state change)
			const toggleCallback = (plugin.addCommand as any).mock.calls[0][0].callback;
			toggleCallback();

			expect((plugin as any).runtimeState.isVisible).toBe(true);
			expect(plugin.settings.defaultFooterVisible).toBe(false); // Settings unchanged

			// Simulate settings change (like from settings tab)
			plugin.settings.defaultFooterHeight = 800;
			await plugin.saveSettings();

			// Runtime state should be unaffected by settings changes
			expect((plugin as any).runtimeState.isVisible).toBe(true);
			expect((plugin as any).runtimeState.currentHeight).toBe(420); // Original runtime value
		});

		it("should use settings as initial values for new sessions", async () => {
			// Mock loadData to simulate saved settings from previous session
			plugin.loadData = vi.fn().mockResolvedValue({
				defaultFooterVisible: true,
				defaultFooterHeight: 350,
			});

			await plugin.onload();

			// Runtime state should initialize from settings
			expect((plugin as any).runtimeState.isVisible).toBe(true);
			expect((plugin as any).runtimeState.currentHeight).toBe(350);
		});
	});
});
