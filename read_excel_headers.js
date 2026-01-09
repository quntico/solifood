
import * as XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'CDA 2000 1.2.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert first row to JSON to get headers
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (jsonData.length > 0) {
        console.log("Headers found:", jsonData[0]);
        console.log("First Row Data:", jsonData[1]);
    } else {
        console.log("File appears empty or unreadable.");
    }
} catch (error) {
    console.error("Error reading file:", error.message);
}
