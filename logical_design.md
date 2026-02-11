# Andmebaasi loogiline disain

## Tabelite valik

Andmebaas koosneb neljast tabelist, mis katavad arvutiklasside broneerimissysteemi
pohifunktsionaalsuse:

1. **classroom** - arvutiklassid, kus toimuvad tunnid
2. **user_or_group** - opetajad ja oppegrupid, kes broneerivad klasse
3. **booking** - broneeringud, mis seovad klassi ja kasutaja konkreetse ajaga
4. **lesson_type** - tunni tuupide klassifikaator (loeng, praktikum jne)

## Seosed ja kardinaalsused

- **classroom → booking**: 1:N (uhel klassil voib olla mitu broneeringut)
- **user_or_group → booking**: 1:N (uks kasutaja/grupp voib teha mitu broneeringut)
- **lesson_type → booking**: 1:N (uks tunni tuup voib olla mitmel broneeringul, seos on valikuline)

N:M seoseid selles mudelis ei esine, kuna iga broneering on seotud tapselt
uhe klassi ja uhe kasutajaga. Kui oleks vaja, et uhel broneeringul oleks mitu
opetajat, tuleks luua vahetabel `booking_user`.

## Arireglid ja piirangud

### Arireegel 1: Broneeringu loppaeg peab olema suurem kui algusaeg

Rakendatud **CHECK constraint**-iga `booking` tabelis:

```sql
CHECK (end_time > start_time)
```

### Arireegel 2: Broneeringud ei tohi samas klassis kattuda

Rakendatud **BEFORE INSERT** ja **BEFORE UPDATE** triggeritega, mis kontrollivad
aja kattuvust:

```sql
CREATE TRIGGER trg_no_overlap_insert BEFORE INSERT ON booking
BEGIN
    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM booking
        WHERE classroom_id = NEW.classroom_id AND date = NEW.date
        AND NEW.start_time < end_time AND NEW.end_time > start_time
    ) THEN RAISE(ABORT, 'Broneeringuajad kattuvad!') END;
END;
```

### Arireegel 3: Osalejate arv ei tohi olla negatiivne

```sql
CHECK (participants_count >= 0)
```

### Arireegel 4: Klassi mahutavus peab olema positiivne

```sql
CHECK (capacity > 0)
```

## Normaliseerimine

Andmebaas on **kolmandas normaalvormis (3NF)**:

- **1NF**: Koik veerud sisaldavad atomaarseid vaartusi, duplikaatread puuduvad
- **2NF**: Koik mitte-votme veerud soltuvad tervest primaarvotmest
- **3NF**: Transitiivseid soltuvusi ei esine - tunni tuup on eraldatud
  omaette tabelisse (`lesson_type`), mitte salvestatud tekstina broneeringus

## Indeksid

Joudluse parandamiseks on loodud kolm indeksit:

- `idx_booking_classroom_date` - kiire otsing klassi ja kuupaeva jargi (kattuvuse kontroll)
- `idx_booking_user` - kiire otsing kasutaja broneeringute jargi
- `idx_booking_date` - kiire otsing kuupaeva jargi (statistika paringud)
