# Arvutiklasside kasutuse andmebaasirakendus

Veebirakendus arvutiklasside broneerimise haldamiseks. Projekt on loodud
TAK25 grupi andmebaaside kursuse raames.

## Tehnoloogia

- **Bun** - JavaScripti runtime
- **Hono** - veebiraamistik
- **SQLite** - andmebaas (bun:sqlite)
- **HTMX** - interaktiivsus ilma raskete raamistiketeta

## Kaivitamine

### Eeldused

Arvutisse peab olema paigaldatud [Bun](https://bun.sh):

```bash
curl -fsSL https://bun.sh/install | bash
```

### Paigaldamine ja kaivitamine

```bash
# Soltuvuste paigaldamine
cd app
bun install

# Arendusserver (hot reload)
bun run dev

# Voi tavaline kaivitus
bun run start
```

Server kaivitub aadressil: **http://localhost:3000**

## Kasutamine

### Rollid

Rakenduses on kaks rolli, mida saab vahetada URL parameetriga:

- **Admin**: `http://localhost:3000/?role=admin` - taielikud oigused (vaikimisi)
- **Vaataja**: `http://localhost:3000/?role=viewer` - ainult lugemise oigused

### Pohifunktsioonid

- **Broneeringud** (`/bookings`) - broneeringute nimekiri, lisamine, muutmine, kustutamine
- **Klassid** (`/classrooms`) - arvutiklasside haldamine
- **Kasutajad** (`/users`) - opetajate ja gruppide haldamine
- **Statistika** (`/stats`) - klasside kasutusstatistika tundides nadalas

## Import/Eksport

### Andmete import

```bash
bun run import
```

Impordib andmed kolmest formaadist:
- `import/classes.csv` - klassiruumid (CSV)
- `import/teachers.json` - opetajad/grupid (JSON)
- `import/bookings.xml` - broneeringud (XML)

### Andmete eksport

```bash
bun run export
```

Ekspordib:
- `export/bookings_summary.csv` - broneeringute koondtabel
- `export/top5_classes.json` - Top 5 kasutatumad klassid

## Varundamine

```bash
bun run backup
```

Loob varukoopia kausta `backup/`:
- `backup_YYYY-MM-DD.sql` - SQL dump
- `backup_YYYY-MM-DD.db` - andmebaasi koopia

## Projekti struktuur

```
app/
  src/
    index.ts          # Peamine server
    db.ts             # Andmebaasi yhendus ja seemnamine
    middleware/
      auth.ts         # Rollipohine ligipaaes
    routes/
      bookings.ts     # Broneeringute CRUD
      classrooms.ts   # Klasside CRUD
      users.ts        # Kasutajate CRUD
      stats.ts        # Statistikavaade
    views/
      layout.ts       # HTML pohimall
```

## Ekraanipildid

_Lisa siia ekraanipildid rakenduse pohivaadetest._

### Broneeringute nimekiri
<!-- ![Broneeringud](screenshots/bookings.png) -->

### Uue broneeringu lisamine
<!-- ![Uus broneering](screenshots/new_booking.png) -->

### Statistikavaade
<!-- ![Statistika](screenshots/stats.png) -->
