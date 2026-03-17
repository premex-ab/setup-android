import * as actions from './actions'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

function getVersionShort(versionLong: string): string {
  switch (versionLong) {
    case '12266719':
      return '16.0'
    case '11479570':
      return '13.0'
    case '11076708':
      return '12.0'
    case '10406996':
      return '11.0'
    case '9862592':
      return '10.0'
    case '9477386':
      return '9.0'
    case '9123335':
      return '8.0'
    case '8512546':
      return '7.0'
    case '6858069':
      return '3.0'
    case '6609375':
      return '2.1'
    case '6200805':
      return '1.0'
    default:
      return versionLong
  }
}

const VERSION_LONG = actions.getInput('cmdline-tools-version', {
  trimWhitespace: true
})
if (VERSION_LONG.includes('/') || VERSION_LONG.includes('\\')) {
  actions.setFailed('Malformed cmdline-tools-version!')
  throw new Error('Malformed cmdline-tools-version!')
}
const VERSION_SHORT = getVersionShort(VERSION_LONG)

const COMMANDLINE_TOOLS_WIN_URL = `https://dl.google.com/android/repository/commandlinetools-win-${VERSION_LONG}_latest.zip`
const COMMANDLINE_TOOLS_MAC_URL = `https://dl.google.com/android/repository/commandlinetools-mac-${VERSION_LONG}_latest.zip`
const COMMANDLINE_TOOLS_LIN_URL = `https://dl.google.com/android/repository/commandlinetools-linux-${VERSION_LONG}_latest.zip`

const ANDROID_HOME_SDK_DIR = path.join(os.homedir(), '.android', 'sdk')
let ANDROID_SDK_ROOT = process.env['ANDROID_SDK_ROOT'] || ANDROID_HOME_SDK_DIR

async function callSdkManager(
  sdkManager: string,
  arg: string,
  printOutput: Boolean = true
): Promise<void> {
  const acceptBuffer = Buffer.from(Array(10).fill('y').join('\n'), 'utf8')
  await actions.exec(sdkManager, [arg], {
    input: acceptBuffer,
    silent: !printOutput
  })
}

async function installSdkManager(): Promise<string> {
  const cmdlineTools = path.join(
    ANDROID_SDK_ROOT,
    'cmdline-tools',
    VERSION_SHORT
  )
  let sdkManagerExe = path.join(cmdlineTools, 'bin', 'sdkmanager')

  if (!fs.existsSync(sdkManagerExe)) {
    const latestCmdlineTools = path.join(
      ANDROID_SDK_ROOT,
      'cmdline-tools',
      'latest'
    )
    const sourcePropertiesFile = path.join(
      latestCmdlineTools,
      'source.properties'
    )
    const latestSdkManagerExe = path.join(
      latestCmdlineTools,
      'bin',
      'sdkmanager'
    )
    if (
      fs.existsSync(latestCmdlineTools) &&
      fs.existsSync(sourcePropertiesFile) &&
      fs.existsSync(latestSdkManagerExe)
    ) {
      const sourceProperties = fs.readFileSync(sourcePropertiesFile)
      actions.info(
        `Found preinstalled sdkmanager in ${latestCmdlineTools} with following source.properties:`
      )
      actions.info(sourceProperties.toString())
      if (sourceProperties.includes(`Pkg.Revision=${VERSION_SHORT}`)) {
        actions.info(`Preinstalled sdkmanager has the correct version`)
        sdkManagerExe = latestSdkManagerExe
      } else {
        actions.info(`Wrong version in preinstalled sdkmanager`)
      }
    }
  }

  if (!fs.existsSync(sdkManagerExe)) {
    let cmdlineToolsURL
    if (process.platform === 'linux') {
      cmdlineToolsURL = COMMANDLINE_TOOLS_LIN_URL
    } else if (process.platform === 'darwin') {
      cmdlineToolsURL = COMMANDLINE_TOOLS_MAC_URL
    } else if (process.platform === 'win32') {
      cmdlineToolsURL = COMMANDLINE_TOOLS_WIN_URL
    } else {
      actions.error(`Unsupported platform: ${process.platform}`)
      return ''
    }

    actions.info(`Downloading commandline tools from ${cmdlineToolsURL}`)
    const cmdlineToolsZip = await actions.downloadTool(cmdlineToolsURL)

    const extractTo = path.join(ANDROID_SDK_ROOT, 'cmdline-tools')
    await actions.extractZip(cmdlineToolsZip, extractTo)

    // Make sure we don't have leftover target directory (happens sometimes...)
    if (fs.existsSync(cmdlineTools)) {
      actions.info(`Removing leftovers from ${cmdlineTools}`)
      fs.rmSync(cmdlineTools, {recursive: true})
    }
    // v1.0 and v2.1 extract to tools/, v3.0+ extract to cmdline-tools/
    const extractedCmdlineTools = path.join(extractTo, 'cmdline-tools')
    const extractedTools = path.join(extractTo, 'tools')
    const extractedDir = fs.existsSync(extractedCmdlineTools)
      ? extractedCmdlineTools
      : extractedTools
    fs.renameSync(extractedDir, cmdlineTools)
  }

  // touch $ANDROID_SDK_ROOT/repositories.cfg
  fs.closeSync(
    fs.openSync(path.join(ANDROID_SDK_ROOT, 'repositories.cfg'), 'w')
  )
  actions.debug(`sdkmanager available at: ${sdkManagerExe}`)
  return sdkManagerExe
}

