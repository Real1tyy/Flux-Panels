# Recurring Event Creation Modal - Integration Guide

This guide explains how to integrate the new recurring event creation feature into your Prisma Calendar codebase.

## 📁 Files Created

1. **`recurring-event-create-modal.ts`** - Main modal component
2. **`calendar-view-integration.ts`** - Integration code for calendar-view.ts
3. **`recurring-event-modal-styles.css`** - CSS styling for the modal

## 🚀 Integration Steps

### Step 1: Add the Modal File

Copy `recurring-event-create-modal.ts` to your source directory:

```
src/components/recurring-event-create-modal.ts
```

### Step 2: Update calendar-view.ts

Open `src/components/calendar-view.ts` and make the following changes:

#### 2.1 Add Import

At the top of the file, add the import for the new modal:

```typescript
import { RecurringEventCreateModal } from "./recurring-event-create-modal";
```

#### 2.2 Add Method to CalendarView Class

Add this method to the `CalendarView` class:

```typescript
private openRecurringEventModal(): void {
	new RecurringEventCreateModal(this.app, this.bundle).open();
}
```

#### 2.3 Update the updateToolbar() Method

Find the `updateToolbar()` method and make these changes:

**In the non-batch-selection mode section (around line 158):**

Change from:
```typescript
headerToolbar.right = `skippedEvents batchSelect ${viewSwitchers}`;
```

To:
```typescript
headerToolbar.right = `skippedEvents createRecurring batchSelect ${viewSwitchers}`;
```

**Add the custom button definition (around line 169):**

```typescript
customButtons.createRecurring = {
	text: "New Recurring",
	click: () => this.openRecurringEventModal(),
	className: "create-recurring-btn",
};
```

### Step 3: Add Styles

Copy the contents of `recurring-event-modal-styles.css` and add it to your main `styles.css` file.

## ✨ Features

### Form Fields

1. **Title** - Text input for event title
2. **All Day Toggle** - Switch between all-day and timed events
3. **Start Date** - Date picker for when recurrence starts
4. **Start/End Time** - Time pickers (only shown for timed events)
5. **Recurrence Type** - Dropdown with options:
   - Daily
   - Weekly
   - Bi-Weekly
   - Monthly
   - Bi-Monthly
   - Yearly
6. **Weekdays Selection** - Checkboxes for selecting which days (only shown for weekly/bi-weekly)
7. **Custom Properties** - Dynamic key-value pairs for additional frontmatter

### Behavior

- **All-Day Events**: When toggled on, hides time fields and uses the `dateProp` in frontmatter
- **Timed Events**: Shows start/end time fields and uses `startProp`/`endProp` in frontmatter
- **Weekday Selection**: Only visible for weekly and bi-weekly recurrence types
- **Dynamic Properties**: Users can add unlimited custom frontmatter properties with the "Add Property" button
- **Validation**: Ensures required fields are filled before creating the event

### Generated Frontmatter

The modal creates a recurring event node with the following frontmatter structure:

**For All-Day Events:**
```yaml
---
title: "Team Meeting"
rruleId: "rrule-20251003154500"
rrule: "weekly"
rruleSpec: [1, 3, 5]  # Monday, Wednesday, Friday
allDay: true
date: "2025-10-03"
status: "active"
priority: "high"
---
```

**For Timed Events:**
```yaml
---
title: "Team Meeting"
rruleId: "rrule-20251003154500"
rrule: "weekly"
rruleSpec: [1, 3, 5]  # Monday, Wednesday, Friday
allDay: false
start: "2025-10-03T14:00:00.000Z"
end: "2025-10-03T15:00:00.000Z"
status: "active"
priority: "high"
---
```

## 🎨 UI Components

### Toolbar Button

A prominent "New Recurring" button appears in the calendar toolbar between the "Skipped Events" and "Batch Select" buttons.

### Modal Layout

- **Clean, modern design** with proper spacing
- **Responsive** - adapts to different screen sizes
- **Accessible** - keyboard navigation support
- **Themed** - uses Obsidian's CSS variables for consistent theming

### Weekday Selector

Interactive checkboxes for each day of the week with:
- Visual feedback on selection
- Abbreviated day names (Sun, Mon, Tue, etc.)
- Highlight effect for selected days

### Custom Properties

- Add/remove property fields dynamically
- Each property has key and value inputs
- Trash icon to remove individual properties
- Properties are validated before file creation

## 🔧 Integration with RecurringEventManager

The modal creates files that are automatically detected by your existing `RecurringEventManager`:

1. **File Creation**: Creates a markdown file in the configured directory
2. **Frontmatter Setup**: Uses `processFrontMatter` API (following best practices)
3. **RRule ID**: Generates unique `rruleId` using timestamp format
4. **Properties**: Sets all required properties (`rrule`, `rruleSpec`, dates, etc.)
5. **Custom Data**: Includes user-defined frontmatter properties

