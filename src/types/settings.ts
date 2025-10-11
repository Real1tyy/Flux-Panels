export interface DirectoryMapping {
	id: string;
	directoryPath: string;
	content: string;
}

export interface FluxPanelsSettings {
	// Footer settings
	defaultFooterVisible: boolean;
	defaultFooterHeight: number;
	footerDirectoryMappings: DirectoryMapping[];

	// Left sidebar settings
	leftSidebarDirectoryMappings: DirectoryMapping[];
	showLeftSidebarRibbonIcon: boolean;

	// Right sidebar settings
	rightSidebarDirectoryMappings: DirectoryMapping[];
	showRightSidebarRibbonIcon: boolean;
}

export const DEFAULT_SETTINGS: FluxPanelsSettings = {
	// Footer defaults
	defaultFooterVisible: false,
	defaultFooterHeight: 420,
	footerDirectoryMappings: [],

	// Left sidebar defaults
	leftSidebarDirectoryMappings: [],
	showLeftSidebarRibbonIcon: false,

	// Right sidebar defaults
	rightSidebarDirectoryMappings: [],
	showRightSidebarRibbonIcon: false,
};

export interface FooterRuntimeState {
	isVisible: boolean;
	currentHeight: number;
}
