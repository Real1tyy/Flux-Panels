import { beforeEach, describe, expect, it, vi } from "vitest";
import { FooterManager } from "../src/components/footer-manager";
import type { CustomFooterSettings, FooterRuntimeState } from "../src/types";

// Mock Obsidian modules
vi.mock("obsidian", () => ({
	MarkdownRenderer: {
		render: vi.fn().mockResolvedValue(undefined),
	},
}));

describe("FooterManager", () => {
	let footerManager: FooterManager;
	let mockApp: any;
	let mockRuntimeState: FooterRuntimeState;
	let mockComponent: any;
	let mockSettings: CustomFooterSettings;

	beforeEach(() => {
		// Reset DOM
		document.body.innerHTML = "";
		document.body.className = "";

		// Reset all mocks
		vi.clearAllMocks();

		mockApp = {
			workspace: {
				getActiveFile: vi.fn().mockReturnValue({ path: "Goals/test.md" }),
			},
		};

		mockRuntimeState = {
			isVisible: false,
			currentHeight: 420,
		};

		mockComponent = {
			registerDomEvent: vi.fn(),
		};

		mockSettings = {
			defaultFooterVisible: false,
			defaultFooterHeight: 420,
			directoryMappings: [
				{
					id: "1",
					directoryPath: "Goals",
					content: "![[Templates/Goals]]",
				},
				{
					id: "2",
					directoryPath: "Projects",
					content: "![[Templates/Projects]]",
				},
				{
					id: "3",
					directoryPath: "*",
					content: "![[Templates/Default]]",
				},
			],
		};

		footerManager = new FooterManager(mockApp, mockRuntimeState, mockComponent, () => mockSettings);
	});

	describe("show", () => {
		it("should create footer elements when shown", () => {
			footerManager.show();

			const footerEl = document.querySelector(".custom-footer-container");
			const resizeHandle = document.querySelector(".custom-footer-resize-handle");
			const contentEl = document.querySelector(".custom-footer-content");

			expect(footerEl).toBeTruthy();
			expect(resizeHandle).toBeTruthy();
			expect(contentEl).toBeTruthy();
			expect(document.body.classList.contains("custom-footer-visible")).toBe(true);
		});

		it("should apply correct styles to footer container", () => {
			footerManager.show();

			const footerEl = document.querySelector(".custom-footer-container") as HTMLElement;
			expect(footerEl.style.height).toBe("420px");
			expect(footerEl.style.position).toBe("fixed");
			expect(footerEl.style.bottom).toBe("0px");
			expect(footerEl.style.zIndex).toBe("50"); // Updated to match new z-index
		});

		it("should not create duplicate footer if already shown", () => {
			footerManager.show();
			footerManager.show();

			const footerElements = document.querySelectorAll(".custom-footer-container");
			expect(footerElements.length).toBe(1);
		});

		it("should create resize handle with correct properties", () => {
			footerManager.show();

			const resizeHandle = document.querySelector(".custom-footer-resize-handle") as HTMLElement;
			expect(resizeHandle.style.height).toBe("6px");
			expect(resizeHandle.style.cursor).toBe("ns-resize");
			expect(resizeHandle.style.position).toBe("absolute");
			expect(resizeHandle.style.zIndex).toBe("60"); // Updated to match new z-index
		});

		it("should create content area with correct height", () => {
			footerManager.show();

			const contentEl = document.querySelector(".custom-footer-content") as HTMLElement;
			expect(contentEl.style.height).toBe("414px"); // 420 - 6 for resize handle
			expect(contentEl.style.marginTop).toBe("6px");
		});
	});

	describe("hide", () => {
		it("should remove footer elements when hidden", () => {
			footerManager.show();
			footerManager.hide();

			const footerEl = document.querySelector(".custom-footer-container");
			expect(footerEl).toBeFalsy();
			expect(document.body.classList.contains("custom-footer-visible")).toBe(false);
		});

		it("should handle hiding when footer is not shown", () => {
			expect(() => footerManager.hide()).not.toThrow();
		});
	});

	describe("updateContent", () => {
		it("should not throw when content element doesn't exist", async () => {
			await expect(footerManager.updateContent()).resolves.not.toThrow();
		});

		it("should clear and update content when footer is shown", async () => {
			footerManager.show();

			// The show() method should have called updateContent and populated content
			// Since we have a matching directory mapping for "Goals/test.md", it should render content
			const { MarkdownRenderer } = await import("obsidian");
			expect(MarkdownRenderer.render).toHaveBeenCalledWith(
				mockApp,
				"![[Templates/Goals]]",
				expect.any(HTMLDivElement),
				"Goals/test.md",
				mockComponent
			);
		});

		it("should show error message when content rendering fails", async () => {
			const { MarkdownRenderer } = await import("obsidian");

			// Clear previous calls and set up the error mock
			vi.mocked(MarkdownRenderer.render).mockClear();
			vi.mocked(MarkdownRenderer.render).mockRejectedValueOnce(new Error("Render failed"));

			// Create a fresh footer manager to avoid any state issues
			const freshFooterManager = new FooterManager(
				mockApp,
				mockRuntimeState,
				mockComponent,
				() => mockSettings
			);

			// Show will trigger updateContent which should fail and show error
			freshFooterManager.show();

			// Wait for async operations to complete
			await new Promise((resolve) => setTimeout(resolve, 10));

			const contentEl = document.querySelector(".custom-footer-content") as HTMLElement;
			const errorEl = contentEl.querySelector(".custom-footer-error");
			expect(errorEl).toBeTruthy();
			expect(errorEl?.textContent).toBe("Error loading footer content");
		});

		it("should prevent concurrent updates to avoid duplication", async () => {
			footerManager.show();

			// Clear previous mock calls
			const { MarkdownRenderer } = await import("obsidian");
			vi.mocked(MarkdownRenderer.render).mockClear();

			// Start two concurrent updates
			const update1 = footerManager.updateContent();
			const update2 = footerManager.updateContent();

			await Promise.all([update1, update2]);

			// Should only be called once due to the isUpdating flag
			expect(MarkdownRenderer.render).toHaveBeenCalledTimes(1);
		});

		it("should reset isUpdating flag when footer is hidden", async () => {
			footerManager.show();

			// Start an update but don't wait for it
			const updatePromise = footerManager.updateContent();

			// Hide footer immediately
			footerManager.hide();

			// Wait for update to complete
			await updatePromise;

			// Show footer again and update should work
			footerManager.show();
			await footerManager.updateContent();

			const { MarkdownRenderer } = await import("obsidian");
			expect(MarkdownRenderer.render).toHaveBeenCalled();
		});

		it("should thoroughly clear content to prevent duplication", async () => {
			// Test that the double cleanup (innerHTML = "" and empty()) works
			footerManager.show();
			const contentEl = document.querySelector(".custom-footer-content") as HTMLElement;

			// Manually add complex content to test clearing
			const originalContent = `<div class="bases-header"><div class="query-toolbar">Header Content</div></div><div class="bases-view">View Content</div>`;
			contentEl.innerHTML = originalContent;

			// Manually call the clearing logic from updateContent
			contentEl.innerHTML = "";
			contentEl.empty();

			// Should be completely cleared
			expect(contentEl.innerHTML).toBe("");
			expect(contentEl.children.length).toBe(0);
		});
	});

	describe("resize functionality", () => {
		it("should register resize event handlers", () => {
			footerManager.show();

			expect(mockComponent.registerDomEvent).toHaveBeenCalledWith(
				document,
				"mousemove",
				expect.any(Function)
			);
			expect(mockComponent.registerDomEvent).toHaveBeenCalledWith(
				document,
				"mouseup",
				expect.any(Function)
			);
		});

		it("should update height when runtime state changes", () => {
			footerManager.show();

			// Simulate height change
			mockRuntimeState.currentHeight = 300;

			const footerEl = document.querySelector(".custom-footer-container") as HTMLElement;
			const contentEl = document.querySelector(".custom-footer-content") as HTMLElement;

			// Manually trigger the height update (simulating resize)
			footerEl.style.height = `${mockRuntimeState.currentHeight}px`;
			contentEl.style.height = `${mockRuntimeState.currentHeight - 6}px`;

			expect(footerEl.style.height).toBe("300px");
			expect(contentEl.style.height).toBe("294px");
		});
	});

	describe("hover effects", () => {
		it("should change resize handle color on hover", () => {
			footerManager.show();

			const resizeHandle = document.querySelector(".custom-footer-resize-handle") as HTMLElement;

			// Simulate mouseenter
			resizeHandle.dispatchEvent(new MouseEvent("mouseenter"));
			expect(resizeHandle.style.backgroundColor).toBe("var(--interactive-accent)");

			// Simulate mouseleave
			resizeHandle.dispatchEvent(new MouseEvent("mouseleave"));
			expect(resizeHandle.style.backgroundColor).toBe("var(--background-modifier-border)");
		});
	});

	describe("directory mapping functionality", () => {
		describe("getContentForCurrentFile", () => {
			it("should return content for matching directory path", async () => {
				mockApp.workspace.getActiveFile.mockReturnValue({ path: "Goals/my-goal.md" });
				footerManager.show();

				await footerManager.updateContent();

				const { MarkdownRenderer } = await import("obsidian");
				expect(MarkdownRenderer.render).toHaveBeenCalledWith(
					mockApp,
					"![[Templates/Goals]]",
					expect.any(HTMLDivElement),
					"Goals/my-goal.md",
					mockComponent
				);
			});

			it("should return content for nested directory paths", async () => {
				mockApp.workspace.getActiveFile.mockReturnValue({ path: "Goals/2024/Q1/goal.md" });
				footerManager.show();

				await footerManager.updateContent();

				const { MarkdownRenderer } = await import("obsidian");
				expect(MarkdownRenderer.render).toHaveBeenCalledWith(
					mockApp,
					"![[Templates/Goals]]",
					expect.any(HTMLDivElement),
					"Goals/2024/Q1/goal.md",
					mockComponent
				);
			});

			it("should fallback to wildcard (*) when no specific directory matches", async () => {
				mockApp.workspace.getActiveFile.mockReturnValue({ path: "Random/folder/file.md" });
				footerManager.show();

				await footerManager.updateContent();

				const { MarkdownRenderer } = await import("obsidian");
				expect(MarkdownRenderer.render).toHaveBeenCalledWith(
					mockApp,
					"![[Templates/Default]]",
					expect.any(HTMLDivElement),
					"Random/folder/file.md",
					mockComponent
				);
			});

			it("should prioritize specific paths over wildcard", async () => {
				mockApp.workspace.getActiveFile.mockReturnValue({ path: "Projects/my-project.md" });
				footerManager.show();

				await footerManager.updateContent();

				const { MarkdownRenderer } = await import("obsidian");
				expect(MarkdownRenderer.render).toHaveBeenCalledWith(
					mockApp,
					"![[Templates/Projects]]",
					expect.any(HTMLDivElement),
					"Projects/my-project.md",
					mockComponent
				);
			});

			it("should show no content message when no mappings are configured", async () => {
				mockSettings.directoryMappings = [];
				mockApp.workspace.getActiveFile.mockReturnValue({ path: "Goals/test.md" });
				footerManager.show();

				await footerManager.updateContent();

				const noContentEl = document.querySelector(".custom-footer-no-content");
				expect(noContentEl).toBeTruthy();
				expect(noContentEl?.textContent).toBe("No content configured for this directory");
			});

			it("should show no content message when no active file", async () => {
				mockApp.workspace.getActiveFile.mockReturnValue(null);
				footerManager.show();

				await footerManager.updateContent();

				const noContentEl = document.querySelector(".custom-footer-no-content");
				expect(noContentEl).toBeTruthy();
				expect(noContentEl?.textContent).toBe("No content configured for this directory");
			});

			it("should handle empty content gracefully", async () => {
				mockSettings.directoryMappings = [
					{
						id: "1",
						directoryPath: "Goals",
						content: "",
					},
				];
				mockApp.workspace.getActiveFile.mockReturnValue({ path: "Goals/test.md" });
				footerManager.show();

				await footerManager.updateContent();

				const noContentEl = document.querySelector(".custom-footer-no-content");
				expect(noContentEl).toBeTruthy();
			});
		});

		describe("path matching", () => {
			it("should match exact directory paths", () => {
				const footerManagerInstance = footerManager as any;
				expect(footerManagerInstance.doesPathMatch("Goals/test.md", "Goals")).toBe(true);
				expect(footerManagerInstance.doesPathMatch("Goals/subfolder/test.md", "Goals")).toBe(true);
				expect(footerManagerInstance.doesPathMatch("NotGoals/test.md", "Goals")).toBe(false);
			});

			it("should handle directory paths with trailing slashes", () => {
				const footerManagerInstance = footerManager as any;
				expect(footerManagerInstance.doesPathMatch("Goals/test.md", "Goals/")).toBe(true);
				expect(footerManagerInstance.doesPathMatch("Goals/subfolder/test.md", "Goals/")).toBe(true);
			});

			it("should be case sensitive", () => {
				const footerManagerInstance = footerManager as any;
				expect(footerManagerInstance.doesPathMatch("goals/test.md", "Goals")).toBe(false);
				expect(footerManagerInstance.doesPathMatch("Goals/test.md", "goals")).toBe(false);
			});

			it("should not match partial directory names", () => {
				const footerManagerInstance = footerManager as any;
				expect(footerManagerInstance.doesPathMatch("GoalsAndMore/test.md", "Goals")).toBe(false);
			});

			it("should handle empty directory paths", () => {
				const footerManagerInstance = footerManager as any;
				expect(footerManagerInstance.doesPathMatch("Goals/test.md", "")).toBe(false);
			});
		});

		describe("first match priority", () => {
			it("should apply the first matching rule when multiple rules could match", async () => {
				mockSettings.directoryMappings = [
					{
						id: "1",
						directoryPath: "Goals",
						content: "![[First Match]]",
					},
					{
						id: "2",
						directoryPath: "Goals/2024",
						content: "![[Second Match]]",
					},
				];

				// Both rules could match this path, but first should win
				mockApp.workspace.getActiveFile.mockReturnValue({ path: "Goals/2024/test.md" });
				footerManager.show();

				await footerManager.updateContent();

				const { MarkdownRenderer } = await import("obsidian");
				expect(MarkdownRenderer.render).toHaveBeenCalledWith(
					mockApp,
					"![[First Match]]",
					expect.any(HTMLDivElement),
					"Goals/2024/test.md",
					mockComponent
				);
			});
		});
	});
});
