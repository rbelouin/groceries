# groceries
Google Apps Script / Spreadsheet helping you out with groceries!

Note: I am French and write my grocery lists in French, it should only require you to rewrite a few constants to make the project work in the language of your choice. Internationalization is not my top priority at the moment!

## Setup

```bash
yarn                                    # install dependencies
yarn clasp login                        # link your Google Account
yarn clasp create --title "Courses"     # create a base spreadsheet / script (select "sheets")
```

This should output something like:

```
? Create which script? sheets
Created new Google Sheet: https://drive.google.com/open?id=…
Created new Google Sheets Add-on script: https://script.google.com/d/…
…
```

Keep track of the two generated URLs above, they’ll be useful for future use. Then add the necessary `oauthScopes` to the generated `appsscript.json`:

```json
{
  "timeZone": "America/New_York",
  "dependencies": {
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets"
  ]
}
```

Push the sources to Apps Script:

```bash
yarn clasp push # Yes, you want to push and overwrite
```

Then open the _Google Sheets Add-on script_ that was generated earlier. Run the `init` function; give it permissions to _
See, edit, create, and delete all your Google Sheets spreadsheets_. Assess that a _List_ sheet has been added to the _Google Sheet_ that was also generated earlier.

Congrats! You can now start building your grocery list.
