import { type App, Modal, Notice, Setting } from "obsidian";
import { DateTime } from "luxon";
import type { CalendarBundle } from "../core/calendar-bundle";
import type { RecurrenceType } from "../types/recurring-event";

const WEEKDAYS = [
	{ label: "Sunday", value: 0 },
	{ label: "Monday", value: 1 },
	{ label: "Tuesday", value: 2 },
	{ label: "Wednesday", value: 3 },
	{ label: "Thursday", value: 4 },
	{ label: "Friday", value: 5 },
	{ label: "Saturday", value: 6 },
];

const RECURRENCE_TYPES: { value: RecurrenceType; label: string }[] = [
	{ value: "daily", label: "Daily" },
	{ value: "weekly", label: "Weekly" },
	{ value: "bi-weekly", label: "Bi-Weekly" },
	{ value: "monthly", label: "Monthly" },
	{ value: "bi-monthly", label: "Bi-Monthly" },
	{ value: "yearly", label: "Yearly" },
];

interface FrontmatterProperty {
	key: string;
	value: string;
}

interface RecurringEventFormData {
	title: string;
	allDay: boolean;
	date: string;
	startTime: string;
	endTime: string;
	recurrenceType: RecurrenceType;
	weekdays: number[];
	customProperties: FrontmatterProperty[];
}

export class RecurringEventCreateModal extends Modal {
	private formData: RecurringEventFormData;
	private bundle: CalendarBundle;
	private weekdayCheckboxes: Map<number, HTMLInputElement> = new Map();
	private weekdaysContainer!: HTMLElement;
	private timedFieldsContainer!: HTMLElement;
	private allDayFieldsContainer!: HTMLElement;
	private customPropertiesContainer!: HTMLElement;
	private customPropertyElements: HTMLElement[] = [];

