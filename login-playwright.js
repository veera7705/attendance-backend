const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const config = require("./config");

/**
 * Custom error so the API layer can tell "bad credentials" apart
 * from "the site is down" / "the site changed its markup".
 */
class AttendanceFetchError extends Error {
    constructor(message, code) {
        super(message);
        this.name = "AttendanceFetchError";
        this.code = code; // "INVALID_CREDENTIALS" | "TIMEOUT" | "SCRAPE_FAILED" | "SITE_UNAVAILABLE"
    }
}

/**
 * Logs into MITS IMS with the given credentials, scrapes the
 * attendance table, and returns it as structured data.
 *
 * @param {string} registerNo
 * @param {string} password
 * @returns {Promise<Array<{sno:string, subject:string, attended:number, conducted:number, percentage:number}>>}
 */
async function login(registerNo, password) {
    if (!registerNo || !password) {
        throw new AttendanceFetchError(
            "Register number and password are required.",
            "INVALID_INPUT"
        );
    }

    let browser;

    try {
       browser = await chromium.launch({
    headless: true,
    args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
    ]
});

        const page = await browser.newPage();
        page.setDefaultTimeout(config.navTimeoutMs);

        await page.goto(config.targetUrl, { waitUntil: "networkidle" });

        // Student Login
        await page.locator("#studentLink").click();
        await page.locator("#studentForm #inputStuId").waitFor({ state: "visible" });

        await page.locator("#studentForm #inputStuId").fill(registerNo);
        await page.locator("#studentForm #inputPassword").fill(password);
        await page.locator("#studentForm #studentSubmitButton").click();

        // Wait (concurrently, not racing against page-idle timing) for either
        // the dashboard to actually appear or an error message to show up.
        // Both waits share the same timeout budget and run in parallel, so
        // this takes at most navTimeoutMs total, not double.
        const waitForSignal = async (locator, timeoutMs) => {
            try {
                await locator.waitFor({ state: "visible", timeout: timeoutMs });
                return true;
            } catch {
                return false;
            }
        };

        try {

    await page.waitForSelector("#semActivity", {
        timeout: config.navTimeoutMs
    });

} catch {

    throw new AttendanceFetchError(
        "Login failed. Check your Register Number or Password.",
        "INVALID_CREDENTIALS"
    );

}

        // Open Attendance Page
        await page.locator("#semActivity").click();

await page.waitForSelector(".x-column-inner", {
    timeout: config.navTimeoutMs
});

        const attendance = await page.evaluate(() => {
            const data = [];
            const rows = document.querySelectorAll(".x-column-inner");

            rows.forEach(row => {
                const values = [...row.querySelectorAll("span")]
                    .map(span => span.innerText.trim())
                    .filter(text => text !== "");

                if (values.length < 5) return;

                // Skip menu / header rows
                if (values[0] === "Attendance" || values[1] === "Attendance") return;
                if (
                    values[0] === "S.NO" ||
                    values[1] === "SUBJECT CODE" ||
                    values[2] === "CLASSES ATTENDED"
                ) {
                    return;
                }

                data.push({
                    sno: values[0],
                    subject: values[1],
                    attended: values[2],
                    conducted: values[3],
                    percentage: values[4]
                });
            });

            return data;
        });

        if (!attendance.length) {
            throw new AttendanceFetchError(
                "Attendance table could not be read. The portal's layout may have changed.",
                "SCRAPE_FAILED"
            );
        }

        // Normalize to numbers so the frontend never has to parse strings.
        const normalized = attendance.map(row => ({
            sno: row.sno,
            subject: row.subject,
            attended: Number(row.attended) || 0,
            conducted: Number(row.conducted) || 0,
            percentage: Number(row.percentage) || 0
        }));

        if (config.saveAttendanceJson) {
            fs.writeFileSync(
                path.join(__dirname, "attendance.json"),
                JSON.stringify(normalized, null, 2)
            );
        }

        return normalized;
    } catch (error) {
    if (error instanceof AttendanceFetchError) throw error;

    if (error.name === "TimeoutError") {
        throw new AttendanceFetchError(
            "The portal took too long to respond. Please try again.",
            "TIMEOUT"
        );
    }

    console.error("REAL ERROR:");
    console.error(error);
    console.error(error.stack);

    throw error;
} finally {
    if (browser) {
        await browser.close();
    }
}
}

module.exports = login;
module.exports.AttendanceFetchError = AttendanceFetchError;
