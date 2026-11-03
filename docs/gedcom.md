# GEDCOM import and export

Family Chronicles reads and writes [GEDCOM 5.5.1](https://gedcom.io/specifications/ged551.pdf),
the common exchange format of genealogy software (Ancestry, MyHeritage, Gramps, Ahnenblatt, …).

Both endpoints need the role **Editor** or higher, because they read or write the whole database.

## Import

```bash
curl -X POST "http://localhost:8080/api/v1/gedcom/import?family=Schmidt" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@stammbaum.ged"
```

The file can also be sent as raw body (`Content-Type: text/plain`). Maximum size: 50 MB.

| Query    | Description                                                                   |
| -------- | ----------------------------------------------------------------------------- |
| `family` | Optional. Creates a family with this name and adds all imported persons to it |

Response (`201`):

```json
{
	"Persons": 4,
	"Relationships": 5,
	"FamilyId": "…",
	"Warnings": ["Line 42: @F1@ refers to unknown person @I99@."]
}
```

Invalid files are rejected with `400` and the line number of the first error. Nothing is stored in that case.

**The import only adds data.** Existing persons are not merged or overwritten, so importing the same file twice
creates duplicates.

### What is imported

| GEDCOM                           | Family Chronicles                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `INDI` / `NAME`, `GIVN`, `SURN`  | Person: first given name → first name, other given names → middle names, surname → last names |
| `NAME` with `TYPE birth/maiden`  | Birth name                                                                                    |
| `SEX` `M` / `F` / `X` / `U`      | Gender                                                                                        |
| `BIRT` / `DEAT` `DATE`, `PLAC`   | Date and place of birth / death                                                               |
| `DEAT` `CAUS`                    | Cause of death                                                                                |
| `NOTE` (inline or `@N1@` record) | Notes                                                                                         |
| `FAM` `HUSB` + `WIFE`            | Relationship `Spouse` (with `MARR`) or `Partner`; `MARR`/`DIV` dates → start/end date         |
| `FAM` `CHIL`                     | Relationship `Parent` from each parent to the child                                           |
| `FAMC` `PEDI adopted/foster`     | Role "Adoptiert" / "Pflege" on the parent relationship                                        |

Dates: `12 APR 1901` → `1901-04-12`, `APR 1901` → `1901-04`, `1901` → `1901`.
Inexact dates (`ABT`, `BEF`, `AFT`, `BET … AND …`, `FROM … TO …`, other calendars) keep the first date and
the original text is added to the person's notes, so no information is lost.

Encoding: UTF-8 (with or without BOM). Other files are read as Latin-1 with a warning; ANSEL is not supported.

Not imported: media objects (`OBJE`) – GEDCOM files only reference file paths on the original computer,
the files themselves are not part of the file.

## Export

```bash
curl -H "Authorization: Bearer $TOKEN" -o stammbaum.ged http://localhost:8080/api/v1/gedcom/export
```

Exports all persons with their life events and sources, and their relationships as GEDCOM 5.5.1 in UTF-8.
Sources become `SOUR` records that the persons cite with `PAGE`. Couples and their children become
`FAM` records; spouses get `MARR` (and `DIV` with an end date). Families (surname groups) and media are not part
of the export.

Exported files contain personal data of living persons – handle them with care.
