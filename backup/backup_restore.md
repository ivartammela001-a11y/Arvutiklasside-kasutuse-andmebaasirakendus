# Andmebaasi varundamine ja taastamine

## Varundamise meetodid

### Meetod 1: SQL dump

SQL dump loob tekstifaili, mis sisaldab koiki CREATE TABLE ja INSERT lauseid.
See on inimloetav ja porditav erinevate andmebaaside vahel.

### Meetod 2: Faili koopia

SQLite andmebaas on yks fail. Lihtne failikopia on kiireim viis varukoopia
tegemiseks.

## Varundamise kaivitamine

```bash
cd app
bun run backup

# voi otse:
bun ../backup/backup.ts
```

Tulemus:
- `backup/backup_YYYY-MM-DD.sql` - SQL dump
- `backup/backup_YYYY-MM-DD.db` - Andmebaasi koopia

## Taastamine SQL dump'ist

```bash
# Kustuta olemasolev andmebaas
rm data/klassiruumid.db

# Taasta SQL dump'ist
sqlite3 data/klassiruumid.db < backup/backup_2026-02-11.sql
```

## Taastamine failikoopiast

```bash
# Kopeeri varukoopia tagasi
cp backup/backup_2026-02-11.db data/klassiruumid.db
```

## Taastamise test (todistus)

### Samm 1: Enne kustutamist

```bash
$ sqlite3 data/klassiruumid.db "SELECT COUNT(*) FROM booking;"
9
$ sqlite3 data/klassiruumid.db "SELECT COUNT(*) FROM classroom;"
9
```

### Samm 2: Varundamine

```bash
$ bun backup/backup.ts
=== ANDMEBAASI VARUNDAMINE ===
Meetod 1: SQL dump...
  SQL dump salvestatud: backup/backup_2026-02-11.sql
Meetod 2: Andmebaasi faili koopia...
  Faili koopia: backup/backup_2026-02-11.db
```

### Samm 3: Andmete kustutamine (kontrollitud test)

```bash
$ sqlite3 data/klassiruumid.db "DELETE FROM booking;"
$ sqlite3 data/klassiruumid.db "SELECT COUNT(*) FROM booking;"
0
```

### Samm 4: Taastamine

```bash
$ cp backup/backup_2026-02-11.db data/klassiruumid.db
$ sqlite3 data/klassiruumid.db "SELECT COUNT(*) FROM booking;"
9
```

Andmed on edukalt taastatud!

## Soovitused

- Tehke varukoopia enne iga suuremat muudatust
- Hoidke varukoopiad eraldi kaustas
- Kontrollige regulaarselt varukoopiate toimimist
- Tootmiskeskkonnas automatiseerige varundamine (nt cron job)
