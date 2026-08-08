# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this project is

Lime WYSIWYG Editor — a self-contained, browser-based rich text editor built with **vanilla JavaScript + `contenteditable`**, a **thin PHP/PDO JSON API**, and **MySQL persistence**. Documents (title + HTML content, including embedded image URLs) are saved, listed, and reloaded from a single `documents` table. Images are stored as files in `uploads/`, WordPress-style; MySQL stores only the `<img src="...">` markup.

- Version 1.0.0, MIT License, part of the "Lime" open-source family by shaik-obydullah.
- No frontend build step, no package.json, no node_modules.

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | HTML5, CSS3, Vanilla JS (`contenteditable`, `document.execCommand`) |
| Backend  | PHP 8.3+ (PDO, prepared statements) |
| Database | MySQL 8.0 (UTF-8mb4) |
| Server   | Apache (`php:8.3-apache`) |
| DevOps   | Docker / Docker Compose |

## How it works (data flow)

```
browser (index.html + editor.js)
   │  fetch() JSON / multipart
   ▼
PHP endpoints (save.php, load.php, list.php, upload.php)
   │  PDO / filesystem
   ▼
MySQL (documents)  ·  uploads/ (image files)
```

- `index.html` — static UI: toolbar (buttons with `data-cmd`), docbar (title input + document dropdown + Load/New/Save), `contenteditable` content area, status bar (word/char counts, HTML-View toggle).
- `editor.js` — single IIFE. One delegated click/input/change listener on the toolbar reads `data-cmd` and calls `document.execCommand()`. Toolbar active-state synced via `queryCommandState`/`queryCommandValue` on `selectionchange`/`keyup`/`mouseup`/`input`.
- PHP endpoints — JSON in/out; all SQL uses PDO prepared statements.
- `db.php` — reads `DB_HOST`/`DB_NAME`/`DB_USER`/`DB_PASS` env vars (defaults `127.0.0.1`/`wysiwyg`/`editor`/`editor_pass`) and runs `CREATE TABLE IF NOT EXISTS documents` on every connection. No migration step needed.

## File map

| File | Purpose |
|------|---------|
| `index.html` | Editor UI (toolbar, docbar, content area, statusbar) |
| `editor.js` | All editor logic: exec, toolbar state, stats, save/load/list/upload fetches, HTML view |
| `editor.css` | Lime-themed styling (`.toolbar`, `.docbar`, `.content`, `.statusbar`, etc.) |
| `db.php` | PDO connection + schema bootstrap |
| `save.php` | POST — INSERT or UPDATE document; returns `{ success, id }` |
| `load.php` | GET — one document by `?id=N`, or the latest if no id |
| `list.php` | GET — all documents `{ id, title, updated_at }[]` |
| `upload.php` | POST — image upload (multipart field `image`); returns `{ success, url, name }` |
| `uploads/` | Uploaded images; `.htaccess` blocks script execution |
| `Dockerfile` | `php:8.3-apache` + `pdo_mysql` + custom entrypoint |
| `docker-compose.yml` | Services: `editor` (:8080), `db` (mysql:8.0, healthcheck), `adminer` (:8081) |
| `docker-entrypoint.sh` | `mkdir` + `chown www-data` on `uploads/` at container start |
| `README.md` | Usage, API, schema, security, troubleshooting |
| `favicon.svg` | Lime logo |

## Database schema

```sql
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
    content LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Running the app

Docker (recommended):

```bash
docker compose up -d --build   # editor on :8080, Adminer on :8081
docker compose down            # stop
docker compose down -v         # stop + wipe MySQL data volume
```

Manual (no Docker) — requires PHP 8.3+ with `pdo_mysql`, Apache/Nginx, MySQL 8.0, and a writable `uploads/`:

```bash
mysql -u root -p -e "CREATE DATABASE wysiwyg CHARACTER SET utf8mb4;"
DB_HOST=127.0.0.1 DB_NAME=wysiwyg DB_USER=editor DB_PASS=editor_pass php -S localhost:8080
```

## Conventions & style

- **PHP**: `declare(strict_types=1);` at top of every file; JSON endpoints set `header('Content-Type: application/json')` and exit with proper HTTP codes (400/404/405/413/415/500); env vars via `getenv()` with defaults.
- **JS**: single IIFE with `"use strict";`; DOM elements cached once at the top; `exec(cmd, value)` helper centralizes `execCommand` + toolbar/stats refresh.
- **HTML**: toolbar buttons are declarative — `data-cmd="..."` (+ optional `data-value`). Adding a formatting command requires no JS changes.
- **No code comments** unless asked; match the existing style.
- **CSS**: class-based, grouped by component; brand/accent color is lime green `#65a30d`.

## Key gotchas / things to be careful about

- **`document.execCommand()` is deprecated** but universally supported — the editor intentionally relies on it. Keep any changes within well-tested commands and preserve the HTML-View toggle as the escape hatch.
- **Content is stored as raw HTML and rendered via `innerHTML`.** This is by design for trusted users only. If adding features that render content publicly, sanitize server-side first.
- **Uploads**: validated by `mime_content_type()` (not client type), max 2 MB, extension derived from the MIME allow-list (`jpeg/png/gif/webp/svg/bmp`), server-generated names via `uniqid()`. The uploads URL is built from the request host (`HTTP_HOST`) + `SCRIPT_NAME` dirname — relevant if you change routing/vhosts.
- **`load.php` with no `?id`** returns the most recently updated document (not the most recently created).
- **HTML view sync** (`syncView` in editor.js) swaps `innerHTML` ↔ `textContent`; switching the toggle mutates content, so `getContentHtml()` first un-checks the toggle and calls `syncView()` before reading `innerHTML`.
- **Docker**: first boot of MySQL outpaces the Apache container — the `db` service has a healthcheck and `editor` uses `depends_on: condition: service_healthy`. Don't remove that condition.
- **Ports**: editor 8080, Adminer 8081, MySQL 3306 are hardcoded in `docker-compose.yml`.
- **`uploads/.htaccess`** only works under Apache (not `php -S`); keep the MIME allow-list + extension whitelist as the real defense.

## API endpoints (for agent reference)

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `save.php` | POST | JSON `{ id?: int, title: string, content: string }` | `{ success, id }` |
| `load.php` | GET | `?id=N` optional | `{ success, document: {id,title,content,updated_at} }` |
| `list.php` | GET | — | `{ success, documents: [{id,title,updated_at}] }` |
| `upload.php` | POST | multipart field `image` | `{ success, url, name }` |

## Verification

There is no test suite and no linter config in the repo. To sanity-check changes:

```bash
php -l db.php && php -l save.php && php -l load.php && php -l list.php && php -l upload.php
docker compose up -d --build   # then exercise save/load/list/upload in the UI at :8080
```
