/**
 * Main Application File
 * Orchestrates all modules and initializes the app
 */

// State and UI are made globally available by state.js and ui.js
// Create a shortcut variable (will be set when state.js loads)
let State;
let els; // DOM elements shortcut
let listenersInitialized = false; // Guard to prevent duplicate listeners

// Wait for state.js to load and set up globals
const initAppWhenReady = () => {
    if (typeof window.State !== 'undefined' && typeof window.initializeState !== 'undefined') {
        State = window.State; // Set shortcut
        window.initializeState();
        // Get DOM elements
        if (typeof window.UI !== 'undefined' && window.UI.getElements) {
            els = window.UI.getElements();
        }
        return true;
    }
    return false;
};

// Try to initialize immediately, or wait for DOM
if (!initAppWhenReady()) {
    document.addEventListener('DOMContentLoaded', initAppWhenReady);
}

/**
 * Initialize Application
 */
async function initApp() {
    // Get DOM elements if not already set
    if (!els && typeof window.UI !== 'undefined' && window.UI.getElements) {
        els = window.UI.getElements();
    }
    
    // Initialize dark mode
    initDarkMode();
    
    // Diagnostic: Check if sheetSelect exists
    const versionCheck = document.getElementById('versionCheck');
    const sheetSelectExists = !!document.getElementById('sheetSelect');
    if (versionCheck) {
        versionCheck.textContent = `HTML Version: ${sheetSelectExists ? '✓ sheetSelect found' : '✗ sheetSelect NOT found'}`;
    }
    
    // Initialize event listeners
    setupEventListenersInternal();
    
    // Try to load state
    const savedState = loadSavedState();
    if (savedState) {
        restoreState(savedState);
    }
    
    // Initialize dropdowns
    updateRowDropdown();
    updateRoomDropdown();
    
    // Update export button state
    updateExportButtonState();
}

/**
 * Load saved state from storage
 */
function loadSavedState() {
    try {
        const saved = localStorage.getItem('selectionAppState');
        return saved ? JSON.parse(saved) : null;
    } catch (err) {
        console.error('Failed to load state:', err);
        return null;
    }
}

/**
 * Restore state from saved data
 */
function restoreState(savedState) {
    State.selectedItems = savedState.selectedItems || [];
    State.dynamicBedrooms = savedState.dynamicBedrooms || [];
    State.dynamicBaths = savedState.dynamicBaths || [];
    State.selectedExtraRooms = savedState.selectedExtraRooms || [];
    State.houseName = savedState.houseName || '';
    State.floorPlan = savedState.floorPlan || '';
    State.beds = savedState.beds || 0;
    State.baths = savedState.baths || 0;
    State.activeRoomTab = savedState.activeRoomTab || null;
    State.spreadsheetData = savedState.spreadsheetData || [];
    State.headers = savedState.headers || [];
    State.allSheets = savedState.allSheets || {};
    State.sheetNames = savedState.sheetNames || [];
    State.activeSheet = savedState.activeSheet || null;

    // Restore UI
    els.houseNameInput.value = State.houseName;
    els.floorPlanSelect.value = State.floorPlan;
    els.bedsInput.value = State.beds;
    els.bathsInput.value = State.baths;

    // Restore room config state
    if (State.beds > 0 || State.baths > 0 || State.selectedExtraRooms.length > 0) {
        setRoomConfigLocked(true);
        if (State.houseName) {
            setHouseNameLocked(true);
        }
    }

    // Restore toggle states
    setSelectedExtraRoomsInUI(State.selectedExtraRooms);

    // Update rooms
    updateRoomsArray();

    // Populate and show selector
    if (State.spreadsheetData.length > 0) {
        updateSheetDropdown();
        updateRowDropdown();
        els.selectorSection.classList.add('active');
    }

    // Display selected items
    if (State.selectedItems.length > 0) {
        renderSelectedItems();
    }
}

/**
 * Save current state to localStorage
 */
function saveState() {
    const state = {
        selectedItems: State.selectedItems,
        dynamicBedrooms: State.dynamicBedrooms,
        dynamicBaths: State.dynamicBaths,
        selectedExtraRooms: State.selectedExtraRooms,
        houseName: State.houseName,
        floorPlan: State.floorPlan,
        beds: State.beds,
        baths: State.baths,
        activeRoomTab: State.activeRoomTab,
        spreadsheetData: State.spreadsheetData,
        headers: State.headers,
        allSheets: State.allSheets,
        sheetNames: State.sheetNames,
        activeSheet: State.activeSheet,
    };
    try {
        localStorage.setItem('selectionAppState', JSON.stringify(state));
    } catch (err) {
        console.error('Failed to save state:', err);
    }
}

/**
 * Initialize Dark Mode
 */
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (!darkModeToggle) return;

    // Load dark mode preference from localStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }

    // Add click listener to toggle button
    darkModeToggle.addEventListener('click', toggleDarkMode);
}

