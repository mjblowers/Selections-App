/**
 * Alt Spreadsheet Viewer - Standalone JavaScript
 * Handles file import, search, category filtering, and state persistence
 */

const AltApp = {
    // State
    state: {
        spreadsheetData: [],
        headers: [],
        allSheets: {},
        sheetNames: [],
        activeSheet: null,
        activeProductGroup: '1', // Product Group 1-6
        activeCategory: 'Tile', // Current active category within the group
        activeRoom: 'Kitchen', // Kitchen, Pantry, Laundry, Master Bath, Powder Bath
        searchQuery: '',
        filteredResults: [],
        selectedItems: {}, // Structure: { category: { room: [items] } }
        showAllView: false, // Toggle between room view and all selections view
        projectConfig: {
            configured: false,
            houseName: '',
            rooms: '',
            baths: '',
            extraRooms: [] // Office, Den, Mudroom, Entry, Powder Bath, Pantry
        }
    },

    // Storage key
    STORAGE_KEY: 'altSpreadsheetViewerState',

    // Product Groups and their categories
    PRODUCT_GROUPS: {
        '1': ['Tile', 'Countertops', 'Stone'],
        '2': ['Material 1', 'Material 2', 'Material 3', 'Material 4'],
        '3': ['Material 1', 'Material 2', 'Material 3', 'Material 4'],
        '4': ['Material 1', 'Material 2', 'Material 3', 'Material 4'],
        '5': ['Material 1', 'Material 2', 'Material 3', 'Material 4'],
        '6': ['Material 1', 'Material 2', 'Material 3', 'Material 4']
    },

    // Column headers per category
    CATEGORY_COLUMNS: {
        'Tile': ['Item', 'MFR', 'Name', 'Color', 'Finish', 'Size', 'Layout', 'Grout', 'Trim', 'Notes'],
        'Countertops': ['Location', 'MFR', 'Name', 'Finish', 'Material', 'Installer', 'Thickness', 'Backsplash', 'Notes'],
        'Stone': ['Location', 'MFR', 'Name', 'Color', 'Grout', 'Layout', 'Accessories', 'Notes'],
        // Default columns for placeholder materials
        'Material 1': ['Item', 'MFR', 'Name', 'Color', 'Size', 'Notes'],
        'Material 2': ['Item', 'MFR', 'Name', 'Color', 'Size', 'Notes'],
        'Material 3': ['Item', 'MFR', 'Name', 'Color', 'Size', 'Notes'],
        'Material 4': ['Item', 'MFR', 'Name', 'Color', 'Size', 'Notes']
    },

    // Dropdown options for specific columns
    DROPDOWN_OPTIONS: {
        'Layout': ['', 'Layout1', 'Layout2', 'Layout3'],
        'Grout': ['', 'Grout1', 'Grout2', 'Grout3'],
        'Trim': ['', 'Trim1', 'Trim2', 'Trim3']
    },

    /**
     * Initialize the application
     */
    init() {
        this.bindElements();
        this.bindEvents();
        this.loadState();
        this.render();
    },

    /**
     * Bind DOM elements
     */
    bindElements() {
        this.els = {
            // Config elements
            configSection: document.getElementById('configSection'),
            configDisplay: document.getElementById('configDisplay'),
            configDisplayText: document.getElementById('configDisplayText'),
            houseNameInput: document.getElementById('houseNameInput'),
            roomsInput: document.getElementById('roomsInput'),
            bathsInput: document.getElementById('bathsInput'),
            extraRoomsCheckboxes: document.querySelectorAll('#extraRoomsCheckboxes input[type="checkbox"]'),
            acceptConfigBtn: document.getElementById('acceptConfigBtn'),
            settingsCog: document.getElementById('settingsCog'),
            mainContent: document.getElementById('mainContent'),
            // Main elements
            importBtn: document.getElementById('importBtn'),
            clearBtn: document.getElementById('clearBtn'),
            exportBtn: document.getElementById('exportBtn'),
            fileInput: document.getElementById('fileInput'),
            productGroupSelect: document.getElementById('productGroupSelect'),
            categoryTabsContainer: document.getElementById('categoryTabs'),
            roomTabsContainer: document.getElementById('roomTabs'),
            showAllToggle: document.getElementById('showAllToggle'),
            searchInput: document.getElementById('searchInput'),
            searchDropdown: document.getElementById('searchDropdown'),
            selectedItemsList: document.getElementById('selectedItemsList'),
            errorMessage: document.getElementById('errorMessage'),
            statusBar: document.getElementById('statusBar'),
            emptyState: document.getElementById('emptyState'),
            columnHeaderRow: document.getElementById('columnHeaderRow')
        };
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Accept config button
        this.els.acceptConfigBtn.addEventListener('click', () => {
            this.acceptConfiguration();
        });

        // Settings cog button
        this.els.settingsCog.addEventListener('click', () => {
            this.showConfiguration();
        });

        // Import button
        this.els.importBtn.addEventListener('click', () => {
            this.els.fileInput.click();
        });

        // File input change
        this.els.fileInput.addEventListener('change', (e) => {
            this.handleFileImport(e);
        });

        // Clear button
        this.els.clearBtn.addEventListener('click', () => {
            this.clearData();
        });

        // Export button
        this.els.exportBtn.addEventListener('click', () => {
            this.exportToExcel();
        });

        // Product group select
        this.els.productGroupSelect.addEventListener('change', (e) => {
            this.setProductGroup(e.target.value);
        });

        // Category tabs (event delegation on container)
        this.els.categoryTabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.category-tab');
            if (tab && tab.dataset.category) {
                this.setCategory(tab.dataset.category);
            }
        });

        // Room tabs (event delegation on container)
        this.els.roomTabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.room-tab');
            if (tab && tab.dataset.room) {
                this.setRoom(tab.dataset.room);
            }
        });

        // Show All toggle
        this.els.showAllToggle.addEventListener('click', () => {
            this.state.showAllView = !this.state.showAllView;
            this.render();
        });

        // Search input - show dropdown with filtered results
        this.els.searchInput.addEventListener('input', (e) => {
            this.state.searchQuery = e.target.value;
            this.filterResults();
            this.renderSearchDropdown();
        });

        // Search input focus - show dropdown if has results
        this.els.searchInput.addEventListener('focus', () => {
            if (this.state.searchQuery && this.state.filteredResults.length > 0) {
                this.els.searchDropdown.classList.add('active');
            }
        });

        // Click outside to close dropdown
        document.addEventListener('click', (e) => {
            if (!this.els.searchInput.contains(e.target) && !this.els.searchDropdown.contains(e.target)) {
                this.els.searchDropdown.classList.remove('active');
            }
        });
    },

    /**
     * Accept project configuration
     */
    acceptConfiguration() {
        const houseName = this.els.houseNameInput.value.trim();
        const rooms = this.els.roomsInput.value.trim();
        const baths = this.els.bathsInput.value.trim();

        // Collect checked extra rooms
        const extraRooms = [];
        this.els.extraRoomsCheckboxes.forEach(cb => {
            if (cb.checked) {
                extraRooms.push(cb.dataset.room);
            }
        });

        // Require at least house name
        if (!houseName) {
            this.showError('Please enter a house name');
            return;
        }

        this.state.projectConfig = {
            configured: true,
            houseName,
            rooms,
            baths,
            extraRooms
        };

        this.saveState();
        this.render();
    },

    /**
     * Show configuration form (when cog is clicked)
     */
    showConfiguration() {
        this.state.projectConfig.configured = false;
        this.saveState();
        this.render();
    },

    /**
     * Render configuration state (show/hide config vs main content)
     */
    renderConfigState() {
        const { configured, houseName, rooms, baths } = this.state.projectConfig;

        if (configured) {
            // Hide config form, show main content
            this.els.configSection.style.display = 'none';
            this.els.mainContent.style.display = 'block';
            this.els.settingsCog.style.display = 'block';

            // Show config display text
            let displayText = `<strong>${houseName}</strong>`;
            if (rooms || baths) {
                displayText += ` — ${rooms || 0} Rooms, ${baths || 0} Baths`;
            }
            this.els.configDisplayText.innerHTML = displayText;
            this.els.configDisplay.style.display = 'block';
        } else {
            // Show config form, hide main content
            this.els.configSection.style.display = 'block';
            this.els.mainContent.style.display = 'none';
            this.els.settingsCog.style.display = 'none';
            this.els.configDisplay.style.display = 'none';

            // Populate inputs with existing values
            this.els.houseNameInput.value = houseName || '';
            this.els.roomsInput.value = rooms || '';
            this.els.bathsInput.value = baths || '';

            // Restore checkbox states
            const extraRooms = this.state.projectConfig.extraRooms || [];
            this.els.extraRoomsCheckboxes.forEach(cb => {
                cb.checked = extraRooms.includes(cb.dataset.room);
            });
        }
    },

    /**
     * Handle file import
     */
    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onerror = () => {
            this.showError('Failed to read file');
        };

        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                const allSheets = {};
                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (jsonData.length < 2) return;

                    const headers = jsonData[0].map(h => String(h || '').trim()).filter(h => h);
                    if (headers.length === 0) return;

                    const dataRows = [];
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (!row || row.length === 0) continue;

                        const isEmpty = row.every(cell => cell === undefined || cell === null || String(cell).trim() === '');
                        if (isEmpty) break;

                        const rowObj = { _rowNumber: i + 1 };
                        headers.forEach((header, j) => {
                            rowObj[header] = row[j] !== undefined ? row[j] : '';
                        });
                        dataRows.push(rowObj);
                    }

                    if (dataRows.length > 0) {
                        allSheets[sheetName] = { headers, data: dataRows };
                    }
                });

                if (Object.keys(allSheets).length === 0) {
                    throw new Error('No valid sheets found');
                }

                // Update state
                this.state.allSheets = allSheets;
                this.state.sheetNames = Object.keys(allSheets);
                this.state.activeSheet = this.state.sheetNames[0];
                this.state.headers = allSheets[this.state.activeSheet].headers;
                this.state.spreadsheetData = allSheets[this.state.activeSheet].data;

                this.saveState();
                this.filterResults();
                this.render();
                this.updateStatus(`Loaded ${this.state.spreadsheetData.length} rows from ${file.name}`);

            } catch (error) {
                this.showError(`Import error: ${error.message}`);
            }
        };

        reader.readAsArrayBuffer(file);
        e.target.value = ''; // Reset input
    },

    /**
     * Set active product group
     */
    setProductGroup(group) {
        this.state.activeProductGroup = group;
        // Reset to first category in the new group
        const categories = this.PRODUCT_GROUPS[group] || [];
        this.state.activeCategory = categories[0] || 'Tile';
        this.saveState();
        this.render();
    },

    /**
     * Set active category
     */
    setCategory(category) {
        this.state.activeCategory = category;
        this.saveState();
        this.render();
    },

    /**
     * Set active room
     */
    setRoom(room) {
        this.state.activeRoom = room;
        this.state.showAllView = false; // Turn off Show All when selecting a room
        this.saveState();
        this.render();
    },

    /**
     * Filter results based on search query and category
     */
    filterResults() {
        const query = this.state.searchQuery.toLowerCase().trim();
        
        if (!this.state.spreadsheetData.length) {
            this.state.filteredResults = [];
            return;
        }

        let results = [...this.state.spreadsheetData];

        // Filter by search query
        if (query) {
            results = results.filter(row => {
                return this.state.headers.some(header => {
                    const value = String(row[header] || '').toLowerCase();
                    return value.includes(query);
                });
            });
        }

        this.state.filteredResults = results;
    },

    /**
     * Render column headers based on active category
     */
    renderColumnHeaders() {
        const columns = this.CATEGORY_COLUMNS[this.state.activeCategory] || [];
        this.els.columnHeaderRow.innerHTML = '';

        columns.forEach(col => {
            const div = document.createElement('div');
            div.className = 'column-header';
            div.textContent = col;
            this.els.columnHeaderRow.appendChild(div);
        });
    },

    /**
     * Render the UI
     */
    render() {
        // Render configuration state first
        this.renderConfigState();

        const hasData = this.state.spreadsheetData.length > 0;

        // Update clear button state
        this.els.clearBtn.disabled = !hasData;

        // Update export button state - enabled if any selected items exist
        const hasSelectedItems = this.getTotalSelectedCount() > 0;
        this.els.exportBtn.disabled = !hasSelectedItems;

        // Show/hide empty state
        this.els.emptyState.style.display = hasData ? 'none' : 'block';

        // Update product group select
        this.els.productGroupSelect.value = this.state.activeProductGroup;

        // Render dynamic category tabs based on product group
        this.renderCategoryTabs();

        // Render dynamic room tabs
        this.renderRoomTabs();

        // Update Show All toggle state
        this.els.showAllToggle.classList.toggle('active', this.state.showAllView);
        this.els.showAllToggle.textContent = this.state.showAllView ? 'Show By Room' : 'Show All';

        this.filterResults();
        this.renderColumnHeaders();
        this.renderSelectedItems();
    },

    /**
     * Get list of rooms based on beds/baths configuration
     */
    getRoomList() {
        const rooms = ['Kitchen', 'Laundry'];
        
        const bedsCount = parseInt(this.state.projectConfig.rooms) || 0;
        const bathsCount = parseInt(this.state.projectConfig.baths) || 0;
        const extraRooms = this.state.projectConfig.extraRooms || [];

        // Add bedroom tabs
        for (let i = 1; i <= bedsCount; i++) {
            rooms.push(`Bedroom ${i}`);
        }

        // Add bath tabs (first bath is always "Master Bath")
        for (let i = 1; i <= bathsCount; i++) {
            if (i === 1) {
                rooms.push('Master Bath');
            } else {
                rooms.push(`Bath ${i}`);
            }
        }

        // Add extra rooms from checkboxes
        extraRooms.forEach(room => {
            if (!rooms.includes(room)) {
                rooms.push(room);
            }
        });

        return rooms;
    },

    /**
     * Render category tabs dynamically based on active product group
     */
    renderCategoryTabs() {
        const categories = this.PRODUCT_GROUPS[this.state.activeProductGroup] || [];
        this.els.categoryTabsContainer.innerHTML = '';

        // Ensure activeCategory is valid for current group
        if (!categories.includes(this.state.activeCategory)) {
            this.state.activeCategory = categories[0] || 'Tile';
        }

        categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'category-tab';
            btn.dataset.category = category;
            
            const count = this.getCategoryCount(category);
            btn.textContent = count > 0 ? `${category} (${count})` : category;
            
            if (category === this.state.activeCategory) {
                btn.classList.add('active');
            }
            
            this.els.categoryTabsContainer.appendChild(btn);
        });
    },

    /**
     * Render room tabs dynamically
     */
    renderRoomTabs() {
        const rooms = this.getRoomList();
        this.els.roomTabsContainer.innerHTML = '';

        // Dim room tabs when in Show All mode
        this.els.roomTabsContainer.classList.toggle('dimmed', this.state.showAllView);

        // Ensure activeRoom is valid
        if (!rooms.includes(this.state.activeRoom)) {
            this.state.activeRoom = rooms[0] || 'Kitchen';
        }

        rooms.forEach(room => {
            const btn = document.createElement('button');
            btn.className = 'room-tab';
            btn.dataset.room = room;
            
            const count = this.getRoomCount(this.state.activeCategory, room);
            btn.textContent = count > 0 ? `${room} (${count})` : room;
            
            if (room === this.state.activeRoom && !this.state.showAllView) {
                btn.classList.add('active');
            }
            
            this.els.roomTabsContainer.appendChild(btn);
        });
    },

    /**
     * Get count of items for a category (across all rooms)
     */
    getCategoryCount(category) {
        const categoryItems = this.state.selectedItems[category];
        if (!categoryItems) return 0;
        let count = 0;
        Object.values(categoryItems).forEach(roomItems => {
            count += roomItems.length;
        });
        return count;
    },

    /**
     * Get count of items for a specific room within a category
     */
    getRoomCount(category, room) {
        const categoryItems = this.state.selectedItems[category];
        if (!categoryItems || !categoryItems[room]) return 0;
        return categoryItems[room].length;
    },

    /**
     * Render search dropdown with filtered results
     */
    renderSearchDropdown() {
        const results = this.state.filteredResults;
        this.els.searchDropdown.innerHTML = '';

        if (!this.state.searchQuery || results.length === 0) {
            this.els.searchDropdown.classList.remove('active');
            return;
        }

        this.els.searchDropdown.classList.add('active');

        // Limit to first 10 results
        results.slice(0, 10).forEach(row => {
            const item = document.createElement('div');
            item.className = 'search-dropdown-item';

            // Title: first few column values
            const titleValues = this.state.headers.slice(0, 2).map(h => row[h]).filter(v => v).join(' - ');
            const title = document.createElement('div');
            title.className = 'search-dropdown-item-title';
            title.textContent = titleValues || `Row ${row._rowNumber}`;

            // Details: remaining columns
            const details = document.createElement('div');
            details.className = 'search-dropdown-item-details';
            details.textContent = this.state.headers.slice(2, 4).map(h => `${h}: ${row[h] || ''}`).join(' | ');

            item.appendChild(title);
            item.appendChild(details);

            // Click to add to current room/category
            item.addEventListener('click', () => {
                this.addItemToRoom(row);
            });

            this.els.searchDropdown.appendChild(item);
        });

        if (results.length > 10) {
            const more = document.createElement('div');
            more.className = 'search-dropdown-item';
            more.style.textAlign = 'center';
            more.style.color = '#999';
            more.textContent = `+ ${results.length - 10} more results...`;
            this.els.searchDropdown.appendChild(more);
        }
    },

    /**
     * Add item to current room/category
     */
    addItemToRoom(row) {
        const category = this.state.activeCategory;
        const room = this.state.activeRoom;

        // Initialize structure if needed
        if (!this.state.selectedItems[category]) {
            this.state.selectedItems[category] = {};
        }
        if (!this.state.selectedItems[category][room]) {
            this.state.selectedItems[category][room] = [];
        }

        // Create item with editable fields based on category columns
        const columns = this.CATEGORY_COLUMNS[category];
        const newItem = {
            _id: Date.now(),
            _rowNumber: row._rowNumber,
            _sourceData: { ...row }
        };

        // Initialize field values from source data - match columns flexibly
        columns.forEach(col => {
            const colLower = col.toLowerCase();
            let value = '';

            // Try exact match first
            if (row[col] !== undefined && row[col] !== '') {
                value = row[col];
            } else {
                // Try case-insensitive match against all source headers
                for (const key of Object.keys(row)) {
                    if (key.startsWith('_')) continue; // Skip internal fields
                    const keyLower = key.toLowerCase();
                    
                    // Exact case-insensitive match
                    if (keyLower === colLower) {
                        value = row[key];
                        break;
                    }
                    // Partial match - column contains the target or target contains column
                    if (keyLower.includes(colLower) || colLower.includes(keyLower)) {
                        value = row[key];
                        break;
                    }
                    // Special mappings
                    if (colLower === 'name' && (keyLower.includes('product') || keyLower.includes('name'))) {
                        value = row[key];
                        break;
                    }
                    if (colLower === 'mfr' && (keyLower.includes('manufacturer') || keyLower.includes('mfr') || keyLower.includes('brand'))) {
                        value = row[key];
                        break;
                    }
                }
            }

            newItem[col] = value;
        });

        this.state.selectedItems[category][room].push(newItem);

        // Clear search and close dropdown
        this.els.searchInput.value = '';
        this.state.searchQuery = '';
        this.els.searchDropdown.classList.remove('active');

        this.saveState();
        this.renderSelectedItems();
        this.updateStatus(`Added item to ${room} (${category})`);
    },

    /**
     * Remove item from room
     */
    removeItemFromRoom(itemId) {
        const category = this.state.activeCategory;

        if (this.state.showAllView) {
            // In aggregated view, search all rooms for the item
            const categoryItems = this.state.selectedItems[category];
            if (categoryItems) {
                for (const room of Object.keys(categoryItems)) {
                    const idx = categoryItems[room].findIndex(it => it._id === itemId);
                    if (idx !== -1) {
                        categoryItems[room].splice(idx, 1);
                        this.saveState();
                        this.render();
                        return;
                    }
                }
            }
        } else {
            // Single room view
            const room = this.state.activeRoom;
            if (this.state.selectedItems[category] && this.state.selectedItems[category][room]) {
                const idx = this.state.selectedItems[category][room].findIndex(it => it._id === itemId);
                if (idx !== -1) {
                    this.state.selectedItems[category][room].splice(idx, 1);
                    this.saveState();
                    this.render();
                }
            }
        }
    },

    /**
     * Render selected items for current room/category (or all rooms if showAllView)
     */
    renderSelectedItems() {
        const category = this.state.activeCategory;
        const columns = this.CATEGORY_COLUMNS[category];

        this.els.selectedItemsList.innerHTML = '';

        if (this.state.showAllView) {
            // Aggregated view - show all rooms with dividers
            this.renderAllRoomsItems(category, columns);
        } else {
            // Single room view
            const room = this.state.activeRoom;
            const items = (this.state.selectedItems[category] && this.state.selectedItems[category][room]) || [];
            this.renderRoomItems(room, items, columns, category, false);
        }
    },

    /**
     * Render all rooms items with dividers
     */
    renderAllRoomsItems(category, columns) {
        const rooms = this.getRoomList();
        let hasAnyItems = false;

        rooms.forEach(room => {
            const items = (this.state.selectedItems[category] && this.state.selectedItems[category][room]) || [];
            if (items.length === 0) return;

            hasAnyItems = true;

            // Room divider
            const divider = document.createElement('div');
            divider.className = 'room-divider';
            divider.innerHTML = `
                <span class="room-divider-label">${room} (${items.length})</span>
                <span class="room-divider-line"></span>
            `;
            this.els.selectedItemsList.appendChild(divider);

            // Render items for this room
            this.renderRoomItems(room, items, columns, category, true);
        });

        if (!hasAnyItems) {
            const emptyRow = document.createElement('div');
            emptyRow.style.cssText = 'text-align: center; padding: 20px; color: #999;';
            emptyRow.textContent = `No items added for ${category}. Use the search above to add items.`;
            this.els.selectedItemsList.appendChild(emptyRow);
        }
    },

    /**
     * Render items for a single room
     */
    renderRoomItems(room, items, columns, category, isAggregatedView) {
        if (items.length === 0 && !isAggregatedView) {
            const emptyRow = document.createElement('div');
            emptyRow.style.cssText = 'text-align: center; padding: 20px; color: #999;';
            emptyRow.textContent = `No items added to ${room} for ${category}. Use the search above to add items.`;
            this.els.selectedItemsList.appendChild(emptyRow);
            return;
        }

        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'selected-item-row';

            columns.forEach(col => {
                const cell = document.createElement('div');
                cell.className = 'selected-item-cell';

                // Check if this column should be a dropdown (for Tile: Layout, Grout, Trim when empty)
                const isDropdownColumn = category === 'Tile' && this.DROPDOWN_OPTIONS[col] && !item[col];

                if (isDropdownColumn) {
                    const select = document.createElement('select');
                    this.DROPDOWN_OPTIONS[col].forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt;
                        option.textContent = opt || `-- ${col} --`;
                        if (item[col] === opt) option.selected = true;
                        select.appendChild(option);
                    });
                    select.addEventListener('change', (e) => {
                        item[col] = e.target.value;
                        this.saveState();
                    });
                    cell.appendChild(select);
                } else {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = item[col] || '';
                    input.placeholder = col;
                    input.addEventListener('change', (e) => {
                        item[col] = e.target.value;
                        this.saveState();
                    });
                    cell.appendChild(input);
                }

                row.appendChild(cell);
            });

            // Delete button cell
            const deleteCell = document.createElement('div');
            deleteCell.className = 'selected-item-cell';
            deleteCell.style.flex = '0 0 60px';
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-item-btn';
            deleteBtn.textContent = '✕';
            deleteBtn.addEventListener('click', () => {
                this.removeItemFromRoom(item._id);
            });
            deleteCell.appendChild(deleteBtn);
            row.appendChild(deleteCell);

            this.els.selectedItemsList.appendChild(row);
        });
    },

    /**
     * Clear all data
     */
    clearData() {
        if (!confirm('Clear all imported data and selections?')) return;

        this.state.spreadsheetData = [];
        this.state.headers = [];
        this.state.allSheets = {};
        this.state.sheetNames = [];
        this.state.activeSheet = null;
        this.state.searchQuery = '';
        this.state.filteredResults = [];
        this.state.selectedItems = {};

        this.els.searchInput.value = '';
        this.saveState();
        this.render();
        this.updateStatus('Data cleared');
    },

    /**
     * Save state to localStorage
     */
    saveState() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
        } catch (err) {
            console.error('Failed to save state:', err);
        }
    },

    /**
     * Load state from localStorage
     */
    loadState() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(this.state, parsed);
                // Ensure selectedItems exists
                if (!this.state.selectedItems) {
                    this.state.selectedItems = {};
                }
                // Ensure projectConfig exists
                if (!this.state.projectConfig) {
                    this.state.projectConfig = {
                        configured: false,
                        houseName: '',
                        rooms: '',
                        baths: '',
                        extraRooms: []
                    };
                }
                // Ensure extraRooms array exists in projectConfig
                if (!this.state.projectConfig.extraRooms) {
                    this.state.projectConfig.extraRooms = [];
                }
                // Ensure activeProductGroup exists
                if (!this.state.activeProductGroup) {
                    this.state.activeProductGroup = '1';
                }
                this.els.searchInput.value = this.state.searchQuery || '';
            }
        } catch (err) {
            console.error('Failed to load state:', err);
        }
    },

    /**
     * Show error message
     */
    showError(message) {
        this.els.errorMessage.textContent = message;
        this.els.errorMessage.classList.add('active');
        setTimeout(() => {
            this.els.errorMessage.classList.remove('active');
        }, 5000);
    },

    /**
     * Update status bar
     */
    updateStatus(message) {
        this.els.statusBar.textContent = message;
    },

    /**
     * Count total selected items across all categories/rooms
     */
    getTotalSelectedCount() {
        let count = 0;
        Object.values(this.state.selectedItems).forEach(categoryItems => {
            Object.values(categoryItems).forEach(roomItems => {
                count += roomItems.length;
            });
        });
        return count;
    },

    /**
     * Export all selected items to Excel
     */
    async exportToExcel() {
        const totalItems = this.getTotalSelectedCount();
        if (totalItems === 0) {
            this.showError('Nothing to export.');
            return;
        }

        if (!window.ExcelJS || !window.saveAs) {
            this.showError('ExcelJS or FileSaver not available.');
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Alt Selection App';
            workbook.created = new Date();

            // Summary sheet
            const summaryWs = workbook.addWorksheet('Summary');
            summaryWs.addRow(['House Name', this.state.projectConfig.houseName || '']);
            summaryWs.addRow(['Rooms', this.state.projectConfig.rooms || '']);
            summaryWs.addRow(['Baths', this.state.projectConfig.baths || '']);
            summaryWs.addRow(['Exported At', new Date().toLocaleString()]);

            // Create sheet per category that has items
            const categories = Object.keys(this.CATEGORY_COLUMNS);
            
            categories.forEach(category => {
                const categoryItems = this.state.selectedItems[category];
                if (!categoryItems) return;

                // Collect all items across all rooms for this category
                const allItems = [];
                Object.entries(categoryItems).forEach(([room, items]) => {
                    items.forEach(item => {
                        allItems.push({ ...item, _room: room });
                    });
                });

                if (allItems.length === 0) return;

                const columns = ['Room', ...this.CATEGORY_COLUMNS[category]];
                const ws = workbook.addWorksheet(category);

                // Header row
                const headerRow = ws.addRow(columns);
                headerRow.eachCell(cell => {
                    cell.font = { bold: true };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF808080' }
                    };
                    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                });

                // Group by room (use dynamic room list)
                const rooms = this.getRoomList();
                rooms.forEach(room => {
                    const roomItems = categoryItems[room] || [];
                    if (roomItems.length === 0) return;

                    // Room section header
                    const roomRow = ws.addRow([room]);
                    ws.mergeCells(roomRow.number, 1, roomRow.number, columns.length);
                    const roomCell = ws.getCell(roomRow.number, 1);
                    roomCell.font = { bold: true };
                    roomCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFC6F6D5' }
                    };

                    // Items
                    roomItems.forEach(item => {
                        const rowData = columns.map(col => {
                            if (col === 'Room') return room;
                            return item[col] !== undefined ? item[col] : '';
                        });
                        ws.addRow(rowData);
                    });

                    // Spacer
                    ws.addRow([]);
                });

                // Auto-size columns
                this.autosizeExcelColumns(ws, columns.length);
            });

            // Generate filename
            const houseName = (this.state.projectConfig.houseName || 'Selections').replace(/[\/\\:?<>|*"]/g, '');
            const fileName = `${houseName} - selections.xlsx`;

            // Write and download
            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), fileName);

            this.updateStatus(`Exported ${totalItems} items to Excel`);
        } catch (err) {
            console.error('Export failed:', err);
            this.showError('Export failed: ' + err.message);
        }
    },

    /**
     * Auto-size Excel columns
     */
    autosizeExcelColumns(ws, colCount) {
        try {
            for (let i = 1; i <= colCount; i++) {
                const col = ws.getColumn(i);
                let max = 10;
                col.eachCell({ includeEmpty: true }, (cell) => {
                    const v = cell.value;
                    const s = v === null || v === undefined ? '' : String(v);
                    max = Math.max(max, s.length);
                });
                col.width = Math.min(Math.max(max + 2, 10), 60);
            }
        } catch (e) {
            console.warn('Autosize failed:', e);
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    AltApp.init();
});