	constructor(app: App, bundle: CalendarBundle) {
		super(app);
		this.bundle = bundle;
		
		// Initialize form data with defaults
		const now = DateTime.now();
		this.formData = {
			title: "",
			allDay: false,
			date: now.toFormat("yyyy-MM-dd"),
			startTime: now.toFormat("HH:mm"),
			endTime: now.plus({ hours: 1 }).toFormat("HH:mm"),
			recurrenceType: "weekly",
			weekdays: [now.weekday % 7], // Current day of week (convert from 1-7 to 0-6)
			customProperties: [],
		};
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("recurring-event-create-modal");

		// Modal title
		contentEl.createEl("h2", { text: "Create Recurring Event" });

		// Title field
		new Setting(contentEl)
			.setName("Title")
			.setDesc("Event title")
			.addText((text) =>
				text
					.setPlaceholder("Enter event title")
					.setValue(this.formData.title)
					.onChange((value) => {
						this.formData.title = value;
					})
			);

		// All Day checkbox
		new Setting(contentEl)
			.setName("All Day")
			.setDesc("Mark this as an all-day event")
			.addToggle((toggle) =>
				toggle
					.setValue(this.formData.allDay)
					.onChange((value) => {
						this.formData.allDay = value;
						this.updateTimeFieldsVisibility();
					})
			);

		// Date field (always visible)
		new Setting(contentEl)
			.setName("Start Date")
			.setDesc("When does this recurring event start?")
			.addText((text) =>
				text
					.setPlaceholder("YYYY-MM-DD")
					.setValue(this.formData.date)
					.onChange((value) => {
						this.formData.date = value;
					})
					.inputEl.setAttribute("type", "date")
			);

		// Timed event fields (Start Time + End Time)
		this.timedFieldsContainer = contentEl.createDiv("timed-fields-container");
		
		new Setting(this.timedFieldsContainer)
			.setName("Start Time")
			.setDesc("Start time for the event")
			.addText((text) =>
				text
					.setPlaceholder("HH:MM")
					.setValue(this.formData.startTime)
					.onChange((value) => {
						this.formData.startTime = value;
					})
					.inputEl.setAttribute("type", "time")
			);

		new Setting(this.timedFieldsContainer)
			.setName("End Time")
			.setDesc("End time for the event")
			.addText((text) =>
				text
					.setPlaceholder("HH:MM")
					.setValue(this.formData.endTime)
					.onChange((value) => {
						this.formData.endTime = value;
					})
					.inputEl.setAttribute("type", "time")
			);

		// Recurrence Type dropdown
		new Setting(contentEl)
			.setName("Recurrence")
			.setDesc("How often should this event repeat?")
			.addDropdown((dropdown) => {
				for (const type of RECURRENCE_TYPES) {
					dropdown.addOption(type.value, type.label);
				}
				dropdown
					.setValue(this.formData.recurrenceType)
					.onChange((value) => {
						this.formData.recurrenceType = value as RecurrenceType;
						this.updateWeekdaysVisibility();
					});
			});

		// Weekdays selection (only for weekly/bi-weekly)
		this.weekdaysContainer = contentEl.createDiv("weekdays-container");
		const weekdaysSetting = new Setting(this.weekdaysContainer)
			.setName("Repeat on")
			.setDesc("Select which days of the week");

		const weekdaysControl = weekdaysSetting.controlEl.createDiv("weekdays-checkboxes");
		
		for (const day of WEEKDAYS) {
			const label = weekdaysControl.createEl("label", {
				cls: "weekday-checkbox-label",
			});
			
			const checkbox = label.createEl("input", {
				type: "checkbox",
			});
			checkbox.checked = this.formData.weekdays.includes(day.value);
			checkbox.addEventListener("change", () => {
				if (checkbox.checked) {
					if (!this.formData.weekdays.includes(day.value)) {
						this.formData.weekdays.push(day.value);
					}
				} else {
					this.formData.weekdays = this.formData.weekdays.filter(
						(d) => d !== day.value
					);
				}
			});
			
			this.weekdayCheckboxes.set(day.value, checkbox);
			
			label.createSpan({
				text: day.label.substring(0, 3), // Sun, Mon, Tue, etc.
				cls: "weekday-label",
			});
		}

		// Custom frontmatter properties section
		contentEl.createEl("h3", { 
			text: "Additional Properties",
			cls: "custom-properties-header" 
		});
		
		contentEl.createEl("p", {
			text: "Add custom frontmatter properties to the recurring event",
			cls: "setting-item-description",
		});

		this.customPropertiesContainer = contentEl.createDiv("custom-properties-container");

		// Add property button
		new Setting(contentEl)
			.addButton((button) =>
				button
					.setButtonText("Add Property")
					.setIcon("plus")
					.onClick(() => {
						this.addCustomProperty();
					})
			);

		// Action buttons
		const buttonContainer = contentEl.createDiv("modal-button-container");
		
		buttonContainer.createEl("button", {
			text: "Create",
			cls: "mod-cta",
		}).addEventListener("click", () => {
			this.createRecurringEvent();
		});

		buttonContainer.createEl("button", {
			text: "Cancel",
		}).addEventListener("click", () => {
			this.close();
		});

		// Initial visibility updates
		this.updateTimeFieldsVisibility();
		this.updateWeekdaysVisibility();

		// Add initial custom property field
		this.addCustomProperty();
	}

	private updateTimeFieldsVisibility(): void {
		if (this.formData.allDay) {
			this.timedFieldsContainer.style.display = "none";
		} else {
			this.timedFieldsContainer.style.display = "block";
		}
	}

	private updateWeekdaysVisibility(): void {
		const showWeekdays = 
			this.formData.recurrenceType === "weekly" ||
			this.formData.recurrenceType === "bi-weekly";
		
		this.weekdaysContainer.style.display = showWeekdays ? "block" : "none";
	}

	private addCustomProperty(): void {
		const propertyIndex = this.formData.customProperties.length;
		const property: FrontmatterProperty = { key: "", value: "" };
		this.formData.customProperties.push(property);

		const propertyEl = this.customPropertiesContainer.createDiv("custom-property-item");
		this.customPropertyElements.push(propertyEl);

		const keySetting = new Setting(propertyEl)
			.setName("Property Key")
			.addText((text) =>
				text
					.setPlaceholder("e.g., status, priority, tags")
					.setValue(property.key)
					.onChange((value) => {
						property.key = value;
					})
			);

		const valueSetting = new Setting(propertyEl)
			.setName("Property Value")
			.addText((text) =>
				text
					.setPlaceholder("Property value")
					.setValue(property.value)
					.onChange((value) => {
						property.value = value;
					})
			)
			.addButton((button) =>
				button
					.setIcon("trash")
					.setTooltip("Remove property")
					.onClick(() => {
						this.removeCustomProperty(propertyIndex);
					})
			);
	}

