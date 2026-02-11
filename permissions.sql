-- ============================================================
-- OIGUSTE HALDAMINE (Permissions Management)
-- MySQL 8.x / MariaDB
-- ============================================================

USE klassiruumid;

-- ============================================================
-- 1. KASUTAJATE LOOMINE
-- ============================================================

-- Kustutame vanad kasutajad kui eksisteerivad
DROP USER IF EXISTS 'admin_kasutaja'@'localhost';
DROP USER IF EXISTS 'vaataja_kasutaja'@'localhost';

-- Loome kasutajad
CREATE USER 'admin_kasutaja'@'localhost' IDENTIFIED BY 'Admin_parool_123!';
CREATE USER 'vaataja_kasutaja'@'localhost' IDENTIFIED BY 'Vaataja_parool_456!';

-- ============================================================
-- 2. OIGUSTE ANDMINE (GRANT)
-- ============================================================

-- Admin kasutaja: taielikud oigused koikidele tabelitele
GRANT SELECT, INSERT, UPDATE, DELETE ON klassiruumid.classroom     TO 'admin_kasutaja'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON klassiruumid.user_or_group TO 'admin_kasutaja'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON klassiruumid.booking       TO 'admin_kasutaja'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON klassiruumid.lesson_type   TO 'admin_kasutaja'@'localhost';

-- Vaataja kasutaja: ainult lugemise oigused
GRANT SELECT ON klassiruumid.classroom     TO 'vaataja_kasutaja'@'localhost';
GRANT SELECT ON klassiruumid.user_or_group TO 'vaataja_kasutaja'@'localhost';
GRANT SELECT ON klassiruumid.booking       TO 'vaataja_kasutaja'@'localhost';
GRANT SELECT ON klassiruumid.lesson_type   TO 'vaataja_kasutaja'@'localhost';

-- Oiguste rakendamine
FLUSH PRIVILEGES;

-- ============================================================
-- 3. OIGUSTE KONTROLL
-- ============================================================

SHOW GRANTS FOR 'admin_kasutaja'@'localhost';
SHOW GRANTS FOR 'vaataja_kasutaja'@'localhost';

-- ============================================================
-- 4. OIGUSTE EEMALDAMINE (REVOKE)
-- ============================================================

-- Naite: eemaldame vaatajalt oiguse naha kasutajate andmeid
REVOKE SELECT ON klassiruumid.user_or_group FROM 'vaataja_kasutaja'@'localhost';

-- Kontrolli, et oigus on eemaldatud
SHOW GRANTS FOR 'vaataja_kasutaja'@'localhost';

-- Taastame oiguse (demonstratsiooniks)
GRANT SELECT ON klassiruumid.user_or_group TO 'vaataja_kasutaja'@'localhost';
FLUSH PRIVILEGES;
