import fs from 'fs'
import path from 'path'
import os from 'os'

const LOG_FILE = process.env.DEBUG_LOG_PATH || path.join(os.tmpdir(), 'lollypos_debug_server.log')

export function logDebug(message: string) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}\n`
    try {
        fs.appendFileSync(LOG_FILE, logMessage)
    } catch {
        // Silently fail in production - logging should not crash the app
    }
}
