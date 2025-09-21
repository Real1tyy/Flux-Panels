import type { BaseWatchdogSettings } from "@obsidian-plugins/watchdog-plugin";

export interface CustomSidebarSettings extends BaseWatchdogSettings {}

export const DEFAULT_SETTINGS: CustomSidebarSettings = {
	directoryMappings: [],
	showRibbonIcon: false,
};
