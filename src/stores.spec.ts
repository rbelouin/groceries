import { getStoreNames, getStoreArticles } from "./stores";
import { parsePrice } from "./price";

beforeEach(() => {
  (global as any).LIST_SHEET_NAME = "List";
  (global as any).LIST_SHEET_STORE_NAME = "StoreName";
  (global as any).LIST_SHEET_NO_STORE = "No Store";
  (global as any).STORE_SHEET_NAME = "Stores";
  (global as any).parsePrice = parsePrice;
});

afterEach(() => {
  delete (global as any).LIST_SHEET_NAME;
  delete (global as any).LIST_SHEET_STORE_NAME;
  delete (global as any).LIST_SHEET_NO_STORE;
  delete (global as any).STORE_SHEET_NAME;
  delete (global as any).parsePrice;
});

describe("stores", () => {
  describe("getStoreNames", () => {
    it("should return an empty list when the sheet does not exist", () => {
      const spreadsheet = {
        getSheetByName: (name: string) => {
          expect(name).toBe("Stores");
          return null;
        },
      } as GoogleAppsScript.Spreadsheet.Spreadsheet;

      expect(getStoreNames(spreadsheet)).toStrictEqual([]);
    });

    it("should return the value of every other cell on the first row otherwise, starting from B1", () => {
      const spreadsheet = {
        getSheetByName: (name: string) => {
          expect(name).toBe("Stores");
          return {
            getRange: (range: string) => {
              expect(range).toBe("B1:1");
              return createRangeFromValues([["Store 1", "plop", "Store 2", "plip", "", "", "Store 3", "plap", "", ""]]);
            },
          };
        },
      } as GoogleAppsScript.Spreadsheet.Spreadsheet;

      expect(getStoreNames(spreadsheet)).toStrictEqual(["Store 1", "Store 2", "Store 3"]);
    });
  });

  describe("getStoreArticles", () => {
    it("should return an empty record when the list sheet does not exist", () => {
      const spreadsheet = {
        getSheetByName: jest.fn(() => null),
      };

      expect(getStoreArticles(spreadsheet as any)).toStrictEqual({});
      expect(spreadsheet.getSheetByName).toHaveBeenCalledWith("List");
      expect(spreadsheet.getSheetByName).not.toHaveBeenCalledWith("Stores");
    });

    it("should return an empty record when the selected store is 'No Store'", () => {
      const spreadsheet = {
        getSheetByName: jest.fn(),
      };

      const listSheet = {
        getRange: (range: string) => {
          expect(range).toBe("StoreName");
          return createRangeFromValues([["No Store"]]);
        },
      };

      spreadsheet.getSheetByName.mockImplementation((name: string) => {
        if (name === "List") {
          return listSheet;
        }

        return null;
      });

      expect(getStoreArticles(spreadsheet as any)).toStrictEqual({});
      expect(spreadsheet.getSheetByName).toHaveBeenCalledWith("List");
      expect(spreadsheet.getSheetByName).not.toHaveBeenCalledWith("Stores");
    });

    it("should return an empty record when the store sheet does not exist", () => {
      const spreadsheet = {
        getSheetByName: jest.fn(),
      };

      const listSheet = {
        getRange: (range: string) => {
          expect(range).toBe("StoreName");
          return createRangeFromValues([["Store 1"]]);
        },
      };

      spreadsheet.getSheetByName.mockImplementation((name: string) => {
        if (name === "List") {
          return listSheet;
        }

        return null;
      });

      expect(getStoreArticles(spreadsheet as any)).toStrictEqual({});
      expect(spreadsheet.getSheetByName).toHaveBeenCalledWith("List");
      expect(spreadsheet.getSheetByName).toHaveBeenCalledWith("Stores");
    });

    it("should return an empty record when the store cannot be found", () => {
      const spreadsheet = {
        getSheetByName: jest.fn(),
      };

      const listSheet = {
        getRange: (range: string) => {
          expect(range).toBe("StoreName");
          return createRangeFromValues([["Unknown Store"]]);
        },
      };

      const storeSheet = {
        getRange: (range: string) => {
          expect(range).toBe("B1:1");
          return createRangeFromValues([["Store 1", "", "Store 2", "", "Store 3", ""]]);
        },
      };

      spreadsheet.getSheetByName.mockImplementation((name: string) => {
        if (name === "List") {
          return listSheet;
        }

        if (name === "Stores") {
          return storeSheet;
        }

        return null;
      });

      expect(getStoreArticles(spreadsheet as any)).toStrictEqual({});
      expect(spreadsheet.getSheetByName).toHaveBeenCalledWith("List");
      expect(spreadsheet.getSheetByName).toHaveBeenCalledWith("Stores");
    });

    it("should return a record of articles otherwise", () => {
      const spreadsheet = {
        getSheetByName: jest.fn(),
      };

      const listSheet = {
        getRange: (range: string) => {
          expect(range).toBe("StoreName");
          return createRangeFromValues([["Store 2"]]);
        },
      };

      const storeSheet = {
        getRange: (range: string) => {
          if (range === "B1:1") {
            return createRangeFromValues([["Store 1", "", "Store 2", "", "Store 3", ""]]);
          }

          if (range === "A3:Y") {
            return createRangeFromValues([
              ["Yaourt", "01. Produits Laitiers", "3€", "04. Produits Laitiers", "4€", "", ""],
              ["Lait", "01. Produits Laitiers", "3€", "", "", "", ""],
              ["Fromage", "", "", "04. Produits Laitiers", "5€", "", ""],
            ]);
          }

          return [[]];
        },
      };

      spreadsheet.getSheetByName.mockImplementation((name: string) => {
        if (name === "List") {
          return listSheet;
        }

        if (name === "Stores") {
          return storeSheet;
        }

        return null;
      });

      expect(getStoreArticles(spreadsheet as any)).toStrictEqual({
        "Yaourt": {
          name: "Yaourt",
          department: "04. Produits Laitiers",
          price: {
            value: 4,
            currency: "€",
            quantity: { type: "countable", count: 1, unit: undefined },
          },
        },
        "Fromage": {
          name: "Fromage",
          department: "04. Produits Laitiers",
          price: {
            value: 5,
            currency: "€",
            quantity: { type: "countable", count: 1, unit: undefined },
          },
        },
      });
      expect(spreadsheet.getSheetByName).toHaveBeenCalledWith("List");
      expect(spreadsheet.getSheetByName).toHaveBeenCalledWith("Stores");
    });
  });
});

function createRangeFromValues(initialValues: any[][]): GoogleAppsScript.Spreadsheet.Range {
  let values = initialValues;

  const range = {
    getNumRows: () => values.length,
    getValues: () => values,
    getValue: () => values[0][0],
    setValues: (newValues: any[][]) => { values = newValues },
  } as Partial<GoogleAppsScript.Spreadsheet.Range>;

  return range as any;
}
