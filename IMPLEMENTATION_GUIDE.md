# Implementation Guide - Modular Application Structure

## Quick Start

1. **Open the application**: Open `spreadsheet-viewer.html` in a browser
2. **No build process needed**: All files load directly
3. **No dependencies to install**: Uses CDN libraries only

## File Structure Overview

```
Selections-App/
├── spreadsheet-viewer.html          # Main HTML file (clean, no scripts)
├── index.html                       # Alternative entry point (if used)
├── css/
│   └── styles.css                   # All styling (no changes)
├── js/
│   ├── app.js                       # Main application (~650 lines)
│   └── modules/
│       ├── state.js                 # State management
│       ├── ui.js                    # UI element references
│       ├── constants.js             # (existing, not used in refactoring)
│       ├── events.js                # (existing, not used in refactoring)
│       ├── export.js                # (existing, not used in refactoring)
│       ├── fileHandler.js           # (existing, not used in refactoring)
│       ├── roomManager.js           # (existing, not used in refactoring)
│       ├── select2-init.js          # (existing, not used in refactoring)
│       ├── storage.js               # (existing, not used in refactoring)
│       └── index.html               # (existing, not used in refactoring)
├── REFACTORING_NOTES.md             # Detailed refactoring documentation
└── README.md                        # (this file)
```

## Application Flow

### 1. Page Load
```
HTML loads → CSS applies → External libraries loaded (XLSX, ExcelJS, FileSaver)
↓
state.js: State object created and initializeState() executes
↓
ui.js: UI module loaded (getElements function available)
↓
app.js: DOMContentLoaded listener fires → initApp() executes
```

### 2. initApp() Flow
```
setupEventListenersInternal()    → All DOM listeners registered
  ↓
loadSavedState()                  → Check localStorage
  ↓
restoreState() (if found)         → Restore previous session
  ↓
updateRowDropdown()               → Populate row selector
updateRoomDropdown()              → Populate room selector
updateExportButtonState()         → Update button state
```

### 3. User Interactions
```
User uploads file
  ↓
handleFileUpload()
  ↓
Parse with XLSX → Store in State.spreadsheetData
  ↓
updateRowDropdown()  → Show available rows
  ↓
User selects item
  ↓
handleRowSelect() → displayRowDetails()
  ↓
User assigns to room
  ↓
handleConfirmSelection() or handleAssignToRoom()
  ↓
State.selectedItems updated
  ↓
renderSelectedItems() → Show grouped by room
  ↓
saveState() → Persist to localStorage
```

## Key Data Structures

### State Object (state.js)
```javascript
State = {
  // Spreadsheet data
  spreadsheetData: [{_rowNumber: 2, col1: "value", col2: "value"}, ...],
  headers: ["Column 1", "Column 2", ...],
  
  // Room configuration
  beds: 3,
  baths: 2,
  dynamicBedrooms: ["Bedroom 1", "Bedroom 2", "Bedroom 3"],
  dynamicBaths: ["Bath 1", "Bath 2"],
  selectedExtraRooms: ["Office", "Living"],
  rooms: ["Bedroom 1", "Bedroom 2", "Bedroom 3", "Bath 1", "Bath 2", "Office", "Living"],
  
  // House configuration
  houseName: "Example House",
  floorPlan: "Olympia",
  
  // Selection tracking
  selectedItems: [{_rowNumber: 2, room: "Bedroom 1", subsection: "Subsection 1", ...}, ...],
  currentSelectedRow: {_rowNumber: 2, col1: "value", ...} or null,
  activeRoomTab: "Bedroom 1",
  
  // UI state
  fileMode: "scratch"
}
```

### localStorage Format
```javascript
{
  "selectionAppState": {
    "selectedItems": [...],
    "spreadsheetData": [...],
    "headers": [...],
    "houseName": "",
    "floorPlan": "",
    "beds": 0,
    "baths": 0,
    "dynamicBedrooms": [],
    "dynamicBaths": [],
    "selectedExtraRooms": [],
    "activeRoomTab": null
  }
}
```

## Function Organization in app.js

### Initialization
- `initApp()` - Main entry point
- `loadSavedState()` - Retrieve from localStorage
- `restoreState()` - Populate State from saved
- `saveState()` - Persist State to localStorage
- `resetState()` - Clear all data

### File Handling
- `handleFileUpload()` - Process uploaded Excel file

### Configuration
- `handleConfirmHouse()` - Set house name/floor plan
- `setHouseNameLocked()` - Lock/unlock house name
- `handleSetBedsBaths()` - Set room configuration
- `setRoomConfigLocked()` - Lock/unlock room config
- `getSelectedExtraRooms()` - Get toggle button values

### Selection & Display
- `updateRowDropdown()` - Populate row selector
- `updateRoomDropdown()` - Populate room selector
- `handleRowSelect()` - Handle row selection change
- `displayRowDetails()` - Show row information
- `handleConfirmSelection()` - Add to current room
- `handleAssignToRoom()` - Add to specific room
- `updateRoomsArray()` - Update combined room list
- `renderSelectedItems()` - Display grouped selections

