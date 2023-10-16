import { readList, calculateGeneratedList, updateGeneratedList, GeneratedList } from "./list";
import { resizeRecipe, type Recipe } from "./recipe";
import { reduceQuantities } from "./quantity";

describe("list", () => {
  beforeEach(() => {
    (global as any).LIST_SHEET_NAME = "LIST_SHEET_NAME";
    (global as any).LIST_SHEET_ARTICLE_RANGE = "LIST_SHEET_ARTICLE_RANGE";
    (global as any).GENERATED_LIST_SHEET_NAME = "GENERATED_LIST_SHEET_NAME";
    (global as any).GENERATED_LIST_SHEET_ARTICLE_RANGE = "GENERATED_LIST_SHEET_ARTICLE_RANGE";
  });

  afterEach(() => {
    delete (global as any).LIST_SHEET_NAME;
    delete (global as any).LIST_SHEET_ARTICLE_RANGE;
    delete (global as any).GENERATED_LIST_SHEET_NAME;
    delete (global as any).GENERATED_LIST_SHEET_ARTICLE_RANGE;
  });

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
        { name: "Pain", quantity: "300g" },
        { name: "Eau", quantity: "" },
        { name: "Brioche", quantity: "1kg" },
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
          quantity: "100g",
        }, {
          name: "Confiture",
          quantity: "60ml",
        }],
      },
    } as Record<string, Recipe>;

    const list = [
      { name: "Pain", quantity: "300g" },
      { name: "Tartines", quantity: "2p" },
      { name: "Eau", quantity: "" },
      { name: "Brioche", quantity: "1kg" },
      { name: "Pain", quantity: "600g" },
    ];

    beforeEach(() => {
      (global as any).resizeRecipe = resizeRecipe;
      (global as any).reduceQuantities = reduceQuantities;
    });

    afterEach(() => {
      delete (global as any).resizeRecipe;
      delete (global as any).reduceQuantities;
    });

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
        [true, "Œufs", "6"],
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
          expect(notation).toBe("GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_ARTICLE_RANGE");
          return range;
        },
      } as Partial<GoogleAppsScript.Spreadsheet.Spreadsheet>;
    });

    it("should keep articles that haven’t changed with the same `checked` status", () => {
      updateGeneratedList(spreadsheet as any, list);

      expect(spreadsheet.getRange!("GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_ARTICLE_RANGE").getValues()).toStrictEqual(expect.arrayContaining([
        [false, "Pain", "500g"],
        [true, "Baguette", "250g"],
      ]));
    });

    it("should remove articles that are no longer listed", () => {
      updateGeneratedList(spreadsheet as any, list);

      expect(spreadsheet.getRange!("GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_ARTICLE_RANGE").getValues()).toStrictEqual(expect.not.arrayContaining([[false, "Beurre", "500g"]]));
      expect(spreadsheet.getRange!("GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_ARTICLE_RANGE").getValues()).toStrictEqual(expect.not.arrayContaining([[true, "Crème Fraîche", "5cl"]]));
    });

    it("should add articles that were not listed before", () => {
      updateGeneratedList(spreadsheet as any, list);

      expect(spreadsheet.getRange!("GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_ARTICLE_RANGE").getValues()).toStrictEqual(expect.arrayContaining([[false, "Saucisson", "100g"]]));
    });

    it("should 'uncheck' articles that have changed quantities", () => {
      updateGeneratedList(spreadsheet as any, list);

      expect(spreadsheet.getRange!("GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_ARTICLE_RANGE").getValues()).toStrictEqual(expect.arrayContaining([
        [false, "Yaourt", "1l"],
        [false, "Œufs", "12"],
      ]));
    });

    it("should match snapshot", () => {
      updateGeneratedList(spreadsheet as any, list);

      expect(spreadsheet.getRange!("GENERATED_LIST_SHEET_NAME!GENERATED_LIST_SHEET_ARTICLE_RANGE").getValues()).toMatchSnapshot();
    });
  });
});

function createRangeFromValues(initialValues: any[][]): GoogleAppsScript.Spreadsheet.Range {
  let values = initialValues;

  const range = {
    getNumRows: () => values.length,
    getValues: () => values,
    setValues: (newValues: any[][]) => { values = newValues },
  } as Partial<GoogleAppsScript.Spreadsheet.Range>;

  return range as any;
}
