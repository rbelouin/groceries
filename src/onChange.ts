import { calculateAndUpdateGeneratedList } from "./list";

export function onChange() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  calculateAndUpdateGeneratedList(spreadsheet);
}