/**
 * Toggle Dark Mode
 */
function toggleDarkMode() {
    const body = document.body;
    const isDarkMode = body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

/**
 * Clear all state
 */
function clearAllState() {
    if (confirm('Start a new project? This will clear all current selections.')) {
        localStorage.removeItem('selectionAppState');
        resetState();
        location.reload();
    }
}

/**
 * Update rooms array
 */
function updateRoomsArray() {
    const set = new Set();
    State.dynamicBedrooms.forEach(r => set.add(r));
    State.dynamicBaths.forEach(r => set.add(r));
    State.selectedExtraRooms.forEach(r => set.add(r));
    State.rooms = Array.from(set);
    updateRoomDropdown();
    renderSelectedItems();
}

/**
 * Update sheet dropdown
 */
function updateSheetDropdown() {
    let sheetSelect = document.getElementById('sheetSelect');
    
    // If not found, try waiting a bit and searching again
    if (!sheetSelect) {
        console.warn('sheetSelect element not found on first attempt, waiting...');
        setTimeout(() => {
            sheetSelect = document.getElementById('sheetSelect');
            if (sheetSelect) {
                console.log('Found sheetSelect after delay');
                performSheetDropdownUpdate(sheetSelect);
            } else {
                console.error('sheetSelect element still not found after delay');
            }
        }, 100);
        return;
    }
    
    performSheetDropdownUpdate(sheetSelect);
}

/**
 * Perform the sheet dropdown update
 */
function performSheetDropdownUpdate(sheetSelect) {
    console.log('Updating sheet dropdown. sheetNames:', State.sheetNames, 'activeSheet:', State.activeSheet);
    
    if (window.UI && window.UI.populateSheetDropdown) {
        window.UI.populateSheetDropdown(sheetSelect, State.sheetNames, State.activeSheet);
    } else {
        console.error('window.UI.populateSheetDropdown not available');
    }
}

/**
 * Handle sheet change
 */
function handleSheetChange(e) {
    // Handle both event objects and direct sheet name strings
    const selectedSheet = typeof e === 'string' ? e : e.target.value;
    if (!selectedSheet || !State.allSheets[selectedSheet]) {
        return;
    }

    State.activeSheet = selectedSheet;
    State.headers = State.allSheets[selectedSheet].headers;
    State.spreadsheetData = State.allSheets[selectedSheet].data;

    // Update the sheet dropdown to match the selected sheet
    const sheetSelect = document.getElementById('sheetSelect');
    if (sheetSelect) {
        sheetSelect.value = selectedSheet;
    }

    updateRowDropdown();
    renderSelectedItems();
    const rowDetails = document.getElementById('rowDetails');
    if (rowDetails) {
        rowDetails.classList.remove('active');
    }
    saveState();
}

/**
 * Update row dropdown
 */
function updateRowDropdown() {
    const rowSelect = document.getElementById('rowSelect');
    if (!rowSelect) return;

    rowSelect.innerHTML = '<option value="">-- Choose a row --</option>';
    State.spreadsheetData.forEach((row, index) => {
        const option = document.createElement('option');
        option.value = index;
        const displayValues = State.headers.slice(0, 10).map(h => row[h] !== undefined && row[h] !== '' ? row[h] : 'NULL');
        option.textContent = `Row ${row._rowNumber}: ${displayValues.join(' - ')}`;
        rowSelect.appendChild(option);
    });
}

/**
 * Update room dropdown
 */
function updateRoomDropdown() {
    const roomSelect = document.getElementById('roomSelect');
    if (!roomSelect) return;

    roomSelect.innerHTML = '<option value="">-- Choose a room --</option>';
    State.rooms.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r;
        opt.textContent = r;
        roomSelect.appendChild(opt);
    });
}

/**
 * Render selected items
 */
