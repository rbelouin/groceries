const LIST_SHEET_NAME = "Liste";
const LIST_SHEET_TITLE = "Liste de courses";
const LIST_SHEET_ARTICLE_NAME = "Nom";
const LIST_SHEET_ARTICLE_QUANTITY = "Quantité";

function init() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  createListSheet(spreadsheet);
}

function createListSheet(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  if (spreadsheet.getSheetByName(LIST_SHEET_NAME)) return;

  const sheet = spreadsheet.insertSheet(LIST_SHEET_NAME, 0);
  createHeader(sheet, LIST_SHEET_TITLE);
}

function createHeader(sheet: GoogleAppsScript.Spreadsheet.Sheet, title: string) {
  sheet.getRange("A1:C1")
    .merge()
    .setValue(title)
    .setFontFamily("PT Sans")
    .setFontSize(26)
    .setHorizontalAlignment("center");

  sheet.getRange("A1:2")
    .setBackground("#0f6b4f")
    .setFontColor("#ffffff");

  sheet.getRange("A2")
    .setValue(LIST_SHEET_ARTICLE_NAME)
    .setFontStyle("italic");

  sheet.getRange("B2")
    .setValue(LIST_SHEET_ARTICLE_QUANTITY)
    .setFontStyle("italic");
}
