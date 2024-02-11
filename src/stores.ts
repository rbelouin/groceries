import { LIST_SHEET_NAME, LIST_SHEET_NO_STORE, LIST_SHEET_STORE_NAME, STORE_SHEET_NAME } from "./init";
import { type Price, parsePrice } from "./price";

export type StoreArticle = {
  name: string;
  department: string;
  price?: Price;
};

export function getStoreNames(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet): string[] {
  const sheet = spreadsheet.getSheetByName(STORE_SHEET_NAME);
  return sheet
    ? sheet.getRange("B1:1").getValues()[0]
      .filter((cell, index) => cell !== "" && index % 2 === 0)
    : [];
}

export function getStoreArticles(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet): Record<string, StoreArticle> {
  const listSheet = spreadsheet.getSheetByName(LIST_SHEET_NAME);
  if (!listSheet) return {};

  const storeName = listSheet.getRange(LIST_SHEET_STORE_NAME).getValue();
  if (storeName === LIST_SHEET_NO_STORE) return {};

  const storeSheet = spreadsheet.getSheetByName(STORE_SHEET_NAME);
  if (!storeSheet) return {};

  const storeIndex = 1 + 2 * getStoreNames(spreadsheet).findIndex(name => name === storeName);
  if (storeIndex < 0) return {};

  return Object.fromEntries(storeSheet.getRange("A3:Y").getValues().flatMap(row => {
    const name: string = row[0];
    const department: string = row[storeIndex];
    const price = row[storeIndex + 1] ? parsePrice(row[storeIndex + 1]) : undefined;

    if (name && department) return [[name, {
      name,
      department,
      price,
    }]];

    return [];
  }));
}