function renderSelectedItems() {
    const roomTabs = document.getElementById('roomTabs') || els.roomTabs;
    const roomTabContent = document.getElementById('roomTabContent') || els.roomTabContent;
    const selectedItems = document.getElementById('selectedItems');
    
    if (!roomTabs || !roomTabContent) return;

    // Render sheet tabs
    if (State.sheetNames && State.sheetNames.length > 0 && window.UI && window.UI.renderSheetTabs) {
        window.UI.renderSheetTabs(State.sheetNames, State.activeSheet, (selectedSheet) => {
            handleSheetChange({ target: { value: selectedSheet } });
        }, State.selectedItems);
    }
    
    roomTabs.innerHTML = '';
    roomTabContent.innerHTML = '';

    // Group by sheet, then by room
    const sheetGroups = {};
    State.sheetNames.forEach(sheet => {
        sheetGroups[sheet] = {};
        State.rooms.forEach(r => sheetGroups[sheet][r] = []);
        sheetGroups[sheet]['Unassigned'] = [];
    });

    State.selectedItems.forEach(it => {
        const sheet = it.sheet || State.activeSheet;
        if (!sheetGroups[sheet]) {
            sheetGroups[sheet] = {};
            State.rooms.forEach(r => sheetGroups[sheet][r] = []);
            sheetGroups[sheet]['Unassigned'] = [];
        }
        const room = it.room && sheetGroups[sheet][it.room] ? it.room : 'Unassigned';
        sheetGroups[sheet][room].push(it);
    });

    const sheetNames = Object.keys(sheetGroups);
    if (!State.activeSheet || !sheetNames.includes(State.activeSheet)) {
        State.activeSheet = sheetNames[0] || State.sheetNames[0];
    }

    // Show selected items section if we have sheets/rooms or items
    if ((State.sheetNames?.length > 0 || State.rooms?.length > 0 || State.selectedItems.length > 0) && selectedItems) {
        selectedItems.classList.add('active');
    }

    // Get rooms for the current active sheet
    const roomsInCurrentSheet = sheetGroups[State.activeSheet] || {};
    const roomNames = Object.keys(roomsInCurrentSheet);
    
    if (!State.activeRoomTab || !roomNames.includes(State.activeRoomTab)) {
        const roomWithItems = roomNames.find(r => roomsInCurrentSheet[r]?.length > 0);
        State.activeRoomTab = roomWithItems || roomNames[0] || 'Unassigned';
    }

    // Create room tabs for current sheet
    roomNames.forEach(roomName => {
        const count = roomsInCurrentSheet[roomName]?.length || 0;
        const btn = document.createElement('button');
        btn.className = 'room-tab-btn';
        btn.dataset.room = roomName;
        btn.textContent = roomName + (count ? ` (${count})` : '');
        if (roomName === State.activeRoomTab) btn.classList.add('active');
        roomTabs.appendChild(btn);

        // Content container for this room
        const contentDiv = document.createElement('div');
        contentDiv.className = 'room-section';
        contentDiv.dataset.room = roomName;
        contentDiv.style.display = roomName === State.activeRoomTab ? 'block' : 'none';

        // Product Group (Sheet) name
        const sheetLabel = document.createElement('div');
        sheetLabel.className = 'product-group-label';
        sheetLabel.textContent = State.activeSheet;
        contentDiv.appendChild(sheetLabel);

        const title = document.createElement('div');
        title.className = 'room-title';
        title.textContent = roomName;
        contentDiv.appendChild(title);

        const items = roomsInCurrentSheet[roomName] || [];
        if (!items.length) {
            const empty = document.createElement('div');
            empty.textContent = 'No items yet.';
            empty.style.color = '#888';
            empty.style.fontSize = '13px';
            contentDiv.appendChild(empty);
        } else {
            // Display items for this room
            items.forEach(item => {
                contentDiv.appendChild(createItemElement(item));
            });
        }

        roomTabContent.appendChild(contentDiv);
    });

    // Tab switching by room
    roomTabs.onclick = (e) => {
        const btn = e.target.closest('button.room-tab-btn');
        if (!btn) return;
        const newRoom = btn.dataset.room;
        if (!newRoom || newRoom === State.activeRoomTab) return;

        Array.from(roomTabs.children).forEach(b => b.classList.toggle('active', b.dataset.room === newRoom));
        Array.from(roomTabContent.children).forEach(div => {
            div.style.display = div.dataset.room === newRoom ? 'block' : 'none';
        });
        State.activeRoomTab = newRoom;
    };

    updateExportButtonState();

    // Update show all view if it's currently visible
    const showAllContent = document.getElementById('showAllContent');
    if (showAllContent && showAllContent.style.display !== 'none') {
        renderAllItems();
    }
}

/**
 * Create item element
 */
function createItemElement(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'selected-item';

    const content = document.createElement('div');
    content.className = 'selected-item-content';

    const details = document.createElement('div');
    details.className = 'selected-item-details';
    details.textContent = State.headers.map(h => item[h]).filter(v => v !== '').join(' | ');

    content.appendChild(details);

    // Quantity input
    const quantityContainer = document.createElement('div');
    quantityContainer.className = 'quantity-container';
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.className = 'quantity-input';
    quantityInput.value = item.quantity || 1;
    quantityInput.min = '1';
    quantityInput.onchange = () => {
        item.quantity = parseInt(quantityInput.value) || 1;
        saveState();
    };
    quantityContainer.appendChild(quantityInput);

    // Notes input
    const notesContainer = document.createElement('div');
    notesContainer.className = 'notes-container';
    const notesLabel = document.createElement('label');
    notesLabel.textContent = 'Notes:';
    notesLabel.style.fontSize = '12px';
    notesLabel.style.marginBottom = '2px';
    const notesInput = document.createElement('input');
    notesInput.type = 'text';
    notesInput.className = 'notes-input';
    notesInput.placeholder = 'Add notes...';
    notesInput.value = item.notes || '';
    notesInput.onchange = () => {
        item.notes = notesInput.value;
        saveState();
    };
    notesContainer.appendChild(notesLabel);
    notesContainer.appendChild(notesInput);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => {
        const idx = State.selectedItems.findIndex(
            it => it._rowNumber === item._rowNumber && it.room === item.room && ((it.subsection || 'Subsection 1') === (item.subsection || 'Subsection 1'))
        );
        if (idx !== -1) {
            State.selectedItems.splice(idx, 1);
            saveState();
            renderSelectedItems();
        }
    };

    itemDiv.appendChild(content);
    itemDiv.appendChild(quantityContainer);
    itemDiv.appendChild(notesContainer);
    itemDiv.appendChild(deleteBtn);
    return itemDiv;
}

