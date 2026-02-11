# Oiguste haldamine

## Sissejuhatus

Andmebaasi oiguste haldamine (GRANT/REVOKE) on SQL standardi osa, mida toetavad
toisised andmebaasiserverid nagu MariaDB, PostgreSQL ja Oracle. Oigused
voimalldavad maarata, millised kasutajad saavad milliseid toiminguid teha.

## SQLite piirangud

Selles projektis kasutatakse SQLite andmebaasi, mis on **serverita** (embedded)
andmebaas. SQLite **ei toeta** kasutajate, rollide ega GRANT/REVOKE lauseid,
kuna andmebaasile ligipaaes pohineb failisysteemi oigustel.

Seetottu on oiguste haldamine lahendatud kahel viisil:

1. **Teoreetiline demonstratsioon** (`permissions.sql`) - naitab GRANT/REVOKE
   lauseid MariaDB suuntaksiga
2. **Rakenduse taseme lahendus** (`app/src/middleware/auth.ts`) - tegelik
   rollipohine ligipaaesukontroll

## Rollid

| Toiming                  | admin | viewer |
| ------------------------ | ----- | ------ |
| Broneeringute vaatamine  | Jah   | Jah    |
| Broneeringu lisamine     | Jah   | Ei     |
| Broneeringu muutmine     | Jah   | Ei     |
| Broneeringu kustutamine  | Jah   | Ei     |
| Klasside vaatamine       | Jah   | Jah    |
| Klasside haldamine       | Jah   | Ei     |
| Kasutajate vaatamine     | Jah   | Jah    |
| Kasutajate haldamine     | Jah   | Ei     |
| Statistika vaatamine     | Jah   | Jah    |

## Kuidas testida

### Teoreetiline osa (MariaDB-s)

Kui soovite testida `permissions.sql` faili, kasutage MariaDB serverit:

```bash
# Logige sisse root kasutajana
mysql -u root -p

# Kaivitage skript
SOURCE permissions.sql;

# Kontrollige oigusi
SHOW GRANTS FOR 'admin_kasutaja'@'localhost';
SHOW GRANTS FOR 'vaataja_kasutaja'@'localhost';
```

### Rakenduse taseme lahendus

Rakenduses saab rolli vahetada URL parameeetriga:

```
http://localhost:3000/bookings?role=admin    -- Taielikud oigused
http://localhost:3000/bookings?role=viewer   -- Ainult vaatamine
```

**Admin rolliga:**
- Nahtavad on "Lisa uus", "Muuda" ja "Kustuta" nupud
- Saab luua, muuta ja kustutada broneeringuid, klasse ja kasutajaid

**Viewer rolliga:**
- Nupud "Lisa uus", "Muuda" ja "Kustuta" on peidetud
- Saab ainult vaadata andmeid ja statistikat
- POST/DELETE paringud tagastavad HTTP 403 (Keelatud)

## REVOKE naite selgitus

Failis `permissions.sql` on naidatud, kuidas eemaldada vaataja rollilt oigus
naha kasutajate andmeid:

```sql
REVOKE SELECT ON user_or_group FROM viewer_role;
```

Parast seda ei saa `vaataja_kasutaja` enam `user_or_group` tabelit parieda.
Oiguse saab taastada kaesuga `GRANT SELECT ON user_or_group TO viewer_role;`.
