#!/usr/bin/env node

import {readFileSync, writeFileSync, appendFileSync} from 'fs'

const REPO_URL =
  'https://dl.google.com/android/repository/repository2-3.xml'

async function fetchStableVersions() {
  const response = await fetch(REPO_URL)
  const xml = await response.text()

  const packageRegex =
    /<remotePackage\s+(?:obsolete="true"\s+)?path="cmdline-tools;([^"]+)"[^>]*>([\s\S]*?)<\/remotePackage>/g
  const versions = []

  let match
  while ((match = packageRegex.exec(xml)) !== null) {
    const fullTag = match[0]
    const version = match[1]
    const block = match[2]

    // Skip "latest" alias, obsolete, and pre-release versions
    if (version === 'latest') continue
    if (fullTag.includes('obsolete="true"')) continue
    if (/-(alpha|beta|rc)/.test(version)) continue

    // Only include stable channel (channel-0)
    if (!block.includes('ref="channel-0"')) continue

    const urlMatch = block.match(
      /commandlinetools-linux-(\d+)_latest\.zip/
    )
    if (!urlMatch) continue

    versions.push({version, buildNumber: urlMatch[1]})
  }

  // Sort by build number descending (newest first)
  versions.sort((a, b) => parseInt(b.buildNumber) - parseInt(a.buildNumber))
  return versions
}

function getCurrentBuildNumbers() {
  const mainTs = readFileSync('src/main.ts', 'utf8')
  const builds = new Set()
  const caseRegex = /case '(\d+)':/g
  let match
  while ((match = caseRegex.exec(mainTs)) !== null) {
    builds.add(match[1])
  }
  return builds
}

function updateMainTs(allVersions) {
  let mainTs = readFileSync('src/main.ts', 'utf8')

  const cases = allVersions
    .map((v) => `    case '${v.buildNumber}':\n      return '${v.version}'`)
    .join('\n')

  mainTs = mainTs.replace(
    /switch \(versionLong\) \{\n([\s\S]*?)    default:/,
    `switch (versionLong) {\n${cases}\n    default:`
  )

  writeFileSync('src/main.ts', mainTs)
}

function updateWorkflow(allVersions) {
  let workflow = readFileSync('.github/workflows/build-test.yml', 'utf8')

  const versionList = allVersions
    .map((v) => `          - ${v.buildNumber}`)
    .join('\n')

  workflow = workflow.replace(
    /cmdline-tools-version:\n([\s\S]*?)(?=\n    steps:)/,
    `cmdline-tools-version:\n${versionList}\n`
  )

  writeFileSync('.github/workflows/build-test.yml', workflow)
}

function updateActionYml(latestBuildNumber) {
  let actionYml = readFileSync('action.yml', 'utf8')
  actionYml = actionYml.replace(
    /default: '\d+'/,
    `default: '${latestBuildNumber}'`
  )
  writeFileSync('action.yml', actionYml)
}

function updateReadme(allVersions) {
  let readme = readFileSync('README.md', 'utf8')
  const latest = allVersions[0]

  // Update version references in prose
  readme = readme.replace(
    /current version \([^)]+\)/,
    `current version (${latest.version})`
  )
  readme = readme.replace(
    /installs version \d+ \(short version [^)]+\)/,
    `installs version ${latest.buildNumber} (short version ${latest.version})`
  )

  // Rebuild version table
  const padVersion = (s) => s.padEnd(13)
  const rows = allVersions
    .map((v) => `| ${padVersion(v.version)} | ${v.buildNumber} |`)
    .join('\n')
  readme = readme.replace(
    /\| Short version \| Long version \|\n\|[-| ]+\|\n([\s\S]*?)(?=\n\nCurrent)/,
    `| Short version | Long version |\n|---------------| --- |\n${rows}`
  )

  writeFileSync('README.md', readme)
}

function setOutput(name, value) {
  const ghOutput = process.env.GITHUB_OUTPUT
  if (ghOutput) {
    appendFileSync(ghOutput, `${name}=${value}\n`)
  }
}

async function main() {
  const remoteVersions = await fetchStableVersions()
  console.log(
    `Found ${remoteVersions.length} stable versions in repository XML`
  )

  const currentBuilds = getCurrentBuildNumbers()
  const newVersions = remoteVersions.filter(
    (v) => !currentBuilds.has(v.buildNumber)
  )

  if (newVersions.length === 0) {
    console.log('No new SDK versions found')
    setOutput('has_updates', 'false')
    return
  }

  console.log(`New SDK versions found:`)
  for (const v of newVersions) {
    console.log(`  ${v.version} (build ${v.buildNumber})`)
  }

  updateMainTs(remoteVersions)
  updateWorkflow(remoteVersions)
  updateActionYml(remoteVersions[0].buildNumber)
  updateReadme(remoteVersions)

  const summary = newVersions
    .map((v) => `${v.version} (${v.buildNumber})`)
    .join(', ')
  setOutput('has_updates', 'true')
  setOutput('summary', summary)
  setOutput('latest_version', remoteVersions[0].version)
  setOutput('latest_build', remoteVersions[0].buildNumber)

  console.log('Files updated. Run `npm run build` to rebuild dist/index.js')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
