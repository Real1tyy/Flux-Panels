import { type App, Notice, PluginSettingTab, Setting } from "obsidian";
import type FluxPanelsPlugin from "../main";
import type { DirectoryMapping } from "../types/settings";

export class FluxPanelsSettingTab extends PluginSettingTab {
	plugin: FluxPanelsPlugin;

	constructor(app: App, plugin: FluxPanelsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Flux Panels Settings" });

		// Footer Settings
		this.displayFooterSettings(containerEl);

		// Left Sidebar Settings
		this.displayLeftSidebarSettings(containerEl);

		// Right Sidebar Settings
		this.displayRightSidebarSettings(containerEl);

		// DSL Documentation
		this.displayDslDocumentation(containerEl);
	}

	private displayFooterSettings(containerEl: HTMLElement): void {
		containerEl.createEl("h3", { text: "Footer Settings" });

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
						this.display();
					})
			);

		containerEl.createEl("h4", { text: "Footer Directory Mappings" });
		this.displayDirectoryMappings(
			containerEl,
			this.plugin.settings.footerDirectoryMappings,
			"footer"
		);
	}

	private displayLeftSidebarSettings(containerEl: HTMLElement): void {
		containerEl.createEl("h3", { text: "Left Sidebar Settings" });

		new Setting(containerEl)
			.setName("Show Left Sidebar Ribbon Icon")
			.setDesc("Display the ribbon icon for quick access to the left sidebar")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showLeftSidebarRibbonIcon)
					.onChange(async (value) => {
						this.plugin.settings.showLeftSidebarRibbonIcon = value;
						await this.plugin.saveSettings();

						new Notice(
							"Ribbon icon setting changed. Please reload the plugin or restart Obsidian to see the changes."
						);
					})
			);

		containerEl.createEl("h4", { text: "Left Sidebar Directory Mappings" });
		this.displayDirectoryMappings(
			containerEl,
			this.plugin.settings.leftSidebarDirectoryMappings,
			"left sidebar"
		);
	}

	private displayRightSidebarSettings(containerEl: HTMLElement): void {
		containerEl.createEl("h3", { text: "Right Sidebar Settings" });

		new Setting(containerEl)
			.setName("Show Right Sidebar Ribbon Icon")
			.setDesc("Display the ribbon icon for quick access to the right sidebar")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showRightSidebarRibbonIcon)
					.onChange(async (value) => {
						this.plugin.settings.showRightSidebarRibbonIcon = value;
						await this.plugin.saveSettings();

						new Notice(
							"Ribbon icon setting changed. Please reload the plugin or restart Obsidian to see the changes."
						);
					})
			);

		containerEl.createEl("h4", { text: "Right Sidebar Directory Mappings" });
		this.displayDirectoryMappings(
			containerEl,
			this.plugin.settings.rightSidebarDirectoryMappings,
			"right sidebar"
		);
	}

	private displayDirectoryMappings(
		containerEl: HTMLElement,
		mappings: DirectoryMapping[],
		panelType: string
	): void {
		const descEl = containerEl.createEl("div", { cls: "setting-item-description" });
		descEl.innerHTML = `
			<p><strong>Directory Mappings:</strong> Configure what content to display for different directory paths in the ${panelType}.</p>
			<p>Use "*" as the directory path for a default fallback. More specific paths take priority.</p>
		`;

		for (const mapping of mappings) {
			this.createMappingRow(containerEl, mapping, mappings);
		}

		new Setting(containerEl)
			.setName("Add Directory Mapping")
			.setDesc(`Add a new directory to content mapping for the ${panelType}`)
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

						mappings.push(newMapping);

						await this.plugin.saveSettings();
						this.display();
					})
			);
	}

	private createMappingRow(
		containerEl: HTMLElement,
		mapping: DirectoryMapping,
		mappings: DirectoryMapping[]
	): void {
		const mappingDiv = containerEl.createEl("div", { cls: "directory-mapping-row" });

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
						const index = mappings.indexOf(mapping);
						if (index > -1) {
							mappings.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						}
					})
			);

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

				textarea.inputEl.style.width = "100%";
				textarea.inputEl.style.minWidth = "400px";
				textarea.inputEl.style.height = "120px";
				textarea.inputEl.style.resize = "vertical";
				textarea.inputEl.style.fontFamily = "var(--font-monospace)";
			});

		mappingDiv.createEl("hr", { cls: "directory-mapping-separator" });
	}

	private displayDslDocumentation(containerEl: HTMLElement): void {
		containerEl.createEl("h3", { text: "DSL Syntax" });

		const dslUsageEl = containerEl.createEl("div", { cls: "setting-item-description" });
		dslUsageEl.innerHTML = `
			<p><strong>DSL Syntax Examples (for sidebars):</strong></p>

			<p><em>Basic Syntax:</em></p>
			<pre><code>\`\`\`CommandType Tasks
![[Projects-Tasks.base]]
\`\`\`

\`\`\`CommandType ChildTasks
![[Projects-ChildTasks.base]]
\`\`\`</code></pre>

			<p><em>Nested Syntax (Two-Level Dropdowns):</em></p>
			<pre><code>\`\`\`CommandType Projects
# Project Overview

\`\`\`CommandType CurrentProjects
![[Projects-Current.base]]
\`\`\`

\`\`\`CommandType CompletedProjects
![[Projects-Completed.base]]
\`\`\`

\`\`\`CommandType OnHoldProjects
![[Projects-OnHold.base]]
\`\`\`
\`\`\`</code></pre>

			<p>The <strong>CommandType</strong> creates the main dropdown selector. When nested <strong>CommandType</strong> blocks are within another CommandType, a second dropdown will appear for sub-views.</p>
			<p><strong>Note:</strong> You can mix regular content with nested CommandType blocks within CommandType sections.</p>
		`;

		containerEl.createEl("h3", { text: "Dynamic Commands" });

		const commandsEl = containerEl.createEl("div", { cls: "setting-item-description" });
		commandsEl.innerHTML = `
			<p><strong>Dynamic View Switching Commands:</strong></p>
			<p>When DSL content is detected, the plugin automatically registers commands for each view option:</p>
			<ul>
				<li><strong>Main Views:</strong> "Switch to [ViewName]" - Switch to top-level views</li>
				<li><strong>Sub-Views:</strong> "Switch to [ViewName] → [SubViewName]" - Switch to nested views</li>
			</ul>
			<p>These commands are dynamically created based on your DSL content and can be assigned hotkeys in Obsidian's hotkey settings.</p>
			<p><strong>Command Naming:</strong> Commands use consistent IDs based on your view names, so hotkey assignments persist across content changes.</p>
		`;

		containerEl.createEl("h3", { text: "Usage" });

		const usageEl = containerEl.createEl("div", { cls: "setting-item-description" });
		usageEl.innerHTML = `
			<p><strong>Toggle Footer:</strong> Use the command "Toggle Custom Footer" to toggle the footer visibility.</p>
			<p><strong>Resize Footer:</strong> Drag the top edge of the footer to resize it.</p>
			<p><strong>Open Left Sidebar:</strong> Use the ribbon icon or command "Open Custom Left Sidebar".</p>
			<p><strong>Open Right Sidebar:</strong> Use the ribbon icon or command "Open Custom Right Sidebar".</p>
			<p><strong>Resize Sidebars:</strong> Drag the edges of the sidebars to resize them. Obsidian handles sizing automatically.</p>
		`;
	}
}
