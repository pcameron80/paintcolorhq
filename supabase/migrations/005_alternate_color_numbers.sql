-- Some brands sell one color under multiple numbering systems (e.g. Benjamin
-- Moore "October Mist" is 1495 in the US line and CC-550 in the Canadian
-- Designer Classics line; PPG carries modern 1066-4 codes alongside legacy
-- 18-28 codes). Those used to be separate rows — near-duplicate pages that
-- cannibalize each other. Duplicate rows are consolidated into one canonical
-- row per (brand, name, hex); the other sales numbers live here so the page
-- can still surface them ("Also sold as CC-550").
alter table colors add column if not exists alternate_numbers text[];
