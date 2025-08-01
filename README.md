# Data Export Service

A robust Node.js/TypeScript backend service for exporting data in multiple formats (CSV, PDF, Image) via a RESTful API. Built with Express.js, it leverages the saga pattern for reliable, compensatable workflows and provides detailed logging for all export operations.

---

## Features

- **Export to CSV, PDF, or Image** with customizable formatting
- **RESTful API** built on Express.js
- **Saga pattern** for robust, compensatable export flows
- **Detailed logging** for operations and errors
- **Configurable export options** (headers, delimiters, page size, image size, etc.)
- **Dockerized** for easy deployment
- **TypeScript** for type safety and maintainability

---

## Installation

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd MSA
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment (optional):**
   - Edit `src/config/config.ts` for custom settings.

---

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Docker

Build and run with Docker Compose:

```bash
docker-compose up --build
```

---

## API Endpoints

### Export to CSV

- **POST** `/export/csv`
- **Body:**

  ```json
  {
    "data": [ { "col1": "value1", ... }, ... ],
    "config": {
      "filename": "optional-filename",
      "includeHeader": true,
      "delimiter": ",",
      "quote": "\"",
      "escape": "\""
    }
  }
  ```

- **Response:** CSV file download

### Export to PDF

- **POST** `/export/pdf`
- **Body:**

  ```json
  {
    "data": [ { "col1": "value1", ... }, ... ],
    "config": {
      "filename": "optional-filename",
      "title": "Export Title",
      "pageSize": "A4",
      "margin": 50
    }
  }
  ```

- **Response:** PDF file download

### Export to Image

- **POST** `/export/image`
- **Body:**

  ```json
  {
    "data": [ { "col1": "value1", ... }, ... ],
    "config": {
      "filename": "optional-filename",
      "format": "png",
      "width": 800,
      "height": 600,
      "backgroundColor": "#ffffff"
    }
  }
  ```

- **Response:** Image file download

---

## Configuration

- All export endpoints accept a `config` object for customizing output.
- Global settings can be adjusted in `src/config/config.ts`.

---

## Logging

- Logs are written to `logs/combined.log` and `logs/error.log`.
- Uses a custom logger utility for info, warning, and error logs.

---

## Testing

- Benchmarks and tests are in `benchmarks/` and `src/benchmarks/`.
- Run tests with:

  ```bash
  npm test
  ```

---

## Project Structure

```
MSA/
├── src/
│   ├── controllers/      # API controllers (export, import)
│   ├── middleware/       # Express middleware (error handling, validation)
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic (memory pool, etc.)
│   ├── utils/            # Utilities (logger, saga, streaming, performance)
│   ├── config/           # Configuration files
│   └── types/            # TypeScript type definitions
├── logs/                 # Log files
├── benchmarks/           # Performance tests
├── Dockerfile            # Docker build file
├── docker-compose.yml    # Docker Compose setup
├── package.json          # NPM dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

---

## License

This project is licensed under the MIT License.
