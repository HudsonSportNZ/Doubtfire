-- Migration: Employee draft status and nullable start_date
-- New employees default to 'draft' until profile is complete.
-- start_date made nullable so employees can be created before start date is known.

ALTER TABLE employees ALTER COLUMN status    SET DEFAULT 'draft';
ALTER TABLE employees ALTER COLUMN start_date DROP NOT NULL;
