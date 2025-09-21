import { WatchdogSettingsTab } from "@obsidian-plugins/watchdog-plugin";
import type CustomRightSidebarPlugin from "../main";
import type { CustomSidebarSettings } from "../types/settings";

export class CustomSidebarSettingTab extends WatchdogSettingsTab<
	CustomRightSidebarPlugin,
	CustomSidebarSettings
> {
	protected getTitle(): string {
		return "Custom Right Sidebar Settings";
	}

	protected getSidebarName(): string {
		return "right sidebar";
	}

	protected getUsageText(): string {
		return `
			<p><strong>Open Sidebar:</strong> Use the ribbon icon or command "Open Custom Right Sidebar" to open the right sidebar.</p>
			<p><strong>Resize Sidebar:</strong> Drag the edges of the sidebar to resize it. Obsidian handles the sizing automatically.</p>
			<p><strong>Hotkeys:</strong> Right sidebar: Ctrl/Cmd+Shift+R</p>
		`;
	}
}