The `RecurringEventManager` will:
- Detect the new recurring event node via the indexer
- Parse the `rrule` and `rruleSpec` properties
- Generate physical instances based on `futureInstancesCount` setting
- Create virtual instances for calendar display

## 🧪 Testing

After integration, test the following:

1. **Create All-Day Recurring Event**
   - Open modal
   - Enter title
   - Enable "All Day"
   - Select weekly recurrence
   - Choose weekdays
   - Add custom properties
   - Create event
   - Verify file creation with correct frontmatter

2. **Create Timed Recurring Event**
   - Open modal
   - Enter title
   - Keep "All Day" disabled
   - Set start/end times
   - Select recurrence type
   - Create event
   - Verify file creation with ISO timestamps

3. **Weekday Selection**
   - Test weekly/bi-weekly with multiple weekdays
   - Verify `rruleSpec` array is correct
   - Test other recurrence types (should not show weekdays)

4. **Custom Properties**
   - Add multiple custom properties
   - Remove properties
   - Verify they appear in frontmatter
   - Test with empty properties (should be skipped)

5. **Validation**
   - Try creating without title (should show notice)
   - Try creating without date (should show notice)
   - Try weekly without weekdays (should show notice)

6. **RecurringEventManager Integration**
   - Verify physical instances are created
   - Check that instances appear on calendar
   - Verify virtual instances are generated
   - Test editing instances

## 🐛 Troubleshooting

### Modal doesn't open
- Check that import path is correct
- Verify `CalendarBundle` is passed correctly
- Check console for errors

### Button doesn't appear
- Verify `updateToolbar()` changes were applied
- Check that toolbar is being rendered
- Inspect DOM to see if button exists but is hidden

### Frontmatter not created correctly
- Verify settings props (`rruleProp`, `rruleIdProp`, etc.) are configured
- Check that `processFrontMatter` is working
- Look for errors in console during file creation

### Styling issues
- Ensure CSS was added to main styles.css
- Check for CSS conflicts
- Verify CSS variables are defined in theme

### RecurringEventManager doesn't detect events
- Check that `rruleIdProp` matches in settings
- Verify file is created in the configured directory
- Check indexer is running and detecting files
- Look for errors in RecurringEventManager console logs

## 📚 Code Architecture

### Modal Component (`RecurringEventCreateModal`)

- **Extends**: `obsidian.Modal`
- **Dependencies**: `CalendarBundle`, Luxon `DateTime`
- **State Management**: Uses internal `formData` object
- **Validation**: Pre-creation validation with user feedback
- **API Usage**: Uses `processFrontMatter` for all frontmatter operations (best practice)

### Integration Pattern

Follows the existing pattern used by `EventCreateModal`:
- Modal opened by toolbar button
- Calendar bundle provides app and settings access
- File creation with frontmatter setup
- Notice feedback for user

### CSS Architecture

- Uses Obsidian CSS variables for theming
- Mobile-responsive with media queries
- Modular class naming (BEM-like)
- Smooth transitions for better UX

## 🎯 Future Enhancements

Potential improvements:

1. **Preview**: Show a preview of upcoming instances before creating
2. **Templates**: Allow saving/loading recurring event templates
3. **Bulk Creation**: Create multiple recurring events at once
4. **Advanced Recurrence**: Support for more complex RRule patterns
5. **Edit Existing**: Extend modal to edit existing recurring events
6. **Import/Export**: Import recurring events from iCal or other formats

## 📝 Notes

- The modal creates the **master recurring event node** only
- Physical instances are created automatically by `RecurringEventManager`
- The `rruleId` is generated using timestamp format: `rrule-YYYYMMDDHHmmss`
- Custom properties are optional and validated (empty ones are skipped)
- The modal follows all Obsidian API best practices (uses `processFrontMatter`)
- Styling is theme-aware and will adapt to light/dark modes

## ✅ Checklist

After integration, verify:

- [ ] Modal file is in correct location
- [ ] Import is added to calendar-view.ts
- [ ] Method is added to CalendarView class
- [ ] Toolbar is updated with new button
- [ ] CSS is added to styles.css
- [ ] Modal opens when button clicked
- [ ] All form fields work correctly
- [ ] File creation works
- [ ] Frontmatter is correct
- [ ] RecurringEventManager detects new events
- [ ] Physical instances are created
- [ ] Virtual instances appear on calendar
- [ ] Styling looks good in light/dark themes
- [ ] Mobile layout works (if applicable)

---

**Need help?** Check the console for errors, verify settings are configured correctly, and ensure all dependencies are available.
