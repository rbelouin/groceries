import * as OnChange from "./onChange";
import * as Init from "./init";
import * as Recipe from "./recipe";
import * as Stores from "./stores";
import { Quantity } from "./quantities";

function onChange() {
  OnChange.onChange();
}

function init() {
  Init.init();
}

function sortAndFormatRecipes() {
  Recipe.sortAndFormatRecipes();
}

function listIncompleteIngredients(): string {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const recipes = Object.values(Recipe.getAllRecipesByName(spreadsheet));
  const articlesByName = Stores.getStoreArticles(spreadsheet);

  const recipeIngredients = recipes.flatMap(recipe => recipe.ingredients);
  const problems = recipeIngredients.flatMap(ingredient => {
    const article = articlesByName[ingredient.name];
    if (!article) {
      return [`${ingredient.name} does not exist in the selected store`];
    }

    if (!article.price) {
      return [`${ingredient.name} does not have a price in the selected store`];
    }

    const quantity = Quantity.parse(ingredient.quantity?.toString());
    if (!quantity) {
      return [];
    }

    try {
      quantity.conversions = article.price.quantity.conversions;
      article.price.quantity.add(quantity);
      return [];
    } catch (err) {
      return [`The quantity of ${ingredient.name} (${ingredient.quantity}) could not be converted`];
    }
  });


  console.log("The following ingredients have configuration problems:\n" +
    problems.map((problem) => `- ${problem}`).join("\n"));

  return "The following ingredients have configuration problems:\n" +
    problems.map((problem) => `- ${problem}`).join("\n");
}
