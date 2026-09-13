import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const outputs = [
  path.join(root, 'dist', 'index.html'),
  path.join(root, 'dist-electron', 'electron', 'main', 'main.js'),
]

const sourceRoots = [
  path.join(root, 'src'),
  path.join(root, 'electron'),
]
const sourceFiles = [
  path.join(root, 'index.html'),
  path.join(root, 'vite.config.ts'),
  path.join(root, 'tsconfig.json'),
  path.join(root, 'tsconfig.app.json'),
  path.join(root, 'electron', 'tsconfig.json'),
]

async function newestMtime(target) {
  let newest = 0
  const info = await stat(target)
  if (info.isFile()) return info.mtimeMs
  const entries = await readdir(target, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue
    const value = await newestMtime(path.join(target, entry.name))
    if (value > newest) newest = value
  }
  return newest
}

async function needsBuild() {
  if (outputs.some((file) => !existsSync(file))) return true

  const outputTimes = await Promise.all(outputs.map((file) => stat(file).then((s) => s.mtimeMs)))
  const builtAt = Math.min(...outputTimes)

  for (const target of [...sourceRoots, ...sourceFiles]) {
    if (!existsSync(target)) continue
    if ((await newestMtime(target)) > builtAt) return true
  }
  return false
}

if (await needsBuild()) {
  console.log('Build output is missing or stale; running npm run build...')
  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { stdio: 'inherit' })
} else {
  console.log('Build output is current; skipping npm run build.')
}

execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'clean:release'], { stdio: 'inherit' })
execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['electron-builder', '--config', 'electron-builder.yml', '--publish', 'never'], { stdio: 'inherit' })
