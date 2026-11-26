import { appendFile } from "fs/promises";

const AUDIT_LOG_PATH = process.env.AUDIT_LOG_PATH ?? "token-audit.jsonl";

export type TokenEvent = "issued" | "refreshed" | "revoked" | "rejected";

/**
 * Appends one line per token event to the audit log: the time, the event and the account's email.
 * The token itself is never written.
 */
export async function recordTokenEvent(event: TokenEvent, email: string): Promise<void> {
    const line = JSON.stringify({ at: new Date().toISOString(), event, email });
    await appendFile(AUDIT_LOG_PATH, line + "\n");
}
