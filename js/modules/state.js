/**
 * Global State Management
 */

window.State = {
    // Spreadsheet data
    spreadsheetData: [],
    headers: [],
    
    // Room configuration
    baseRooms: [],
    dynamicBedrooms: [],
    dynamicBaths: [],
    rooms: [],
    selectedExtraRooms: [],
    
    // House configuration
    houseName: '',
    floorPlan: '',
    beds: 0,
    baths: 0,
    
    // Selected items
    selectedItems: [],
    currentSelectedRow: null,
    activeRoomTab: null,
    
    // UI state
    fileMode: 'scratch', // 'scratch' or 'existing'
};

window.initializeState = function() {
    window.State.rooms = [...window.State.baseRooms];
}

window.resetState = function() {
    window.State.spreadsheetData = [];
    window.State.headers = [];
    window.State.dynamicBedrooms = [];
    window.State.dynamicBaths = [];
    window.State.selectedExtraRooms = [];
    window.State.houseName = '';
    window.State.floorPlan = '';
    window.State.beds = 0;
    window.State.baths = 0;
    window.State.selectedItems = [];
    window.State.currentSelectedRow = null;
    window.State.activeRoomTab = null;
    window.State.fileMode = 'scratch';
    window.State.rooms = [...window.State.baseRooms];
}
