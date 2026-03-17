import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {spawn} from 'child_process'

// --- @actions/core replacements ---

export function getInput(
  name: string,
  options?: {required?: boolean; trimWhitespace?: boolean}
): string {
  const val =
    process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || ''
  if (options?.required && !val) {
    throw new Error(`Input required and not supplied: ${name}`)
  }
  return options?.trimWhitespace === false ? val : val.trim()
}

export function getBooleanInput(name: string): boolean {
  const val = getInput(name)
  if (['true', 'True', 'TRUE'].includes(val)) return true
  if (['false', 'False', 'FALSE'].includes(val)) return false
  throw new TypeError(
    `Input does not meet YAML 1.2 "Core Schema" specification: ${name}`
  )
}

export function setOutput(name: string, value: string): void {
  const filePath = process.env['GITHUB_OUTPUT']
  if (filePath) {
    fs.appendFileSync(filePath, `${name}=${value}${os.EOL}`)
  }
}

export function exportVariable(name: string, value: string): void {
  process.env[name] = value
  const filePath = process.env['GITHUB_ENV']
  if (filePath) {
    fs.appendFileSync(filePath, `${name}=${value}${os.EOL}`)
  }
}

export function addPath(inputPath: string): void {
  const filePath = process.env['GITHUB_PATH']
  if (filePath) {
    fs.appendFileSync(filePath, `${inputPath}${os.EOL}`)
  }
  process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`
}

export function setFailed(message: string): void {
  process.exitCode = 1
  error(message)
}

export function info(message: string): void {
  process.stdout.write(`${message}${os.EOL}`)
}

export function debug(message: string): void {
  process.stdout.write(`::debug::${message}${os.EOL}`)
}

export function error(message: string): void {
  process.stdout.write(`::error::${message}${os.EOL}`)
}

// --- @actions/exec replacement ---

export async function exec(
  command: string,
  args: string[],
  options?: {input?: Buffer; silent?: boolean}
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: [
        options?.input ? 'pipe' : 'inherit',
        options?.silent ? 'ignore' : 'inherit',
        options?.silent ? 'ignore' : 'inherit'
      ]
    })
    if (options?.input) {
      child.stdin!.end(options.input)
    }
    child.on('close', code => {
      if (code !== 0) {
        reject(
          new Error(
            `Command '${command} ${args.join(' ')}' exited with code ${code}`
          )
        )
      } else {
        resolve(0)
      }
    })
    child.on('error', reject)
  })
}

// --- @actions/tool-cache replacements ---

export async function downloadTool(url: string): Promise<string> {
  const response = await fetch(url, {redirect: 'follow'})
  if (!response.ok) {
    throw new Error(`Failed to download from ${url}: ${response.statusText}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  const tempFile = path.join(os.tmpdir(), `setup-android-${Date.now()}.zip`)
  fs.writeFileSync(tempFile, buffer)
  return tempFile
}

export async function extractZip(file: string, dest: string): Promise<void> {
  fs.mkdirSync(dest, {recursive: true})
  if (process.platform === 'win32') {
    await exec('powershell', [
      '-NoLogo',
      '-Command',
      `Expand-Archive -Path '${file}' -DestinationPath '${dest}' -Force`
    ])
  } else {
    await exec('unzip', ['-o', '-q', file, '-d', dest])
  }
}
