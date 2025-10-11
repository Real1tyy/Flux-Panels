import type { WorkspaceLeaf } from "obsidian";
import { BaseSidebarView } from "../lib/base-sidebar-view";
import type { FluxPanelsSettings } from "../types/settings";

const VIEW_TYPE_CUSTOM_LEFT_SIDEBAR = "custom-left-sidebar-view";

export class CustomLeftSidebarView extends BaseSidebarView {
	constructor(leaf: WorkspaceLeaf, getSettings: () => FluxPanelsSettings) {
		const getSidebarSettings = () => {
			const settings = getSettings();
			return {
				directoryMappings: settings.leftSidebarDirectoryMappings,
				showRibbonIcon: settings.showLeftSidebarRibbonIcon,
			};
		};
		super(leaf, getSidebarSettings, "left", "custom-left-sidebar");
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
