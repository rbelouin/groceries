declare const STORE_SHEET_NAME: string;

export function getStoreNames(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet): string[] {
  const sheet = spreadsheet.getSheetByName(STORE_SHEET_NAME);
  return sheet
    ? sheet.getRange("B1:1").getValues()[0]
      .filter((cell) => cell !== "")
    : [];
}
