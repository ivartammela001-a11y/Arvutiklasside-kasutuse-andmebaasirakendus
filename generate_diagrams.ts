import { chromium } from "playwright";
import { join } from "path";

const DIR = import.meta.dir;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
const page = await ctx.newPage();

// === 1. ERD Crow's Foot diagramm (Mermaid erDiagram) ===
console.log("Genereerin ERD (Crow's Foot) diagrammi...");

const erdMermaid = `erDiagram
    lesson_type {
        INT id PK
        VARCHAR name UK
        VARCHAR description
    }
    classroom {
        INT id PK
        VARCHAR name UK
        VARCHAR building
        INT floor
        INT capacity
        BOOLEAN has_projector
        BOOLEAN has_webcam
        VARCHAR description
        DATETIME created_at
    }
    user_or_group {
        INT id PK
        VARCHAR name
        VARCHAR email UK
        ENUM role
        DATETIME created_at
    }
    booking {
        INT id PK
        INT classroom_id FK
        INT user_id FK
        INT lesson_type_id FK
        DATE date
        TIME start_time
        TIME end_time
        INT participants_count
        VARCHAR description
        DATETIME created_at
    }

    classroom ||--o{ booking : "1:N"
    user_or_group ||--o{ booking : "1:N"
    lesson_type ||--o{ booking : "0..1:N"
`;

const erdHtml = `<!DOCTYPE html>
<html><head>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<style>body{background:white;margin:2rem;font-family:sans-serif}h1{color:#2c3e50;text-align:center}</style>
</head><body>
<h1>ERD (Crow's Foot) - Arvutiklasside kasutuse andmebaas</h1>
<pre class="mermaid">${erdMermaid}</pre>
<script>mermaid.initialize({startOnLoad:true,er:{useMaxWidth:false},theme:'default'});</script>
</body></html>`;

await page.setContent(erdHtml, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
await page.screenshot({ path: join(DIR, "erd_crowsfoot.png"), fullPage: true });
console.log("  Salvestatud: erd_crowsfoot.png");

// === 2. UML klassidiagramm ===
console.log("Genereerin UML klassidiagrammi...");

const umlMermaid = `classDiagram
    class LessonType {
        +INT id
        +VARCHAR name
        +VARCHAR description
    }
    class Classroom {
        +INT id
        +VARCHAR name
        +VARCHAR building
        +INT floor
        +INT capacity
        +BOOLEAN has_projector
        +BOOLEAN has_webcam
        +VARCHAR description
        +DATETIME created_at
    }
    class UserOrGroup {
        +INT id
        +VARCHAR name
        +VARCHAR email
        +ENUM role
        +DATETIME created_at
    }
    class Booking {
        +INT id
        +INT classroom_id
        +INT user_id
        +INT lesson_type_id
        +DATE date
        +TIME start_time
        +TIME end_time
        +INT participants_count
        +VARCHAR description
        +DATETIME created_at
    }

    Classroom "1" --> "*" Booking : has
    UserOrGroup "1" --> "*" Booking : makes
    LessonType "1" --> "0..*" Booking : categorizes
`;

const umlHtml = `<!DOCTYPE html>
<html><head>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<style>body{background:white;margin:2rem;font-family:sans-serif}h1{color:#2c3e50;text-align:center}</style>
</head><body>
<h1>UML klassidiagramm - Arvutiklasside kasutuse andmebaas</h1>
<pre class="mermaid">${umlMermaid}</pre>
<script>mermaid.initialize({startOnLoad:true,theme:'default'});</script>
</body></html>`;

await page.setContent(umlHtml, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
await page.screenshot({ path: join(DIR, "uml_class.png"), fullPage: true });
console.log("  Salvestatud: uml_class.png");

await browser.close();
console.log("\nDiagrammid genereeritud!");
