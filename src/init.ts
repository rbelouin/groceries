const LIST_SHEET_NAME = "Liste";
const LIST_SHEET_TITLE = "Liste de courses";
const LIST_SHEET_ARTICLE_NAME = "Nom";
const LIST_SHEET_ARTICLE_QUANTITY = "Quantité";
const LIST_SHEET_ARTICLE_RANGE = "A3:B";

const GENERATED_LIST_SHEET_NAME = "Liste générée";
const GENERATED_LIST_SHEET_TITLE = "Liste générée";
const GENERATED_LIST_SHEET_ARTICLE_RANGE = "A3:C";

const RECIPE_SHEET_NAME = "Recettes";
const RECIPE_SHEET_TITLE = "Recettes";
const RECIPE_SHEET_RANGE = "A3:C";
const RECIPE_SHEET_RECIPE = "Recette";
const RECIPE_SHEET_INGREDIENT = "Ingrédient";
const RECIPE_SHEET_QUANTITY = "Quantité";

function init() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  createListSheet(spreadsheet);
  createGeneratedListSheet(spreadsheet);
  createTrigger(spreadsheet);
  createRecipeSheet(spreadsheet);

  migrate0000(spreadsheet);
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

function createRecipeSheet(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  if (spreadsheet.getSheetByName(RECIPE_SHEET_NAME)) return;

  const sheet = spreadsheet.insertSheet(RECIPE_SHEET_NAME, 2);
  createHeader(sheet, RECIPE_SHEET_TITLE);

  sheet.getRange("A2")
    .setValue(RECIPE_SHEET_RECIPE)
    .setFontStyle("italic");

  sheet.getRange("B2")
    .setValue(RECIPE_SHEET_INGREDIENT)
    .setFontStyle("italic");

  sheet.getRange("C2")
    .setValue(RECIPE_SHEET_QUANTITY)
    .setFontStyle("italic");
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

function migrate0000(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  const listSheet = spreadsheet.getSheetByName(LIST_SHEET_NAME);
  if (!listSheet) return;

  const version = listSheet.getRange("D1");

  if (version.getValue() === "") {
    listSheet.setColumnWidth(1, 250);
    listSheet.setColumnWidth(2, 80);
    listSheet.setColumnWidth(3, 20);

    const articles = listSheet.getRange(LIST_SHEET_ARTICLE_RANGE);
    articles.setVerticalAlignment("middle");
    listSheet.setRowHeights(articles.getRow(), articles.getNumRows(), 36);

    const generatedListSheet = spreadsheet.getSheetByName(GENERATED_LIST_SHEET_NAME);
    if (generatedListSheet) {
      generatedListSheet.setColumnWidth(1, 50);
      generatedListSheet.setColumnWidth(2, 220);
      generatedListSheet.setColumnWidth(3, 80);

      const generatedArticles = generatedListSheet.getRange(GENERATED_LIST_SHEET_ARTICLE_RANGE);
      articles.setVerticalAlignment("middle");
      generatedListSheet.setRowHeights(generatedArticles.getRow(), generatedArticles.getNumRows(), 36);
    }

    version.setFontColor("#388a66");
    version.setFontStyle("italic");
    version.setValue(1);
  }
}
