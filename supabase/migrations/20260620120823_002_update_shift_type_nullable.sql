-- shift_type artık opsiyonel ve nullable olacak
ALTER TABLE timesheet_entries ALTER COLUMN shift_type DROP NOT NULL;
ALTER TABLE timesheet_entries ALTER COLUMN shift_type SET DEFAULT 'MANUAL';
ALTER TABLE timesheet_entries DROP CONSTRAINT IF EXISTS timesheet_entries_shift_type_check;
