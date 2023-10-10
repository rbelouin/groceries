export type Recipe = {
  name: string;
  people: `${number}p`;
  ingredients: Ingredient[];
};

export type Ingredient = {
  name: string;
  quantity?: Quantity;
};

export type Quantity = number | `${number} ${string}` | `${number}${string}` | "";

export function sortAndFormatRecipes() {
  const range = getRange();
  sortRecipes(range);
  formatRecipes(range);
}

export function sortRecipes(range: GoogleAppsScript.Spreadsheet.Range) {
  const recipes = readRecipes(range);

  recipes.sort((a, b) => a.name > b.name ? 1 : -1);

  writeRecipes(range, recipes);
}

function readRecipes(range: GoogleAppsScript.Spreadsheet.Range): Recipe[] {
  let recipes: Recipe[] = [];

  for (let row of range.getValues()) {
    if (row.every(cell => cell === '')) {
      break;
    }

    if (row[0] !== '') {
      recipes.push({
        name: row[0],
        people: row[2],
        ingredients: [],
      });
    } else {
      recipes[recipes.length - 1].ingredients.push({
        name: row[1],
        quantity: row[2],
      });
    }
  }

  return recipes;
}

function writeRecipes(range: GoogleAppsScript.Spreadsheet.Range, recipes: Recipe[]) {
  const values = recipes.flatMap(recipe => ([
    [recipe.name, '', recipe.people],
    ...recipe.ingredients.map(ingredient => (['', ingredient.name, ingredient.quantity]))
  ]));

  const blank = new Array(range.getNumRows() - values.length).fill(['', '', '']);

  range.setValues(values.concat(blank));
}

function getRange(): GoogleAppsScript.Spreadsheet.Range {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getRange(`${RECIPE_SHEET_NAME}!${RECIPE_SHEET_RANGE}`);
}

export function resizeRecipe(recipe: Recipe, people: `${number}p`): Recipe {
  const ratio = parseInt(people, 10) / parseInt(recipe.people, 10);

  return {
    ...recipe,
    people,
    ingredients: recipe.ingredients.map(ingredient => resizeIngredient(ingredient, ratio)),
  };
}

function resizeIngredient(ingredient: Ingredient, ratio: number): Ingredient {
  if (typeof ingredient.quantity === "undefined") {
    return ingredient;
  }

  if (typeof ingredient.quantity === "number") {
    return {
      ...ingredient,
      quantity: ingredient.quantity * ratio,
    };
  }

  if (typeof ingredient.quantity === "string") {
    return {
      ...ingredient,
      quantity: ingredient.quantity.replace(/^([0-9,.]+)/, (_, num) => {
        return (Math.round(parseInt(num, 10) * ratio * 100) / 100).toString();
      }) as Quantity,
    };
  }

  throw new Error("Unsupported quantity");
}

export function formatRecipes(range: GoogleAppsScript.Spreadsheet.Range) {
  const values = range.getValues();
  const fontSizes = values.map(row => row.map(_ => row[0] ? 16 : 10));
  range.setFontSizes(fontSizes);
}
