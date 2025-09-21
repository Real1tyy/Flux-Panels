import { beforeEach, describe, expect, it, vi } from "vitest";
import CustomLeftSidebarPlugin from "../src/main";
import { DEFAULT_SETTINGS } from "../src/types/settings";

const VIEW_TYPE_CUSTOM_LEFT_SIDEBAR = "custom-left-sidebar-view";

// Mock the CustomLeftSidebarView
vi.mock("../src/components/custom-left-sidebar-view", () => ({
	CustomLeftSidebarView: vi.fn().mockImplementation(() => ({
		updateContent: vi.fn(),
	})),
}));

// Mock the CustomSidebarSettingTab
vi.mock("../src/components/settings-tab", () => ({
	CustomSidebarSettingTab: vi.fn().mockImplementation(() => ({})),
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
		registerView = vi.fn();
		addRibbonIcon = vi.fn();

		constructor(app: any, _manifest: any) {
			this.app = app;
		}
	},
	ItemView: class {
		app: any;
		leaf: any;
		containerEl: HTMLElement;

		constructor(leaf: any) {
			this.leaf = leaf;
			this.app = leaf?.app;
			this.containerEl = document.createElement("div");
		}

		onOpen = vi.fn().mockResolvedValue(undefined);
		onClose = vi.fn().mockResolvedValue(undefined);
		getViewType = vi.fn().mockReturnValue("mock-view");
		getDisplayText = vi.fn().mockReturnValue("Mock View");
		getIcon = vi.fn().mockReturnValue("mock-icon");
		getState = vi.fn().mockReturnValue({});
		setState = vi.fn().mockResolvedValue(undefined);
	},
	MarkdownRenderer: {
		render: vi.fn().mockResolvedValue(undefined),
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

describe("CustomLeftSidebarPlugin", () => {
	let plugin: CustomLeftSidebarPlugin;
	let mockApp: any;

	beforeEach(async () => {
		mockApp = {
			workspace: {
				on: vi.fn(),
				getActiveFile: vi.fn().mockReturnValue({ path: "test.md" }),
				getLeavesOfType: vi.fn().mockReturnValue([]),
				getLeftLeaf: vi.fn().mockReturnValue({
					setViewState: vi.fn().mockResolvedValue(undefined),
				}),
				getRightLeaf: vi.fn().mockReturnValue({
					setViewState: vi.fn().mockResolvedValue(undefined),
				}),
				revealLeaf: vi.fn(),
				onLayoutReady: vi.fn().mockImplementation((callback) => callback()),
			},
		};

		plugin = new CustomLeftSidebarPlugin(mockApp, {} as any);
		await plugin.loadSettings();
	});

	describe("initialization", () => {
		it("should initialize with default settings", async () => {
			expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
		});

		it("should register the custom left sidebar view", async () => {
			await plugin.onload();

			expect(plugin.registerView).toHaveBeenCalledWith(
				VIEW_TYPE_CUSTOM_LEFT_SIDEBAR,
				expect.any(Function)
			);
		});

		it("should not add ribbon icon by default", async () => {
			await plugin.onload();

			expect(plugin.addRibbonIcon).not.toHaveBeenCalled();
		});

		it("should add ribbon icon when enabled in settings", async () => {
			// Mock loadData to return settings with ribbon icon enabled
			plugin.loadData = vi.fn().mockResolvedValue({
				directoryMappings: [],
				showRibbonIcon: true,
			});
			await plugin.loadSettings();
			await plugin.onload();

			expect(plugin.addRibbonIcon).toHaveBeenCalledWith(
				"sidebar-left",
				"Open Custom Left Sidebar",
				expect.any(Function)
			);
		});

		it("should add settings tab", async () => {
			const { CustomSidebarSettingTab } = await import("../src/components/settings-tab");

			await plugin.onload();

			expect(plugin.addSettingTab).toHaveBeenCalled();
			expect(CustomSidebarSettingTab).toHaveBeenCalledWith(mockApp, plugin);
		});

		it("should not open sidebar on startup", async () => {
			await plugin.onload();

			expect(mockApp.workspace.getRightLeaf).not.toHaveBeenCalled();
		});
	});

	describe("commands", () => {
		it("should register open command", async () => {
			await plugin.onload();

			expect(plugin.addCommand).toHaveBeenCalledWith({
				id: "open-custom-left-sidebar",
				name: "Open Custom Left Sidebar",
				checkCallback: expect.any(Function),
			});
		});

		it("should open sidebar when command is executed", async () => {
			await plugin.onload();

			// Get the command callback
			const commandCall = (plugin.addCommand as any).mock.calls[0][0];
			const checkCallback = commandCall.checkCallback;

			// Should return true when checking
			expect(checkCallback(true)).toBe(true);

			// Should activate view when not checking
			checkCallback(false);
			expect(mockApp.workspace.getLeftLeaf).toHaveBeenCalled();
		});

		it("should reveal existing view if already open", async () => {
			const mockLeaf = { view: {} };
			mockApp.workspace.getLeavesOfType.mockReturnValue([mockLeaf]);

			// Mock loadData to return settings with ribbon icon enabled
			plugin.loadData = vi.fn().mockResolvedValue({
				directoryMappings: [],
				showRibbonIcon: true,
			});
			await plugin.loadSettings();
			await plugin.onload();

			// Get the ribbon callback
			const ribbonCallback = (plugin.addRibbonIcon as any).mock.calls[0][2];
			await ribbonCallback();

			expect(mockApp.workspace.revealLeaf).toHaveBeenCalledWith(mockLeaf);
		});
	});

	describe("workspace events", () => {
		it("should register workspace event listener", async () => {
			await plugin.onload();

			expect(plugin.registerEvent).toHaveBeenCalled();
			expect(mockApp.workspace.on).toHaveBeenCalledWith("active-leaf-change", expect.any(Function));
		});

		it("should update active sidebar views when file changes", async () => {
			const mockView = { updateContent: vi.fn() };
			// Mock the view to pass instanceof check
			Object.setPrototypeOf(
				mockView,
				(await import("../src/components/custom-left-sidebar-view")).CustomLeftSidebarView.prototype
			);
			const mockLeaf = { view: mockView };
			mockApp.workspace.getLeavesOfType.mockReturnValue([mockLeaf]);

			await plugin.onload();

			const eventCallback = (mockApp.workspace.on as any).mock.calls[0][1];
			eventCallback();

			expect(mockView.updateContent).toHaveBeenCalled();
		});

		it("should handle no active sidebar views gracefully", async () => {
			mockApp.workspace.getLeavesOfType.mockReturnValue([]);

			await plugin.onload();

			const eventCallback = (mockApp.workspace.on as any).mock.calls[0][1];
			expect(() => eventCallback()).not.toThrow();
		});
	});

	describe("startup behavior", () => {
		it("should never open sidebar on startup", async () => {
			await plugin.onload();

			// getRightLeaf should not be called during startup
			expect(mockApp.workspace.getRightLeaf).not.toHaveBeenCalled();
		});
	});

	describe("settings management", () => {
		it("should load custom settings from storage", async () => {
			const customSettings = {
				directoryMappings: [
					{
						id: "1",
						directoryPath: "Test",
						content: "![[Test]]",
					},
				],
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
				directoryMappings: [
					{
						id: "1",
						directoryPath: "Goals",
						content: "![[Templates/Goals]]",
					},
				],
				showRibbonIcon: false,
			};

			await plugin.saveSettings();

			expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
		});

		it("should include directory mappings in default settings", async () => {
			expect(plugin.settings).toHaveProperty("directoryMappings");
			expect(Array.isArray(plugin.settings.directoryMappings)).toBe(true);
		});

		it("should maintain settings independently of view state", async () => {
			// Mock loadData to return custom settings
			plugin.loadData = vi.fn().mockResolvedValue({
				directoryMappings: [
					{
						id: "1",
						directoryPath: "Test",
						content: "![[Test]]",
					},
				],
			});

			// Mock loadData to return settings with ribbon icon enabled
			plugin.loadData = vi.fn().mockResolvedValue({
				directoryMappings: [
					{
						id: "1",
						directoryPath: "Test",
						content: "![[Test]]",
					},
				],
				showRibbonIcon: true,
			});
			await plugin.loadSettings();
			await plugin.onload();

			// Settings should be loaded correctly
			expect(plugin.settings.directoryMappings).toHaveLength(1);

			// Settings should remain unchanged when view is opened/closed
			const ribbonCallback = (plugin.addRibbonIcon as any).mock.calls[0][2];
			await ribbonCallback();

			expect(plugin.settings.directoryMappings).toHaveLength(1);
		});
	});

	describe("onunload", () => {
		it("should close all sidebar views on unload", async () => {
			const mockLeaf = { detach: vi.fn() };
			mockApp.workspace.getLeavesOfType.mockReturnValue([mockLeaf]);

			await plugin.onload();
			await plugin.onunload();

			expect(mockLeaf.detach).toHaveBeenCalled();
		});

		it("should handle unload when no views are open", async () => {
			mockApp.workspace.getLeavesOfType.mockReturnValue([]);

			await plugin.onload();
			expect(() => plugin.onunload()).not.toThrow();
		});
	});

	describe("view management", () => {
		it("should create view with settings getter function", async () => {
			const { CustomLeftSidebarView } = await import("../src/components/custom-left-sidebar-view");

			await plugin.onload();

			// Get the view factory function
			const viewFactory = (plugin.registerView as any).mock.calls[0][1];
			const mockLeaf = {};

			viewFactory(mockLeaf);

			expect(CustomLeftSidebarView).toHaveBeenCalledWith(mockLeaf, expect.any(Function));
		});

		it("should provide current settings to view", async () => {
			const { CustomLeftSidebarView } = await import("../src/components/custom-left-sidebar-view");

			// Clear previous mock calls
			vi.mocked(CustomLeftSidebarView).mockClear();

			await plugin.onload();

			// Get the view factory function and create a view
			const viewFactory = (plugin.registerView as any).mock.calls[0][1];
			const mockLeaf = {};
			viewFactory(mockLeaf);

			// Check that CustomLeftSidebarView was called with the correct arguments
			expect(CustomLeftSidebarView).toHaveBeenCalledWith(mockLeaf, expect.any(Function));

			// Get the settings getter function from the constructor call
			const settingsGetter = vi.mocked(CustomLeftSidebarView).mock.calls[0][1];

			expect(settingsGetter()).toBe(plugin.settings);
		});
	});
});
