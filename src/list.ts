import type { getAllRecipesByName as GetAllRecipesByName, resizeRecipe as ResizeRecipe, Recipe } from "./recipe";
import type { parseQuantity as ParseQuantity, reduceQuantities as ReduceQuantities } from "./quantity";
import type { getStoreArticles as GetStoreArticles, StoreArticle } from "./stores";
import type {
  serializeTotalPrice as SerializeTotalPrice,
  Price,
  getTotalPriceForQuantity as GetTotalPriceForQuantity,
} from "./price";

export type List = ListItem[];
export type ListItem = {
  name: string;
  quantity: Quantity;
}
export type Quantity = number | string;

export type GeneratedList = Record<ListItem["name"], GeneratedListItem>;
export type GeneratedListItem = {
  quantity: string;
  checked: boolean;
};

export type SortedGeneratedList = { name: string; quantity: string; checked: boolean; department?: string; price?: Price }[];

declare const getAllRecipesByName: typeof GetAllRecipesByName;
declare const resizeRecipe: typeof ResizeRecipe;
declare const reduceQuantities: typeof ReduceQuantities;
declare const getStoreArticles: typeof GetStoreArticles;
declare const serializeTotalPrice: typeof SerializeTotalPrice;
declare const getTotalPriceForQuantity: typeof GetTotalPriceForQuantity;
declare const parseQuantity: typeof ParseQuantity;
declare const LIST_SHEET_NAME: string;
declare const LIST_SHEET_ARTICLE_RANGE: string;
declare const GENERATED_LIST_SHEET_NAME: string;
declare const GENERATED_LIST_SHEET_ARTICLE_RANGE: string;
declare const GENERATED_LIST_SHEET_TOTAL_PRICE_RANGE: string;
declare const GENERATED_LIST_SHEET_PRICE_RANGE: string;

export function calculateAndUpdateGeneratedList(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  const recipesByName = getAllRecipesByName(spreadsheet);
  const articlesByName = getStoreArticles(spreadsheet);

  return updateGeneratedList(spreadsheet, articlesByName, calculateGeneratedList(recipesByName, readList(spreadsheet)));
}

export function readList(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet): List {
  const range = spreadsheet.getRange(`${LIST_SHEET_NAME}!${LIST_SHEET_ARTICLE_RANGE}`);
  return range.getValues().flatMap(([name, quantity]) => name ? [{ name, quantity }] : []);
}

export function calculateGeneratedList(recipesByName: Record<string, Recipe>, list: List): GeneratedList {
  return list
    .flatMap(item => recipesByName[item.name]
      ? resizeRecipe(recipesByName[item.name], item.quantity as `${number}p`).ingredients
      : [item])
    .reduce((acc, item) => ({
      ...acc,
      [item.name]: {
        quantity: reduceQuantities(acc[item.name]?.quantity || "", item.quantity),
        checked: false,
      },
    }), {});
}

export function updateGeneratedList(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, articlesByName: Record<string, StoreArticle>, list: GeneratedList) {
  const range = spreadsheet.getRange(`${GENERATED_LIST_SHEET_NAME}!${GENERATED_LIST_SHEET_ARTICLE_RANGE}`);

  const oldList = readGeneratedList(range);
  const newList = Object.fromEntries(Object.entries(list).map(([name, item]) => ([name, {
    ...item,
    checked: oldList[name] && oldList[name].quantity === item.quantity ? oldList[name].checked : false,
  }])));

  writeGeneratedList(range, sortGeneratedList(articlesByName, newList));
  updateGeneratedPrice(
    spreadsheet.getRange(`${GENERATED_LIST_SHEET_NAME}!${GENERATED_LIST_SHEET_TOTAL_PRICE_RANGE}`),
    spreadsheet.getRange(`${GENERATED_LIST_SHEET_NAME}!${GENERATED_LIST_SHEET_PRICE_RANGE}`)
  );
}

function sortGeneratedList(articlesByName: Record<string, StoreArticle>, list: GeneratedList): SortedGeneratedList {
  const items = Object.entries(list).map(([name, { quantity, checked }]) => {
    const article: StoreArticle | undefined = articlesByName[name];
    return {
      checked,
      name,
      quantity,
      department: article?.department,
      price: article?.price,
    };
  });

  items.sort((itemA, itemB) => {
    if (itemA.department && itemB.department) {
      if (itemA.department > itemB.department) {
        return 1;
      }

      if (itemA.department < itemB.department) {
        return -1;
      }

      return itemA.name > itemB.name ? 1 : -1;
    }

    if (itemA.department && !itemB.department) {
      return 1;
    }

    if (!itemA.department && itemB.department) {
      return -1;
    }

    return itemA.name > itemB.name ? 1 : -1;
  });

  return items;
}

function readGeneratedList(range: GoogleAppsScript.Spreadsheet.Range): GeneratedList {
  return range.getValues().reduce((acc, [checked, name, quantity]) => !name ? acc : ({
    ...acc,
    [name]: { quantity: quantity.toString(), checked },
  }), {});
}

function writeGeneratedList(range: GoogleAppsScript.Spreadsheet.Range, list: SortedGeneratedList) {
  const numRows = range.getNumRows();
  const items = list.map(({ name, quantity, checked, price }) => {
    const parsedQuantity = quantity ? parseQuantity(quantity) : "";
    const totalPrice = typeof parsedQuantity !== "string" && price ? getTotalPriceForQuantity(price, parsedQuantity) : "";

    if (price && quantity && !totalPrice) {
      console.error(`Something is wrong with article: ${name}`);
    }

    return [checked, name, quantity, totalPrice ? serializeTotalPrice(totalPrice) : ""];
  });
  const blankRows = new Array(numRows - items.length).fill(["", "", "", ""]);

  range.setValues(items.concat(blankRows));
}

function updateGeneratedPrice(
  totalPriceRange: GoogleAppsScript.Spreadsheet.Range,
  priceRange: GoogleAppsScript.Spreadsheet.Range,
) {
  const totalPrices = priceRange.getValues().reduce((acc, row) => {
    const result = row[0].match(/^([0-9.]+)(\S+)$/);
    if (!result) return acc;

    const [_, valueString, currency] = result;
    return {
      ...acc,
      [currency]: (acc[currency] || 0) + parseFloat(valueString),
    };
  }, {} as Record<string, number>);

  totalPriceRange.setValue(Object.entries(totalPrices).map(([currency, value]) => `${Math.round(value * 100) / 100}${currency}`).join("\n"));
}
