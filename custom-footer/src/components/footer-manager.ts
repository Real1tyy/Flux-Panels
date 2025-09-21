import { type App, type Component, MarkdownRenderer } from "obsidian";
import type { CustomFooterSettings, FooterRuntimeState } from "../types";

export class FooterManager {
	private footerEl: HTMLElement | null = null;
	private contentEl: HTMLElement | null = null;
	private resizeHandle: HTMLElement | null = null;
	private isResizing = false;
	private startY = 0;
	private startHeight = 0;

	constructor(
		private app: App,
		private runtimeState: FooterRuntimeState,
		private component: Component,
		private getSettings: () => CustomFooterSettings
	) {}

	show(): void {
		if (this.footerEl) return;

		this.createFooterContainer();
		this.createResizeHandle();
		this.createContentArea();
		this.setupResizeHandlers();

		document.body.appendChild(this.footerEl!);
		this.updateContent();
		document.body.addClass("custom-footer-visible");
	}

	hide(): void {
		if (this.footerEl) {
			this.footerEl.remove();
			this.footerEl = null;
			this.contentEl = null;
			this.resizeHandle = null;
		}
		this.isUpdating = false; // Reset update flag
		document.body.removeClass("custom-footer-visible");
	}

	private isUpdating = false;

	async updateContent(): Promise<void> {
		if (!this.contentEl || this.isUpdating) return;

		this.isUpdating = true;

		try {
			// More thorough cleanup to prevent duplication
			this.contentEl.innerHTML = "";
			this.contentEl.empty();

			const content = this.getContentForCurrentFile();

			if (!content) {
				this.contentEl.createEl("div", {
					text: "No content configured for this directory",
					cls: "custom-footer-no-content",
				});
				return;
			}

			await this.renderContent(content, this.contentEl);
		} catch (error) {
			console.error("Failed to update footer content:", error);
			this.contentEl.innerHTML = "";
			this.contentEl.empty();
			this.contentEl.createEl("div", {
				text: "Error loading footer content",
				cls: "custom-footer-error",
			});
		} finally {
			this.isUpdating = false;
		}
	}

	private getContentForCurrentFile(): string | null {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) return null;

		const settings = this.getSettings();
		const filePath = activeFile.path;

		let wildcardMapping: string | null = null;

		// First pass: look for specific directory matches, store wildcard for fallback
		for (const mapping of settings.directoryMappings) {
			if (mapping.directoryPath === "*") {
				wildcardMapping = mapping.content;
				continue;
			}

			if (this.doesPathMatch(filePath, mapping.directoryPath)) {
				return mapping.content || null;
			}
		}

		return wildcardMapping;
	}

	private doesPathMatch(filePath: string, directoryPath: string): boolean {
		if (!directoryPath) return false;

		// Normalize directory path - ensure it ends with /
		const normalizedDirPath = directoryPath.endsWith("/") ? directoryPath : `${directoryPath}/`;

		return filePath.startsWith(normalizedDirPath);
	}

	private createFooterContainer(): void {
		this.footerEl = document.createElement("div");
		this.footerEl.addClass("custom-footer-container");

		Object.assign(this.footerEl.style, {
			height: `${this.runtimeState.currentHeight}px`,
			backgroundColor: "var(--background-primary)",
			position: "fixed",
			bottom: "0",
			left: "0",
			right: "0",
			zIndex: "50", // Lower z-index to allow Obsidian dialogs above
			overflow: "hidden",
			boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)",
			pointerEvents: "auto",
		});
	}

	private createResizeHandle(): void {
		this.resizeHandle = document.createElement("div");
		this.resizeHandle.addClass("custom-footer-resize-handle");

		Object.assign(this.resizeHandle.style, {
			position: "absolute",
			top: "0",
			left: "0",
			right: "0",
			height: "6px",
			backgroundColor: "var(--background-modifier-border)",
			cursor: "ns-resize",
			zIndex: "60", // Just above footer container (50) for interaction
			transition: "background-color 0.2s ease",
		});

		this.resizeHandle.addEventListener("mouseenter", () => {
			this.resizeHandle!.style.backgroundColor = "var(--interactive-accent)";
		});

		this.resizeHandle.addEventListener("mouseleave", () => {
			if (!this.isResizing) {
				this.resizeHandle!.style.backgroundColor = "var(--background-modifier-border)";
			}
		});

		this.footerEl!.appendChild(this.resizeHandle);
	}

	private createContentArea(): void {
		this.contentEl = document.createElement("div");
		this.contentEl.addClass("custom-footer-content");

		Object.assign(this.contentEl.style, {
			padding: "12px",
			height: `${this.runtimeState.currentHeight - 6}px`,
			overflow: "auto",
			marginTop: "6px",
			pointerEvents: "auto",
			position: "relative",
		});

		this.footerEl!.appendChild(this.contentEl);
	}

	private setupResizeHandlers(): void {
		if (!this.resizeHandle) return;

		const onMouseDown = (e: MouseEvent) => {
			e.preventDefault();
			this.isResizing = true;
			this.startY = e.clientY;
			this.startHeight = this.runtimeState.currentHeight;

			document.body.style.cursor = "ns-resize";
			document.body.style.userSelect = "none";
			this.resizeHandle!.style.backgroundColor = "var(--interactive-accent)";
		};

		const onMouseMove = (e: MouseEvent) => {
			if (!this.isResizing) return;

			e.preventDefault();
			const deltaY = this.startY - e.clientY;
			const newHeight = Math.max(100, this.startHeight + deltaY);

			this.runtimeState.currentHeight = newHeight;
			if (this.footerEl && this.contentEl) {
				this.footerEl.style.height = `${newHeight}px`;
				this.contentEl.style.height = `${newHeight - 6}px`;
			}
		};

		const onMouseUp = () => {
			if (!this.isResizing) return;

			this.isResizing = false;
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
			this.resizeHandle!.style.backgroundColor = "var(--background-modifier-border)";
		};

		this.resizeHandle.addEventListener("mousedown", onMouseDown);
		this.component.registerDomEvent(document, "mousemove", onMouseMove);
		this.component.registerDomEvent(document, "mouseup", onMouseUp);
	}

	private async renderContent(content: string, container: HTMLElement): Promise<void> {
		const tempEl = document.createElement("div");
		const activeFile = this.app.workspace.getActiveFile();
		const sourcePath = activeFile?.path || "";

		await MarkdownRenderer.render(this.app, content, tempEl, sourcePath, this.component);

		while (tempEl.firstChild) {
			container.appendChild(tempEl.firstChild);
		}
	}
}
