/**
 * Excel Export Functionality
 */

const ExcelExport = {
    /**
     * Export selected items to Excel workbook
     */
    async exportToExcel(state, headers) {
        if (!state.selectedItems || state.selectedItems.length === 0) {
            throw new Error('Nothing to export.');
        }

        if (!window.ExcelJS || !window.saveAs) {
            throw new Error('ExcelJS or FileSaver not available.');
        }

        const dataHeaders = headers.slice().filter(k => k !== 'subsection');
        const selectionCols = ['Room', '_rowNumber', ...dataHeaders];

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Selection App';
        workbook.created = new Date();

        // Summary sheet
        this.addSummarySheet(workbook, state);

        // All Selections sheet
        this.addAllSelectionsSheet(workbook, state, selectionCols);

        // Per-room sheets
        this.addRoomSheets(workbook, state, selectionCols);

        // Write file
        const fileName = this.generateFileName(state);
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), fileName);
    },

    /**
     * Add summary sheet
     */
    addSummarySheet(workbook, state) {
        const summaryWs = workbook.addWorksheet('Summary');
        summaryWs.addRow(['House Name', state.houseName || '']);
        summaryWs.addRow(['Floor Plan', state.floorPlan || '']);
        summaryWs.addRow(['Exported At', new Date().toLocaleString()]);
    },

    /**
     * Add all selections sheet with autosizing
     */
    addAllSelectionsSheet(workbook, state, selectionCols) {
        const allWs = workbook.addWorksheet('All Selections');
        const headerRow = allWs.addRow(selectionCols);
        this.styleBoldHeader(headerRow);

        state.selectedItems.forEach(item => {
            const row = selectionCols.map(col => {
                if (col === 'Room') return item.room || '';
                if (col === '_rowNumber') return item._rowNumber || '';
                return item[col] !== undefined ? item[col] : '';
            });
            allWs.addRow(row);
        });

        this.autosizeColumns(allWs, selectionCols.length);
    },

    /**
     * Add per-room sheets with subsection grouping
     */
    addRoomSheets(workbook, state, selectionCols) {
        const grouped = {};
        state.rooms.forEach(r => grouped[r] = []);
        grouped['Unassigned'] = [];

        state.selectedItems.forEach(it => {
            const key = it.room && grouped[it.room] ? it.room : 'Unassigned';
            grouped[key].push(it);
        });

        Object.keys(grouped).forEach(roomName => {
            const items = grouped[roomName];
            if (!items || items.length === 0) return;

            const sheetName = this.sanitizeSheetName(roomName);
            const ws = workbook.addWorksheet(sheetName);

            // Group by subsection
            const subsectionGroups = {};
            items.forEach(it => {
                const ss = it.subsection || 'Subsection 1';
                if (!subsectionGroups[ss]) subsectionGroups[ss] = [];
                subsectionGroups[ss].push(it);
            });

            // Render subsections
            Object.keys(subsectionGroups).sort().forEach(subsection => {
                // Subsection title row
                const titleRow = ws.addRow([subsection]);
                this.styleSectionTitle(ws, titleRow, selectionCols.length);

                // Header row
                const hdr = ws.addRow(selectionCols);
                this.styleBoldHeader(hdr);

                // Items
                subsectionGroups[subsection].forEach(item => {
                    const row = selectionCols.map(col => {
                        if (col === 'Room') return item.room || '';
                        if (col === '_rowNumber') return item._rowNumber || '';
                        return item[col] !== undefined ? item[col] : '';
                    });
                    ws.addRow(row);
                });

                // Spacer
                ws.addRow([]);
            });

            this.autosizeColumns(ws, selectionCols.length);
        });
    },

    /**
     * Style bold header
     */
    styleBoldHeader(row) {
        try {
            row.eachCell(cell => {
                cell.font = { bold: true };
            });
        } catch (e) {
            // ignore
        }
    },

    /**
     * Style section title (bold + green fill + merged)
     */
    styleSectionTitle(ws, row, colCount) {
        try {
            ws.mergeCells(row.number, 1, row.number, colCount);
            const cell = ws.getCell(row.number, 1);
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFC6F6D5' },
            };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
        } catch (e) {
            // ignore
        }
    },

    /**
     * Auto-size columns based on content
     */
    autosizeColumns(ws, colCount) {
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
    },

    /**
     * Sanitize sheet name for Excel
     */
    sanitizeSheetName(name) {
        const safe = String(name).replace(/[\/\\\?\*\[\]:]/g, '').slice(0, 31) || 'Sheet';
        return safe;
    },

    /**
     * Generate Excel file name
     */
    generateFileName(state) {
        const house = (state.houseName || 'Selections').replace(/[\/\\:?<>|*"]/g, '');
        const floor = state.floorPlan || 'Plan';
        return `${house} - ${floor} - selections.xlsx`;
    },
};

export { ExcelExport };
