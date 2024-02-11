import { getStoreNames } from "./stores";

export const LIST_SHEET_NAME = "Liste";
export const LIST_SHEET_TITLE = "Liste de courses";
export const LIST_SHEET_ARTICLE_NAME = "Nom";
export const LIST_SHEET_ARTICLE_QUANTITY = "Quantité";
export const LIST_SHEET_ARTICLE_RANGE = "A4:B";
export const LIST_SHEET_STORE_NAME = "A2:C2";
export const LIST_SHEET_NO_STORE = "Aucun Magasin";

export const GENERATED_LIST_SHEET_NAME = "Liste générée";
export const GENERATED_LIST_SHEET_TITLE = "Liste générée";
export const GENERATED_LIST_SHEET_ARTICLE_RANGE = "A3:D";
export const GENERATED_LIST_SHEET_PRICE = "Prix";
export const GENERATED_LIST_SHEET_PRICE_RANGE = "D3:D";
export const GENERATED_LIST_SHEET_TOTAL_PRICE_RANGE = "D1";

export const RECIPE_SHEET_NAME = "Recettes";
export const RECIPE_SHEET_TITLE = "Recettes";
export const RECIPE_SHEET_RANGE = "A3:C";
export const RECIPE_SHEET_RECIPE = "Recette";
export const RECIPE_SHEET_INGREDIENT = "Ingrédient";
export const RECIPE_SHEET_QUANTITY = "Quantité";

export const STORE_SHEET_NAME = "Magasins";
export const STORE_SHEET_TITLE = "Magasins";
export const STORE_SHEET_ARTICLE_NAME = "Article";
export const STORE_SHEET_ARTICLE_DEPARTMENT = "Rayon";
export const STORE_SHEET_ARTICLE_PRICE = "Price";

export function init() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  createListSheet(spreadsheet);
  createGeneratedListSheet(spreadsheet);
  createTrigger(spreadsheet);
  createRecipeSheet(spreadsheet);

  migrate0000(spreadsheet);
  migrate0001(spreadsheet);
  migrate0002(spreadsheet);
  migrate0003(spreadsheet);
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

    const articles = listSheet.getRange("A3:B");
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

function migrate0001(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  const listSheet = spreadsheet.getSheetByName(LIST_SHEET_NAME);
  if (!listSheet) return;

  const version = listSheet.getRange("D1");

  if (version.getValue() === 1) {
    const sheet = spreadsheet.insertSheet(STORE_SHEET_NAME, 3);
    sheet.getRange("A1")
      .setValue(STORE_SHEET_TITLE)
      .setFontFamily("PT Sans")
      .setFontSize(26)
      .setHorizontalAlignment("center");

    sheet.deleteColumn(26);

    for (let column = 2; column <= 24; column += 2) {
      sheet.getRange(1, column, 1, 2)
        .merge()
        .setFontSize(20)
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");
    }

    const headers = sheet.getRange("A2:2")
      .setFontStyle("italic");

    headers.setValues([new Array(headers.getNumColumns()).fill("").map((_, index) => {
      if (index === 0) return STORE_SHEET_ARTICLE_NAME;
      return index % 2 === 1
        ? STORE_SHEET_ARTICLE_DEPARTMENT
        : STORE_SHEET_ARTICLE_PRICE;
    })]);

    sheet.setColumnWidth(1, 250);

    sheet.getRange("A1:2")
      .setBackground("#0f6b4f")
      .setFontColor("#ffffff");

    const range = sheet.getRange("A3:Y");
    sheet.setRowHeights(range.getRow(), range.getNumRows(), 36);

    version.setValue(2);
  }
}

function migrate0002(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  const listSheet = spreadsheet.getSheetByName(LIST_SHEET_NAME);
  if (!listSheet) return;

  const version = listSheet.getRange("D1");

  if (version.getValue() === 2) {
    listSheet.insertRowAfter(1);

    listSheet.getRange(LIST_SHEET_STORE_NAME)
      .merge()
      .setValue(LIST_SHEET_NO_STORE)
      .setFontSize(16)
      .setHorizontalAlignment("right")
      .setDataValidation(SpreadsheetApp.newDataValidation()
                        .requireValueInList([LIST_SHEET_NO_STORE].concat(getStoreNames(spreadsheet)))
                        .build());

    version.setValue(3);
  }
}

function migrate0003(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  const listSheet = spreadsheet.getSheetByName(LIST_SHEET_NAME);
  if (!listSheet) return;

  const version = listSheet.getRange("D1");

  if (version.getValue() === 3) {
    const generatedListSheet = spreadsheet.getSheetByName(GENERATED_LIST_SHEET_NAME);
    if (generatedListSheet) {
      generatedListSheet.getRange("D2")
        .setValue(GENERATED_LIST_SHEET_PRICE)
        .setFontStyle("italic");
    }

    version.setValue(4);
  }
}
