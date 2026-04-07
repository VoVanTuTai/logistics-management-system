# ID Code Rules

`infra/dev/postgres/code-rules.sql` contains database constraints for:

- Hub segment codes (`001/002/003` + area + sequence)
- Hub route codes (`01..10` per hub)
- Bag code (`MB` + 10 digits)
- Shipment code (`111|101|222|333` + 9 digits)
- Employee login code (`8` digits by role prefix)
- User ID equals login code (no random cuid)
- Merchant code (`411` + 5 digits)
- Vehicle tag code (`XT` + 10 digits)

## Apply

1. Connect to the target database.
2. Run only the section that matches that database.
3. Keep constraints as `NOT VALID` until legacy data is migrated.
4. After migration, run `VALIDATE CONSTRAINT` statements.
