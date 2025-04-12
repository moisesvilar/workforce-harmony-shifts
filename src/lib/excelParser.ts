
import * as XLSX from 'xlsx';
import { Employee } from '../types';

export const parseExcelFile = (file: File): Promise<{ data: any[], headers: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          reject(new Error('File does not contain enough data'));
          return;
        }
        
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[];
        
        resolve({ data: rows, headers });
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(new Error('Failed to parse Excel file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsBinaryString(file);
  });
};

export const processEmployeeData = (data: any[], headers: string[]): Employee[] => {
  const employees: Employee[] = [];
  
  // Find column indices based on column headers
  const idIndex = headers.findIndex(h => h === 'ID');
  const nameIndex = headers.findIndex(h => h === 'PEOPLE');
  const sectionIndex = headers.findIndex(h => h === 'SECTION');
  const groupingIndex = headers.findIndex(h => h === 'GROUPING');
  const jobIndex = headers.findIndex(h => h === 'JOB');
  const roleIndex = headers.findIndex(h => h === 'ROLE');
  const contractIndex = headers.findIndex(h => h === 'CONTRACT');
  const hoursIndex = headers.findIndex(h => h === 'HOURS');
  const statusIndex = headers.findIndex(h => h === 'STATUS');
  
  // Check if all required columns are present
  if (idIndex === -1 || nameIndex === -1 || sectionIndex === -1 || 
      groupingIndex === -1 || jobIndex === -1 || contractIndex === -1 || 
      hoursIndex === -1 || statusIndex === -1) {
    throw new Error('Required column(s) missing in the Excel file');
  }
  
  // Process each row
  data.forEach((row) => {
    if (!row[idIndex]) return; // Skip rows without ID
    
    // Extract hours and ensure it's a number
    let hours = row[hoursIndex];
    if (typeof hours === 'string') {
      // Try to parse the string to a number
      hours = parseFloat(hours.replace(/[^0-9.]/g, ''));
    }
    
    // Skip rows with 0 hours (as per requirements)
    if (isNaN(hours) || hours <= 0) {
      console.warn(`Skipping employee ${row[nameIndex]} (ID: ${row[idIndex]}) - invalid hours: ${row[hoursIndex]}`);
      return;
    }
    
    const employee: Employee = {
      id: String(row[idIndex]),
      name: String(row[nameIndex] || ''),
      section: String(row[sectionIndex] || ''),
      grouping: String(row[groupingIndex] || ''),
      job: String(row[jobIndex] || ''),
      contract: String(row[contractIndex] || ''),
      hours: hours,
      status: String(row[statusIndex] || '')
    };
    
    // Add role if present
    if (roleIndex !== -1 && row[roleIndex]) {
      employee.role = String(row[roleIndex]);
    }
    
    employees.push(employee);
  });
  
  return employees;
};
