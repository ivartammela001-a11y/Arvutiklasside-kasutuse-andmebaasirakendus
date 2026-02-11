# Oiguste haldamine

## Sissejuhatus

Selles projektis kasutatakse MySQL andmebaasi, mis toetab taislikult
kasutajate, rollide ja oiguste haldamist SQL GRANT/REVOKE lausetega.

## Rollid ja kasutajad

| Kasutaja | Parool | Oigused |
|----------|--------|---------|
| `admin_kasutaja` | `Admin_parool_123!` | SELECT, INSERT, UPDATE, DELETE koikidele tabelitele |
| `vaataja_kasutaja` | `Vaataja_parool_456!` | Ainult SELECT koikidele tabelitele |

## Oiguste tabel

| Toiming                  | admin_kasutaja | vaataja_kasutaja |
| ------------------------ | -------------- | ---------------- |
| Broneeringute vaatamine  | Jah            | Jah              |
| Broneeringu lisamine     | Jah            | Ei               |
| Broneeringu muutmine     | Jah            | Ei               |
| Broneeringu kustutamine  | Jah            | Ei               |
| Klasside vaatamine       | Jah            | Jah              |
| Klasside haldamine       | Jah            | Ei               |
| Kasutajate vaatamine     | Jah            | Jah              |
| Kasutajate haldamine     | Jah            | Ei               |

## Kuidas testida

### 1. Oiguste skripti kaivitamine

```bash
mysql -u root < permissions.sql
```

### 2. Oiguste kontroll

```bash
# Vaata admin oigusi
mysql -u root -e "SHOW GRANTS FOR 'admin_kasutaja'@'localhost';"

# Vaata vaataja oigusi
mysql -u root -e "SHOW GRANTS FOR 'vaataja_kasutaja'@'localhost';"
```

### 3. Testimine admin kasutajaga

```bash
# Admin saab andmeid lisada
mysql -u admin_kasutaja -p'Admin_parool_123!' klassiruumid -e "INSERT INTO lesson_type (name) VALUES ('Test');"

# Ja kustutada
mysql -u admin_kasutaja -p'Admin_parool_123!' klassiruumid -e "DELETE FROM lesson_type WHERE name='Test';"
```

### 4. Testimine vaataja kasutajaga

```bash
# Vaataja saab andmeid lugeda
mysql -u vaataja_kasutaja -p'Vaataja_parool_456!' klassiruumid -e "SELECT * FROM classroom;"

# Vaataja EI saa andmeid lisada (peaks andma vea)
mysql -u vaataja_kasutaja -p'Vaataja_parool_456!' klassiruumid -e "INSERT INTO classroom (name, building, capacity) VALUES ('Test', 'Test', 10);"
# ERROR 1142 (42000): INSERT command denied to user 'vaataja_kasutaja'@'localhost' for table 'classroom'
```

### 5. REVOKE naite

```bash
# Eemaldame vaatajalt user_or_group tabeli lugemise oiguse
mysql -u root -e "REVOKE SELECT ON klassiruumid.user_or_group FROM 'vaataja_kasutaja'@'localhost'; FLUSH PRIVILEGES;"

# Kontrollime - vaataja ei saa enam kasutajaid naha
mysql -u vaataja_kasutaja -p'Vaataja_parool_456!' klassiruumid -e "SELECT * FROM user_or_group;"
# ERROR 1142 (42000): SELECT command denied

# Taastame oiguse
mysql -u root -e "GRANT SELECT ON klassiruumid.user_or_group TO 'vaataja_kasutaja'@'localhost'; FLUSH PRIVILEGES;"
```
