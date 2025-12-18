/**
 * Event Listeners Setup
 */

function setupEventListeners(state, ui, handlers) {
    const el = ui.getElements();

    // File upload
    if (el.startScratchBtn) {
        el.startScratchBtn.addEventListener('click', () => {
            state.fileMode = 'scratch';
            el.fileInput.value = '';
            el.fileInput.click();
        });
    }

    if (el.fileInput) {
        el.fileInput.addEventListener('change', (e) => handlers.handleFileUpload(e, state, ui));
    }

    // House config
    if (el.confirmHouseBtn) {
        el.confirmHouseBtn.addEventListener('click', () => handlers.handleConfirmHouse(state, ui));
    }
    if (el.editHouseBtn) {
        el.editHouseBtn.addEventListener('click', () => handlers.handleEditHouse(state, ui));
    }

    // Beds/Baths
    if (el.setBedsBtn) {
        el.setBedsBtn.addEventListener('click', () => handlers.handleSetBedsBaths(state, ui));
    }
    if (el.editBedsBtn) {
        el.editBedsBtn.addEventListener('click', () => handlers.handleEditBedsBaths(state, ui));
    }

    // Extra rooms toggle
    document.addEventListener('click', (e) => {
        if (e.target?.classList?.contains('toggle-btn') && !e.target.disabled) {
            e.target.classList.toggle('active');
        }
    });

    // Row selection
    if (el.rowSelect) {
        el.rowSelect.addEventListener('change', (e) => handlers.handleRowSelect(e, state, ui));
    }

    // Confirm selection
    if (el.confirmSelectionBtn) {
        el.confirmSelectionBtn.addEventListener('click', () => handlers.handleConfirmSelection(state, ui));
    }

    // Assign to room
    if (el.assignBtn) {
        el.assignBtn.addEventListener('click', () => handlers.handleAssignToRoom(state, ui));
    }
    if (el.assignCurrentBtn) {
        el.assignCurrentBtn.addEventListener('click', () => handlers.handleConfirmSelection(state, ui));
    }

    // Export
    if (el.exportBtn) {
        el.exportBtn.addEventListener('click', () => handlers.handleExport(state, ui));
    }

    // New project
    if (el.newProjectBtn) {
        el.newProjectBtn.addEventListener('click', () => handlers.handleNewProject(state, ui));
    }
}

export { setupEventListeners };
