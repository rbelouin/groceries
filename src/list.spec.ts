import { readList, calculateGeneratedList, updateGeneratedList, GeneratedList } from "./list";
import { Quantity } from "./quantities";
import { type Recipe } from "./recipe";

jest.mock("./init", () => {
  const originalModule = jest.requireActual("./init");
  return {
    __esModule: true,
    ...originalModule,
    LIST_SHEET_NAME: "LIST_SHEET_NAME",
    LIST_SHEET_ARTICLE_RANGE: "LIST_SHEET_ARTICLE_RANGE",
    GENERATED_LIST_SHEET_NAME: "GENERATED_LIST_SHEET_NAME",
    GENERATED_LIST_SHEET_ARTICLE_RANGE: "GENERATED_LIST_SHEET_ARTICLE_RANGE",
    GENERATED_LIST_SHEET_PRICE_RANGE: "GENERATED_LIST_SHEET_PRICE_RANGE",
    GENERATED_LIST_SHEET_TOTAL_PRICE_RANGE: "GENERATED_LIST_SHEET_TOTAL_PRICE_RANGE",
  };
});

describe("list", () => {
  describe("readList", () => {
    it("should only read rows with non-empty names", () => {
      const values = [
        ["Pain", "300g"],
        ["Eau", ""],
        ["", ""],
        ["Brioche", "1kg"],
      ];

      const spreadsheet = {
        getRange: (notation: string) => {
          expect(notation).toBe("LIST_SHEET_NAME!LIST_SHEET_ARTICLE_RANGE");
          return createRangeFromValues(values);
        },
      } as Partial<GoogleAppsScript.Spreadsheet.Spreadsheet>;

      expect(readList(spreadsheet as any)).toStrictEqual([
        { name: "Pain", quantity: Quantity.parse("300g") },
        { name: "Eau", quantity: Quantity.parse("") },
        { name: "Brioche", quantity: Quantity.parse("1kg") },
      ]);
    });
  });

  describe("calculateGeneratedList", () => {
    const recipesByName = {
      "Tartines": {
        name: "Tartines",
        people: "4p",
        ingredients: [{
          name: "Pain",
          quantity: Quantity.parse("100g"),
        }, {
          name: "Confiture",
          quantity: Quantity.parse("60ml"),
        }],
      },
    } as Record<string, Recipe>;

    const list = [
      { name: "Pain", quantity: Quantity.parse("300g") },
      { name: "Tartines", quantity: Quantity.parse("2p") },
      { name: "Eau", quantity: Quantity.parse("") },
      { name: "Brioche", quantity: Quantity.parse("1kg") },
      { name: "Pain", quantity: Quantity.parse("600g") },
    ];

    it("should expand recipes and deduplicate articles", () => {
      const generatedList = calculateGeneratedList(recipesByName, list);
      expect(Object.keys(generatedList)).toStrictEqual(["Pain", "Confiture", "Eau", "Brioche"]);
    });

    it("should scale and combine quantity fields of redundant items", () => {
      const generatedList = calculateGeneratedList(recipesByName, list);
      expect(generatedList["Pain"].quantity).toBe("950g");
    });

    it("should leave the other quantity fields uncombined", () => {
      const generatedList = calculateGeneratedList(recipesByName, list);
      expect(generatedList["Eau"].quantity).toBe("");
      expect(generatedList["Brioche"].quantity).toBe("1kg");
      expect(generatedList["Confiture"].quantity).toBe("3cl");
    });

    it("should mark articles as unchecked", () => {
      const generatedList = calculateGeneratedList(recipesByName, list);
      expect(Object.values(generatedList).map(item => item.checked)).not.toEqual(expect.arrayContaining([true]));
    });
  });

  describe("updateGeneratedList", () => {
    let range: GoogleAppsScript.Spreadsheet.Range;
    let list: GeneratedList;
    let spreadsheet: Partial<GoogleAppsScript.Spreadsheet.Spreadsheet>;

    beforeEach(() => {
      range = createRangeFromValues([
        [false, "Pain", "500g"],
        [true, "Baguette", "250g"],
        [false, "Beurre", "500g"],
        [true, "Crème Fraîche", "5cl"],
        [false, "Yaourt", "6 pots"],
        [true, "Œufs", 6],
      ]);

      list = {
        "Pain": {
          quantity: "500g",
          checked: false,
        },
        "Baguette": {
          quantity: "250g",
          checked: false,
        },
        "Saucisson": {
          quantity: "100g",
          checked: false,
        },
        "Yaourt": {
          quantity: "1l",
          checked: false,
        },
        "Œufs": {
          quantity: "12",
          checked: false,
        },
      };

      spreadsheet = {
        getRange: (notation: string) => {
          if (notation === "GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_ARTICLE_RANGE") {
            return range;
          }

          if (notation === "GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_PRICE_RANGE") {
            return createRangeFromValues([]);
          }

          if (notation === "GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_TOTAL_PRICE_RANGE") {
            return createRangeFromValues([[""]]);
          }

          throw new Error(`Unsupported notation: ${notation}`);
        },
      } as Partial<GoogleAppsScript.Spreadsheet.Spreadsheet>;
    });

    it("should keep articles that haven’t changed with the same `checked` status", () => {
      updateGeneratedList(spreadsheet as any, {}, list);

      expect(spreadsheet.getRange!("GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_ARTICLE_RANGE").getValues()).toStrictEqual(expect.arrayContaining([
        [false, "Pain", "500g", ""],
        [true, "Baguette", "250g", ""],
      ]));
    });

    it("should remove articles that are no longer listed", () => {
      updateGeneratedList(spreadsheet as any, {}, list);

      expect(spreadsheet.getRange!("GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_ARTICLE_RANGE").getValues()).toStrictEqual(expect.not.arrayContaining([[false, "Beurre", "500g", ""]]));
      expect(spreadsheet.getRange!("GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_ARTICLE_RANGE").getValues()).toStrictEqual(expect.not.arrayContaining([[true, "Crème Fraîche", "5cl", ""]]));
    });

    it("should add articles that were not listed before", () => {
      updateGeneratedList(spreadsheet as any, {}, list);

      expect(spreadsheet.getRange!("GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_ARTICLE_RANGE").getValues()).toStrictEqual(expect.arrayContaining([[false, "Saucisson", "100g", ""]]));
    });

    it("should 'uncheck' articles that have changed quantities", () => {
      updateGeneratedList(spreadsheet as any, {}, list);

      expect(spreadsheet.getRange!("GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_ARTICLE_RANGE").getValues()).toStrictEqual(expect.arrayContaining([
        [false, "Yaourt", "1l", ""],
        [false, "Œufs", "12", ""],
      ]));
    });

    it("should keep checked the articles that have not changed quantities", () => {
      updateGeneratedList(spreadsheet as any, {}, {
        ...list,
        "Œufs": {
          quantity: "6",
          checked: true,
        },
      });

      expect(spreadsheet.getRange!("GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_ARTICLE_RANGE").getValues()).toStrictEqual(expect.arrayContaining([
        [true, "Œufs", "6", ""],
      ]));
    });

    it("should sort articles by department, and then by name", () => {
      updateGeneratedList(spreadsheet as any, {
        "Pain": { name: "Pain", department: "02. Pains" },
        "Baguette": { name: "Baguette", department: "02. Pains" },
        "Yaourt": { name: "Yaourt", department: "01. Produits Laitiers" },
      }, list);

      expect(spreadsheet.getRange!("GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_ARTICLE_RANGE").getValues().map(row => row[1])).toStrictEqual([
        "Saucisson",
        "Œufs",
        "Yaourt",
        "Baguette",
        "Pain",
        ""
      ]);
    });

    it("should match snapshot", () => {
      updateGeneratedList(spreadsheet as any, {}, list);

      expect(spreadsheet.getRange!("GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_ARTICLE_RANGE").getValues()).toMatchSnapshot();
    });
  });
});

function createRangeFromValues(initialValues: any[][]): GoogleAppsScript.Spreadsheet.Range {
  let values = initialValues;

  const range = {
    getNumRows: () => values.length,
    getValues: () => values,
    setValue: (newValue: any) => { values[0][0] = newValue; },
    setValues: (newValues: any[][]) => { values = newValues },
  } as Partial<GoogleAppsScript.Spreadsheet.Range>;

  return range as any;
}
