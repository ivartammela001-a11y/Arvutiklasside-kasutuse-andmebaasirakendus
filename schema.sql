-- ============================================================
-- Arvutiklasside kasutuse andmebaas (MySQL)
-- DDL genereeritud dbdiagram.io CASE tööriistast
-- ============================================================

CREATE DATABASE IF NOT EXISTS klassiruumid
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE klassiruumid;

-- Tunni tüüpide tabel (lookup/klassifikaator)
CREATE TABLE IF NOT EXISTS lesson_type (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
) ENGINE=InnoDB;

-- Arvutiklasside tabel
CREATE TABLE IF NOT EXISTS classroom (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(50)  NOT NULL UNIQUE,
    building      VARCHAR(100) NOT NULL,
    floor         INT          NOT NULL DEFAULT 1,
    capacity      INT          NOT NULL CHECK (capacity > 0),
    has_projector BOOLEAN      NOT NULL DEFAULT FALSE,
    has_webcam    BOOLEAN      NOT NULL DEFAULT FALSE,
    description   VARCHAR(255),
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Kasutajate/gruppide tabel
CREATE TABLE IF NOT EXISTS user_or_group (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) UNIQUE,
    role       ENUM('opetaja', 'grupp', 'admin') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Broneeringute tabel
CREATE TABLE IF NOT EXISTS booking (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    classroom_id       INT  NOT NULL,
    user_id            INT  NOT NULL,
    lesson_type_id     INT  NULL,
    date               DATE NOT NULL,
    start_time         TIME NOT NULL,
    end_time           TIME NOT NULL,
    participants_count INT  NOT NULL DEFAULT 0 CHECK (participants_count >= 0),
    description        VARCHAR(255),
    created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (classroom_id)   REFERENCES classroom(id)     ON DELETE CASCADE,
    FOREIGN KEY (user_id)        REFERENCES user_or_group(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_type_id) REFERENCES lesson_type(id)   ON DELETE SET NULL,

    CHECK (end_time > start_time)
) ENGINE=InnoDB;

-- Indeksid kiiremateks päringuteks
CREATE INDEX idx_booking_classroom_date ON booking(classroom_id, date);
CREATE INDEX idx_booking_user           ON booking(user_id);
CREATE INDEX idx_booking_date           ON booking(date);

-- Trigger: keela kattuvad broneeringud samas klassis (INSERT)
DELIMITER //
CREATE TRIGGER trg_no_overlap_insert
BEFORE INSERT ON booking
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM booking
        WHERE classroom_id = NEW.classroom_id
          AND date = NEW.date
          AND NEW.start_time < end_time
          AND NEW.end_time > start_time
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Broneeringuajad kattuvad! Samas klassis on juba broneering sellel ajal.';
    END IF;
END//

-- Trigger: keela kattuvad broneeringud samas klassis (UPDATE)
CREATE TRIGGER trg_no_overlap_update
BEFORE UPDATE ON booking
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM booking
        WHERE classroom_id = NEW.classroom_id
          AND date = NEW.date
          AND id != NEW.id
          AND NEW.start_time < end_time
          AND NEW.end_time > start_time
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Broneeringuajad kattuvad! Samas klassis on juba broneering sellel ajal.';
    END IF;
END//
DELIMITER ;
