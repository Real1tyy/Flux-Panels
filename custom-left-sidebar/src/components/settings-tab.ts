import { WatchdogSettingsTab } from "@obsidian-plugins/watchdog-plugin";
import type CustomLeftSidebarPlugin from "../main";
import type { CustomSidebarSettings } from "../types/settings";

export class CustomSidebarSettingTab extends WatchdogSettingsTab<
	CustomLeftSidebarPlugin,
	CustomSidebarSettings
> {
	protected getTitle(): string {
		return "Custom Left Sidebar Settings";
	}

	protected getSidebarName(): string {
		return "left sidebar";
	}

	protected getUsageText(): string {
		return `
			<p><strong>Open Sidebar:</strong> Use the ribbon icon or command "Open Custom Left Sidebar" to open the left sidebar.</p>
			<p><strong>Resize Sidebar:</strong> Drag the edges of the sidebar to resize it. Obsidian handles the sizing automatically.</p>
			<p><strong>Hotkeys:</strong> Left sidebar: Ctrl/Cmd+Shift+L</p>
		`;
	}
}
