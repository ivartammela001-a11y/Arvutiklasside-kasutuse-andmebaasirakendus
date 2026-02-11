-- ============================================================
-- Arvutiklasside kasutuse andmebaas
-- DDL genereeritud dbdiagram.io CASE tööriistast
-- ============================================================

PRAGMA foreign_keys = ON;

-- Tunni tüüpide tabel (lookup/klassifikaator)
CREATE TABLE IF NOT EXISTS lesson_type (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL UNIQUE,
    description TEXT
);

-- Arvutiklasside tabel
CREATE TABLE IF NOT EXISTS classroom (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL UNIQUE,
    building      TEXT    NOT NULL,
    floor         INTEGER NOT NULL DEFAULT 1,
    capacity      INTEGER NOT NULL CHECK (capacity > 0),
    has_projector INTEGER NOT NULL DEFAULT 0 CHECK (has_projector IN (0, 1)),
    has_webcam    INTEGER NOT NULL DEFAULT 0 CHECK (has_webcam IN (0, 1)),
    description   TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Kasutajate/gruppide tabel
CREATE TABLE IF NOT EXISTS user_or_group (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    UNIQUE,
    role       TEXT    NOT NULL CHECK (role IN ('opetaja', 'grupp', 'admin')),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Broneeringute tabel
CREATE TABLE IF NOT EXISTS booking (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    classroom_id       INTEGER NOT NULL,
    user_id            INTEGER NOT NULL,
    lesson_type_id     INTEGER,
    date               TEXT    NOT NULL,
    start_time         TEXT    NOT NULL,
    end_time           TEXT    NOT NULL,
    participants_count INTEGER NOT NULL DEFAULT 0 CHECK (participants_count >= 0),
    description        TEXT,
    created_at         TEXT    NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (classroom_id)   REFERENCES classroom(id)    ON DELETE CASCADE,
    FOREIGN KEY (user_id)        REFERENCES user_or_group(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_type_id) REFERENCES lesson_type(id)   ON DELETE SET NULL,

    CHECK (end_time > start_time),
    CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
    CHECK (start_time GLOB '[0-2][0-9]:[0-5][0-9]'),
    CHECK (end_time GLOB '[0-2][0-9]:[0-5][0-9]')
);

-- Indeksid kiiremateks päringuteks
CREATE INDEX IF NOT EXISTS idx_booking_classroom_date ON booking(classroom_id, date);
CREATE INDEX IF NOT EXISTS idx_booking_user           ON booking(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_date           ON booking(date);

-- Trigger: keela kattuvad broneeringud samas klassis (INSERT)
CREATE TRIGGER IF NOT EXISTS trg_no_overlap_insert
BEFORE INSERT ON booking
BEGIN
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM booking
            WHERE classroom_id = NEW.classroom_id
              AND date = NEW.date
              AND NEW.start_time < end_time
              AND NEW.end_time > start_time
        )
        THEN RAISE(ABORT, 'Broneeringuajad kattuvad! Samas klassis on juba broneering sellel ajal.')
    END;
END;

-- Trigger: keela kattuvad broneeringud samas klassis (UPDATE)
CREATE TRIGGER IF NOT EXISTS trg_no_overlap_update
BEFORE UPDATE ON booking
BEGIN
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM booking
            WHERE classroom_id = NEW.classroom_id
              AND date = NEW.date
              AND id != NEW.id
              AND NEW.start_time < end_time
              AND NEW.end_time > start_time
        )
        THEN RAISE(ABORT, 'Broneeringuajad kattuvad! Samas klassis on juba broneering sellel ajal.')
    END;
END;
