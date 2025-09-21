import {
	WatchdogPlugin,
	type WatchdogView,
	type WatchdogViewConfig,
} from "@obsidian-plugins/watchdog-plugin";
import type { WorkspaceLeaf } from "obsidian";
import { CustomRightSidebarView, CustomSidebarSettingTab } from "./components";
import { type CustomSidebarSettings, DEFAULT_SETTINGS } from "./types/settings";

const VIEW_TYPE_CUSTOM_RIGHT_SIDEBAR = "custom-right-sidebar-view";

export default class CustomRightSidebarPlugin extends WatchdogPlugin<CustomSidebarSettings> {
	protected createView(
		leaf: WorkspaceLeaf,
		getSettings: () => CustomSidebarSettings
	): WatchdogView {
		return new CustomRightSidebarView(leaf, getSettings);
	}

	protected getViewConfig(): WatchdogViewConfig {
		return {
			viewType: VIEW_TYPE_CUSTOM_RIGHT_SIDEBAR,
			displayName: "Custom Right Sidebar",
			ribbonIcon: "sidebar-right",
			ribbonTooltip: "Open Custom Right Sidebar",
			commandId: "open-custom-right-sidebar",
			commandName: "Open Custom Right Sidebar",
			sidebarSide: "right",
		};
	}

	protected getDefaultSettings(): CustomSidebarSettings {
		return DEFAULT_SETTINGS;
	}

	protected createSettingsTab(): CustomSidebarSettingTab {
		return new CustomSidebarSettingTab(this.app, this);
	}
}
