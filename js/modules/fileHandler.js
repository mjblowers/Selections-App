/**
 * File Upload & Parsing
 */

const FileHandler = {
    /**
     * Check if a row is completely empty
     */
    isEmptyRow(row) {
        if (!row || row.length === 0) return true;
        return row.every(cell => cell === undefined || cell === null || cell === '');
    },

    /**
     * Handle file upload and parse all spreadsheet sheets
     */
    handleFileUpload(file, state) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
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
                                
                                // Stop at first empty row
                                if (FileHandler.isEmptyRow(row)) {
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
                    state.allSheets = allSheets;
                    state.sheetNames = Object.keys(allSheets);
                    
                    // Set first sheet as active
                    state.activeSheet = state.sheetNames[0];
                    state.headers = allSheets[state.activeSheet].headers;
                    state.spreadsheetData = allSheets[state.activeSheet].data;

                    resolve({
                        fileName: file.name,
                        rowCount: state.spreadsheetData.length,
                        sheetNames: state.sheetNames,
                        activeSheet: state.activeSheet,
                    });
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('File read failed'));
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Auto-assign rows based on 'existing' spec mode
     */
    autoAssignRows(state, rooms) {
        const matches = [];
        state.spreadsheetData.forEach((row) => {
            const col1 = row[state.headers[0]] ? String(row[state.headers[0]]).trim() : '';
            if (!col1) return;
            const matchedRoom = rooms.find(r => r.toLowerCase() === col1.toLowerCase());
            if (matchedRoom) {
                const item = { ...row, room: matchedRoom };
                matches.push(item);
            }
        });
        return matches;
    },
};

export { FileHandler };
