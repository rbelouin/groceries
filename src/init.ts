const LIST_SHEET_NAME = "Liste";
const LIST_SHEET_TITLE = "Liste de courses";
const LIST_SHEET_ARTICLE_NAME = "Nom";
const LIST_SHEET_ARTICLE_QUANTITY = "Quantité";
const LIST_SHEET_ARTICLE_RANGE = "A3:B";

const GENERATED_LIST_SHEET_NAME = "Liste générée";
const GENERATED_LIST_SHEET_TITLE = "Liste générée";
const GENERATED_LIST_SHEET_ARTICLE_RANGE = "A3:C";

function init() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  createListSheet(spreadsheet);
  createGeneratedListSheet(spreadsheet);
  createTrigger(spreadsheet);
}

function createListSheet(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  if (spreadsheet.getSheetByName(LIST_SHEET_NAME)) return;

  const sheet = spreadsheet.insertSheet(LIST_SHEET_NAME, 0);
  createHeader(sheet, LIST_SHEET_TITLE);

  sheet.getRange("A2")
    .setValue(LIST_SHEET_ARTICLE_NAME)
    .setFontStyle("italic");

  sheet.getRange("B2")
    .setValue(LIST_SHEET_ARTICLE_QUANTITY)
    .setFontStyle("italic");
}

function createGeneratedListSheet(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  if (spreadsheet.getSheetByName(GENERATED_LIST_SHEET_NAME)) return;

  const sheet = spreadsheet.insertSheet(GENERATED_LIST_SHEET_NAME, 1);
  createHeader(sheet, GENERATED_LIST_SHEET_TITLE);

  sheet.getRange("A3:A")
    .insertCheckboxes();

  sheet.getRange("B2")
    .setValue(LIST_SHEET_ARTICLE_NAME)
    .setFontStyle("italic");

  sheet.getRange("C2")
    .setValue(LIST_SHEET_ARTICLE_QUANTITY)
    .setFontStyle("italic");
}

function createTrigger(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  const triggers = ScriptApp.getUserTriggers(spreadsheet);
  if (triggers.length !== 0) return;

  ScriptApp.newTrigger("onChange")
    .forSpreadsheet(spreadsheet)
    .onChange()
    .create();
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
}
