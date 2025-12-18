/**
 * Local Storage Management
 */

const StorageManager = {
    /**
     * Save current state to localStorage
     */
    saveState(state) {
        try {
            const data = {
                selectedItems: state.selectedItems,
                dynamicBedrooms: state.dynamicBedrooms,
                dynamicBaths: state.dynamicBaths,
                selectedExtraRooms: state.selectedExtraRooms,
                houseName: state.houseName,
                floorPlan: state.floorPlan,
                beds: state.beds,
                baths: state.baths,
                activeRoomTab: state.activeRoomTab,
                spreadsheetData: state.spreadsheetData,
                headers: state.headers,
            };
            localStorage.setItem('selectionAppState', JSON.stringify(data));
        } catch (err) {
            console.error('Failed to save state:', err);
        }
    },

    /**
     * Load state from localStorage
     */
    loadState() {
        try {
            const saved = localStorage.getItem('selectionAppState');
            return saved ? JSON.parse(saved) : null;
        } catch (err) {
            console.error('Failed to load state:', err);
            return null;
        }
    },

    /**
     * Clear all saved state
     */
    clearState() {
        try {
            localStorage.removeItem('selectionAppState');
        } catch (err) {
            console.error('Failed to clear state:', err);
        }
    },
};

export { StorageManager };
