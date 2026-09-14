import { execFileSync } from 'node:child_process'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

if (process.platform === 'win32') {
  try {
    execFileSync('taskkill', ['/F', '/IM', 'Note Replace.exe'], {
      stdio: 'ignore',
      timeout: 3000,
      windowsHide: true,
    })
  } catch {
    // The app is not running; continue.
  }
}

const releaseDir = path.resolve('release')
try {
  await rm(releaseDir, {
    recursive: true,
    force: true,
    maxRetries: 4,
    retryDelay: 250,
  })
  console.log(`Cleaned ${releaseDir}`)
} catch (error) {
  console.error(`Could not fully clean ${releaseDir}. Close the packaged app and retry.`)
  throw error
}
