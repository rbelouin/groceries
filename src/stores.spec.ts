import { getStoreNames, getStoreArticles } from "./stores";
import { Quantity } from "./quantities";

jest.mock("./init", () => {
  const originalModule = jest.requireActual("./init");
  return {
    __esModule: true,
    ...originalModule,
    LIST_SHEET_NAME: "List",
    LIST_SHEET_STORE_NAME: "StoreName",
    LIST_SHEET_NO_STORE: "No Store",
    STORE_SHEET_NAME: "Stores",
  };
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
              [{ value: "Yaourt", note: "1.03kg/1l" }, "01. Produits Laitiers", "3€", "04. Produits Laitiers", "4€", "", ""],
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
            quantity: Quantity.from(1, "", new Map([
              ["mass", new Map([
                ["volume", [Quantity.from(1.03, "kg"), Quantity.from(1, "l")]],
              ])],
            ])),
          },
        },
        "Fromage": {
          name: "Fromage",
          department: "04. Produits Laitiers",
          price: {
            value: 5,
            currency: "€",
            quantity: Quantity.from(1),
          },
        },
      });
      expect(spreadsheet.getSheetByName).toHaveBeenCalledWith("List");
      expect(spreadsheet.getSheetByName).toHaveBeenCalledWith("Stores");
    });
  });
});

function createRangeFromValues(initialValues: any[][]): GoogleAppsScript.Spreadsheet.Range {
  let values = initialValues.map(row => row.map(cell => {
    return typeof cell.value === "string" && typeof cell.note === "string" ? cell.value : cell;
  }));

  let notes = initialValues.map(row => row.map(cell => {
    return typeof cell.value === "string" && typeof cell.note === "string" ? cell.note : "";
  }));

  const range = {
    getNumRows: () => values.length,
    getValues: () => values,
    getNotes: () => notes,
    getValue: () => values[0][0],
    getNote: () => notes[0][0],
    setValues: (newValues: any[][]) => { values = newValues },
    setNotes: (newNotes: any[][]) => { notes = newNotes },
  } as Partial<GoogleAppsScript.Spreadsheet.Range>;

  return range as any;
}
