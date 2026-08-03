const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const config = require("./config");
const login = require("./login-playwright");
const { AttendanceFetchError } = login;

const app = express();
app.set("trust proxy", 1);

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "10kb" }));

app.use(
    cors({
        origin(origin, callback) {
            // Allow non-browser tools (curl/Postman) with no Origin header,
            // and any origin explicitly listed in ALLOWED_ORIGINS.
            if (!origin || config.allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        }
    })
);

const attendanceLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please wait a moment and try again."
    }
});

// Home Route
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "Attendance Vision backend running" });
});

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// Attendance API
app.post("/api/attendance", attendanceLimiter, async (req, res) => {
    const { registerNo, password } = req.body || {};

    if (
        typeof registerNo !== "string" ||
        typeof password !== "string" ||
        !registerNo.trim() ||
        !password.trim() ||
        registerNo.length > 50 ||
        password.length > 100
    ) {
        return res.status(400).json({
            success: false,
            message: "A valid register number and password are required."
        });
    }

    try {
        const attendance = await login(registerNo.trim(), password);
        res.json({ success: true, attendance });
    } catch (error) {
        console.error("PLAYWRIGHT ERROR:", error);
        console.error(error.stack);
        if (error instanceof AttendanceFetchError) {
            const statusByCode = {
                INVALID_INPUT: 400,
                INVALID_CREDENTIALS: 401,
                TIMEOUT: 504,
                SITE_UNAVAILABLE: 502,
                SCRAPE_FAILED: 502
            };

            return res.status(statusByCode[error.code] || 500).json({
                success: false,
                message: error.message
            });
        }

        // Never leak internal error details (stack traces, selectors, etc.)
        console.error("Unexpected error fetching attendance:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching attendance."
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Not found." });
});

// Final safety-net error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("Unhandled server error:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
});

const server = app.listen(config.port, () => {
    console.log(`Attendance Vision backend running on port ${config.port} (${config.nodeEnv})`);
});

function shutdown(signal) {
    console.log(`${signal} received, shutting down...`);
    server.close(() => process.exit(0));
    // Force-exit if something hangs
    setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

module.exports = app;