/**
 * Set house name locked state
 */
function setHouseNameLocked(locked) {
    const houseNameInput = document.getElementById('houseNameInput');
    const confirmHouseBtn = document.getElementById('confirmHouseBtn');
    const editHouseBtn = document.getElementById('editHouseBtn');

    if (houseNameInput) houseNameInput.disabled = locked;
    if (confirmHouseBtn) confirmHouseBtn.style.display = locked ? 'none' : 'inline-block';
    if (editHouseBtn) editHouseBtn.style.display = locked ? 'inline-block' : 'none';
}

/**
 * Set room config locked state
 */
function setRoomConfigLocked(locked) {
    const bedsInput = document.getElementById('bedsInput');
    const bathsInput = document.getElementById('bathsInput');
    const setBedsBtn = document.getElementById('setBedsBtn');
    const editBedsBtn = document.getElementById('editBedsBtn');

    if (bedsInput) bedsInput.disabled = locked;
    if (bathsInput) bathsInput.disabled = locked;
    document.querySelectorAll('#extraRoomsGroup .toggle-btn').forEach(b => b.disabled = locked);
    if (setBedsBtn) setBedsBtn.style.display = locked ? 'none' : 'inline-block';
    if (editBedsBtn) editBedsBtn.style.display = locked ? 'inline-block' : 'none';
}

/**
 * Set selected extra rooms in UI
 */
function setSelectedExtraRoomsInUI(rooms) {
    document.querySelectorAll('#extraRoomsGroup .toggle-btn').forEach(btn => {
        const room = btn.getAttribute('data-room');
        btn.classList.toggle('active', rooms.includes(room));
    });
}

/**
 * Get selected extra rooms from UI
 */
function getSelectedExtraRooms() {
    const buttons = document.querySelectorAll('#extraRoomsGroup .toggle-btn.active');
    return Array.from(buttons).map(b => b.getAttribute('data-room'));
}

/**
 * Update export button state
 */
function updateExportButtonState() {
    const exportBtn = document.getElementById('exportBtn') || els.exportBtn;
    if (exportBtn) {
        exportBtn.disabled = State.selectedItems.length === 0;
    }
}

/**
 * Toggle Show All View
 */
function toggleShowAllView() {
    const showAllBtn = document.getElementById('showAllBtn');
    const roomTabContent = document.getElementById('roomTabContent');
    const showAllContent = document.getElementById('showAllContent');
    
    if (!showAllBtn || !roomTabContent || !showAllContent) return;

    const isShowingAll = showAllContent.style.display !== 'none';

    if (isShowingAll) {
        // Switch back to normal view
        roomTabContent.style.display = 'block';
        showAllContent.style.display = 'none';
        showAllBtn.textContent = 'Show All';
    } else {
        // Switch to show all view
        roomTabContent.style.display = 'none';
        showAllContent.style.display = 'block';
        showAllBtn.textContent = 'Show By Room';
        renderAllItems();
    }
}

/**
 * Render all items view (all rooms in current product group)
 */
function renderAllItems() {
    const showAllContent = document.getElementById('showAllContent');
    if (!showAllContent) return;

    showAllContent.innerHTML = '';

    // Get items from current active sheet only
    const itemsInCurrentSheet = State.selectedItems.filter(item => item.sheet === State.activeSheet);
    
    if (itemsInCurrentSheet.length === 0) {
        const empty = document.createElement('div');
        empty.textContent = 'No items in this product group.';
        empty.style.color = 'var(--text-tertiary)';
        empty.style.fontSize = '13px';
        empty.style.padding = '12px';
        showAllContent.appendChild(empty);
        return;
    }

    // Group items by room
    const roomGroups = {};
    State.rooms.forEach(r => roomGroups[r] = []);
    roomGroups['Unassigned'] = [];

    itemsInCurrentSheet.forEach(item => {
        const room = item.room && roomGroups[item.room] ? item.room : 'Unassigned';
        roomGroups[room].push(item);
    });

    // Render each room
    Object.keys(roomGroups).forEach(roomName => {
        const items = roomGroups[roomName];
        if (!items || items.length === 0) return;

        // Room header
        const roomDiv = document.createElement('div');
        roomDiv.style.marginBottom = '16px';

        const roomHeader = document.createElement('div');
        roomHeader.className = 'all-items-room-header';
        roomHeader.textContent = roomName;
        roomHeader.style.fontSize = '14px';
        roomHeader.style.fontWeight = '600';
        roomHeader.style.color = 'var(--text-primary)';
        roomHeader.style.marginBottom = '8px';
        roomHeader.style.paddingBottom = '4px';
        roomHeader.style.borderBottom = '2px solid var(--border-color)';
        roomDiv.appendChild(roomHeader);

        // Room items
        items.forEach(item => {
            roomDiv.appendChild(createItemElement(item));
        });

        showAllContent.appendChild(roomDiv);
    });
}

