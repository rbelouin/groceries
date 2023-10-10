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

Keep track of the two generated URLs above, they’ll be useful for future use.
