require("dotenv").config();

function toBool(value, fallback) {
    if (value === undefined || value === "") return fallback;
    return String(value).trim().toLowerCase() === "true";
}

function toInt(value, fallback) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : fallback;
}

const config = {
    port: toInt(process.env.PORT, 5000),
    nodeEnv: process.env.NODE_ENV || "development",
    allowedOrigins: (process.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map(origin => origin.trim())
        .filter(Boolean),
    targetUrl: process.env.TARGET_URL || "http://mitsims.in",
    headless: toBool(process.env.HEADLESS, true),
    navTimeoutMs: toInt(process.env.NAV_TIMEOUT_MS, 30000),
    rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 10),
    rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60000),
    // Off by default: scraped attendance data is personal data and
    // shouldn't be written to disk in plaintext unless you opt in.
    saveAttendanceJson: toBool(process.env.SAVE_ATTENDANCE_JSON, false)
};

module.exports = config;