### Export
- `handleExport()` - Create Excel workbook and download
- `updateExportButtonState()` - Enable/disable export button

### Utilities
- `showError()` - Display error message to user
- `setupEventListenersInternal()` - Attach all DOM listeners
- `clearAllState()` - Reset everything with confirmation
- `createItemElement()` - Create DOM element for item
- `setSelectedExtraRoomsInUI()` - Update toggle buttons

## Error Handling

All functions check for element existence:
```javascript
const element = document.getElementById('elementId');
if (!element) return;  // Gracefully handle missing elements
```

All user-facing errors use `showError()`:
```javascript
showError('User-friendly error message');
// Auto-clears after 2 seconds
```

## State Management Best Practices

### ✅ DO
```javascript
// Save state after changes
State.houseName = "New House";
saveState();

// Check State values before using
if (State.selectedItems.length > 0) { ... }

// Create new objects for complex updates
State.selectedItems.push({ ...State.currentSelectedRow, room: "Office" });
```

### ❌ DON'T
```javascript
// Don't mutate nested objects directly
State.selectedItems[0].room = "new room";  // Works but not predictable

// Don't assume State values exist
const count = State.selectedItems.length;  // Use: State.selectedItems?.length || 0

// Don't update UI without updating State
document.getElementById('roomTabs').innerHTML = ...;  // State won't match UI
```

## Testing the Refactoring

### Manual Testing Checklist
1. **File Upload**
   - [ ] Click "Select Data Source"
   - [ ] Upload an Excel file
   - [ ] Verify file name displays
   - [ ] Verify row dropdown populates

2. **Configuration**
   - [ ] Enter house name, click Confirm
   - [ ] Select floor plan
   - [ ] Enter beds/baths, click Set
   - [ ] Toggle extra rooms

3. **Selection**
   - [ ] Select row from dropdown
   - [ ] Verify details display
   - [ ] Assign to room
   - [ ] See item in room tab

4. **Persistence**
   - [ ] Reload page
   - [ ] Verify state restored
   - [ ] All selections still there

5. **Export**
   - [ ] Add selections
   - [ ] Click Export
   - [ ] Verify Excel file downloads
   - [ ] Check file contents

6. **Error Handling**
   - [ ] Try uploading invalid file (should show error)
   - [ ] Try assigning without room (should show error)
   - [ ] Errors should auto-clear after 2 seconds

## Debugging

### Browser Console
```javascript
// View current state
console.log(State);

// Check localStorage
console.log(localStorage.getItem('selectionAppState'));

// Clear and reload
localStorage.removeItem('selectionAppState');
location.reload();
```

### Common Issues

**"State is not defined"**
- Check state.js loads before app.js
- Verify file paths are correct

**Elements not found**
- Verify HTML element IDs match document.getElementById() calls
- Check for typos in element IDs
- Ensure HTML loaded before app.js executes

**State not persisting**
- Check browser localStorage is enabled
- Verify saveState() is being called
- Check for localStorage quota exceeded errors

**Export not working**
- Verify ExcelJS and FileSaver libraries loaded
- Check browser allows downloads
- Check console for blob/download errors

## Performance Considerations

### Current Performance
- **App size**: ~650 lines JavaScript, ~450 lines HTML
- **Load time**: Instant (no build, no optimization needed)
- **Runtime**: O(n) where n = number of items selected

### Optimization Opportunities (if needed)
1. Minify/bundle js files (webpack/rollup)
2. Add virtual scrolling for large datasets
3. Add pagination for large spreadsheets
4. Debounce dropdown updates
5. Lazy load Excel library

## Browser Support

- **Minimum**: ES6 (all evergreen browsers)
- **Tested**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Not supported**: IE11 (uses ES6 features)

## Future Enhancements

### Short term (easy additions)
1. Add input validation
2. Add confirmation dialogs
3. Add batch operations
4. Add search/filter

### Medium term (moderate effort)
1. Add undo/redo
2. Add import saved states
3. Add drag-and-drop reordering
4. Add keyboard shortcuts
5. Add dark mode

### Long term (larger refactors)
1. Convert to ES6 modules (requires build)
2. Add unit tests
3. Add TypeScript
4. Add state history
5. Add collaborative features

## Support & Maintenance

### Code Quality
- All functions documented with JSDoc
- Consistent naming conventions
- Clear separation of concerns
- No external dependencies except libraries

### Making Changes
1. Identify which module/function needs change
2. Make the change locally
3. Test manually (refresh browser)
4. Verify state persists (reload page)
5. Check export functionality

### Adding Features
1. Add required State properties
2. Create handler function in app.js
3. Add event listener in setupEventListenersInternal()
4. Add DOM elements to HTML if needed
5. Call saveState() after updates

---

**Last Updated**: 2024
**Format**: Modular JavaScript (no frameworks)
**Status**: Refactoring Complete - Ready for use/extension
