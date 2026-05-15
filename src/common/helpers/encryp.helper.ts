import crypto from 'crypto'
import { config } from 'dotenv'

config()

const SECRET = process.env.SECRET_KEY_CODES!

export function encryptToString(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data, "utf8").digest("base64")
}