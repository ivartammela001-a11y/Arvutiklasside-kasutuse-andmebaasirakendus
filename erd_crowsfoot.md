# ERD (Crow's Foot) diagramm

## Juhend

Kopeeri allolev DBML kood [dbdiagram.io](https://dbdiagram.io) keskkonda,
et genereerida ERD diagramm Crow's Foot notatsiooniga.

Parast diagrammi loomist ekspordi see PNG-ks ja salvesta failina `erd_crowsfoot.png`.
Samuti saab dbdiagram.io-st eksportida SQL-i (Export → MySQL/PostgreSQL).

## DBML kood

```dbml
Table lesson_type {
  id integer [pk, increment]
  name text [not null, unique]
  description text
}

Table classroom {
  id integer [pk, increment]
  name text [not null, unique]
  building text [not null]
  floor integer [not null, default: 1]
  capacity integer [not null, note: 'CHECK (capacity > 0)']
  has_projector integer [not null, default: 0, note: 'CHECK IN (0, 1)']
  has_webcam integer [not null, default: 0, note: 'CHECK IN (0, 1)']
  description text
  created_at text [not null, default: `datetime('now')`]
}

Table user_or_group {
  id integer [pk, increment]
  name text [not null]
  email text [unique]
  role text [not null, note: "CHECK IN ('opetaja', 'grupp', 'admin')"]
  created_at text [not null, default: `datetime('now')`]
}

Table booking {
  id integer [pk, increment]
  classroom_id integer [not null, ref: > classroom.id]
  user_id integer [not null, ref: > user_or_group.id]
  lesson_type_id integer [ref: > lesson_type.id]
  date text [not null, note: 'YYYY-MM-DD']
  start_time text [not null, note: 'HH:MM']
  end_time text [not null, note: 'HH:MM, CHECK (end_time > start_time)']
  participants_count integer [not null, default: 0, note: 'CHECK (>= 0)']
  description text
  created_at text [not null, default: `datetime('now')`]
}
```

## Seosed

- `classroom` 1──* `booking` (uhel klassil mitu broneeringut)
- `user_or_group` 1──* `booking` (uhel kasutajal mitu broneeringut)
- `lesson_type` 1──0..* `booking` (tunni tuup on valikuline)