/**
 * Show error message
 */
function showError(message) {
    const errorDiv = document.getElementById('error') || els.errorDiv;
    if (errorDiv) {
        errorDiv.textContent = message;
        setTimeout(() => {
            if (errorDiv.textContent === message) {
                errorDiv.textContent = '';
            }
        }, 2000);
    }
}

/**
 * Setup Event Listeners
 */
function setupEventListenersInternal() {
    // Guard: prevent duplicate listener setup
    if (listenersInitialized) {
        console.log('Listeners already initialized, skipping duplicate setup');
        return;
    }
    listenersInitialized = true;
    
    // Retry logic to ensure elements are found
    const getElement = (id) => document.getElementById(id);
    const waitForElement = (id, maxAttempts = 5) => {
        let attempts = 0;
        while (!getElement(id) && attempts < maxAttempts) {
            attempts++;
        }
        return getElement(id);
    };

    // File upload
    const startScratchBtn = waitForElement('startScratchBtn') || document.getElementById('startScratchBtn');
    const fileInput = waitForElement('fileInput') || document.getElementById('fileInput');
    const sheetSelect = waitForElement('sheetSelect') || document.getElementById('sheetSelect');
    const confirmHouseBtn = waitForElement('confirmHouseBtn') || document.getElementById('confirmHouseBtn');
    const editHouseBtn = waitForElement('editHouseBtn') || document.getElementById('editHouseBtn');
    const setBedsBtn = waitForElement('setBedsBtn') || document.getElementById('setBedsBtn');
    const editBedsBtn = waitForElement('editBedsBtn') || document.getElementById('editBedsBtn');
    const rowSelect = waitForElement('rowSelect') || document.getElementById('rowSelect');
    const confirmSelectionBtn = waitForElement('confirmSelectionBtn') || document.getElementById('confirmSelectionBtn');
    const assignBtn = waitForElement('assignBtn') || document.getElementById('assignBtn');
    const assignCurrentBtn = waitForElement('assignCurrentBtn') || document.getElementById('assignCurrentBtn');
    const exportBtn = waitForElement('exportBtn') || document.getElementById('exportBtn');
    const newProjectBtn = waitForElement('newProjectBtn') || document.getElementById('newProjectBtn');

    if (startScratchBtn) {
        startScratchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            State.fileMode = 'scratch';
            if (fileInput) {
                fileInput.value = '';
                fileInput.click();
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    // Sheet selection
    if (sheetSelect) {
        sheetSelect.addEventListener('change', handleSheetChange);
    }

    // House
    if (confirmHouseBtn) {
        confirmHouseBtn.addEventListener('click', handleConfirmHouse);
    }
    if (editHouseBtn) {
        editHouseBtn.addEventListener('click', () => {
            setHouseNameLocked(false);
        });
    }

    // Beds/Baths
    if (setBedsBtn) {
        setBedsBtn.addEventListener('click', handleSetBedsBaths);
    } else {
        console.warn('setBedsBtn not found');
    }
    if (editBedsBtn) {
        editBedsBtn.addEventListener('click', () => {
            setRoomConfigLocked(false);
            const bedsInput = document.getElementById('bedsInput');
            if (bedsInput) bedsInput.focus();
        });
    }

    // Row selection
    if (rowSelect) {
        rowSelect.addEventListener('change', handleRowSelect);
    }
    if (confirmSelectionBtn) {
        confirmSelectionBtn.addEventListener('click', handleConfirmSelection);
    }

    // Room assignment
    if (assignBtn) {
        assignBtn.addEventListener('click', handleAssignToRoom);
    }
    if (assignCurrentBtn) {
        assignCurrentBtn.addEventListener('click', handleConfirmSelection);
    }

    // Export
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExport);
    }

    // New project
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', clearAllState);
    }

    // Extra rooms toggle
    document.addEventListener('click', (e) => {
        if (e.target?.classList?.contains('toggle-btn')) {
            e.stopPropagation();
            if (!e.target.disabled) {
                const roomName = e.target.getAttribute('data-room');
                console.log('BEFORE toggle:', roomName, 'has active class:', e.target.classList.contains('active'));
                e.target.classList.toggle('active');
                console.log('AFTER toggle:', roomName, 'has active class:', e.target.classList.contains('active'));
                
                // Check all active buttons
                const allActive = document.querySelectorAll('#extraRoomsGroup .toggle-btn.active');
                console.log('All active buttons:', Array.from(allActive).map(b => b.getAttribute('data-room')));
                
                // Update state with selected extra rooms
                State.selectedExtraRooms = getSelectedExtraRooms();
                console.log('Updated selectedExtraRooms:', State.selectedExtraRooms);
                updateRoomDropdown();
                saveState();
            }
        }
    });

    // Show All button
    const showAllBtn = document.getElementById('showAllBtn');
    if (showAllBtn) {
        showAllBtn.addEventListener('click', toggleShowAllView);
    }
}

