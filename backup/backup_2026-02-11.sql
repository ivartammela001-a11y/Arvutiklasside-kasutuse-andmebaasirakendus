-- Arvutiklasside andmebaasi varukoopia
-- Kuupaev: 2026-02-11
-- Genereeritud automaatselt backup.ts skriptiga

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE lesson_type (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE sqlite_sequence(name,seq);

CREATE TABLE classroom (
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

CREATE TABLE user_or_group (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    UNIQUE,
    role       TEXT    NOT NULL CHECK (role IN ('opetaja', 'grupp', 'admin')),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE booking (
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

-- Andmed: lesson_type (5 rida)
INSERT INTO "lesson_type" (id, name, description) VALUES (1, 'Loeng', 'Teoreetiline loeng');
INSERT INTO "lesson_type" (id, name, description) VALUES (2, 'Praktikum', 'Praktiline töö arvutiklassis');
INSERT INTO "lesson_type" (id, name, description) VALUES (3, 'Seminar', 'Arutelu ja rühmatöö');
INSERT INTO "lesson_type" (id, name, description) VALUES (4, 'Eksam', 'Eksamite läbiviimine');
INSERT INTO "lesson_type" (id, name, description) VALUES (5, 'Muu', 'Muu tegevus');

-- Andmed: classroom (9 rida)
INSERT INTO "classroom" (id, name, building, floor, capacity, has_projector, has_webcam, description, created_at) VALUES (1, 'A-201', 'A-hoone', 2, 30, 1, 1, 'Programmeerimise labor', '2026-02-11 11:52:26');
INSERT INTO "classroom" (id, name, building, floor, capacity, has_projector, has_webcam, description, created_at) VALUES (2, 'A-202', 'A-hoone', 2, 25, 1, 0, 'Võrgutehnoloogia klass', '2026-02-11 11:52:26');
INSERT INTO "classroom" (id, name, building, floor, capacity, has_projector, has_webcam, description, created_at) VALUES (3, 'B-101', 'B-hoone', 1, 20, 0, 0, 'Arvutiõppe klass', '2026-02-11 11:52:26');
INSERT INTO "classroom" (id, name, building, floor, capacity, has_projector, has_webcam, description, created_at) VALUES (4, 'B-305', 'B-hoone', 3, 35, 1, 1, 'Multimeedia labor', '2026-02-11 11:52:26');
INSERT INTO "classroom" (id, name, building, floor, capacity, has_projector, has_webcam, description, created_at) VALUES (5, 'C-110', 'C-hoone', 1, 15, 1, 0, 'Väike seminariruum', '2026-02-11 11:52:26');
INSERT INTO "classroom" (id, name, building, floor, capacity, has_projector, has_webcam, description, created_at) VALUES (6, 'D-101', 'D-hoone', 1, 22, 1, 0, 'Programmeerimise labor', '2026-02-11 11:53:10');
INSERT INTO "classroom" (id, name, building, floor, capacity, has_projector, has_webcam, description, created_at) VALUES (7, 'D-205', 'D-hoone', 2, 30, 1, 1, 'Multimeedia klass', '2026-02-11 11:53:10');
INSERT INTO "classroom" (id, name, building, floor, capacity, has_projector, has_webcam, description, created_at) VALUES (8, 'E-301', 'E-hoone', 3, 18, 0, 0, 'Vorgutehnika labor', '2026-02-11 11:53:10');
INSERT INTO "classroom" (id, name, building, floor, capacity, has_projector, has_webcam, description, created_at) VALUES (9, 'E-102', 'E-hoone', 1, 24, 1, 0, 'Tarkvara testimise klass', '2026-02-11 11:53:10');

-- Andmed: user_or_group (9 rida)
INSERT INTO "user_or_group" (id, name, email, role, created_at) VALUES (1, 'Mart Tamm', 'mart.tamm@kool.ee', 'opetaja', '2026-02-11 11:52:26');
INSERT INTO "user_or_group" (id, name, email, role, created_at) VALUES (2, 'Kati Kask', 'kati.kask@kool.ee', 'opetaja', '2026-02-11 11:52:26');
INSERT INTO "user_or_group" (id, name, email, role, created_at) VALUES (3, 'TAK-21', 'tak21@kool.ee', 'grupp', '2026-02-11 11:52:26');
INSERT INTO "user_or_group" (id, name, email, role, created_at) VALUES (4, 'Admin Kasutaja', 'admin@kool.ee', 'admin', '2026-02-11 11:52:26');
INSERT INTO "user_or_group" (id, name, email, role, created_at) VALUES (5, 'Piret Puu', 'piret.puu@kool.ee', 'opetaja', '2026-02-11 11:53:10');
INSERT INTO "user_or_group" (id, name, email, role, created_at) VALUES (6, 'Jaan Jaanson', 'jaan.jaanson@kool.ee', 'opetaja', '2026-02-11 11:53:10');
INSERT INTO "user_or_group" (id, name, email, role, created_at) VALUES (7, 'Liina Lepik', 'liina.lepik@kool.ee', 'opetaja', '2026-02-11 11:53:10');
INSERT INTO "user_or_group" (id, name, email, role, created_at) VALUES (8, 'RIF-22', 'rif22@kool.ee', 'grupp', '2026-02-11 11:53:10');
INSERT INTO "user_or_group" (id, name, email, role, created_at) VALUES (9, 'TAK-23', 'tak23@kool.ee', 'grupp', '2026-02-11 11:53:10');

-- Andmed: booking (9 rida)
INSERT INTO "booking" (id, classroom_id, user_id, lesson_type_id, date, start_time, end_time, participants_count, description, created_at) VALUES (1, 1, 1, 1, '2026-02-12', '08:00', '09:30', 28, 'Programmeerimise loeng', '2026-02-11 11:52:26');
INSERT INTO "booking" (id, classroom_id, user_id, lesson_type_id, date, start_time, end_time, participants_count, description, created_at) VALUES (2, 1, 2, 2, '2026-02-12', '10:00', '11:30', 25, 'Andmebaaside praktikum', '2026-02-11 11:52:26');
INSERT INTO "booking" (id, classroom_id, user_id, lesson_type_id, date, start_time, end_time, participants_count, description, created_at) VALUES (3, 2, 1, 2, '2026-02-12', '08:00', '09:30', 20, 'Võrkude praktikum', '2026-02-11 11:52:26');
INSERT INTO "booking" (id, classroom_id, user_id, lesson_type_id, date, start_time, end_time, participants_count, description, created_at) VALUES (4, 3, 3, 3, '2026-02-13', '13:00', '14:30', 18, 'IT seminar', '2026-02-11 11:52:26');
INSERT INTO "booking" (id, classroom_id, user_id, lesson_type_id, date, start_time, end_time, participants_count, description, created_at) VALUES (5, 4, 2, 1, '2026-02-14', '09:00', '10:30', 30, 'Multimeedia loeng', '2026-02-11 11:52:26');
INSERT INTO "booking" (id, classroom_id, user_id, lesson_type_id, date, start_time, end_time, participants_count, description, created_at) VALUES (6, 6, 5, 2, '2026-02-16', '10:00', '11:30', 20, 'Veebiarenduse praktikum', '2026-02-11 11:53:10');
INSERT INTO "booking" (id, classroom_id, user_id, lesson_type_id, date, start_time, end_time, participants_count, description, created_at) VALUES (7, 7, 6, 1, '2026-02-16', '08:00', '09:30', 28, 'Programmeerimise loeng', '2026-02-11 11:53:10');
INSERT INTO "booking" (id, classroom_id, user_id, lesson_type_id, date, start_time, end_time, participants_count, description, created_at) VALUES (8, 8, 7, 3, '2026-02-17', '13:00', '14:30', 16, 'IT-turvalisuse seminar', '2026-02-11 11:53:10');
INSERT INTO "booking" (id, classroom_id, user_id, lesson_type_id, date, start_time, end_time, participants_count, description, created_at) VALUES (9, 6, 5, 4, '2026-02-18', '09:00', '11:00', 22, 'Programmeerimise eksam', '2026-02-11 11:53:10');

CREATE TRIGGER trg_no_overlap_insert
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

CREATE TRIGGER trg_no_overlap_update
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

CREATE INDEX idx_booking_classroom_date ON booking(classroom_id, date);
CREATE INDEX idx_booking_user           ON booking(user_id);
CREATE INDEX idx_booking_date           ON booking(date);

COMMIT;
