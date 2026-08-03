{
  "name": "attendancepro-backend",
  "version": "2.0.0",
  "description": "Attendance Vision backend - scrapes MITS IMS attendance via Playwright and serves it over a secured REST API.",
  "main": "server.js",
  "type": "commonjs",
  "scripts": {
    "start": "node server.js",
    "dev": "NODE_ENV=development node server.js",
    "postinstall": "playwright install chromium"
  },
  "keywords": [
    "attendance",
    "playwright",
    "mits"
  ],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "cors": "^2.8.6",
    "dotenv": "^16.4.5",
    "express": "^5.2.1",
    "express-rate-limit": "^7.4.1",
    "helmet": "^8.0.0",
    "playwright": "^1.62.1"
  }
}