/**
 * File Upload Handler
 */
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const fileNameEl = document.getElementById('fileName') || els.fileName;
    const errorDiv = document.getElementById('error') || els.errorDiv;
    
    if (fileNameEl) {
        fileNameEl.textContent = `Selected: ${file.name}`;
    }
    if (errorDiv) {
        errorDiv.textContent = '';
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = new Uint8Array(ev.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Parse all sheets
            const allSheets = {};
            const sheetNames = workbook.SheetNames;
            
            sheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                
                if (jsonData.length >= 2) {
                    const headers = jsonData[0];
                    const data = [];
                    
                    // Process rows until we hit an empty row
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        
                        // Check if row is completely empty
                        const isEmpty = !row || row.length === 0 || row.every(cell => cell === undefined || cell === null || cell === '');
                        
                        // Stop at first empty row
                        if (isEmpty) {
                            break;
                        }
                        
                        const rowObj = { _rowNumber: i + 1 };
                        headers.forEach((header, j) => {
                            rowObj[header] = row[j] !== undefined ? row[j] : '';
                        });
                        data.push(rowObj);
                    }
                    
                    // Only add sheet if it has at least one data row
                    if (data.length > 0) {
                        allSheets[sheetName] = { headers, data };
                    }
                }
            });
            
            if (Object.keys(allSheets).length === 0) {
                throw new Error('No valid sheets found. Each sheet must have at least a header row and one data row');
            }
            
            // Store all sheets
            State.allSheets = allSheets;
            State.sheetNames = Object.keys(allSheets);
            State.activeSheet = State.sheetNames[0];
            State.headers = allSheets[State.activeSheet].headers;
            State.spreadsheetData = allSheets[State.activeSheet].data;

            // Update sheet dropdown
            updateSheetDropdown();
            updateRowDropdown();
            
            const selectorSection = document.getElementById('selectorSection') || els.selectorSection;
            if (selectorSection) {
                selectorSection.classList.add('active');
            }
            const rowDetails = document.getElementById('rowDetails') || els.rowDetails;
            if (rowDetails) {
                rowDetails.classList.remove('active');
            }
            saveState();
        } catch (error) {
            if (errorDiv) {
                errorDiv.textContent = `Error: ${error.message}`;
            }
        }
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Confirm House Handler
 */
function handleConfirmHouse() {
    const houseNameInput = document.getElementById('houseNameInput');
    if (!houseNameInput) return;

    const name = houseNameInput.value.trim();
    if (!name) {
        showError('Please enter a house name.');
        return;
    }
    State.houseName = name;
    const floorPlanSelect = document.getElementById('floorPlanSelect');
    if (floorPlanSelect) {
        State.floorPlan = floorPlanSelect.value;
    }
    setHouseNameLocked(true);
    saveState();
}

/**
 * Set Beds/Baths Handler
 */
function handleSetBedsBaths() {
    const bedsInput = document.getElementById('bedsInput');
    const bathsInput = document.getElementById('bathsInput');
    if (!bedsInput || !bathsInput) return;

    const beds = parseInt(bedsInput.value, 10) || 0;
    const baths = parseInt(bathsInput.value, 10) || 0;
    
    if (beds < 0 || baths < 0) {
        showError('Please enter valid non-negative numbers.');
        return;
    }

    State.beds = beds;
    State.baths = baths;
    State.dynamicBedrooms = Array.from({ length: beds }, (_, i) => `Bedroom ${i + 1}`);
    State.dynamicBaths = Array.from({ length: baths }, (_, i) => `Bath ${i + 1}`);
    State.selectedExtraRooms = getSelectedExtraRooms();

    setRoomConfigLocked(true);
    updateRoomsArray();
    saveState();
}

/**
 * Row Select Handler
 */
