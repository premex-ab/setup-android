/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 496:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getInput = getInput;
exports.getBooleanInput = getBooleanInput;
exports.setOutput = setOutput;
exports.exportVariable = exportVariable;
exports.addPath = addPath;
exports.setFailed = setFailed;
exports.info = info;
exports.debug = debug;
exports.error = error;
exports.exec = exec;
exports.downloadTool = downloadTool;
exports.extractZip = extractZip;
const fs = __importStar(__nccwpck_require__(896));
const os = __importStar(__nccwpck_require__(857));
const path = __importStar(__nccwpck_require__(928));
const child_process_1 = __nccwpck_require__(317);
// --- @actions/core replacements ---
function getInput(name, options) {
    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    if ((options === null || options === void 0 ? void 0 : options.required) && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
    }
    return (options === null || options === void 0 ? void 0 : options.trimWhitespace) === false ? val : val.trim();
}
function getBooleanInput(name) {
    const val = getInput(name);
    if (['true', 'True', 'TRUE'].includes(val))
        return true;
    if (['false', 'False', 'FALSE'].includes(val))
        return false;
    throw new TypeError(`Input does not meet YAML 1.2 "Core Schema" specification: ${name}`);
}
function setOutput(name, value) {
    const filePath = process.env['GITHUB_OUTPUT'];
    if (filePath) {
        fs.appendFileSync(filePath, `${name}=${value}${os.EOL}`);
    }
}
function exportVariable(name, value) {
    process.env[name] = value;
    const filePath = process.env['GITHUB_ENV'];
    if (filePath) {
        fs.appendFileSync(filePath, `${name}=${value}${os.EOL}`);
    }
}
function addPath(inputPath) {
    const filePath = process.env['GITHUB_PATH'];
    if (filePath) {
        fs.appendFileSync(filePath, `${inputPath}${os.EOL}`);
    }
    process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`;
}
function setFailed(message) {
    process.exitCode = 1;
    error(message);
}
function info(message) {
    process.stdout.write(`${message}${os.EOL}`);
}
function debug(message) {
    process.stdout.write(`::debug::${message}${os.EOL}`);
}
function error(message) {
    process.stdout.write(`::error::${message}${os.EOL}`);
}
// --- @actions/exec replacement ---
function exec(command, args, options) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const child = (0, child_process_1.spawn)(command, args, {
                stdio: [
                    (options === null || options === void 0 ? void 0 : options.input) ? 'pipe' : 'inherit',
                    (options === null || options === void 0 ? void 0 : options.silent) ? 'ignore' : 'inherit',
                    (options === null || options === void 0 ? void 0 : options.silent) ? 'ignore' : 'inherit'
                ],
                shell: process.platform === 'win32'
            });
            if (options === null || options === void 0 ? void 0 : options.input) {
                child.stdin.end(options.input);
            }
            child.on('close', code => {
                if (code !== 0) {
                    reject(new Error(`Command '${command} ${args.join(' ')}' exited with code ${code}`));
                }
                else {
                    resolve(0);
                }
            });
            child.on('error', reject);
        });
    });
}
// --- @actions/tool-cache replacements ---
function downloadTool(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(url, { redirect: 'follow' });
        if (!response.ok) {
            throw new Error(`Failed to download from ${url}: ${response.statusText}`);
        }
        const buffer = Buffer.from(yield response.arrayBuffer());
        const tempFile = path.join(os.tmpdir(), `setup-android-${Date.now()}.zip`);
        fs.writeFileSync(tempFile, buffer);
        return tempFile;
    });
}
function extractZip(file, dest) {
    return __awaiter(this, void 0, void 0, function* () {
        fs.mkdirSync(dest, { recursive: true });
        if (process.platform === 'win32') {
            yield exec('powershell', [
                '-NoLogo',
                '-Command',
                `Expand-Archive -Path '${file}' -DestinationPath '${dest}' -Force`
            ]);
        }
        else {
            yield exec('unzip', ['-o', '-q', file, '-d', dest]);
        }
    });
}


/***/ }),

/***/ 730:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const actions = __importStar(__nccwpck_require__(496));
const path = __importStar(__nccwpck_require__(928));
const fs = __importStar(__nccwpck_require__(896));
const os = __importStar(__nccwpck_require__(857));
function getVersionShort(versionLong) {
    switch (versionLong) {
        case '12266719':
            return '16.0';
        case '11479570':
            return '13.0';
        case '11076708':
            return '12.0';
        case '10406996':
            return '11.0';
        case '9862592':
            return '10.0';
        case '9477386':
            return '9.0';
        case '9123335':
            return '8.0';
        case '8512546':
            return '7.0';
        default:
            return versionLong;
    }
}
const VERSION_LONG = actions.getInput('cmdline-tools-version', {
    trimWhitespace: true
});
if (VERSION_LONG.includes('/') || VERSION_LONG.includes('\\')) {
    actions.setFailed('Malformed cmdline-tools-version!');
    throw new Error('Malformed cmdline-tools-version!');
}
const VERSION_SHORT = getVersionShort(VERSION_LONG);
const COMMANDLINE_TOOLS_WIN_URL = `https://dl.google.com/android/repository/commandlinetools-win-${VERSION_LONG}_latest.zip`;
const COMMANDLINE_TOOLS_MAC_URL = `https://dl.google.com/android/repository/commandlinetools-mac-${VERSION_LONG}_latest.zip`;
const COMMANDLINE_TOOLS_LIN_URL = `https://dl.google.com/android/repository/commandlinetools-linux-${VERSION_LONG}_latest.zip`;
const ANDROID_HOME_SDK_DIR = path.join(os.homedir(), '.android', 'sdk');
let ANDROID_SDK_ROOT = process.env['ANDROID_SDK_ROOT'] || ANDROID_HOME_SDK_DIR;
function callSdkManager(sdkManager_1, arg_1) {
    return __awaiter(this, arguments, void 0, function* (sdkManager, arg, printOutput = true) {
        const acceptBuffer = Buffer.from(Array(10).fill('y').join('\n'), 'utf8');
        yield actions.exec(sdkManager, [arg], {
            input: acceptBuffer,
            silent: !printOutput
        });
    });
}
function installSdkManager() {
    return __awaiter(this, void 0, void 0, function* () {
        const cmdlineTools = path.join(ANDROID_SDK_ROOT, 'cmdline-tools', VERSION_SHORT);
        let sdkManagerExe = path.join(cmdlineTools, 'bin', 'sdkmanager');
        if (!fs.existsSync(sdkManagerExe)) {
            const latestCmdlineTools = path.join(ANDROID_SDK_ROOT, 'cmdline-tools', 'latest');
            const sourcePropertiesFile = path.join(latestCmdlineTools, 'source.properties');
            const latestSdkManagerExe = path.join(latestCmdlineTools, 'bin', 'sdkmanager');
            if (fs.existsSync(latestCmdlineTools) &&
                fs.existsSync(sourcePropertiesFile) &&
                fs.existsSync(latestSdkManagerExe)) {
                const sourceProperties = fs.readFileSync(sourcePropertiesFile);
                actions.info(`Found preinstalled sdkmanager in ${latestCmdlineTools} with following source.properties:`);
                actions.info(sourceProperties.toString());
                if (sourceProperties.includes(`Pkg.Revision=${VERSION_SHORT}`)) {
                    actions.info(`Preinstalled sdkmanager has the correct version`);
                    sdkManagerExe = latestSdkManagerExe;
                }
                else {
                    actions.info(`Wrong version in preinstalled sdkmanager`);
                }
            }
        }
        if (!fs.existsSync(sdkManagerExe)) {
            let cmdlineToolsURL;
            if (process.platform === 'linux') {
                cmdlineToolsURL = COMMANDLINE_TOOLS_LIN_URL;
            }
            else if (process.platform === 'darwin') {
                cmdlineToolsURL = COMMANDLINE_TOOLS_MAC_URL;
            }
            else if (process.platform === 'win32') {
                cmdlineToolsURL = COMMANDLINE_TOOLS_WIN_URL;
            }
            else {
                actions.error(`Unsupported platform: ${process.platform}`);
                return '';
            }
            actions.info(`Downloading commandline tools from ${cmdlineToolsURL}`);
            const cmdlineToolsZip = yield actions.downloadTool(cmdlineToolsURL);
            const extractTo = path.join(ANDROID_SDK_ROOT, 'cmdline-tools');
            yield actions.extractZip(cmdlineToolsZip, extractTo);
            // Make sure we don't have leftover target directory (happens sometimes...)
            if (fs.existsSync(cmdlineTools)) {
                actions.info(`Removing leftovers from ${cmdlineTools}`);
                fs.rmSync(cmdlineTools, { recursive: true });
            }
            fs.renameSync(path.join(extractTo, 'cmdline-tools'), cmdlineTools);
        }
        // touch $ANDROID_SDK_ROOT/repositories.cfg
        fs.closeSync(fs.openSync(path.join(ANDROID_SDK_ROOT, 'repositories.cfg'), 'w'));
        actions.debug(`sdkmanager available at: ${sdkManagerExe}`);
        return sdkManagerExe;
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        if ('win16' === process.env['ImageOS']) {
            if (-1 !== ANDROID_SDK_ROOT.indexOf(' ')) {
                // On Windows2016, Android SDK is installed to Program Files,
                // and it doesn't really work..
                // C:\windows\system32\cmd.exe /D /S /C ""C:\Program Files (x86)\Android\android-sdk\cmdline-tools\3.0\bin\sdkmanager.bat" --licenses"
                // Error: Could not find or load main class Files
                const newSDKLocation = ANDROID_SDK_ROOT.replace(/\s/gi, '-');
                actions.debug(`moving ${ANDROID_SDK_ROOT} to ${newSDKLocation}`);
                fs.mkdirSync(path.dirname(newSDKLocation), { recursive: true });
                // intentionally using fs.renameSync,
                // because it doesn't move across drives
                fs.renameSync(ANDROID_SDK_ROOT, newSDKLocation);
                ANDROID_SDK_ROOT = newSDKLocation;
            }
        }
        const sdkManagerExe = yield installSdkManager();
        if (actions.getBooleanInput('accept-android-sdk-licenses')) {
            actions.info('Accepting Android SDK licenses');
            yield callSdkManager(sdkManagerExe, '--licenses', actions.getBooleanInput('log-accepted-android-sdk-licenses'));
        }
        const packages = actions
            .getInput('packages', { required: false })
            .split(' ')
            .map(function (str) {
            return str.trim();
        })
            /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
            .filter(function (element, index, array) {
            return element;
        });
        for (const pkg of packages) {
            yield callSdkManager(sdkManagerExe, pkg);
        }
        actions.setOutput('ANDROID_COMMANDLINE_TOOLS_VERSION', VERSION_LONG);
        actions.exportVariable('ANDROID_HOME', ANDROID_SDK_ROOT);
        actions.exportVariable('ANDROID_SDK_ROOT', ANDROID_SDK_ROOT);
        actions.addPath(path.dirname(sdkManagerExe));
        actions.addPath(path.join(ANDROID_SDK_ROOT, 'platform-tools'));
        actions.debug('add matchers');
        // eslint-disable-next-line no-console
        console.log(`##[add-matcher]${path.join(__dirname, '..', 'matchers.json')}`);
    });
}
run();


/***/ }),

/***/ 317:
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),

/***/ 896:
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ 857:
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ 928:
/***/ ((module) => {

module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(730);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;