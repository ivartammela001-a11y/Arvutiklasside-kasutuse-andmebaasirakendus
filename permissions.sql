-- ============================================================
-- OIGUSTE HALDAMINE (Permissions Management)
-- ============================================================
-- NB! See fail on TEOREETILINE demonstratsioon MariaDB/PostgreSQL suuntaksiga.
-- SQLite EI toeta GRANT/REVOKE lauseid.
-- Tegelik oiguste kontroll on rakenduse tasemel (vt app/src/middleware/auth.ts)
-- ============================================================

-- ============================================================
-- 1. ROLLIDE LOOMINE
-- ============================================================

CREATE ROLE admin_role;
CREATE ROLE viewer_role;

-- ============================================================
-- 2. OIGUSTE ANDMINE (GRANT)
-- ============================================================

-- Admin roll: taielikud oigused koikidele tabelitele
GRANT SELECT, INSERT, UPDATE, DELETE ON classroom     TO admin_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_or_group  TO admin_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON booking        TO admin_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON lesson_type    TO admin_role;

-- Vaataja roll: ainult lugemise oigused
GRANT SELECT ON classroom     TO viewer_role;
GRANT SELECT ON user_or_group  TO viewer_role;
GRANT SELECT ON booking        TO viewer_role;
GRANT SELECT ON lesson_type    TO viewer_role;

-- ============================================================
-- 3. KASUTAJATE LOOMINE JA ROLLIDE OMISTAMINE
-- ============================================================

CREATE USER 'admin_kasutaja'@'localhost' IDENTIFIED BY 'tugev_parool_123!';
CREATE USER 'vaataja_kasutaja'@'localhost' IDENTIFIED BY 'vaataja_parool_456!';

GRANT admin_role  TO 'admin_kasutaja'@'localhost';
GRANT viewer_role TO 'vaataja_kasutaja'@'localhost';

-- Rollide aktiveerimine (MariaDB/MySQL)
SET DEFAULT ROLE admin_role  FOR 'admin_kasutaja'@'localhost';
SET DEFAULT ROLE viewer_role FOR 'vaataja_kasutaja'@'localhost';

-- ============================================================
-- 4. OIGUSTE KONTROLL
-- ============================================================

SHOW GRANTS FOR 'admin_kasutaja'@'localhost';
SHOW GRANTS FOR 'vaataja_kasutaja'@'localhost';

-- ============================================================
-- 5. OIGUSTE EEMALDAMINE (REVOKE)
-- ============================================================

-- Naite: eemaldame vaatajalt oiguse naha kasutajate andmeid
REVOKE SELECT ON user_or_group FROM viewer_role;

-- Kontrolli, et oigus on eemaldatud
SHOW GRANTS FOR 'vaataja_kasutaja'@'localhost';

-- Taastame oiguse (demonstratsiooniks)
GRANT SELECT ON user_or_group TO viewer_role;
