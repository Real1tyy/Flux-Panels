import type { WorkspaceLeaf } from "obsidian";
import { BaseSidebarView } from "../lib/base-sidebar-view";
import type { FluxPanelsSettings } from "../types/settings";

const VIEW_TYPE_CUSTOM_RIGHT_SIDEBAR = "custom-right-sidebar-view";

export class CustomRightSidebarView extends BaseSidebarView {
	constructor(leaf: WorkspaceLeaf, getSettings: () => FluxPanelsSettings) {
		const getSidebarSettings = () => {
			const settings = getSettings();
			return {
				directoryMappings: settings.rightSidebarDirectoryMappings,
				showRibbonIcon: settings.showRightSidebarRibbonIcon,
			};
		};
		super(leaf, getSidebarSettings, "right", "custom-right-sidebar");
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

