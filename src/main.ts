import { Plugin, type WorkspaceLeaf } from "obsidian";
import { FooterManager } from "./components/footer-manager";
import { CustomLeftSidebarView } from "./components/left-sidebar-view";
import { CustomRightSidebarView } from "./components/right-sidebar-view";
import { FluxPanelsSettingTab } from "./components/settings-tab";
import { containsDslSyntax } from "./lib/dsl-parser";
import type { DynamicViewCommand, ViewSwitchingManager } from "./lib/types";
import { DEFAULT_SETTINGS, type FluxPanelsSettings, type FooterRuntimeState } from "./types/settings";

const VIEW_TYPE_LEFT_SIDEBAR = "custom-left-sidebar-view";
const VIEW_TYPE_RIGHT_SIDEBAR = "custom-right-sidebar-view";

export default class FluxPanelsPlugin extends Plugin {
	settings: FluxPanelsSettings;
	private footerManager: FooterManager;
	private footerRuntimeState: FooterRuntimeState;

	private registeredDynamicCommandsLeft: string[] = [];
	private registeredDynamicCommandsRight: string[] = [];
	private lastContentHashLeft: string | null = null;
	private lastContentHashRight: string | null = null;

	async onload() {
		await this.loadSettings();

		// Initialize footer
		this.footerRuntimeState = {
			isVisible: this.settings.defaultFooterVisible,
			currentHeight: this.settings.defaultFooterHeight,
		};

		this.footerManager = new FooterManager(this.app, this.footerRuntimeState, this, () => this.settings);

		// Register left sidebar view
		this.registerView(VIEW_TYPE_LEFT_SIDEBAR, (leaf) => this.createLeftSidebarView(leaf));

		// Register right sidebar view
		this.registerView(VIEW_TYPE_RIGHT_SIDEBAR, (leaf) => this.createRightSidebarView(leaf));

		// Add settings tab
		this.addSettingTab(new FluxPanelsSettingTab(this.app, this));

		// Register footer commands
		this.addCommand({
			id: "toggle-custom-footer",
			name: "Toggle Custom Footer",
			callback: () => {
				this.toggleFooter();
			},
		});

		// Register left sidebar commands
		if (this.settings.showLeftSidebarRibbonIcon) {
			this.addRibbonIcon("sidebar-left", "Open Custom Left Sidebar", async () => {
				await this.activateView(VIEW_TYPE_LEFT_SIDEBAR, "left");
			});
		}

		this.addCommand({
			id: "open-custom-left-sidebar",
			name: "Open Custom Left Sidebar",
			checkCallback: (checking) => {
				if (checking) return true;
				this.activateView(VIEW_TYPE_LEFT_SIDEBAR, "left");
			},
		});

		// Register right sidebar commands
		if (this.settings.showRightSidebarRibbonIcon) {
			this.addRibbonIcon("sidebar-right", "Open Custom Right Sidebar", async () => {
				await this.activateView(VIEW_TYPE_RIGHT_SIDEBAR, "right");
			});
		}

		this.addCommand({
			id: "open-custom-right-sidebar",
			name: "Open Custom Right Sidebar",
			checkCallback: (checking) => {
				if (checking) return true;
				this.activateView(VIEW_TYPE_RIGHT_SIDEBAR, "right");
			},
		});

		// Listen to active leaf changes
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				if (this.footerRuntimeState.isVisible) {
					this.footerManager.updateContent();
				}
				this.updateActiveViews();
				setTimeout(() => this.updateDynamicCommands(), 100);
			})
		);

		// Listen to layout changes
		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				setTimeout(() => this.updateDynamicCommands(), 200);
			})
		);

		// Show footer if configured
		if (this.footerRuntimeState.isVisible) {
			this.footerManager.show();
		}

		// Initial command registration
		setTimeout(() => {
			this.updateDynamicCommands();
		}, 500);
	}

	async onunload() {
		this.footerManager?.hide();

		this.app.workspace.getLeavesOfType(VIEW_TYPE_LEFT_SIDEBAR).forEach((leaf) => {
			leaf.detach();
		});

		this.app.workspace.getLeavesOfType(VIEW_TYPE_RIGHT_SIDEBAR).forEach((leaf) => {
			leaf.detach();
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		setTimeout(() => this.updateDynamicCommands(), 100);
	}

	private createLeftSidebarView(leaf: WorkspaceLeaf): CustomLeftSidebarView {
		return new CustomLeftSidebarView(leaf, () => this.settings);
	}

	private createRightSidebarView(leaf: WorkspaceLeaf): CustomRightSidebarView {
		return new CustomRightSidebarView(leaf, () => this.settings);
	}

	private toggleFooter() {
		this.footerRuntimeState.isVisible = !this.footerRuntimeState.isVisible;

		if (this.footerRuntimeState.isVisible) {
			this.footerManager.show();
		} else {
			this.footerManager.hide();
		}
	}

	private async activateView(viewType: string, side: "left" | "right"): Promise<void> {
		const existingLeaves = this.app.workspace.getLeavesOfType(viewType);

		if (existingLeaves.length > 0) {
			this.app.workspace.revealLeaf(existingLeaves[0]);
			return;
		}

		const leaf = side === "left" ? this.app.workspace.getLeftLeaf(false) : this.app.workspace.getRightLeaf(false);

		if (leaf) {
			await leaf.setViewState({ type: viewType, active: true });
			this.app.workspace.revealLeaf(leaf);
		}
	}

	private updateActiveViews(): void {
		const leftLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_LEFT_SIDEBAR);
		const rightLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_RIGHT_SIDEBAR);

		for (const leaf of [...leftLeaves, ...rightLeaves]) {
			const view = leaf.view;
			if (view && "updateContent" in view && typeof view.updateContent === "function") {
				view.updateContent();
			}
		}
	}

	private updateDynamicCommands(): void {
		// Update left sidebar commands
		this.updateDynamicCommandsForView(
			VIEW_TYPE_LEFT_SIDEBAR,
			this.settings.leftSidebarDirectoryMappings,
			this.registeredDynamicCommandsLeft,
			this.lastContentHashLeft,
			(hash) => {
				this.lastContentHashLeft = hash;
			},
			"open-custom-left-sidebar"
		);

		// Update right sidebar commands
		this.updateDynamicCommandsForView(
			VIEW_TYPE_RIGHT_SIDEBAR,
			this.settings.rightSidebarDirectoryMappings,
			this.registeredDynamicCommandsRight,
			this.lastContentHashRight,
			(hash) => {
				this.lastContentHashRight = hash;
			},
			"open-custom-right-sidebar"
		);
	}

	private updateDynamicCommandsForView(
		viewType: string,
		directoryMappings: { directoryPath: string; content: string }[],
		registeredCommands: string[],
		lastContentHash: string | null,
		setLastContentHash: (hash: string | null) => void,
		commandIdPrefix: string
	): void {
		const content = this.getContentForCurrentContext(directoryMappings);
		const viewSwitchingManager = this.getViewSwitchingManager(viewType);

		if (!viewSwitchingManager) {
			registeredCommands.length = 0;
			setLastContentHash(null);
			return;
		}

		const currentViewOptions = viewSwitchingManager.getCurrentViewOptions();
		const viewStateHash = this.createViewStateHash(currentViewOptions, viewSwitchingManager);
		const contentHash = content ? this.simpleHash(content) : null;
		const combinedHash = `${contentHash}|${viewStateHash}`;

		if (combinedHash === lastContentHash) {
			return;
		}

		setLastContentHash(combinedHash);
		registeredCommands.length = 0;

		if (!content || !containsDslSyntax(content)) {
			return;
		}

		if ("onCommandsNeedUpdate" in viewSwitchingManager) {
			(viewSwitchingManager as any).onCommandsNeedUpdate = () => {
				setTimeout(() => {
					setLastContentHash(null);
					this.updateDynamicCommands();
				}, 50);
			};
		}

		const availableCommands = viewSwitchingManager.getAvailableCommands();
		this.registerDynamicCommands(
			availableCommands,
			viewSwitchingManager,
			registeredCommands,
			commandIdPrefix,
			viewType
		);
	}

	private getContentForCurrentContext(directoryMappings: { directoryPath: string; content: string }[]): string {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			return "";
		}

		const filePath = activeFile.path;

		const matchedMapping =
			directoryMappings.find((mapping) => filePath.startsWith(mapping.directoryPath)) ||
			directoryMappings.find((mapping) => mapping.directoryPath === "*");

		return matchedMapping?.content || "";
	}

	private getViewSwitchingManager(viewType: string): ViewSwitchingManager | null {
		const leaves = this.app.workspace.getLeavesOfType(viewType);

		if (leaves.length === 0) {
			return null;
		}

		const view = leaves[0].view;
		if (view && "getViewSwitchingManager" in view && typeof view.getViewSwitchingManager === "function") {
			return view.getViewSwitchingManager();
		}

		return null;
	}

	private registerDynamicCommands(
		commands: DynamicViewCommand[],
		_manager: ViewSwitchingManager,
		registeredCommands: string[],
		commandIdPrefix: string,
		viewType: string
	): void {
		for (const command of commands) {
			const commandId = `${commandIdPrefix}-${command.id}`;

			this.addCommand({
				id: commandId,
				name: command.name,
				checkCallback: (checking) => {
					if (checking) {
						return this.getViewSwitchingManager(viewType) !== null;
					}

					const currentManager = this.getViewSwitchingManager(viewType);
					if (!currentManager) {
						return false;
					}

					const currentCommands = currentManager.getAvailableCommands();
					const matchingCommand = currentCommands.find((cmd) => cmd.id === command.id);

					if (matchingCommand) {
						currentManager.switchToView(matchingCommand.viewId, matchingCommand.subViewId);
					}
					return true;
				},
			});

			registeredCommands.push(commandId);
		}
	}

	private simpleHash(str: string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash;
		}
		return hash.toString();
	}

	private createViewStateHash(_viewOptions: any[], viewSwitchingManager: ViewSwitchingManager): string {
		const currentCommands = viewSwitchingManager.getAvailableCommands();
		const commandsString = currentCommands.map((cmd) => `${cmd.id}:${cmd.viewId}:${cmd.subViewId || ""}`).join("|");
		return this.simpleHash(commandsString);
	}
}
