/**
 * Room Management
 */

const RoomManager = {
    /**
     * Update rooms array from dynamic sources
     */
    updateRooms(state) {
        const set = new Set();
        state.baseRooms.forEach(r => set.add(r));
        state.dynamicBedrooms.forEach(r => set.add(r));
        state.dynamicBaths.forEach(r => set.add(r));
        if (state.selectedExtraRooms && Array.isArray(state.selectedExtraRooms)) {
            state.selectedExtraRooms.forEach(r => set.add(r));
        }
        state.rooms = Array.from(set);
    },

    /**
     * Generate bedroom list
     */
    generateBedrooms(count) {
        return Array.from({ length: count }, (_, i) => `Bedroom ${i + 1}`);
    },

    /**
     * Generate bathroom list
     */
    generateBathrooms(count) {
        return Array.from({ length: count }, (_, i) => `Bath ${i + 1}`);
    },

    /**
     * Get selected extra rooms from UI
     */
    getSelectedExtraRooms() {
        const buttons = document.querySelectorAll('#extraRoomsGroup .toggle-btn.active');
        return Array.from(buttons).map(b => b.getAttribute('data-room'));
    },

    /**
     * Set selected extra rooms in UI
     */
    setSelectedExtraRoomsInUI(rooms) {
        document.querySelectorAll('#extraRoomsGroup .toggle-btn').forEach(btn => {
            const room = btn.getAttribute('data-room');
            if (rooms.includes(room)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },

    /**
     * Lock/unlock room configuration UI
     */
    setRoomConfigLocked(locked) {
        const bedsInput = document.getElementById('bedsInput');
        const bathsInput = document.getElementById('bathsInput');
        const setBedsBtn = document.getElementById('setBedsBtn');
        const editBedsBtn = document.getElementById('editBedsBtn');
        const toggles = document.querySelectorAll('#extraRoomsGroup .toggle-btn');

        if (locked) {
            bedsInput.disabled = true;
            bathsInput.disabled = true;
            toggles.forEach(b => b.disabled = true);
            setBedsBtn.style.display = 'none';
            editBedsBtn.style.display = 'inline-block';
        } else {
            bedsInput.disabled = false;
            bathsInput.disabled = false;
            toggles.forEach(b => b.disabled = false);
            setBedsBtn.style.display = 'inline-block';
            editBedsBtn.style.display = 'none';
        }
    },
};

export { RoomManager };
