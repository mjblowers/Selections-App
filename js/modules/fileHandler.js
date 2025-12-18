/**
 * File Upload & Parsing
 */

const FileHandler = {
    /**
     * Handle file upload and parse spreadsheet
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
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                    if (jsonData.length < 2) {
                        throw new Error('Spreadsheet must have at least a header row and one data row');
                    }

                    state.headers = jsonData[0];
                    state.spreadsheetData = jsonData.slice(1).map((row, index) => {
                        const rowObj = { _rowNumber: index + 2 };
                        state.headers.forEach((header, i) => {
                            rowObj[header] = row[i] !== undefined ? row[i] : '';
                        });
                        return rowObj;
                    });

                    resolve({
                        fileName: file.name,
                        rowCount: state.spreadsheetData.length,
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
