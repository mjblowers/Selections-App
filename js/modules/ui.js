/**
 * UI Rendering & Updates
 */

window.UI = {
    /**
     * Get all DOM elements
     */
    getElements() {
        return {
            // Upload
            startScratchBtn: document.getElementById('startScratchBtn'),
            newProjectBtn: document.getElementById('newProjectBtn'),
            fileInput: document.getElementById('fileInput'),
            fileName: document.getElementById('fileName'),
            errorDiv: document.getElementById('error'),
            
            // House config
            houseNameInput: document.getElementById('houseNameInput'),
            confirmHouseBtn: document.getElementById('confirmHouseBtn'),
            editHouseBtn: document.getElementById('editHouseBtn'),
            floorPlanSelect: document.getElementById('floorPlanSelect'),
            
            // Beds/Baths
            bedsInput: document.getElementById('bedsInput'),
            bathsInput: document.getElementById('bathsInput'),
            setBedsBtn: document.getElementById('setBedsBtn'),
            editBedsBtn: document.getElementById('editBedsBtn'),
            
            // Row selection
            selectorSection: document.getElementById('selectorSection'),
            rowSelect: document.getElementById('rowSelect'),
            subsectionSelect: document.getElementById('subsectionSelect'),
            confirmSelectionBtn: document.getElementById('confirmSelectionBtn'),
            
            // Row details
            rowDetails: document.getElementById('rowDetails'),
            detailsContent: document.getElementById('detailsContent'),
            roomSelect: document.getElementById('roomSelect'),
            assignBtn: document.getElementById('assignBtn'),
            assignCurrentBtn: document.getElementById('assignCurrentBtn'),
            
            // Selected items
            selectedItemsSection: document.getElementById('selectedItems'),
            roomTabs: document.getElementById('roomTabs'),
            roomTabContent: document.getElementById('roomTabContent'),
            
            // Export
            exportBtn: document.getElementById('exportBtn'),
        };
    },

    /**
     * Show error message
     */
    showError(message, duration = 3000) {
        const el = document.getElementById('error');
        el.textContent = message;
        el.style.display = 'block';
        if (duration > 0) {
            setTimeout(() => {
                if (el.textContent === message) {
                    el.textContent = '';
                }
            }, duration);
        }
    },

    /**
     * Clear error message
     */
    clearError() {
        document.getElementById('error').textContent = '';
    },

    /**
     * Populate row dropdown
     */
    populateRowDropdown(rowSelect, headers, spreadsheetData) {
        rowSelect.innerHTML = '<option value="">-- Choose a row --</option>';
        spreadsheetData.forEach((row, index) => {
            const option = document.createElement('option');
            option.value = index;
            const displayValues = headers.slice(0, 3).map(h => row[h]).filter(v => v !== '');
            option.textContent = `Row ${row._rowNumber}: ${displayValues.join(' - ')}`;
            rowSelect.appendChild(option);
        });
    },

    /**
     * Populate room dropdown
     */
    populateRoomDropdown(roomSelect, rooms) {
        roomSelect.innerHTML = '<option value="">-- Choose a room --</option>';
        rooms.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r;
            opt.textContent = r;
            roomSelect.appendChild(opt);
        });
    },

    /**
     * Display row details
     */
    displayRowDetails(detailsContent, headers, row) {
        detailsContent.innerHTML = '';
        headers.forEach(header => {
            const item = document.createElement('div');
            item.className = 'detail-item';

            const label = document.createElement('span');
            label.className = 'detail-label';
            label.textContent = header;

            const value = document.createElement('span');
            value.className = 'detail-value';
            value.textContent = row[header] !== '' ? row[header] : '(empty)';

            item.appendChild(label);
            item.appendChild(value);
            detailsContent.appendChild(item);
        });
    },

    /**
     * Render selected items with room tabs and subsections
     */
    renderSelectedItems(state, headers) {
        const { roomTabs, roomTabContent } = this.getElements();
        roomTabs.innerHTML = '';
        roomTabContent.innerHTML = '';

        // Group by room
        const grouped = {};
        state.rooms.forEach(r => grouped[r] = []);
        grouped['Unassigned'] = [];

        state.selectedItems.forEach(it => {
            const key = it.room && grouped[it.room] ? it.room : 'Unassigned';
            grouped[key].push(it);
        });

        const roomNames = Object.keys(grouped);

        // Preserve active tab
        if (!state.activeRoomTab || !roomNames.includes(state.activeRoomTab)) {
            const roomWithItems = roomNames.find(r => grouped[r] && grouped[r].length > 0);
            state.activeRoomTab = roomWithItems || roomNames[0] || 'Unassigned';
        }

        // Create tabs and content
        roomNames.forEach(roomName => {
            const count = grouped[roomName] ? grouped[roomName].length : 0;
            
            // Tab button
            const btn = document.createElement('button');
            btn.className = 'room-tab-btn';
            btn.setAttribute('type', 'button');
            btn.dataset.room = roomName;
            btn.textContent = roomName + (count ? ` (${count})` : '');
            if (roomName === state.activeRoomTab) btn.classList.add('active');
            roomTabs.appendChild(btn);

            // Content div
            const contentDiv = document.createElement('div');
            contentDiv.className = 'room-section';
            contentDiv.dataset.room = roomName;
            contentDiv.style.display = roomName === state.activeRoomTab ? 'block' : 'none';

            const title = document.createElement('div');
            title.className = 'room-title';
            title.textContent = roomName;
            contentDiv.appendChild(title);

            const items = grouped[roomName] || [];
            if (!items || items.length === 0) {
                const emptyNote = document.createElement('div');
                emptyNote.style.color = '#888';
                emptyNote.style.fontSize = '13px';
                emptyNote.style.padding = '8px 0';
                emptyNote.textContent = 'No items yet.';
                contentDiv.appendChild(emptyNote);
            } else {
                // Group by subsection
                const subsectionGroups = {};
                items.forEach(it => {
                    const ss = it.subsection || 'Subsection 1';
                    if (!subsectionGroups[ss]) subsectionGroups[ss] = [];
                    subsectionGroups[ss].push(it);
                });

                // Render subsections
                Object.keys(subsectionGroups).sort().forEach(subsection => {
                    const header = document.createElement('div');
                    header.className = 'subsection-header';
                    header.textContent = subsection;
                    contentDiv.appendChild(header);

                    subsectionGroups[subsection].forEach(item => {
                        const itemDiv = this.createItemElement(item, headers, state);
                        contentDiv.appendChild(itemDiv);
                    });
                });
            }

            roomTabContent.appendChild(contentDiv);
        });

        // Tab switching
        roomTabs.onclick = (e) => {
            const btn = e.target.closest('button.room-tab-btn');
            if (!btn) return;
            const newRoom = btn.dataset.room;
            if (!newRoom || newRoom === state.activeRoomTab) return;

            Array.from(roomTabs.children).forEach(b => b.classList.toggle('active', b.dataset.room === newRoom));
            Array.from(roomTabContent.children).forEach(div => {
                div.style.display = div.dataset.room === newRoom ? 'block' : 'none';
            });
            state.activeRoomTab = newRoom;
        };
    },

    /**
     * Create a single item element
     */
    createItemElement(item, headers, state) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'selected-item';

        const content = document.createElement('div');
        content.className = 'selected-item-content';

        const summary = document.createElement('div');
        summary.className = 'selected-item-summary';
        const displayValues = headers.slice(0, 3).map(h => item[h]).filter(v => v !== '');
        summary.textContent = `Row ${item._rowNumber}: ${displayValues.join(' - ')}`;

        const details = document.createElement('div');
        details.className = 'selected-item-details';
        details.textContent = headers.map(h => `${h}: ${item[h]}`).join(' | ');

        content.appendChild(summary);
        content.appendChild(details);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => this.deleteSelectedItem(item._rowNumber, item.room, item.subsection, state);

        itemDiv.appendChild(content);
        itemDiv.appendChild(deleteBtn);
        return itemDiv;
    },

    /**
     * Delete a selected item
     */
    deleteSelectedItem(rowNumber, room, subsection, state) {
        const matchSub = subsection || 'Subsection 1';
        const idx = state.selectedItems.findIndex(
            it => it._rowNumber === rowNumber && it.room === room && ((it.subsection || 'Subsection 1') === matchSub)
        );
        if (idx !== -1) {
            state.selectedItems.splice(idx, 1);
            this.renderSelectedItems(state, state.headers);
            return;
        }
        // Fallback: remove first match by rowNumber
        const fallback = state.selectedItems.findIndex(it => it._rowNumber === rowNumber);
        if (fallback !== -1) {
            state.selectedItems.splice(fallback, 1);
            this.renderSelectedItems(state, state.headers);
        }
    },

    /**
     * Set section visibility
     */
    setSection(sectionId, visible) {
        const el = document.getElementById(sectionId);
        if (el) {
            el.classList.toggle('active', visible);
        }
    },

    /**
     * Set button visibility
     */
    setButtonVisibility(buttonId, visible) {
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.style.display = visible ? 'inline-block' : 'none';
        }
    },

    /**
     * Set input disabled state
     */
    setInputDisabled(inputId, disabled) {
        const input = document.getElementById(inputId);
        if (input) {
            input.disabled = disabled;
        }
    },
};
