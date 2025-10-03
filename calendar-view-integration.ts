// ================================================================
// INTEGRATION CODE FOR calendar-view.ts
// ================================================================
// Add these changes to your existing calendar-view.ts file

// 1. ADD THIS IMPORT at the top with other imports:
import { RecurringEventCreateModal } from "./recurring-event-create-modal";

// 2. ADD THIS METHOD to the CalendarView class:
private openRecurringEventModal(): void {
	new RecurringEventCreateModal(this.app, this.bundle).open();
}

// 3. MODIFY the updateToolbar() method to include the "Create Recurring Event" button
// Add this to the headerToolbar configuration:

// In the non-batch-selection mode section (around line 158), change:
// FROM:
//   headerToolbar.right = `skippedEvents batchSelect ${viewSwitchers}`;

// TO:
headerToolbar.right = `skippedEvents createRecurring batchSelect ${viewSwitchers}`;

// And add this custom button definition (around line 169, with other customButtons):
customButtons.createRecurring = {
	text: "New Recurring",
	click: () => this.openRecurringEventModal(),
	className: "create-recurring-btn",
};

// ================================================================
// COMPLETE UPDATED updateToolbar() METHOD
// (Replace your existing updateToolbar method with this)
// ================================================================

private updateToolbar(): void {
	if (!this.calendar || !this.batchSelectionManager) return;

	const bsm = this.batchSelectionManager;
	const inSelectionMode = bsm.isInSelectionMode();

	const headerToolbar: any = {
		left: "prev,next today zoomLevel",
		center: "title",
		right: "", // Will be constructed dynamically
	};

	const customButtons: Record<string, any> = {
		zoomLevel: this.zoomManager.createZoomLevelButton(),
	};

	const viewSwitchers = "dayGridMonth,timeGridWeek,timeGridDay,listWeek";

	if (inSelectionMode) {
		const batchButtons =
			"batchCounter batchSelectAll batchClear batchDuplicate batchCloneNext batchClonePrev batchMoveNext batchMovePrev batchOpenAll batchSkip batchDelete batchExit";
		headerToolbar.right = `${batchButtons} ${viewSwitchers}`;

		// Define all batch buttons
		customButtons.batchCounter = {
			text: bsm.getSelectionCountText(),
			className: "batch-action-btn batch-counter",
		};
		customButtons.batchSelectAll = {
			text: "Select All",
			click: () => bsm.selectAllVisibleEvents(),
			className: "batch-action-btn select-all-btn",
		};
		customButtons.batchClear = {
			text: "Clear",
			click: () => bsm.clearSelection(),
			className: "batch-action-btn clear-btn",
		};
		customButtons.batchDuplicate = {
			text: "Duplicate",
			click: () => bsm.executeDuplicate(),
			className: "batch-action-btn duplicate-btn",
		};
		customButtons.batchExit = {
			text: "Exit",
			click: () => this.toggleBatchSelection(),
			className: "batch-action-btn exit-btn",
		};
		customButtons.batchDelete = {
			text: "Delete",
			click: () => bsm.executeDelete(),
			className: "batch-action-btn delete-btn",
		};
		customButtons.batchCloneNext = {
			text: "Clone Next",
			click: () => bsm.executeClone(1),
			className: "batch-action-btn clone-next-btn",
		};
		customButtons.batchClonePrev = {
			text: "Clone Prev",
			click: () => bsm.executeClone(-1),
			className: "batch-action-btn clone-prev-btn",
		};
		customButtons.batchMoveNext = {
			text: "Move Next",
			click: () => bsm.executeMove(1),
			className: "batch-action-btn move-next-btn",
		};
		customButtons.batchMovePrev = {
			text: "Move Prev",
			click: () => bsm.executeMove(-1),
			className: "batch-action-btn move-prev-btn",
		};
		customButtons.batchOpenAll = {
			text: "Open All",
			click: () => bsm.executeOpenAll(),
			className: "batch-action-btn open-all-btn",
		};
		customButtons.batchSkip = {
			text: "Skip",
			click: () => bsm.executeSkip(),
			className: "batch-action-btn skip-btn",
		};
	} else {
		// UPDATED: Added createRecurring button
		headerToolbar.right = `skippedEvents createRecurring batchSelect ${viewSwitchers}`;
		
		// NEW: Create Recurring Event button
		customButtons.createRecurring = {
			text: "New Recurring",
			click: () => this.openRecurringEventModal(),
			className: "create-recurring-btn",
		};
		
		customButtons.batchSelect = {
			text: "Batch Select",
			click: () => this.toggleBatchSelection(),
		};
		
		// Preserve button text from previous update (important for batch mode toggle)
		const currentButton = this.calendar.getOption("customButtons")?.skippedEvents;
		const currentText = currentButton?.text || "0 skipped";
		customButtons.skippedEvents = {
			text: currentText,
			click: () => this.showSkippedEventsModal(),
		};
	}

	this.calendar.setOption("headerToolbar", headerToolbar);
	this.calendar.setOption("customButtons", customButtons);

	// Preserve button visibility based on current text
	setTimeout(() => {
		const btn = this.container.querySelector(".fc-skippedEvents-button");
		if (btn instanceof HTMLElement) {
			const currentText = btn.textContent || "";
			const hasSkipped = !currentText.startsWith("0 ");
			btn.style.display = hasSkipped ? "inline-block" : "none";
		}
	}, 0);
}