	private removeCustomProperty(index: number): void {
		this.formData.customProperties.splice(index, 1);
		
		const elementToRemove = this.customPropertyElements[index];
		if (elementToRemove) {
			elementToRemove.remove();
		}
		this.customPropertyElements.splice(index, 1);
	}

	private async createRecurringEvent(): Promise<void> {
		// Validation
		if (!this.formData.title.trim()) {
			new Notice("Please enter a title for the recurring event");
			return;
		}

		if (!this.formData.date) {
			new Notice("Please select a start date");
			return;
		}

		if (
			(this.formData.recurrenceType === "weekly" ||
				this.formData.recurrenceType === "bi-weekly") &&
			this.formData.weekdays.length === 0
		) {
			new Notice("Please select at least one day of the week");
			return;
		}

		try {
			const settings = this.bundle.settingsStore.currentSettings;
			
			// Generate unique rruleId
			const rruleId = `rrule-${DateTime.now().toFormat("yyyyMMddHHmmss")}`;
			
			// Create file name
			const sanitizedTitle = this.formData.title.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-");
			const fileName = `${sanitizedTitle}.md`;
			const filePath = settings.directory ? `${settings.directory}/${fileName}` : fileName;

			// Check if file already exists
			if (this.app.vault.getAbstractFileByPath(filePath)) {
				new Notice(`File ${fileName} already exists`);
				return;
			}

			// Create the recurring event node file
			const file = await this.app.vault.create(filePath, "");

			// Build frontmatter object
			const frontmatter: Record<string, unknown> = {};

			// Set title
			if (settings.titleProp) {
				frontmatter[settings.titleProp] = this.formData.title;
			}

			// Set rruleId
			frontmatter[settings.rruleIdProp] = rruleId;

			// Set recurrence type
			frontmatter[settings.rruleProp] = this.formData.recurrenceType;

			// Set recurrence spec (weekdays) for weekly/bi-weekly
			if (
				(this.formData.recurrenceType === "weekly" ||
					this.formData.recurrenceType === "bi-weekly") &&
				this.formData.weekdays.length > 0
			) {
				frontmatter[settings.rruleSpecProp] = this.formData.weekdays.sort();
			}

			// Set allDay property
			if (settings.allDayProp) {
				frontmatter[settings.allDayProp] = this.formData.allDay;
			}

			// Set date/time properties
			if (this.formData.allDay) {
				// All-day event: use dateProp
				frontmatter[settings.dateProp] = this.formData.date;
			} else {
				// Timed event: use startProp and endProp
				const startDateTime = DateTime.fromFormat(
					`${this.formData.date}T${this.formData.startTime}`,
					"yyyy-MM-dd'T'HH:mm"
				);
				const endDateTime = DateTime.fromFormat(
					`${this.formData.date}T${this.formData.endTime}`,
					"yyyy-MM-dd'T'HH:mm"
				);

				frontmatter[settings.startProp] = startDateTime.toISO();
				frontmatter[settings.endProp] = endDateTime.toISO();
			}

			// Add custom frontmatter properties
			for (const prop of this.formData.customProperties) {
				if (prop.key.trim() && prop.value.trim()) {
					frontmatter[prop.key.trim()] = prop.value.trim();
				}
			}

			// Use processFrontMatter to set all properties
			await this.app.fileManager.processFrontMatter(file, (fm) => {
				for (const [key, value] of Object.entries(frontmatter)) {
					fm[key] = value;
				}
			});

			new Notice(`Recurring event "${this.formData.title}" created successfully`);
			this.close();
		} catch (error) {
			console.error("Error creating recurring event:", error);
			new Notice("Failed to create recurring event");
		}
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
		this.weekdayCheckboxes.clear();
		this.customPropertyElements = [];
	}
}
