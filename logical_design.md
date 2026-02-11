# Andmebaasi loogiline disain

## Tabelite valik

Andmebaas koosneb neljast tabelist, mis katavad arvutiklasside broneerimissüsteemi
põhifunktsionaalsuse:

1. **classroom** - arvutiklassid, kus toimuvad tunnid
2. **user_or_group** - õpetajad ja õppegrupid, kes broneerivad klasse
3. **booking** - broneeringud, mis seovad klassi ja kasutaja konkreetse ajaga
4. **lesson_type** - tunni tüüpide klassifikaator (loeng, praktikum jne)

## Seosed ja kardinaalsused

- **classroom → booking**: 1:N (ühel klassil võib olla mitu broneeringut)
- **user_or_group → booking**: 1:N (üks kasutaja/grupp võib teha mitu broneeringut)
- **lesson_type → booking**: 1:N (üks tunni tüüp võib olla mitmel broneeringul, seos on valikuline)

N:M seoseid selles mudelis ei esine, kuna iga broneering on seotud täpselt
ühe klassi ja ühe kasutajaga. Kui oleks vaja, et ühel broneeringul oleks mitu
õpetajat, tuleks luua vahetabel `booking_user`.

## Ärireglid ja piirangud

### Ärireegel 1: Broneeringu lõppaeg peab olema suurem kui algusaeg

Rakendatud **CHECK constraint**-iga `booking` tabelis:

```sql
CHECK (end_time > start_time)
```

### Ärireegel 2: Broneeringud ei tohi samas klassis kattuda

Rakendatud **BEFORE INSERT** ja **BEFORE UPDATE** triggeritega MySQL-is,
mis kontrollivad aja kattuvust ja annavad veateate:

```sql
CREATE TRIGGER trg_no_overlap_insert BEFORE INSERT ON booking
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM booking
        WHERE classroom_id = NEW.classroom_id AND date = NEW.date
        AND NEW.start_time < end_time AND NEW.end_time > start_time
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Broneeringuajad kattuvad!';
    END IF;
END;
```

### Ärireegel 3: Osalejate arv ei tohi olla negatiivne

```sql
CHECK (participants_count >= 0)
```

### Ärireegel 4: Klassi mahutavus peab olema positiivne

```sql
CHECK (capacity > 0)
```

## Normaliseerimine

Andmebaas on **kolmandas normaalvormis (3NF)**:

- **1NF**: Kõik veerud sisaldavad atomaarseid väärtusi, duplikaatread puuduvad
- **2NF**: Kõik mitte-võtme veerud sõltuvad tervest primaarvõtmest
- **3NF**: Transitiivseid sõltuvusi ei esine - tunni tüüp on eraldatud
  omaette tabelisse (`lesson_type`), mitte salvestatud tekstina broneeringus

## Indeksid

Jõudluse parandamiseks on loodud kolm indeksit:

- `idx_booking_classroom_date` - kiire otsing klassi ja kuupäeva järgi (kattuvuse kontroll)
- `idx_booking_user` - kiire otsing kasutaja broneeringute järgi
- `idx_booking_date` - kiire otsing kuupäeva järgi (statistika päringud)
