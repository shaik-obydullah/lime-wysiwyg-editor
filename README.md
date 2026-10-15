<div align="center">

<img src="favicon.svg" alt="Lime WYSIWYG Editor" width="110">

# Lime WYSIWYG Editor

**A lightweight, WordPress-style rich text editor with image uploads and MySQL persistence.**

[![Version](https://img.shields.io/badge/Version-1.0.0-blue)](https://github.com/shaik-obydullah/lime-wysiwyg-editor)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![PHP](https://img.shields.io/badge/PHP-8.4-%23777BB4?logo=php&logoColor=white)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-%234479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Apache](https://img.shields.io/badge/Apache-%23D22128?logo=apache&logoColor=white)](https://httpd.apache.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-%232496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-%23F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-%23E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-%231572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)

</div>

---

## About

Lime WYSIWYG Editor is a self-contained, browser-based rich text editor built with vanilla JavaScript and `contenteditable`. It comes with a full formatting toolbar, a WordPress-style image uploader, and a MySQL backend so documents (with embedded image URLs) persist across sessions.

Part of the **Lime** family of open-source tools.

## Features

- ✍️ **Full Toolbar** — bold, italic, underline, strikethrough, superscript/subscript, headings, code blocks, quotes
- 🔤 **Typography** — font family, font size, text color, highlight
- 📋 **Lists & Alignment** — bullet/numbered lists, indent/outdent, left/center/right/justify
- 🔗 **Links & Media** — insert links, upload images like WordPress (OS file picker → server → URL)
- 🗃️ **MySQL Persistence** — save, list, and load documents with a title and auto timestamps
- 🧾 **HTML View** — toggle between rich text and raw HTML
- 🛡️ **Secure Uploads** — MIME validation, size limit, and script-execution blocking in `uploads/`
- 🐳 **Docker Ready** — one command to run editor + MySQL + Adminer
- 🔢 **Live Stats** — word and character count

## Tech Stack

| Layer    | Technology                                                                  |
| -------- | --------------------------------------------------------------------------- |
| Frontend | HTML5, CSS3, Vanilla JavaScript (`contenteditable`, `document.execCommand`) |
| Backend  | PHP 8.3+ (PDO, prepared statements)                                         |
| Database | MySQL 8.0                                                                   |
| Server   | Apache (official `php:8.3-apache` image)                                    |
| DevOps   | Docker, Docker Compose                                                      |

## Quick Start (Docker)

### Prerequisites

- [Docker](https://www.docker.com/) with Docker Compose v2

### 1. Clone & run

```bash
git clone https://github.com/shaik-obydullah/lime-wysiwyg-editor.git
cd lime-wysiwyg-editor
docker compose up -d --build
```

### 2. Open the app

- **Editor** → http://localhost:8080
- **Adminer** (database admin) → http://localhost:8081

> On first start MySQL initializes its data files, which can take longer than the healthcheck. If the editor doesn't come up, wait a few seconds and run `docker compose up -d` again.

### 3. Stop

```bash
docker compose down        # stops containers
docker compose down -v     # also wipes the MySQL data volume
```

## Manual Setup (no Docker)

Requires PHP 8.3+ with `pdo_mysql`, Apache/Nginx, and MySQL 8.0.

```bash
# 1. Create the database
mysql -u root -p -e "CREATE DATABASE wysiwyg CHARACTER SET utf8mb4;"

# 2. Run the built-in server from the project folder
DB_HOST=127.0.0.1 DB_NAME=wysiwyg DB_USER=editor DB_PASS=editor_pass \
  php -S localhost:8080
```

The `documents` table is created automatically on first request. Make sure `uploads/` is writable by the web server user.

## Usage

1. **Format text** — select text, then click toolbar buttons (or use `Ctrl+B/I/U`).
2. **Insert an image** — click the image button, pick a file from your computer. The file is uploaded to `uploads/` and its URL is embedded in the document.
3. **Title & Save** — type a document title, click **Save**. The content (HTML) and title are stored in MySQL.
4. **Reload a document** — pick it from the dropdown and click **Load** (or just select it).
5. **New document** — click **New** to clear the editor.
6. **HTML View** — toggle to see/edit raw HTML before saving.

## API Endpoints

| Endpoint     | Method | Description                                                                                                    |
| ------------ | ------ | -------------------------------------------------------------------------------------------------------------- |
| `save.php`   | POST   | Save/update a document. Body: `{ "id"?: int, "title": string, "content": string }`. Returns `{ success, id }`. |
| `load.php`   | GET    | Load a document. `?id=N` loads a specific one; without `id` returns the latest.                                |
| `list.php`   | GET    | List all documents: `{ id, title, updated_at }[]`                                                              |
| `upload.php` | POST   | Upload an image. Multipart field `image`. Returns `{ success, url }`.                                          |

## Database Schema

```sql
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
    content LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

> Images are stored as files in `uploads/`; MySQL stores only the `<img src="...">` URL inside the HTML content — the same model WordPress uses.

## Project Structure

```
lime-wysiwyg-editor/
├── index.html              # Editor UI (toolbar, docbar, content area)
├── editor.css              # Styling (Lime-themed)
├── editor.js               # Editor logic, save/load/upload
├── favicon.svg             # Lime logo
├── db.php                  # PDO connection + schema bootstrap
├── save.php                # Save/update document
├── load.php                # Load document
├── list.php                # List documents
├── upload.php              # Image upload endpoint
├── uploads/                # Uploaded images (deny script execution)
│   └── .htaccess
├── Dockerfile              # PHP 8.3 + Apache + pdo_mysql
├── docker-compose.yml      # Editor + MySQL + Adminer services
├── docker-entrypoint.sh    # Fixes uploads/ permissions at startup
├── AGENTS.md               # Guidance for AI coding agents
├── case-study.html         # Published case study (TinyMCE-ready content)
└── badges/                 # Self-hosted shields-style tech badges
```

## Configuration

All settings are environment variables (used by the Docker Compose `editor` service):

| Variable  | Default       | Description       |
| --------- | ------------- | ----------------- |
| `DB_HOST` | `db`          | MySQL host        |
| `DB_NAME` | `wysiwyg`     | Database name     |
| `DB_USER` | `editor`      | Database user     |
| `DB_PASS` | `editor_pass` | Database password |

## Security Notes

- Uploads are validated by real MIME type (`mime_content_type`) and limited to 2 MB.
- `uploads/.htaccess` blocks script execution inside the uploads folder.
- All SQL uses prepared statements (PDO) to prevent injection.
- **Warning:** Editor content is stored as HTML by design and rendered via `innerHTML` — only let trusted users access the editor, and sanitize content server-side before display on public pages.

## Troubleshooting

| Problem                                   | Solution                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Connection refused` on first boot        | MySQL is still initializing — wait and run `docker compose up -d` again.                                     |
| `Permission denied` writing to `uploads/` | Run `docker compose up -d --build` (the entrypoint chowns the folder to `www-data`), or `chmod 775 uploads`. |
| Port `8080`/`8081`/`3306` already in use  | Change the left-hand port in `docker-compose.yml`.                                                           |

## License

Distributed under the [MIT License](LICENSE). Part of the **Lime** open-source family by [shaik-obydullah](https://github.com/shaik-obydullah).
