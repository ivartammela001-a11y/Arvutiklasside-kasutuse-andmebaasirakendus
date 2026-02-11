# Andmebaasi varundamine ja taastamine

## Varundamise meetod

Kasutame `mysqldump` tööriista, mis loob SQL dump-faili kõigi tabelite
struktuuride, andmete ja triggeritega. See on inimloetav ja porditav.

## Varundamise käivitamine

```bash
bun run backup

# või otse:
bun backup/backup.ts
```

Tulemus:
- `backup/backup_YYYY-MM-DD.sql` - täielik SQL dump (struktuur + andmed + triggerid)

## Taastamine SQL dump'ist

```bash
# Kustuta andmebaas ja taasta dump'ist
mysql -u root -e "DROP DATABASE IF EXISTS klassiruumid;"
mysql -u root < backup/backup_2026-02-11.sql
```

## Taastamise test (tõendus)

### Samm 1: Enne kustutamist

```bash
$ mysql -u root klassiruumid -e "SELECT COUNT(*) AS broneeringuid FROM booking;"
+---------------+
| broneeringuid |
+---------------+
|             9 |
+---------------+

$ mysql -u root klassiruumid -e "SELECT COUNT(*) AS klasse FROM classroom;"
+--------+
| klasse |
+--------+
|      9 |
+--------+
```

### Samm 2: Varundamine

```bash
$ bun backup/backup.ts
=== ANDMEBAASI VARUNDAMINE ===
Meetod: mysqldump...
  Varukoopia salvestatud: backup/backup_2026-02-11.sql

=== VARUKOOPIA STATISTIKA ===
  lesson_type: 5 rida
  classroom: 9 rida
  user_or_group: 9 rida
  booking: 9 rida
```

### Samm 3: Andmete kustutamine (kontrollitud test)

```bash
$ mysql -u root klassiruumid -e "DELETE FROM booking;"
$ mysql -u root klassiruumid -e "SELECT COUNT(*) AS broneeringuid FROM booking;"
+---------------+
| broneeringuid |
+---------------+
|             0 |
+---------------+
```

### Samm 4: Taastamine

```bash
$ mysql -u root < backup/backup_2026-02-11.sql
$ mysql -u root klassiruumid -e "SELECT COUNT(*) AS broneeringuid FROM booking;"
+---------------+
| broneeringuid |
+---------------+
|             9 |
+---------------+
```

Andmed on edukalt taastatud!

## Soovitused

- Tehke varukoopia enne iga suuremat muudatust
- Hoidke varukoopiad eraldi kaustas
- Kontrollige regulaarselt varukoopiate toimimist
- Tootmiskeskkonnas automatiseerige varundamine (nt cron job)
