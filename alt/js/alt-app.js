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
        searchDisplayLimit: 10, // How many search results to show
        selectedItems: {}, // Structure: { category: { room: [items] } }
        showAllView: false, // Toggle between room view and all selections view
        applianceSupplier: '', // Supplier name for appliances
        cabinetFabricator: '', // Fabricator name for cabinets
        cabinetRoomFields: {}, // Per-room fields for cabinets: { room: { countertopMaterial: '', sinkType: '' } }
        projectConfig: {
            configured: false,
            houseName: '',
            rooms: '',
            baths: '',
            extraRooms: [], // Office, Den, Mudroom, Entry, Powder Bath, Pantry
            trimLevel: '',
            address: '',
            lotNumber: '',
            blockNumber: '',
            subdivisionName: ''
        }
    },

    // Storage key
    STORAGE_KEY: 'altSpreadsheetViewerState',

    // Product Groups and their categories
    PRODUCT_GROUPS: {
        '1': ['Tile', 'Countertops', 'Stone'],
        '2': ['Appliance 1', 'Appliance 2', 'Appliance 3', 'Appliance 4'],
        '3': ['Cabinet 1', 'Cabinet 2', 'Cabinet 3', 'Cabinet 4'],
        '4': ['Doors', 'Trim'],
        '5': ['Drywall'],
        '6': ['Fireplace'],
        '7': ['Flooring'],
        '8': ['Hardware'],
        '9': ['Lighting'],
        '10': ['Mirrors'],
        '11': ['Paint'],
        '12': ['Plumbing']
    },

    // Column headers per category
    CATEGORY_COLUMNS: {
        'Tile': ['Item', 'MFR', 'Name', 'Color', 'Finish', 'Size', 'Layout', 'Grout', 'Trim', 'Notes'],
        'Countertops': ['Location', 'MFR', 'Name', 'Finish', 'Material', 'Installer', 'Thickness', 'Backsplash', 'Notes'],
        'Stone': ['Location', 'MFR', 'Name', 'Color', 'Grout', 'Layout', 'Accessories', 'Notes'],
        // Appliance columns
        'Appliance 1': ['Item', 'MFR', 'Size', 'Finish', 'Config', 'Sku', 'Qty', 'Notes'],
        'Appliance 2': ['Item', 'MFR', 'Size', 'Finish', 'Config', 'Sku', 'Qty', 'Notes'],
        'Appliance 3': ['Item', 'MFR', 'Size', 'Finish', 'Config', 'Sku', 'Qty', 'Notes'],
        'Appliance 4': ['Item', 'MFR', 'Size', 'Finish', 'Config', 'Sku', 'Qty', 'Notes'],
        // Cabinet columns
        'Cabinet 1': ['Location', 'Wood Species', 'Door Style', 'Finish', 'Color/Stain', 'Lacquer', 'Notes'],
        'Cabinet 2': ['Location', 'Wood Species', 'Door Style', 'Finish', 'Color/Stain', 'Lacquer', 'Notes'],
        'Cabinet 3': ['Location', 'Wood Species', 'Door Style', 'Finish', 'Color/Stain', 'Lacquer', 'Notes'],
        'Cabinet 4': ['Location', 'Wood Species', 'Door Style', 'Finish', 'Color/Stain', 'Lacquer', 'Notes'],
        // Doors + Trim columns
        'Doors': ['Item', 'MFR', 'Model', 'Finish', 'Glass Type', 'Size', 'Notes'],
        'Trim': ['Item', 'Location', 'Detail', 'Material', 'Finish', 'Size', 'Installer', 'Notes'],
        // Drywall Finish columns
        'Drywall': ['Location', 'Detail', 'Notes'],
        // Fireplace columns
        'Fireplace': ['Item', 'Supplier', 'MFR', 'Name/Size', 'Box AFF', 'Surround Style', 'Mantle', 'Notes'],
        // Flooring columns
        'Flooring': ['Location', 'MFR', 'Name/Collection', 'Color', 'SKU', 'Thickness', 'Notes'],
        // Hardware columns
        'Hardware': ['Item', 'MFR', 'Name', 'Finish', 'Size', 'SKU', 'Qty', 'Notes'],
        // Lighting columns
        'Lighting': ['Item', 'MFR', 'Name/Size/Finish', 'SKU', 'Qty', 'Notes'],
        // Mirrors columns
        'Mirrors': ['Location', 'Size', 'Shape', 'Finish', 'Frame Type', 'Qty', 'Standoff', 'Notes'],
        // Paint columns
        'Paint': ['Item', 'Location', 'Finish', 'MFR', 'Color/Code', 'Notes'],
        // Plumbing columns
        'Plumbing': ['Item', 'MFR', 'Name', 'Finish', 'Config', 'SKU', 'Qty', 'Notes'],
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
            supplierField: document.getElementById('supplierField'),
            supplierInput: document.getElementById('supplierInput'),
            fabricatorField: document.getElementById('fabricatorField'),
            fabricatorInput: document.getElementById('fabricatorInput'),
            cabinetRoomFieldsContainer: document.getElementById('cabinetRoomFieldsContainer'),
            countertopMaterialInput: document.getElementById('countertopMaterialInput'),
            sinkTypeInput: document.getElementById('sinkTypeInput'),
            categoryTabsContainer: document.getElementById('categoryTabs'),
            roomTabsContainer: document.getElementById('roomTabs'),
            showAllToggle: document.getElementById('showAllToggle'),
            searchInput: document.getElementById('searchInput'),
            searchDropdown: document.getElementById('searchDropdown'),
            sheetSelect: document.getElementById('sheetSelect'),
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

        // Supplier input (for Appliances)
        this.els.supplierInput.addEventListener('change', (e) => {
            this.state.applianceSupplier = e.target.value.trim();
            this.saveState();
        });

        // Fabricator input (for Cabinet)
        this.els.fabricatorInput.addEventListener('change', (e) => {
            this.state.cabinetFabricator = e.target.value.trim();
            this.saveState();
        });

        // Countertop Material input (for Cabinet, per room)
        this.els.countertopMaterialInput.addEventListener('change', (e) => {
            const room = this.state.activeRoom;
            if (!this.state.cabinetRoomFields[room]) {
                this.state.cabinetRoomFields[room] = {};
            }
            this.state.cabinetRoomFields[room].countertopMaterial = e.target.value.trim();
            this.saveState();
        });

        // Sink Type input (for Cabinet, per room)
        this.els.sinkTypeInput.addEventListener('change', (e) => {
            const room = this.state.activeRoom;
            if (!this.state.cabinetRoomFields[room]) {
                this.state.cabinetRoomFields[room] = {};
            }
            this.state.cabinetRoomFields[room].sinkType = e.target.value.trim();
            this.saveState();
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

        // Sheet selector - switch active sheet
        this.els.sheetSelect.addEventListener('change', (e) => {
            const sheetName = e.target.value;
            if (sheetName && this.state.allSheets[sheetName]) {
                this.state.activeSheet = sheetName;
                this.state.headers = this.state.allSheets[sheetName].headers;
                this.state.spreadsheetData = this.state.allSheets[sheetName].data;
                this.state.searchQuery = '';
                this.state.searchDisplayLimit = 10; // Reset limit on sheet change
                this.els.searchInput.value = '';
                this.filterResults();
                this.render();
                this.updateStatus(`Switched to sheet: ${sheetName} (${this.state.spreadsheetData.length} rows)`);
            }
        });

        // Search input - show dropdown with filtered results
        this.els.searchInput.addEventListener('input', (e) => {
            this.state.searchQuery = e.target.value;
            this.state.searchDisplayLimit = 10; // Reset limit on new search
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
            extraRooms,
            trimLevel: document.getElementById('trimLevelSelect').value,
            address: document.getElementById('addressInput').value.trim(),
            lotNumber: document.getElementById('lotNumberInput').value.trim(),
            blockNumber: document.getElementById('blockNumberInput').value.trim(),
            subdivisionName: document.getElementById('subdivisionNameInput').value.trim()
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
            document.getElementById('trimLevelSelect').value = this.state.projectConfig.trimLevel || '';
            document.getElementById('addressInput').value = this.state.projectConfig.address || '';
            document.getElementById('lotNumberInput').value = this.state.projectConfig.lotNumber || '';
            document.getElementById('blockNumberInput').value = this.state.projectConfig.blockNumber || '';
            document.getElementById('subdivisionNameInput').value = this.state.projectConfig.subdivisionName || '';

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

        // Update sheet selector dropdown
        this.renderSheetSelector();

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
     * Render sheet selector dropdown
     */
    renderSheetSelector() {
        const select = this.els.sheetSelect;
        const currentValue = this.state.activeSheet;
        
        // Clear existing options
        select.innerHTML = '';
        
        if (this.state.sheetNames.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '-- Import a spreadsheet --';
            select.appendChild(option);
        } else {
            this.state.sheetNames.forEach(sheetName => {
                const option = document.createElement('option');
                option.value = sheetName;
                option.textContent = sheetName;
                if (sheetName === currentValue) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        }
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
     * Get product group ID for a given category
     */
    getProductGroupForCategory(category) {
        for (const [groupId, categories] of Object.entries(this.PRODUCT_GROUPS)) {
            if (categories.includes(category)) {
                return groupId;
            }
        }
        return '1'; // Default to first group
    },

    /**
     * Get rooms for current product group (handles Paint special case)
     */
    getRoomsForProductGroup(productGroup) {
        if (productGroup === '11') {
            // Paint uses Interior, Doors, Exterior
            return ['Interior', 'Doors', 'Exterior'];
        }
        return this.getRoomList();
    },

    /**
     * Render category tabs dynamically based on active product group
     */
    renderCategoryTabs() {
        const categories = this.PRODUCT_GROUPS[this.state.activeProductGroup] || [];
        this.els.categoryTabsContainer.innerHTML = '';

        // Hide all special fields by default
        this.els.supplierField.style.display = 'none';
        this.els.fabricatorField.style.display = 'none';
        this.els.cabinetRoomFieldsContainer.style.display = 'none';

        // For Appliances (product group 2), hide category tabs and show supplier field
        if (this.state.activeProductGroup === '2') {
            this.els.categoryTabsContainer.style.display = 'none';
            this.els.supplierField.style.display = 'flex';
            this.els.supplierInput.value = this.state.applianceSupplier || '';
            // Set default active category to first appliance category
            if (!categories.includes(this.state.activeCategory)) {
                this.state.activeCategory = categories[0] || 'Appliance 1';
            }
            return;
        }

        // For Cabinet (product group 3), hide category tabs and show fabricator + room fields
        if (this.state.activeProductGroup === '3') {
            this.els.categoryTabsContainer.style.display = 'none';
            this.els.fabricatorField.style.display = 'flex';
            this.els.fabricatorInput.value = this.state.cabinetFabricator || '';
            this.els.cabinetRoomFieldsContainer.style.display = 'flex';
            // Update room fields for current room
            const roomFields = this.state.cabinetRoomFields[this.state.activeRoom] || {};
            this.els.countertopMaterialInput.value = roomFields.countertopMaterial || '';
            this.els.sinkTypeInput.value = roomFields.sinkType || '';
            // Set default active category to first cabinet category
            if (!categories.includes(this.state.activeCategory)) {
                this.state.activeCategory = categories[0] || 'Cabinet 1';
            }
            return;
        }

        // For Drywall Finish (product group 5), hide category tabs (single category, no field)
        if (this.state.activeProductGroup === '5') {
            this.els.categoryTabsContainer.style.display = 'none';
            // Set default active category to Drywall
            if (!categories.includes(this.state.activeCategory)) {
                this.state.activeCategory = categories[0] || 'Drywall';
            }
            return;
        }

        // For Fireplace (product group 6), hide category tabs (single category, no field)
        if (this.state.activeProductGroup === '6') {
            this.els.categoryTabsContainer.style.display = 'none';
            // Set default active category to Fireplace
            if (!categories.includes(this.state.activeCategory)) {
                this.state.activeCategory = categories[0] || 'Fireplace';
            }
            return;
        }

        // For Flooring (product group 7), hide category tabs (single category, no field)
        if (this.state.activeProductGroup === '7') {
            this.els.categoryTabsContainer.style.display = 'none';
            // Set default active category to Flooring
            if (!categories.includes(this.state.activeCategory)) {
                this.state.activeCategory = categories[0] || 'Flooring';
            }
            return;
        }

        // For Hardware (product group 8), hide category tabs (single category, no field)
        if (this.state.activeProductGroup === '8') {
            this.els.categoryTabsContainer.style.display = 'none';
            // Set default active category to Hardware
            if (!categories.includes(this.state.activeCategory)) {
                this.state.activeCategory = categories[0] || 'Hardware';
            }
            return;
        }

        // For Lighting (product group 9), hide category tabs (single category, no field)
        if (this.state.activeProductGroup === '9') {
            this.els.categoryTabsContainer.style.display = 'none';
            // Set default active category to Lighting
            if (!categories.includes(this.state.activeCategory)) {
                this.state.activeCategory = categories[0] || 'Lighting';
            }
            return;
        }

        // For Mirrors (product group 10), hide category tabs (single category, no field)
        if (this.state.activeProductGroup === '10') {
            this.els.categoryTabsContainer.style.display = 'none';
            // Set default active category to Mirrors
            if (!categories.includes(this.state.activeCategory)) {
                this.state.activeCategory = categories[0] || 'Mirrors';
            }
            return;
        }

        // For Paint (product group 11), hide category tabs (single category, no field)
        if (this.state.activeProductGroup === '11') {
            this.els.categoryTabsContainer.style.display = 'none';
            // Set default active category to Paint
            if (!categories.includes(this.state.activeCategory)) {
                this.state.activeCategory = categories[0] || 'Paint';
            }
            return;
        }

        // For Plumbing (product group 12), hide category tabs (single category, no field)
        if (this.state.activeProductGroup === '12') {
            this.els.categoryTabsContainer.style.display = 'none';
            // Set default active category to Plumbing
            if (!categories.includes(this.state.activeCategory)) {
                this.state.activeCategory = categories[0] || 'Plumbing';
            }
            return;
        }

        this.els.categoryTabsContainer.style.display = '';

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
        this.els.roomTabsContainer.innerHTML = '';

        // Hide room tabs for Countertops and Stone (no room selection needed)
        const noRoomCategories = ['Countertops', 'Stone'];
        if (noRoomCategories.includes(this.state.activeCategory)) {
            this.els.roomTabsContainer.style.display = 'none';
            return;
        } else {
            this.els.roomTabsContainer.style.display = '';
        }

        // For Paint (product group 11), show Interior, Doors, Exterior instead of regular rooms
        const rooms = this.getRoomsForProductGroup(this.state.activeProductGroup);

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

        const displayLimit = this.state.searchDisplayLimit;
        const resultsToShow = results.slice(0, displayLimit);

        resultsToShow.forEach(row => {
            const item = document.createElement('div');
            item.className = 'search-dropdown-item';

            // Title: first column value
            const titleValue = row[this.state.headers[0]] || `Row ${row._rowNumber}`;
            const title = document.createElement('div');
            title.className = 'search-dropdown-item-title';
            title.textContent = titleValue;

            // Details: all remaining columns
            const details = document.createElement('div');
            details.className = 'search-dropdown-item-details';
            const detailParts = this.state.headers.slice(1).map(h => {
                const val = row[h];
                if (val !== undefined && val !== null && String(val).trim() !== '') {
                    return `${h}: ${val}`;
                }
                return null;
            }).filter(Boolean);
            details.textContent = detailParts.join(' | ');

            item.appendChild(title);
            item.appendChild(details);

            // Click to add to current room/category
            item.addEventListener('click', () => {
                this.addItemToRoom(row);
            });

            this.els.searchDropdown.appendChild(item);
        });

        // Show "load more" button if there are more results
        const remaining = results.length - displayLimit;
        if (remaining > 0) {
            const more = document.createElement('div');
            more.className = 'search-dropdown-item search-dropdown-more';
            more.style.textAlign = 'center';
            more.style.color = 'var(--primary-color)';
            more.style.fontWeight = '600';
            more.style.cursor = 'pointer';
            more.textContent = `Show 10 more (${remaining} remaining)`;
            more.addEventListener('click', (e) => {
                e.stopPropagation();
                this.state.searchDisplayLimit += 10;
                this.renderSearchDropdown();
            });
            this.els.searchDropdown.appendChild(more);
        }
    },

    /**
     * Add item to current room/category
     */
    addItemToRoom(row) {
        const category = this.state.activeCategory;
        // For Countertops and Stone, use a default key since no room selection
        const noRoomCategories = ['Countertops', 'Stone'];
        const room = noRoomCategories.includes(category) ? '_default' : this.state.activeRoom;

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
        const statusMsg = room === '_default' ? `Added item to ${category}` : `Added item to ${room} (${category})`;
        this.updateStatus(statusMsg);
    },

    /**
     * Remove item from room
     */
    removeItemFromRoom(itemId) {
        const category = this.state.activeCategory;
        const noRoomCategories = ['Countertops', 'Stone'];

        if (noRoomCategories.includes(category)) {
            // For Countertops/Stone, remove from _default room
            if (this.state.selectedItems[category] && this.state.selectedItems[category]['_default']) {
                const idx = this.state.selectedItems[category]['_default'].findIndex(it => it._id === itemId);
                if (idx !== -1) {
                    this.state.selectedItems[category]['_default'].splice(idx, 1);
                    this.saveState();
                    this.render();
                }
            }
        } else if (this.state.showAllView) {
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
        const noRoomCategories = ['Countertops', 'Stone'];

        this.els.selectedItemsList.innerHTML = '';

        if (noRoomCategories.includes(category)) {
            // For Countertops/Stone, show items from _default room
            const items = (this.state.selectedItems[category] && this.state.selectedItems[category]['_default']) || [];
            this.renderRoomItems('_default', items, columns, category, false);
        } else if (this.state.showAllView) {
            // Aggregated view - show all rooms with dividers
            this.renderAllRoomsItems(category, columns);
        } else {
            // Single room view - still show room header
            const room = this.state.activeRoom;
            const items = (this.state.selectedItems[category] && this.state.selectedItems[category][room]) || [];
            
            // Add room divider header
            const divider = document.createElement('div');
            divider.className = 'room-divider';
            divider.innerHTML = `
                <span class="room-divider-label">${room} (${items.length})</span>
                <span class="room-divider-line"></span>
            `;
            this.els.selectedItemsList.appendChild(divider);
            
            this.renderRoomItems(room, items, columns, category, false);
        }
    },

    /**
     * Render all rooms items with dividers
     */
    renderAllRoomsItems(category, columns) {
        // Get appropriate rooms for the category's product group
        const productGroup = this.getProductGroupForCategory(category);
        const rooms = this.getRoomsForProductGroup(productGroup);
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

                // Check if this column should be a dropdown (for Tile: Layout, Grout, Trim)
                const isDropdownColumn = category === 'Tile' && this.DROPDOWN_OPTIONS[col];

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

    // Product Group Names for export
    PRODUCT_GROUP_NAMES: {
        '1': 'Countertop + Tile + Stone',
        '2': 'Appliances',
        '3': 'Cabinet',
        '4': 'Doors + Trim',
        '5': 'Drywall Finish',
        '6': 'Fireplace',
        '7': 'Flooring',
        '8': 'Hardware',
        '9': 'Lighting',
        '10': 'Mirrors',
        '11': 'Paint',
        '12': 'Plumbing'
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
            summaryWs.addRow(['Trim Level', this.state.projectConfig.trimLevel || '']);
            summaryWs.addRow(['Address', this.state.projectConfig.address || '']);
            summaryWs.addRow(['Subdivision', this.state.projectConfig.subdivisionName || '']);
            summaryWs.addRow(['Lot Number', this.state.projectConfig.lotNumber || '']);
            summaryWs.addRow(['Block Number', this.state.projectConfig.blockNumber || '']);
            summaryWs.addRow(['Rooms', this.state.projectConfig.rooms || '']);
            summaryWs.addRow(['Baths', this.state.projectConfig.baths || '']);
            summaryWs.addRow(['Exported At', new Date().toLocaleString()]);

            // Create one sheet per product group that has items
            Object.entries(this.PRODUCT_GROUPS).forEach(([groupId, categories]) => {
                // Check if this product group has any items
                let groupHasItems = false;
                categories.forEach(category => {
                    const categoryItems = this.state.selectedItems[category];
                    if (categoryItems) {
                        Object.values(categoryItems).forEach(roomItems => {
                            if (roomItems && roomItems.length > 0) groupHasItems = true;
                        });
                    }
                });

                if (!groupHasItems) return;

                // Create sheet for this product group
                const groupName = this.PRODUCT_GROUP_NAMES[groupId] || `Product Group ${groupId}`;
                const ws = workbook.addWorksheet(groupName.substring(0, 31)); // Excel sheet name limit

                // Pre-calculate max columns for header rows
                let maxColumns = 0;
                categories.forEach(category => {
                    const categoryItems = this.state.selectedItems[category];
                    if (!categoryItems) return;
                    let categoryHasItems = false;
                    Object.values(categoryItems).forEach(roomItems => {
                        if (roomItems && roomItems.length > 0) categoryHasItems = true;
                    });
                    if (!categoryHasItems) return;
                    
                    let colCount = this.CATEGORY_COLUMNS[category].length;
                    if (category === 'Stone') colCount += 2;
                    else if (category === 'Countertops') colCount += 1;
                    maxColumns = Math.max(maxColumns, colCount);
                });

                // Project config for header rows
                const config = this.state.projectConfig;
                
                // Header Row 1: Tab Name - Subdivision Lot # Block #
                const headerText1 = `${groupName.toUpperCase()} - ${(config.subdivisionName || '').toUpperCase()} LOT ${(config.lotNumber || '').toUpperCase()} BLOCK ${(config.blockNumber || '').toUpperCase()}`;
                const headerRow1 = ws.addRow([headerText1]);
                headerRow1.height = 30;
                ws.mergeCells(headerRow1.number, 1, headerRow1.number, maxColumns);
                const headerCell1 = ws.getCell(headerRow1.number, 1);
                headerCell1.font = { bold: true, color: { argb: 'FF000000' } };
                headerCell1.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF3CB371' } // Medium Sea Green (lighter)
                };
                headerCell1.alignment = { horizontal: 'center', vertical: 'middle' };
                headerCell1.border = {
                    top: { style: 'medium', color: { argb: 'FF000000' } },
                    left: { style: 'medium', color: { argb: 'FF000000' } },
                    bottom: { style: 'medium', color: { argb: 'FF000000' } },
                    right: { style: 'medium', color: { argb: 'FF000000' } }
                };

                // Header Row 2: Address + spacing + Trim Level + spacing + House Name
                // Create array with values at specific positions for spacing effect
                const headerRow2Data = [];
                headerRow2Data[0] = (config.address || '').toUpperCase();
                // Position trim level after ~5 columns
                const trimPos = Math.min(5, Math.floor(maxColumns / 3));
                headerRow2Data[trimPos] = (config.trimLevel || '').toUpperCase();
                // Position house name after another ~5 columns  
                const housePos = Math.min(trimPos + 5, Math.floor(2 * maxColumns / 3));
                headerRow2Data[housePos] = (config.houseName || '').toUpperCase();
                
                const headerRow2 = ws.addRow(headerRow2Data);
                ws.mergeCells(headerRow2.number, 1, headerRow2.number, maxColumns);
                const headerCell2 = ws.getCell(headerRow2.number, 1);
                // Combine all values into single merged cell with tab spacing
                headerCell2.value = `${(config.address || '').toUpperCase()}          ${(config.trimLevel || '').toUpperCase()}          ${(config.houseName || '').toUpperCase()}`;
                headerCell2.font = { bold: true };
                headerCell2.alignment = { horizontal: 'center', vertical: 'middle' };
                headerCell2.border = {
                    top: { style: 'medium', color: { argb: 'FF000000' } },
                    left: { style: 'medium', color: { argb: 'FF000000' } },
                    bottom: { style: 'medium', color: { argb: 'FF000000' } },
                    right: { style: 'medium', color: { argb: 'FF000000' } }
                };

                // Blank row after header
                ws.addRow([]);

                // Add each category that has items
                categories.forEach(category => {
                    const categoryItems = this.state.selectedItems[category];
                    if (!categoryItems) return;

                    // Collect all items across all rooms for this category
                    let categoryHasItems = false;
                    Object.values(categoryItems).forEach(roomItems => {
                        if (roomItems && roomItems.length > 0) categoryHasItems = true;
                    });

                    if (!categoryHasItems) return;

                    // For Countertops add 1 blank column, for Stone add 2 blank columns after Notes for merging
                    let columns;
                    let mergeCount = 0; // How many extra columns to merge with Notes
                    if (category === 'Stone') {
                        columns = [...this.CATEGORY_COLUMNS[category], '', ''];
                        mergeCount = 2;
                    } else if (category === 'Countertops') {
                        columns = [...this.CATEGORY_COLUMNS[category], ''];
                        mergeCount = 1;
                    } else {
                        columns = [...this.CATEGORY_COLUMNS[category]];
                    }
                    const notesColIndex = columns.indexOf('Notes') + 1; // 1-based for ExcelJS
                    const needsMerge = mergeCount > 0;

                    // Category header - black background with white text (capitalized)
                    const categoryRow = ws.addRow([category.toUpperCase()]);
                    ws.mergeCells(categoryRow.number, 1, categoryRow.number, columns.length);
                    const categoryCell = ws.getCell(categoryRow.number, 1);
                    categoryCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    categoryCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF000000' }
                    };
                    categoryCell.alignment = { vertical: 'middle', horizontal: 'left' };

                    // Blank row after category header
                    ws.addRow([]);

                    // Row border style (includes left/right for first/last cells)
                    const rowBorderMiddle = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } }
                    };
                    const rowBorderLeft = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        left: { style: 'thin', color: { argb: 'FF000000' } }
                    };
                    const rowBorderRight = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } }
                    };
                    const rowBorderBoth = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } }
                    };
                    // Thick row border style for room headers
                    const thickRowBorder = {
                        top: { style: 'medium', color: { argb: 'FF000000' } },
                        left: { style: 'medium', color: { argb: 'FF000000' } },
                        bottom: { style: 'medium', color: { argb: 'FF000000' } },
                        right: { style: 'medium', color: { argb: 'FF000000' } }
                    };

                    // Column headers (capitalized)
                    const headerRow = ws.addRow(columns.map(col => col.toUpperCase()));
                    headerRow.eachCell((cell, colNumber) => {
                        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FF808080' }
                        };
                        // Apply appropriate border based on position
                        if (colNumber === 1 && columns.length === 1) {
                            cell.border = rowBorderBoth;
                        } else if (colNumber === 1) {
                            cell.border = rowBorderLeft;
                        } else if (colNumber === columns.length) {
                            cell.border = rowBorderRight;
                        } else {
                            cell.border = rowBorderMiddle;
                        }
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    });
                    // Merge Notes header with blank columns for Countertops/Stone
                    if (needsMerge && notesColIndex > 0) {
                        ws.mergeCells(headerRow.number, notesColIndex, headerRow.number, notesColIndex + mergeCount);
                        // Ensure merged header cell has right border
                        const mergedHeaderCell = ws.getCell(headerRow.number, notesColIndex);
                        mergedHeaderCell.border = {
                            top: { style: 'thin', color: { argb: 'FF000000' } },
                            bottom: { style: 'thin', color: { argb: 'FF000000' } },
                            right: { style: 'thin', color: { argb: 'FF000000' } }
                        };
                    }

                    // For Appliances (product group 2), add supplier row after column headers
                    if (groupId === '2' && this.state.applianceSupplier) {
                        // Blank row before supplier
                        ws.addRow([]);
                        
                        // Supplier row
                        const supplierText = `SUPPLIER: ${this.state.applianceSupplier.toUpperCase()}`;
                        const supplierRow = ws.addRow([supplierText]);
                        supplierRow.height = 25;
                        ws.mergeCells(supplierRow.number, 1, supplierRow.number, columns.length);
                        const supplierCell = ws.getCell(supplierRow.number, 1);
                        supplierCell.font = { bold: true };
                        supplierCell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFC6F6D5' } // Light green
                        };
                        supplierCell.alignment = { horizontal: 'center', vertical: 'middle' };
                        supplierCell.border = thickRowBorder;
                        
                        // Blank row after supplier
                        ws.addRow([]);
                    }

                    // For Cabinet (product group 3), add fabricator row after column headers
                    if (groupId === '3' && this.state.cabinetFabricator) {
                        // Blank row before fabricator
                        ws.addRow([]);
                        
                        // Fabricator row
                        const fabricatorText = `FABRICATOR: ${this.state.cabinetFabricator.toUpperCase()}`;
                        const fabricatorRow = ws.addRow([fabricatorText]);
                        fabricatorRow.height = 25;
                        ws.mergeCells(fabricatorRow.number, 1, fabricatorRow.number, columns.length);
                        const fabricatorCell = ws.getCell(fabricatorRow.number, 1);
                        fabricatorCell.font = { bold: true };
                        fabricatorCell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFC6F6D5' } // Light green
                        };
                        fabricatorCell.alignment = { horizontal: 'center', vertical: 'middle' };
                        fabricatorCell.border = thickRowBorder;
                        
                        // Blank row after fabricator
                        ws.addRow([]);
                    }

                    // Categories that don't need room grouping
                    const noRoomCategories = ['Countertops', 'Stone'];
                    const skipRoomHeaders = noRoomCategories.includes(category);

                    // For categories without room grouping, get all items regardless of room key
                    if (skipRoomHeaders) {
                        // Collect all items from all room keys
                        Object.values(categoryItems).forEach(roomItems => {
                            roomItems.forEach(item => {
                                const rowData = columns.map(col => {
                                    if (col === '') return ''; // Blank merge column
                                    return item[col] !== undefined ? item[col] : '';
                                });
                                const dataRow = ws.addRow(rowData);
                                dataRow.height = 25;
                                // Apply row border and center alignment to all data cells
                                dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                                    // Apply appropriate border based on position
                                    if (colNumber === 1 && columns.length === 1) {
                                        cell.border = rowBorderBoth;
                                    } else if (colNumber === 1) {
                                        cell.border = rowBorderLeft;
                                    } else if (colNumber === columns.length) {
                                        cell.border = rowBorderRight;
                                    } else {
                                        cell.border = rowBorderMiddle;
                                    }
                                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                                });
                                // Merge Notes with blank column(s) for Countertops/Stone
                                if (needsMerge && notesColIndex > 0) {
                                    ws.mergeCells(dataRow.number, notesColIndex, dataRow.number, notesColIndex + mergeCount);
                                    // Ensure merged cell has right border (lost during merge)
                                    const mergedCell = ws.getCell(dataRow.number, notesColIndex);
                                    mergedCell.border = {
                                        top: { style: 'thin', color: { argb: 'FF000000' } },
                                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                                        right: { style: 'thin', color: { argb: 'FF000000' } }
                                    };
                                    mergedCell.alignment = { horizontal: 'center', vertical: 'middle' };
                                }
                            });
                        });
                    } else {
                        // Group by room
                        const rooms = this.getRoomsForProductGroup(groupId);
                        let isFirstRoom = true;
                        rooms.forEach(room => {
                            const roomItems = categoryItems[room] || [];
                            if (roomItems.length === 0) return;

                            // Blank row between rooms (not before first room)
                            if (!isFirstRoom) {
                                ws.addRow([]);
                            }
                            isFirstRoom = false;

                            // Room section header (capitalized, thick border)
                            const roomRow = ws.addRow([room.toUpperCase()]);
                            ws.mergeCells(roomRow.number, 1, roomRow.number, columns.length);
                            const roomCell = ws.getCell(roomRow.number, 1);
                            roomCell.font = { bold: true };
                            roomCell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFC6F6D5' }
                            };
                            roomCell.border = thickRowBorder;

                            // For Cabinet (product group 3), add Countertop Material and Sink Type rows
                            if (groupId === '3') {
                                const roomFields = this.state.cabinetRoomFields[room] || {};
                                
                                if (roomFields.countertopMaterial) {
                                    const ctMaterialRow = ws.addRow([`Countertop Material: ${roomFields.countertopMaterial}`]);
                                    ctMaterialRow.height = 15;
                                    ws.mergeCells(ctMaterialRow.number, 1, ctMaterialRow.number, columns.length);
                                    const ctMaterialCell = ws.getCell(ctMaterialRow.number, 1);
                                    ctMaterialCell.font = { bold: false };
                                    ctMaterialCell.fill = {
                                        type: 'pattern',
                                        pattern: 'solid',
                                        fgColor: { argb: 'FFD3D3D3' } // Light grey
                                    };
                                    ctMaterialCell.alignment = { horizontal: 'left', vertical: 'middle' };
                                    ctMaterialCell.border = rowBorderBoth;
                                }
                                
                                if (roomFields.sinkType) {
                                    const sinkTypeRow = ws.addRow([`Sink Type: ${roomFields.sinkType}`]);
                                    sinkTypeRow.height = 15;
                                    ws.mergeCells(sinkTypeRow.number, 1, sinkTypeRow.number, columns.length);
                                    const sinkTypeCell = ws.getCell(sinkTypeRow.number, 1);
                                    sinkTypeCell.font = { bold: false };
                                    sinkTypeCell.fill = {
                                        type: 'pattern',
                                        pattern: 'solid',
                                        fgColor: { argb: 'FFD3D3D3' } // Light grey
                                    };
                                    sinkTypeCell.alignment = { horizontal: 'left', vertical: 'middle' };
                                    sinkTypeCell.border = rowBorderBoth;
                                }
                            }

                            // Items
                            roomItems.forEach(item => {
                                const rowData = columns.map(col => {
                                    if (col === '') return ''; // Blank merge column
                                    return item[col] !== undefined ? item[col] : '';
                                });
                                const dataRow = ws.addRow(rowData);
                                dataRow.height = 25;
                                // Apply row border and center alignment to all data cells
                                dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                                    // Apply appropriate border based on position
                                    if (colNumber === 1 && columns.length === 1) {
                                        cell.border = rowBorderBoth;
                                    } else if (colNumber === 1) {
                                        cell.border = rowBorderLeft;
                                    } else if (colNumber === columns.length) {
                                        cell.border = rowBorderRight;
                                    } else {
                                        cell.border = rowBorderMiddle;
                                    }
                                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                                });
                                // Merge Notes with blank column(s)
                                if (needsMerge && notesColIndex > 0) {
                                    ws.mergeCells(dataRow.number, notesColIndex, dataRow.number, notesColIndex + mergeCount);
                                    // Ensure merged cell has right border (lost during merge)
                                    const mergedCell = ws.getCell(dataRow.number, notesColIndex);
                                    mergedCell.border = {
                                        top: { style: 'thin', color: { argb: 'FF000000' } },
                                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                                        right: { style: 'thin', color: { argb: 'FF000000' } }
                                    };
                                    mergedCell.alignment = { horizontal: 'center', vertical: 'middle' };
                                }
                            });
                        });
                    }

                    // Spacer between categories
                    ws.addRow([]);
                    ws.addRow([]);
                });

                // Auto-size columns, passing columns array to handle Notes
                this.autosizeExcelColumns(ws, maxColumns, categories);
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
    autosizeExcelColumns(ws, colCount, categories) {
        try {
            // Set all columns to width of 15
            for (let i = 1; i <= colCount; i++) {
                const col = ws.getColumn(i);
                col.width = 15;
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
