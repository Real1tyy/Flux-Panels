export interface DirectoryMapping {
	id: string;
	directoryPath: string;
	content: string;
}

export interface CustomFooterSettings {
	defaultFooterVisible: boolean;
	defaultFooterHeight: number;
	directoryMappings: DirectoryMapping[];
}

export const DEFAULT_SETTINGS: CustomFooterSettings = {
	defaultFooterVisible: false,
	defaultFooterHeight: 420,
	directoryMappings: [],
};

export interface FooterRuntimeState {
	isVisible: boolean;
	currentHeight: number;
}
