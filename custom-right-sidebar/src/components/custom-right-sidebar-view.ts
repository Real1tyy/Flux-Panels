import { BaseSidebarView } from "@obsidian-plugins/watchdog-plugin";
import type { WorkspaceLeaf } from "obsidian";
import type { CustomSidebarSettings } from "../types/settings";

const VIEW_TYPE_CUSTOM_RIGHT_SIDEBAR = "custom-right-sidebar-view";

export class CustomRightSidebarView extends BaseSidebarView {
	constructor(leaf: WorkspaceLeaf, getSettings: () => CustomSidebarSettings) {
		super(leaf, getSettings, "right", "custom-right-sidebar");
	}

	getViewType(): string {
		return VIEW_TYPE_CUSTOM_RIGHT_SIDEBAR;
	}

	getDisplayText(): string {
		return "Custom Right Sidebar";
	}

	getIcon(): string {
		return "sidebar-right";
	}
}
