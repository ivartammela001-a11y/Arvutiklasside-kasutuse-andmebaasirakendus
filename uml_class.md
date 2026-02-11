# UML klassidiagramm (andmevaade)

## Juhend

Loo UML klassidiagramm [draw.io](https://app.diagrams.net/) keskkonnas.

Kasuta UML Class Diagram elemente (paremalt paneelilt "UML" sektsioonist).
Salvesta diagramm PNG-ks failina `uml_class.png`.

## Klassid ja atribuudid

### LessonType
```
+---------------------------+
|       LessonType          |
+---------------------------+
| - id: Integer <<PK>>     |
| - name: Text              |
| - description: Text       |
+---------------------------+
```

### Classroom
```
+---------------------------+
|       Classroom           |
+---------------------------+
| - id: Integer <<PK>>     |
| - name: Text              |
| - building: Text          |
| - floor: Integer          |
| - capacity: Integer       |
| - has_projector: Boolean  |
| - has_webcam: Boolean     |
| - description: Text       |
| - created_at: DateTime    |
+---------------------------+
```

### UserOrGroup
```
+---------------------------+
|      UserOrGroup          |
+---------------------------+
| - id: Integer <<PK>>     |
| - name: Text              |
| - email: Text             |
| - role: Enum              |
| - created_at: DateTime    |
+---------------------------+
```

### Booking
```
+-------------------------------+
|          Booking              |
+-------------------------------+
| - id: Integer <<PK>>         |
| - classroom_id: Integer <<FK>>|
| - user_id: Integer <<FK>>    |
| - lesson_type_id: Integer <<FK>>|
| - date: Date                  |
| - start_time: Time            |
| - end_time: Time              |
| - participants_count: Integer |
| - description: Text           |
| - created_at: DateTime        |
+-------------------------------+
```

## Seosed (draw.io-s joonista nooled)

```
Classroom  ───1──────*──  Booking
UserOrGroup ──1──────*──  Booking
LessonType ──1──────0..*── Booking
```

- Classroom ja Booking vahel: **1..* (yksi-mitmele)** - association
- UserOrGroup ja Booking vahel: **1..* (yksi-mitmele)** - association
- LessonType ja Booking vahel: **0..1..* (valikuline yksi-mitmele)** - association
