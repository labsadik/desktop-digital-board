import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const node = process.execPath
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

function runNodeScript(script, args = []) {
  execFileSync(node, [path.join(root, script), ...args], { stdio: 'inherit' })
}

if (await needsBuild()) {
  console.log('Build output is missing or stale; running npm run build...')
  const npmCli = process.env.npm_execpath
  if (npmCli && existsSync(npmCli)) {
    execFileSync(node, [npmCli, 'run', 'build'], { stdio: 'inherit' })
  } else {
    runNodeScript('node_modules/typescript/bin/tsc', ['-b'])
    execFileSync(path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite'), ['build'], { stdio: 'inherit' })
    execFileSync(path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc'), ['-p', 'electron/tsconfig.json'], { stdio: 'inherit' })
  }
} else {
  console.log('Build output is current; skipping npm run build.')
}

runNodeScript('scripts/clean-release.mjs')

const builderCli = path.join(root, 'node_modules', 'app-builder-lib', 'out', 'cli', 'cli.js')
const electronBuilderBin = path.join(root, 'node_modules', 'electron-builder', 'cli.js')
const cli = existsSync(electronBuilderBin) ? electronBuilderBin : builderCli

execFileSync(node, [cli, '--config', 'electron-builder.yml', '--publish', 'never'], { stdio: 'inherit' })
