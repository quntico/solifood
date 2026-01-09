
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'CDA 2000 1.2.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert first row to JSON to get headers
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (jsonData.length > 0) {
        console.log("Headers found:", JSON.stringify(jsonData[0]));
        console.log("First Row Data:", JSON.stringify(jsonData[1]));
        console.log("Second Row Data:", JSON.stringify(jsonData[2]));
    } else {
        console.log("File appears empty or unreadable.");
    }
} catch (error) {
    console.error("Error reading file:", error.message);
}
