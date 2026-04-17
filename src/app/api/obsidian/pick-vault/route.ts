import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  try {
    const { stdout } = await execAsync(
      `osascript -e 'POSIX path of (choose folder with prompt "Select your Obsidian vault folder")'`
    )
    const vaultPath = stdout.trim().replace(/\/$/, "") // strip trailing slash
    return NextResponse.json({ vaultPath })
  } catch (err: unknown) {
    // User cancelled the dialog — osascript exits with code 1
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes("User canceled") || message.includes("(-128)")) {
      return NextResponse.json({ cancelled: true })
    }
    return NextResponse.json(
      { error: "Could not open folder picker" },
      { status: 500 }
    )
  }
}