function handleRowSelect(e) {
    const idx = e.target.value;
    const rowDetails = document.getElementById('rowDetails');
    const confirmSelectionBtn = document.getElementById('confirmSelectionBtn');

    if (idx === '') {
        if (rowDetails) rowDetails.classList.remove('active');
        State.currentSelectedRow = null;
        if (confirmSelectionBtn) confirmSelectionBtn.disabled = true;
        return;
    }

    State.currentSelectedRow = State.spreadsheetData[idx];
    displayRowDetails(State.currentSelectedRow);
    if (confirmSelectionBtn) confirmSelectionBtn.disabled = false;
}

/**
 * Display Row Details
 */
function displayRowDetails(row) {
    const detailsContent = document.getElementById('detailsContent');
    const rowDetails = document.getElementById('rowDetails');
    
    if (!detailsContent || !rowDetails) return;

    detailsContent.innerHTML = '';
    State.headers.forEach(header => {
        const item = document.createElement('div');
        item.className = 'detail-item';

        const value = document.createElement('span');
        value.className = 'detail-value';
        value.textContent = row[header] ? row[header] : '(empty)';

        item.appendChild(value);
        detailsContent.appendChild(item);
    });
    rowDetails.classList.add('active');
}

/**
 * Confirm Selection Handler
 */
function handleConfirmSelection() {
    const rowSelect = document.getElementById('rowSelect');

    // Make sure a row is selected
    if (!rowSelect || rowSelect.value === '') {
        showError('Please select an item first.');
        return;
    }

    // Get the selected row from the dropdown
    const selectedIndex = rowSelect.value;
    if (!State.spreadsheetData[selectedIndex]) {
        showError('Invalid item selected.');
        return;
    }
    
    const selectedRow = State.spreadsheetData[selectedIndex];
    
    let targetRoom = State.activeRoomTab || (State.rooms.length ? State.rooms[0] : null);
    if (!targetRoom || targetRoom === 'Unassigned') {
        const firstRoom = State.rooms.find(r => r !== 'Unassigned');
        targetRoom = firstRoom;
        if (!targetRoom) {
            showError('No room available. Please set house layout first.');
            return;
        }
    }
    
    // Add the item with current sheet and room (no subsection)
    State.selectedItems.push({ ...selectedRow, sheet: State.activeSheet, room: targetRoom });

    State.activeRoomTab = targetRoom;
    renderSelectedItems();
    saveState();
}

/**
 * Assign to Room Handler
 */
function handleAssignToRoom() {
    const roomSelect = document.getElementById('roomSelect');
    const rowDetails = document.getElementById('rowDetails');
    const rowSelect = document.getElementById('rowSelect');

    if (!State.currentSelectedRow) {
        showError('No row selected.');
        return;
    }
    if (!roomSelect) {
        showError('Room selector not found.');
        return;
    }
    
    const room = roomSelect.value;
    if (!room) {
        showError('Please choose a room.');
        return;
    }

    const existing = State.selectedItems.findIndex(it => it._rowNumber === State.currentSelectedRow._rowNumber && it.room === room && it.sheet === State.activeSheet);
    if (existing === -1) {
        State.selectedItems.push({ ...State.currentSelectedRow, sheet: State.activeSheet, room });
    }

    renderSelectedItems();
    State.currentSelectedRow = null;
    if (rowDetails) rowDetails.classList.remove('active');
    if (rowSelect) rowSelect.value = '';
    if (roomSelect) roomSelect.value = '';
    saveState();
}

/**
 * Export Handler
 */
