import * as OnChange from "./onChange";
import * as Init from "./init";
import * as Recipe from "./recipe";

function onChange() {
  OnChange.onChange();
}

function init() {
  Init.init();
}

function sortAndFormatRecipes() {
  Recipe.sortAndFormatRecipes();
}

function listIngredientsWithMultipleDimensions(): string {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const recipes = Object.values(Recipe.getAllRecipesByName(spreadsheet));
  const ingredients = Recipe.listIngredientsWithMultipleDimensions(recipes);

  return "The following ingredients have quantities with various dimensions:\n" +
    ingredients.map((ingredient) => `- ${ingredient.name} (${ingredient.quantity.dimensions()})`).join("\n");
}
