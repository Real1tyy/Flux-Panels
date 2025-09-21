import { type App, PluginSettingTab, Setting } from "obsidian";
import type CustomFooterPlugin from "../main";
import type { DirectoryMapping } from "../types/settings";

export class CustomFooterSettingTab extends PluginSettingTab {
	plugin: CustomFooterPlugin;

	constructor(app: App, plugin: CustomFooterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Custom Footer Settings" });

		new Setting(containerEl)
			.setName("Default Footer Visibility")
			.setDesc(
				"Whether the footer should be visible when Obsidian starts. You can toggle visibility using the command palette."
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.defaultFooterVisible).onChange(async (value) => {
					this.plugin.settings.defaultFooterVisible = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Default Footer Height")
			.setDesc("The default height of the footer in pixels when it's first shown.")
			.addSlider((slider) =>
				slider
					.setLimits(100, 800, 10)
					.setValue(this.plugin.settings.defaultFooterHeight)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.defaultFooterHeight = value;
						await this.plugin.saveSettings();
					})
			)
			.addExtraButton((button) =>
				button
					.setIcon("reset")
					.setTooltip("Reset to default (420px)")
					.onClick(async () => {
						this.plugin.settings.defaultFooterHeight = 420;
						await this.plugin.saveSettings();
						this.display(); // Refresh the settings display
					})
			);

		this.displayDirectoryMappings(containerEl);

		containerEl.createEl("h3", { text: "Usage" });

		const usageEl = containerEl.createEl("div", { cls: "setting-item-description" });
		usageEl.innerHTML = `
			<p><strong>Toggle Footer:</strong> Use the command "Show Custom Footer" to toggle the footer visibility.</p>
			<p><strong>Resize Footer:</strong> Drag the top edge of the footer to resize it. The size will be remembered during the current session.</p>
			<p><strong>Settings:</strong> Changes here affect the default state when Obsidian starts, not the current session.</p>
		`;
	}

	private displayDirectoryMappings(containerEl: HTMLElement): void {
		containerEl.createEl("h3", { text: "Directory Mappings" });

		const descEl = containerEl.createEl("div", { cls: "setting-item-description" });
		descEl.innerHTML = `
			<p><strong>Directory Mappings:</strong> Configure what content to display for different directory paths.</p>
			<p>Use "*" as the directory path for a default fallback. More specific paths take priority.</p>
		`;

		// Display existing mappings
		for (const mapping of this.plugin.settings.directoryMappings) {
			this.createMappingRow(containerEl, mapping);
		}

		// Add new mapping button
		new Setting(containerEl)
			.setName("Add Directory Mapping")
			.setDesc("Add a new directory to content mapping")
			.addButton((button) =>
				button
					.setButtonText("Add Mapping")
					.setCta()
					.onClick(async () => {
						const newMapping: DirectoryMapping = {
							id: Date.now().toString(),
							directoryPath: "",
							content: "",
						};
						this.plugin.settings.directoryMappings.push(newMapping);
						await this.plugin.saveSettings();
						this.display();
					})
			);
	}

	private createMappingRow(containerEl: HTMLElement, mapping: DirectoryMapping): void {
		const mappingDiv = containerEl.createEl("div", { cls: "directory-mapping-row" });

		// Directory path setting
		new Setting(mappingDiv)
			.setName("Directory Path")
			.setDesc("Path to match (e.g., 'Goals', 'Projects', or '*' for default)")
			.addText((text) =>
				text
					.setPlaceholder("Goals")
					.setValue(mapping.directoryPath)
					.onChange(async (value) => {
						mapping.directoryPath = value.trim();
						await this.plugin.saveSettings();
					})
			)
			.addExtraButton((button) =>
				button
					.setIcon("trash")
					.setTooltip("Remove this mapping")
					.onClick(async () => {
						const index = this.plugin.settings.directoryMappings.indexOf(mapping);
						if (index > -1) {
							this.plugin.settings.directoryMappings.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						}
					})
			);

		// Content setting
		new Setting(mappingDiv)
			.setName("Content to Render")
			.setDesc("Markdown content to display for this directory (supports embeds, links, etc.)")
			.addTextArea((textarea) => {
				textarea
					.setPlaceholder("![[Templates/Links]]")
					.setValue(mapping.content)
					.onChange(async (value) => {
						mapping.content = value;
						await this.plugin.saveSettings();
					});

				// Make the textarea larger and more readable
				textarea.inputEl.style.width = "100%";
				textarea.inputEl.style.minWidth = "400px";
				textarea.inputEl.style.height = "120px";
				textarea.inputEl.style.resize = "vertical";
				textarea.inputEl.style.fontFamily = "var(--font-monospace)";
			});

		mappingDiv.createEl("hr", { cls: "directory-mapping-separator" });
	}
}
