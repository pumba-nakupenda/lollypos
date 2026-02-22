import fs from 'fs'
import path from 'path'

const LOG_FILE = 'c:\\Users\\oudam\\Documents\\SynologyDrive\\SITE et APP\\Gestion Lolly\\debug_server.log'

export function logDebug(message: string) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}\n`
    try {
        fs.appendFileSync(LOG_FILE, logMessage)
    } catch (e) {
        console.error('Failed to write to debug log:', e)
    }
}
