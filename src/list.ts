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

export function calculateAndUpdateGeneratedList(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  return updateGeneratedList(spreadsheet, calculateGeneratedList(readList(spreadsheet)));
}

export function readList(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet): List {
  const range = spreadsheet.getRange(`${LIST_SHEET_NAME}!${LIST_SHEET_ARTICLE_RANGE}`);
  return range.getValues().flatMap(([name, quantity]) => name ? [{ name, quantity }] : []);
}

export function calculateGeneratedList(list: List): GeneratedList {
  return list.reduce((acc, item) => ({
    ...acc,
    [item.name]: {
      quantity: acc[item.name] ? `${acc[item.name].quantity}|${item.quantity}` : item.quantity,
      checked: false,
    },
  }), {});
}

export function updateGeneratedList(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, list: GeneratedList) {
  const range = spreadsheet.getRange(`${GENERATED_LIST_SHEET_NAME}!${GENERATED_LIST_SHEET_ARTICLE_RANGE}`);

  const oldList = readGeneratedList(range);
  const newList = Object.fromEntries(Object.entries(list).map(([name, item]) => ([name, {
    ...item,
    checked: oldList[name] && oldList[name].quantity === item.quantity ? oldList[name].checked : false,
  }])));

  writeGeneratedList(range, newList);
}

function readGeneratedList(range: GoogleAppsScript.Spreadsheet.Range): GeneratedList {
  return range.getValues().reduce((acc, [checked, name, quantity]) => !name ? acc : ({
    ...acc,
    [name]: { quantity, checked },
  }), {});
}

function writeGeneratedList(range: GoogleAppsScript.Spreadsheet.Range, list: GeneratedList) {
  const numRows = range.getNumRows();
  const items = Object.entries(list).map(([name, { quantity, checked }]) => ([checked, name, quantity]));
  const blankRows = new Array(numRows - items.length).fill(["", "", ""]);

  range.setValues(items.concat(blankRows));
}