async function run(): Promise<void> {
  if ('win16' === process.env['ImageOS']) {
    if (-1 !== ANDROID_SDK_ROOT.indexOf(' ')) {
      // On Windows2016, Android SDK is installed to Program Files,
      // and it doesn't really work..
      // C:\windows\system32\cmd.exe /D /S /C ""C:\Program Files (x86)\Android\android-sdk\cmdline-tools\3.0\bin\sdkmanager.bat" --licenses"
      // Error: Could not find or load main class Files

      const newSDKLocation = ANDROID_SDK_ROOT.replace(/\s/gi, '-')
      actions.debug(`moving ${ANDROID_SDK_ROOT} to ${newSDKLocation}`)
      fs.mkdirSync(path.dirname(newSDKLocation), {recursive: true})

      // intentionally using fs.renameSync,
      // because it doesn't move across drives
      fs.renameSync(ANDROID_SDK_ROOT, newSDKLocation)
      ANDROID_SDK_ROOT = newSDKLocation
    }
  }

  const sdkManagerExe = await installSdkManager()

  if (actions.getBooleanInput('accept-android-sdk-licenses')) {
    actions.info('Accepting Android SDK licenses')
    await callSdkManager(
      sdkManagerExe,
      '--licenses',
      actions.getBooleanInput('log-accepted-android-sdk-licenses')
    )
  }

  const packages = actions
    .getInput('packages', {required: false})
    .split(' ')
    .map(function (str) {
      return str.trim()
    })
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    .filter(function (element, index, array) {
      return element
    })
  for (const pkg of packages) {
    await callSdkManager(sdkManagerExe, pkg)
  }

  actions.setOutput('ANDROID_COMMANDLINE_TOOLS_VERSION', VERSION_LONG)
  actions.exportVariable('ANDROID_HOME', ANDROID_SDK_ROOT)
  actions.exportVariable('ANDROID_SDK_ROOT', ANDROID_SDK_ROOT)

  actions.addPath(path.dirname(sdkManagerExe))
  actions.addPath(path.join(ANDROID_SDK_ROOT, 'platform-tools'))

  actions.debug('add matchers')
  // eslint-disable-next-line no-console
  console.log(`##[add-matcher]${path.join(__dirname, '..', 'matchers.json')}`)
}

run()
