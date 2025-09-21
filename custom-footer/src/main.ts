import { Plugin } from "obsidian";
import { CustomFooterSettingTab, FooterManager } from "./components";
import { type CustomFooterSettings, DEFAULT_SETTINGS, type FooterRuntimeState } from "./types";

export default class CustomFooterPlugin extends Plugin {
	settings: CustomFooterSettings;
	private footerManager: FooterManager;
	private runtimeState: FooterRuntimeState;

	async onload() {
		await this.loadSettings();

		this.runtimeState = {
			isVisible: this.settings.defaultFooterVisible,
			currentHeight: this.settings.defaultFooterHeight,
		};

		this.footerManager = new FooterManager(this.app, this.runtimeState, this, () => this.settings);

		this.addSettingTab(new CustomFooterSettingTab(this.app, this));

		this.addCommand({
			id: "toggle-custom-footer",
			name: "Toggle Custom Footer",
			callback: () => {
				this.toggleFooter();
			},
		});

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				if (this.runtimeState.isVisible) {
					this.footerManager.updateContent();
				}
			})
		);

		if (this.runtimeState.isVisible) {
			this.footerManager.show();
		}
	}

	async onunload() {
		this.footerManager?.hide();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private toggleFooter() {
		this.runtimeState.isVisible = !this.runtimeState.isVisible;

		if (this.runtimeState.isVisible) {
			this.footerManager.show();
		} else {
			this.footerManager.hide();
		}
	}
}
