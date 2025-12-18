# Quick Reference Guide

## 🚀 Getting Started
1. Open `spreadsheet-viewer.html` in your browser
2. Click "Select Data Source"
3. Upload an Excel file
4. Configure house and rooms
5. Select items and assign to rooms
6. Click "Export to Excel"

## 📁 Project Structure
```
js/
├── app.js                    # Main application (650 lines)
└── modules/
    ├── state.js             # State management
    ├── ui.js                # UI references
    └── [others]             # (legacy, not used)

css/
└── styles.css               # All styling

spreadsheet-viewer.html      # Clean HTML entry point
```

## 🔧 Main Functions Reference

### State Management
| Function | Purpose |
|----------|---------|
| `initializeState()` | Initialize State object |
| `resetState()` | Clear all data |
| `saveState()` | Save to localStorage |
| `loadSavedState()` | Load from localStorage |
| `restoreState(saved)` | Restore previous session |

### File & Configuration
| Function | Purpose |
|----------|---------|
| `handleFileUpload(e)` | Parse Excel files |
| `handleConfirmHouse()` | Set house name/plan |
| `handleSetBedsBaths()` | Configure rooms |

### Selection & Display
| Function | Purpose |
|----------|---------|
| `handleRowSelect(e)` | Select row from dropdown |
| `displayRowDetails(row)` | Show row information |
| `handleConfirmSelection()` | Add to current room |
| `handleAssignToRoom()` | Assign to specific room |
| `renderSelectedItems()` | Display all selections |

### Export & Utilities
| Function | Purpose |
|----------|---------|
| `handleExport()` | Generate Excel workbook |
| `showError(msg)` | Show error notification |
| `clearAllState()` | Reset everything |

## 📊 State Object Structure

```javascript
State = {
  // Data
  spreadsheetData: [],        // Rows from Excel file
  headers: [],                // Column names
  
  // Rooms
  beds: 0,                    // Number of bedrooms
  baths: 0,                   // Number of bathrooms
  dynamicBedrooms: [],        // Generated: ["Bedroom 1", ...]
  dynamicBaths: [],           // Generated: ["Bath 1", ...]
  selectedExtraRooms: [],     // Toggled: ["Office", "Living", ...]
  rooms: [],                  // Combined all rooms
  
  // House Config
  houseName: "",              // User entered
  floorPlan: "",              // Selected from dropdown
  
  // Selections
  selectedItems: [],          // Items added to rooms
  currentSelectedRow: null,   // Currently viewing
  activeRoomTab: null,        // Current room tab
  
  // UI
  fileMode: "scratch"         // "scratch" or "existing"
}
```

## ⌨️ Key Element IDs

### File Upload
- `startScratchBtn` - Upload file button
- `fileInput` - File input element
- `newProjectBtn` - Clear data button

### House Config
- `houseNameInput` - House name input
- `floorPlanSelect` - Floor plan dropdown
- `confirmHouseBtn` - Confirm house button
- `editHouseBtn` - Edit house button

### Room Config
- `bedsInput` - Number of beds input
- `bathsInput` - Number of baths input
- `setBedsBtn` - Set rooms button
- `editBedsBtn` - Edit rooms button
- `extraRoomsGroup` - Toggle buttons container

### Selection
- `rowSelect` - Row selection dropdown
- `subsectionSelect` - Subsection dropdown
- `detailsContent` - Row details display
- `confirmSelectionBtn` - Confirm selection button

### Room Assignment
- `roomSelect` - Room selection dropdown
- `assignBtn` - Assign to room button
- `assignCurrentBtn` - Add to current room

### Display & Export
- `roomTabs` - Room tab buttons
- `roomTabContent` - Room content area
- `selectedItems` - Selected items section
- `exportBtn` - Export button
- `error` - Error message display

## 💾 localStorage Format

```javascript
localStorage.getItem('selectionAppState')
// Returns JSON with full State object
```

Clear state:
```javascript
localStorage.removeItem('selectionAppState');
location.reload();
```

## 🔍 Debugging Tips

### View Current State
```javascript
console.log(State);
```

### View Saved State
```javascript
console.log(JSON.parse(localStorage.getItem('selectionAppState')));
```

### Check Specific Values
```javascript
console.log('House:', State.houseName);
console.log('Items:', State.selectedItems.length);
console.log('Rooms:', State.rooms);
```

### Clear Everything
```javascript
localStorage.clear();
location.reload();
```

## 📝 Adding Features

### Add a New Handler
1. Create function in app.js:
```javascript
function handleNewFeature() {
    // Update State
    State.newProperty = value;
    
    // Update UI
    updateDisplay();
    
    // Save
    saveState();
}
```

2. Add listener in `setupEventListenersInternal()`:
```javascript
const newBtn = document.getElementById('newBtnId');
if (newBtn) {
    newBtn.addEventListener('click', handleNewFeature);
}
```

3. Add HTML element:
```html
<button id="newBtnId">New Feature</button>
```

### Add State Property
1. Add to State object in state.js:
```javascript
const State = {
    // ... existing properties
    newProperty: initialValue,
};
```

2. Save in `saveState()` if needed:
```javascript
state.newProperty = State.newProperty;
```

3. Restore in `restoreState()` if needed:
```javascript
State.newProperty = savedState.newProperty || initialValue;
```

## 🎯 Common Tasks

### Make Room Config Required Before Selection
```javascript
// In handleRowSelect()
if (State.rooms.length === 0) {
    showError('Please configure rooms first');
    return;
}
```

### Change Export Format
Look in `handleExport()` around line 750:
```javascript
// Modify workbook structure
// Change sheet names
// Modify formatting
// Change filename format
```

### Add New Room Type
In HTML:
```html
<button class="toggle-btn" data-room="NewRoom">New Room</button>
```

The code automatically includes it when toggled.

### Validate Data Before Upload
In `handleFileUpload()` after line 460:
```javascript
// Add validation
if (!headers.includes('Required Column')) {
    throw new Error('Missing required column');
}
```

## ⚠️ Common Mistakes

| Mistake | Fix |
|---------|-----|
| State changes not persisting | Call `saveState()` after update |
| UI doesn't match state | Call `renderSelectedItems()` |
| Element not found errors | Check HTML element IDs |
| Buttons not responding | Check `setupEventListenersInternal()` |
| Export not working | Check ExcelJS/FileSaver loaded |

## 📚 Documentation Files

- **COMPLETION_SUMMARY.md** - What was done, overview
- **REFACTORING_NOTES.md** - Architecture details, improvements
- **IMPLEMENTATION_GUIDE.md** - Comprehensive developer guide
- **README.md** - This file (quick reference)

## 🔗 External Libraries

All loaded from CDN:

```html
<!-- Excel parsing -->
<script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>

<!-- Excel generation -->
<script src="https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js"></script>

<!-- File download -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
```

## 🎨 Styling

All CSS in `css/styles.css`. Key classes:
- `.container` - Main container
- `.file-btn` - Button styling
- `.selector-section` - Selection area
- `.selected-item` - Item card
- `.room-tab-btn` - Room tab button
- `.error` - Error message

## ✅ Testing Checklist

- [ ] Upload file
- [ ] Configure house
- [ ] Set beds/baths
- [ ] Toggle extra rooms
- [ ] Select item
- [ ] View details
- [ ] Assign to room
- [ ] See in display
- [ ] Export to Excel
- [ ] Reload page (persistence)
- [ ] Clear data
- [ ] Error messages

---

**For complete documentation, see:**
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Detailed guide
- [REFACTORING_NOTES.md](REFACTORING_NOTES.md) - Architecture overview
