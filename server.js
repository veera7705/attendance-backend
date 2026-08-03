# Copy this file to ".env" and adjust as needed.
# Never commit the real ".env" file.

# Port the backend API listens on
PORT=5000

# development | production
NODE_ENV=development

# Comma-separated list of origins allowed to call this API.
# In development this is usually the file/localhost origin your
# frontend is served from, e.g. http://127.0.0.1:5500,http://localhost:5500
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500

# MITS IMS login page
TARGET_URL=http://mitsims.in

# Run the browser headless (true in production/servers).
# Set to "false" locally if you want to watch the automation run.
HEADLESS=true

# Max ms to wait for navigation/selectors before giving up
NAV_TIMEOUT_MS=30000

# Max attendance requests allowed per IP per window (abuse protection)
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW_MS=60000

# Write each scrape result to backend/attendance.json for debugging.
# Leave "false" in normal use - it's personal data and shouldn't sit
# on disk in plaintext.
SAVE_ATTENDANCE_JSON=false
