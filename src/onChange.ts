import type { calculateAndUpdateGeneratedList as CalculateAndUpdateGeneratedList } from "./list";

// Google Apps Script does not like ESM modules
declare const calculateAndUpdateGeneratedList: typeof CalculateAndUpdateGeneratedList;

export function onChange() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  calculateAndUpdateGeneratedList(spreadsheet);
}
