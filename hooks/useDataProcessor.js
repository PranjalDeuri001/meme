// src/hooks/useDataProcessor.js (Corrected)

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { FAULT_CATEGORIES } from './faults.config';

export const useDataProcessor = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [detectedFaults, setDetectedFaults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeColumnKey, setTimeColumnKey] = useState(null);

  const processFile = useCallback(async (file, rowsToSkip = 0) => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setData([]);
    setColumns([]);
    setDetectedFaults([]);
    setTimeColumnKey(null);

    const fileExtension = file.name.split('.').pop().toLowerCase();

    try {
      let allRows;
      if (['xlsx', 'xls'].includes(fileExtension)) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
      } else if (fileExtension === 'csv') {
        allRows = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            complete: (results) => resolve(results.data),
            error: (error) => reject(error),
            skipEmptyLines: true,
          });
        });
      } else {
        throw new Error('Unsupported file type. Please upload an Excel or CSV file.');
      }

      const skip = Number(rowsToSkip) || 0;
      if (allRows.length <= skip) {
        throw new Error("File does not have enough rows to process.");
      }

      const header = allRows[skip].map(h => String(h || '').trim());
      const body = allRows.slice(skip + 1);

      const dateIndex = header.findIndex(h => h.toUpperCase() === 'DATE');
      const timeIndex = header.findIndex(h => h.toUpperCase() === 'TIME');
      const newTimeKey = 'timestamp';
      setTimeColumnKey(newTimeKey);

      const formattedData = body.map((row) => {
        const rowObj = {};
        
        if (dateIndex !== -1 && timeIndex !== -1) {
          rowObj[newTimeKey] = `${row[dateIndex]} ${row[timeIndex]}`;
        } else {
          rowObj[newTimeKey] = row[0]; 
        }

        header.forEach((col, j) => {
          if (col) {
            const rawValue = row[j];
            if (rawValue === 'N' || rawValue === null || rawValue === undefined || rawValue === '') {
              rowObj[col] = null;
            } else {
              const isNumeric = !isNaN(parseFloat(rawValue)) && isFinite(rawValue);
              rowObj[col] = isNumeric ? Number(rawValue) : rawValue;
            }
          }
        });
        return rowObj;
      }).filter(row => row[newTimeKey]);

      const foundFaults = [];
      const faultToCategoryMap = {};
      Object.entries(FAULT_CATEGORIES).forEach(([category, signals]) => {
        signals.forEach(signal => (faultToCategoryMap[signal] = category));
      });

      header.forEach(signalName => {
        if (faultToCategoryMap[signalName]) {
          if (formattedData.some(row => row[signalName] == 1)) {
            foundFaults.push({ name: signalName, category: faultToCategoryMap[signalName] });
          }
        }
      });
      
      setColumns([...header, newTimeKey]);
      setData(formattedData);
      setDetectedFaults(foundFaults);

    } catch (err) {
      console.error("Error processing file:", err);
      setError(`Failed to process file. ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // FIXED: Added 'setData' to the return object so it can be used by other components.
  return { data, setData, columns, detectedFaults, isLoading, error, timeColumnKey, processFile };
};