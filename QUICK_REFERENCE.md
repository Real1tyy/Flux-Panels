# Quick Reference - Recurring Event Creation

## 📥 Files to Copy

```
📁 Your Prisma Calendar Project
├── src/
│   └── components/
│       └── recurring-event-create-modal.ts  ← Copy this
└── styles.css  ← Add styles from recurring-event-modal-styles.css
```

## 🔧 Code Changes

### 1. calendar-view.ts - Add Import
```typescript
import { RecurringEventCreateModal } from "./recurring-event-create-modal";
```

### 2. calendar-view.ts - Add Method
```typescript
private openRecurringEventModal(): void {
	new RecurringEventCreateModal(this.app, this.bundle).open();
}
```

### 3. calendar-view.ts - Update Toolbar (Line ~158)
```typescript
// Change from:
headerToolbar.right = `skippedEvents batchSelect ${viewSwitchers}`;

// To:
headerToolbar.right = `skippedEvents createRecurring batchSelect ${viewSwitchers}`;

// Add button (Line ~169):
customButtons.createRecurring = {
	text: "New Recurring",
	click: () => this.openRecurringEventModal(),
	className: "create-recurring-btn",
};
```

## 🎨 Button Location

```
┌─────────────────────────────────────────────────────────┐
│ ← → Today [Zoom]    Calendar Title    [0 skipped]       │
│                                        [New Recurring] ← │
│                                        [Batch Select]    │
│                                        Month Week Day... │
└─────────────────────────────────────────────────────────┘
```

## 📝 Form Fields

| Field | Type | Visibility | Required |
|-------|------|------------|----------|
| Title | Text | Always | ✓ |
| All Day | Toggle | Always | - |
| Start Date | Date | Always | ✓ |
| Start Time | Time | !allDay | - |
| End Time | Time | !allDay | - |
| Recurrence | Dropdown | Always | ✓ |
| Weekdays | Checkboxes | weekly/bi-weekly | ✓* |
| Custom Props | Key-Value | Always | - |

*Required only for weekly/bi-weekly

## 🔄 Recurrence Types

```typescript
"daily"      // Every day
"weekly"     // Every week (needs weekdays)
"bi-weekly"  // Every 2 weeks (needs weekdays)
"monthly"    // Every month
"bi-monthly" // Every 2 months
"yearly"     // Every year
```

## 📋 Frontmatter Structure

### All-Day Event
```yaml
---
title: "Event Title"
rruleId: "rrule-YYYYMMDDHHMMSS"
rrule: "weekly"
rruleSpec: [1, 3, 5]  # If weekly/bi-weekly
allDay: true
date: "YYYY-MM-DD"
# ... custom properties
---
```

### Timed Event
```yaml
---
title: "Event Title"
rruleId: "rrule-YYYYMMDDHHMMSS"
rrule: "weekly"
rruleSpec: [1, 3, 5]  # If weekly/bi-weekly
allDay: false
start: "YYYY-MM-DDTHH:mm:ss.sssZ"
end: "YYYY-MM-DDTHH:mm:ss.sssZ"
# ... custom properties
---
```

## 🗓️ Weekday Values

```
Sunday    = 0
Monday    = 1
Tuesday   = 2
Wednesday = 3
Thursday  = 4
Friday    = 5
Saturday  = 6
```

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Modal doesn't open | Check import path and method exists |
| Button not visible | Verify toolbar code changes |
| Weekdays not working | Must select weekday for weekly/bi-weekly |
| File not created | Check directory setting and permissions |
| Instances not appearing | Verify RecurringEventManager is running |

## ✅ Quick Test

1. Click "New Recurring" button
2. Enter title: "Test Event"
3. Select recurrence: "Weekly"
4. Check weekdays: Monday, Wednesday, Friday
5. Add property: `status` = `test`
6. Click "Create"
7. Check file was created
8. Verify frontmatter is correct
9. Check calendar for instances

## 🎯 Validation Rules

```typescript
// Title required
if (!title.trim()) {
  ❌ "Please enter a title"
}

// Date required
if (!date) {
  ❌ "Please select a start date"
}

// Weekdays required for weekly/bi-weekly
if ((rrule === "weekly" || rrule === "bi-weekly") && weekdays.length === 0) {
  ❌ "Please select at least one day"
}
```

## 🔑 Key Settings Props

```typescript
settings.titleProp      // e.g., "title"
settings.rruleIdProp    // e.g., "rruleId"
settings.rruleProp      // e.g., "rrule"
settings.rruleSpecProp  // e.g., "rruleSpec"
settings.allDayProp     // e.g., "allDay"
settings.dateProp       // e.g., "date"
settings.startProp      // e.g., "start"
settings.endProp        // e.g., "end"
settings.directory      // Target folder
```

## 💡 Usage Tips

**Best Practices:**
- Use descriptive titles
- Add custom properties for filtering/searching
- Set meaningful recurrence patterns
- Test with one instance first

**Custom Property Ideas:**
```yaml
status: "active"
priority: "high"
project: "Q4-Goals"
team: "engineering"
type: "meeting"
location: "Office"
zoom-link: "https://..."
attendees: "team-leads"
```

## 🚀 Workflow

```
Click Button → Fill Form → Validate → Create File
                                          ↓
                                   Set Frontmatter
                                          ↓
                                   Indexer Detects
                                          ↓
                              RecurringEventManager
                                          ↓
                            Create Physical Instances
                                          ↓
                              Display on Calendar
```

## 📞 Need Help?

1. Check INTEGRATION_GUIDE.md for detailed instructions
2. See IMPLEMENTATION_SUMMARY.md for technical details
3. Look for console errors
4. Verify settings are configured
5. Check RecurringEventManager logs

---

**Happy recurring! 🎉**