async function handleExport() {
    try {
        if (!State.selectedItems.length) {
            showError('Nothing to export.');
            return;
        }

        if (!window.ExcelJS || !window.saveAs) {
            showError('Export libraries not available.');
            return;
        }

        const dataHeaders = State.headers.slice().filter(k => k !== 'subsection' && k !== 'sheet');
        const selectionCols = ['Room', '_rowNumber', 'Quantity', ...dataHeaders, 'Notes'];

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Selection App';
        workbook.created = new Date();

        // Summary
        const summaryWs = workbook.addWorksheet('Summary');
        summaryWs.addRow(['House Name', State.houseName || '']);
        summaryWs.addRow(['Floor Plan', State.floorPlan || '']);
        summaryWs.addRow(['Exported At', new Date().toLocaleString()]);

        // All Selections
        const allWs = workbook.addWorksheet('All Selections');
        const headerRow = allWs.addRow(['Sheet', 'Room', '_rowNumber', 'Quantity', ...dataHeaders, 'Notes']);
        headerRow.eachCell(cell => { cell.font = { bold: true }; });
        State.selectedItems.forEach(item => {
            const row = ['Sheet', 'Room', '_rowNumber', 'Quantity', ...dataHeaders, 'Notes'].map(col => {
                if (col === 'Sheet') return item.sheet || '';
                if (col === 'Room') return item.room || '';
                if (col === '_rowNumber') return item._rowNumber || '';
                if (col === 'Quantity') return item.quantity || 1;
                if (col === 'Notes') return item.notes || '';
                return item[col] ?? '';
            });
            allWs.addRow(row);
        });

        // Auto-size
        for (let i = 1; i <= ['Sheet', 'Room', '_rowNumber', 'Quantity', ...dataHeaders].length; i++) {
            const col = allWs.getColumn(i);
            let max = 10;
            col.eachCell({ includeEmpty: true }, (cell) => {
                const s = String(cell.value ?? '');
                max = Math.max(max, s.length);
            });
            col.width = Math.min(Math.max(max + 2, 10), 60);
        }

        // Per-sheet, then per-room
        const sheetGroups = {};
        State.sheetNames.forEach(sheet => {
            sheetGroups[sheet] = {};
            State.rooms.forEach(r => sheetGroups[sheet][r] = []);
            sheetGroups[sheet]['Unassigned'] = [];
        });

        State.selectedItems.forEach(it => {
            const sheet = it.sheet || State.activeSheet;
            if (!sheetGroups[sheet]) {
                sheetGroups[sheet] = {};
                State.rooms.forEach(r => sheetGroups[sheet][r] = []);
                sheetGroups[sheet]['Unassigned'] = [];
            }
            const room = it.room && sheetGroups[sheet][it.room] ? it.room : 'Unassigned';
            sheetGroups[sheet][room].push(it);
        });

        Object.keys(sheetGroups).forEach(sheetName => {
            const roomsInSheet = sheetGroups[sheetName];
            const sheetNameSafe = String(sheetName).replace(/[\/\\\?\*\[\]:]/g, '').slice(0, 31) || 'Sheet';
            const ws = workbook.addWorksheet(sheetNameSafe);

            // Add header row with sheet name, house name, and floor plan
            const headerText = `${sheetName} - ${State.houseName || 'N/A'} - ${State.floorPlan || 'N/A'}`;
            const headerRow = ws.addRow([headerText]);
            ws.mergeCells(headerRow.number, 1, headerRow.number, selectionCols.length);
            const headerCell = ws.getCell(headerRow.number, 1);
            headerCell.font = { bold: true, size: 12 };
            headerCell.alignment = { horizontal: 'left', vertical: 'middle' };
            ws.getRow(headerRow.number).height = 25;
            ws.addRow([]); // Spacing row

            Object.keys(roomsInSheet).forEach(roomName => {
                const items = roomsInSheet[roomName];
                if (!items?.length) return;

                // Room header
                const titleRow = ws.addRow([roomName]);
                ws.mergeCells(titleRow.number, 1, titleRow.number, selectionCols.length);
                const cell = ws.getCell(titleRow.number, 1);
                cell.font = { bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6F6D5' } };

                // Column headers
                const hdr = ws.addRow(selectionCols);
                hdr.eachCell(c => { c.font = { bold: true }; });

                // Room items
                items.forEach(item => {
                    const row = selectionCols.map(col => {
                        if (col === 'Room') return item.room || '';
                        if (col === '_rowNumber') return item._rowNumber || '';
                        if (col === 'Quantity') return item.quantity || 1;
                        if (col === 'Notes') return item.notes || '';
                        return item[col] ?? '';
                    });
                    ws.addRow(row);
                });
                ws.addRow([]); // Spacing
            });

            // Auto-size columns
            for (let i = 1; i <= selectionCols.length; i++) {
                const col = ws.getColumn(i);
                let max = 10;
                col.eachCell({ includeEmpty: true }, (cell) => {
                    const s = String(cell.value ?? '');
                    max = Math.max(max, s.length);
                });
                col.width = Math.min(Math.max(max + 2, 10), 60);
            }
        });

        const house = (State.houseName || 'Selections').replace(/[\/\\:?<>|*"]/g, '');
        const floor = State.floorPlan || 'Plan';
        const fileName = `${house} - ${floor} - selections.xlsx`;

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), fileName);
    } catch (err) {
        showError(`Export error: ${err.message}`);
    }
}

// Expose functions globally for HTML onclick handlers - do this immediately
window.handleAssignToCurrentRoom = handleConfirmSelection;
window.handleConfirmSelection = handleConfirmSelection;
window.handleAssignToRoom = handleAssignToRoom;
window.handleExport = handleExport;
window.handleConfirmHouse = handleConfirmHouse;
window.handleSetBedsBaths = handleSetBedsBaths;
window.handleRowSelect = handleRowSelect;
window.handleFileUpload = handleFileUpload;

// Also set up a fallback in case functions aren't ready yet
if (!window.handleSetBedsBaths) {
    window.handleSetBedsBaths = function() {
        if (typeof handleSetBedsBaths === 'function') {
            handleSetBedsBaths();
        } else {
            console.error('handleSetBedsBaths is not yet defined');
        }
    };
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Ensure State is available and initialize
    if (typeof window.State !== 'undefined' && typeof window.initializeState !== 'undefined') {
        window.initializeState();
    }
    initApp();
});
