import { BaseSidebarView } from "@obsidian-plugins/watchdog-plugin";
import type { WorkspaceLeaf } from "obsidian";
import type { CustomSidebarSettings } from "../types/settings";

const VIEW_TYPE_CUSTOM_LEFT_SIDEBAR = "custom-left-sidebar-view";

export class CustomLeftSidebarView extends BaseSidebarView {
	constructor(leaf: WorkspaceLeaf, getSettings: () => CustomSidebarSettings) {
		super(leaf, getSettings, "left", "custom-left-sidebar");
	}

	getViewType(): string {
		return VIEW_TYPE_CUSTOM_LEFT_SIDEBAR;
	}

	getDisplayText(): string {
		return "Custom Left Sidebar";
	}

	getIcon(): string {
		return "sidebar-left";
	}
}
