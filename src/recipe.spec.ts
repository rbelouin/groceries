import { formatRecipes, Recipe, resizeRecipe, sortRecipes } from "./recipe";

const RECIPE: Recipe = {
  name: "Recipe 1",
  people: "6p",
  ingredients: [{
    name: "Cheese",
    quantity: "300g",
  }, {
    name: "Crème Fraîche",
    quantity: "2 c-à-s",
  }, {
    name: "Onions",
    quantity: 1,
  }],
};

describe("recipe", () => {
  describe("resizeRecipe", () => {
    it("should not change the recipe if the number of people is the same", () => {
      expect(resizeRecipe(RECIPE, RECIPE.people)).toStrictEqual(RECIPE);
    });

    it("should adjust the quantities correctly when multiplying the number of people by 2", () => {
      expect(resizeRecipe(RECIPE, "12p")).toStrictEqual({
        name: "Recipe 1",
        people: "12p",
        ingredients: [{
          name: "Cheese",
          quantity: "600g",
        }, {
          name: "Crème Fraîche",
          quantity: "4 c-à-s",
        }, {
          name: "Onions",
          quantity: 2,
        }],
      });
    });

    it("should adjust the quantities correctly when dividing the number of people by 2", () => {
      expect(resizeRecipe(RECIPE, "3p")).toStrictEqual({
        name: "Recipe 1",
        people: "3p",
        ingredients: [{
          name: "Cheese",
          quantity: "150g",
        }, {
          name: "Crème Fraîche",
          quantity: "1 c-à-s",
        }, {
          name: "Onions",
          quantity: 0.5,
        }],
      });
    });

    it("should round string quantity values with a precision of two digits after the comma", () => {
      expect(resizeRecipe(RECIPE, "2p")).toStrictEqual({
        name: "Recipe 1",
        people: "2p",
        ingredients: [{
          name: "Cheese",
          quantity: "100g",
        }, {
          name: "Crème Fraîche",
          quantity: "0.67 c-à-s",
        }, {
          name: "Onions",
          quantity: 1 / 3,
        }],
      });
    });
  });

  describe("sortRecipes", () => {
    it("should not update a sorted list", () => {
      const range = createRangeFromValues([
        ["Recipe 1", "", "6p"],
        ["", "Cheese", "300g"],
        ["", "Crème Fraîche", "2 c-à-s"],
        ["", "Onions", 1],
        ["Recipe 2", "", "2p"],
        ["", "Salad", ""],
        ["", "Bacon", "100g"],
        ["", "Tomatoes", 4],
      ]);

      sortRecipes(range);

      expect(range.getValues()).toStrictEqual([
        ["Recipe 1", "", "6p"],
        ["", "Cheese", "300g"],
        ["", "Crème Fraîche", "2 c-à-s"],
        ["", "Onions", 1],
        ["Recipe 2", "", "2p"],
        ["", "Salad", ""],
        ["", "Bacon", "100g"],
        ["", "Tomatoes", 4],
      ]);
    });

    it("should sort a simple list of recipes by name", () => {
      const range = createRangeFromValues([
        ["Recipe 2", "", "2p"],
        ["", "Salad", ""],
        ["", "Bacon", "100g"],
        ["", "Tomatoes", 4],
        ["Recipe 1", "", "6p"],
        ["", "Cheese", "300g"],
        ["", "Crème Fraîche", "2 c-à-s"],
        ["", "Onions", 1],
      ]);

      sortRecipes(range);

      expect(range.getValues()).toStrictEqual([
        ["Recipe 1", "", "6p"],
        ["", "Cheese", "300g"],
        ["", "Crème Fraîche", "2 c-à-s"],
        ["", "Onions", 1],
        ["Recipe 2", "", "2p"],
        ["", "Salad", ""],
        ["", "Bacon", "100g"],
        ["", "Tomatoes", 4],
      ]);
    });

    it("should read and write the same number of rows", () => {
      const range = createRangeFromValues([
        ["Recipe 2", "", "2p"],
        ["", "Salad", ""],
        ["", "Bacon", "100g"],
        ["", "Tomatoes", 4],
        ["Recipe 1", "", "6p"],
        ["", "Cheese", "300g"],
        ["", "Crème Fraîche", "2 c-à-s"],
        ["", "Onions", 1],
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
      ]);

      sortRecipes(range);

      expect(range.getValues()).toStrictEqual([
        ["Recipe 1", "", "6p"],
        ["", "Cheese", "300g"],
        ["", "Crème Fraîche", "2 c-à-s"],
        ["", "Onions", 1],
        ["Recipe 2", "", "2p"],
        ["", "Salad", ""],
        ["", "Bacon", "100g"],
        ["", "Tomatoes", 4],
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
      ]);
    });
  });

  describe("formatRecipes", () => {
    it("should use 16pt for recipes and 10pt for ingredients", () => {
      const range = createRangeFromValues([
        ["Recipe 2", "", "2p"],
        ["", "Salad", ""],
        ["", "Bacon", "100g"],
        ["", "Tomatoes", 4],
        ["Recipe 1", "", "6p"],
        ["", "Cheese", "300g"],
        ["", "Crème Fraîche", "2 c-à-s"],
        ["", "Onions", 1],
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
      ]);

      formatRecipes(range);

      expect(range.setFontSizes).toHaveBeenCalledWith([
        [16, 16, 16],
        [10, 10, 10],
        [10, 10, 10],
        [10, 10, 10],
        [16, 16, 16],
        [10, 10, 10],
        [10, 10, 10],
        [10, 10, 10],
        [10, 10, 10],
        [10, 10, 10],
        [10, 10, 10],
      ]);
    });
  });
});

function createRangeFromValues(values: (string | number)[][]): GoogleAppsScript.Spreadsheet.Range {
  let cells = values.map(row => row.map(cell => {
    let value = cell;

    return {
      getNumRows: () => 1,
      getValue: () => value,
      setValue: jest.fn(function (v: string | number) {
        value = v;
        return this;
      }),
    } as Partial<GoogleAppsScript.Spreadsheet.Range>;
  }));

  const range = {
    getNumRows: () => cells.length,
    getCell: (row: number, column: number) => cells[row - 1][column - 1] as GoogleAppsScript.Spreadsheet.Range,
    getValues: () => cells.map(row => row.map(cell => cell.getValue!())),
    setValues: (values: (string | number)[][]) => {
      values.forEach((row, rowIndex) => {
        row.forEach((cell, columnIndex) => {
          cells[rowIndex][columnIndex].setValue!(cell);
        });
      });
      return this;
    },
    setFontSizes: jest.fn(function (_: number[][]) {
      return this;
    }),
  } as Partial<GoogleAppsScript.Spreadsheet.Range>;

  return range as any;
}
