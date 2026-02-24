const ExcelJS = require("exceljs");

/**
 * Export data to Excel
 * @param {Array} data - Array of objects
 * @param {Object} options - Export options
 * @returns {Promise<Buffer>} Excel file buffer
 */
const exportToExcel = async (data, options = {}) => {
  const {
    sheetName = "Sheet1",
    columns = null,
    headerStyle = {},
    fileName = "export.xlsx"
  } = options;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Auto-detect columns if not provided
  if (!columns && data.length > 0) {
    const firstRow = data[0];
    worksheet.columns = Object.keys(firstRow).map(key => ({
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      key,
      width: 20
    }));
  } else if (columns) {
    worksheet.columns = columns;
  }

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, size: 12 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: headerStyle.backgroundColor || "FFE0E0E0" }
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  // Add data
  worksheet.addRows(data);

  // Auto-filter
  if (data.length > 0) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columns.length }
    };
  }

  // Freeze header row
  worksheet.views = [
    { state: "frozen", xSplit: 0, ySplit: 1 }
  ];

  // Format columns
  worksheet.columns.forEach(column => {
    if (column.key?.toLowerCase().includes("amount") || 
        column.key?.toLowerCase().includes("balance") ||
        column.key?.toLowerCase().includes("total") ||
        column.key?.toLowerCase().includes("debit") ||
        column.key?.toLowerCase().includes("credit")) {
      column.numFmt = "#,##0.00";
      column.alignment = { horizontal: "right" };
    }
    
    if (column.key?.toLowerCase().includes("date")) {
      column.numFmt = "dd-mmm-yyyy";
      column.alignment = { horizontal: "center" };
    }
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * Export multiple sheets to Excel
 * @param {Object} sheets - Object with sheet names as keys and data as values
 * @param {Object} options - Export options
 * @returns {Promise<Buffer>} Excel file buffer
 */
const exportMultiSheetExcel = async (sheets, options = {}) => {
  const workbook = new ExcelJS.Workbook();

  for (const [sheetName, { data, columns }] of Object.entries(sheets)) {
    const worksheet = workbook.addWorksheet(sheetName);

    if (!columns && data.length > 0) {
      const firstRow = data[0];
      worksheet.columns = Object.keys(firstRow).map(key => ({
        header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        key,
        width: 20
      }));
    } else if (columns) {
      worksheet.columns = columns;
    }

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }
    };

    worksheet.addRows(data);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = {
  exportToExcel,
  exportMultiSheetExcel
};