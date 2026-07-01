ALTER TABLE timesheet_entries
ALTER COLUMN hours_worked TYPE numeric(4,2) USING hours_worked::numeric;
