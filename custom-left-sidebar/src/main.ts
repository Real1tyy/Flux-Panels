import {
	WatchdogPlugin,
	type WatchdogView,
	type WatchdogViewConfig,
} from "@obsidian-plugins/watchdog-plugin";
import type { WorkspaceLeaf } from "obsidian";
import { CustomLeftSidebarView, CustomSidebarSettingTab } from "./components";
import { type CustomSidebarSettings, DEFAULT_SETTINGS } from "./types/settings";

const VIEW_TYPE_CUSTOM_LEFT_SIDEBAR = "custom-left-sidebar-view";

export default class CustomLeftSidebarPlugin extends WatchdogPlugin<CustomSidebarSettings> {
	protected createView(
		leaf: WorkspaceLeaf,
		getSettings: () => CustomSidebarSettings
	): WatchdogView {
		return new CustomLeftSidebarView(leaf, getSettings);
	}

	protected getViewConfig(): WatchdogViewConfig {
		return {
			viewType: VIEW_TYPE_CUSTOM_LEFT_SIDEBAR,
			displayName: "Custom Left Sidebar",
			ribbonIcon: "sidebar-left",
			ribbonTooltip: "Open Custom Left Sidebar",
			commandId: "open-custom-left-sidebar",
			commandName: "Open Custom Left Sidebar",
			sidebarSide: "left",
		};
	}

	protected getDefaultSettings(): CustomSidebarSettings {
		return DEFAULT_SETTINGS;
	}

	protected createSettingsTab(): CustomSidebarSettingTab {
		return new CustomSidebarSettingTab(this.app, this);
	}
}
