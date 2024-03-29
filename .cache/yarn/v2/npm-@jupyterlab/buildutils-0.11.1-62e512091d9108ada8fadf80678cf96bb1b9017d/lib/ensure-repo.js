"use strict";
/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Ensure the integrity of the packages in the repo.
 *
 * Ensure the core package version dependencies match everywhere.
 * Ensure imported packages match dependencies.
 * Ensure a consistent version of all packages.
 * Manage the metapackage meta package.
 */
const path = __importStar(require("path"));
const utils = __importStar(require("./utils"));
const ensure_package_1 = require("./ensure-package");
// Data to ignore.
let MISSING = {
    '@jupyterlab/buildutils': ['path']
};
let UNUSED = {
    '@jupyterlab/apputils': ['@types/react'],
    '@jupyterlab/apputils-extension': ['es6-promise'],
    '@jupyterlab/theme-dark-extension': ['font-awesome'],
    '@jupyterlab/theme-light-extension': ['font-awesome'],
    '@jupyterlab/services': ['ws'],
    '@jupyterlab/testutils': ['node-fetch', 'identity-obj-proxy'],
    '@jupyterlab/test-csvviewer': ['csv-spectrum'],
    '@jupyterlab/vega4-extension': ['vega', 'vega-lite']
};
let pkgData = {};
let pkgPaths = {};
let pkgNames = {};
let depCache = {};
let locals = {};
/**
 * Ensure the metapackage package.
 *
 * @returns An array of messages for changes.
 */
function ensureMetaPackage() {
    let basePath = path.resolve('.');
    let mpPath = path.join(basePath, 'packages', 'metapackage');
    let mpJson = path.join(mpPath, 'package.json');
    let mpData = utils.readJSONFile(mpJson);
    let messages = [];
    let seen = {};
    utils.getCorePaths().forEach(pkgPath => {
        if (path.resolve(pkgPath) === path.resolve(mpPath)) {
            return;
        }
        let name = pkgNames[pkgPath];
        if (!name) {
            return;
        }
        seen[name] = true;
        let data = pkgData[name];
        let valid = true;
        // Ensure it is a dependency.
        if (!mpData.dependencies[name]) {
            valid = false;
            mpData.dependencies[name] = '^' + data.version;
        }
        if (!valid) {
            messages.push(`Updated: ${name}`);
        }
    });
    // Make sure there are no extra deps.
    Object.keys(mpData.dependencies).forEach(name => {
        if (!(name in seen)) {
            messages.push(`Removing dependency: ${name}`);
            delete mpData.dependencies[name];
        }
    });
    // Write the files.
    if (messages.length > 0) {
        utils.writePackageData(mpJson, mpData);
    }
    // Update the global data.
    pkgData[mpData.name] = mpData;
    return messages;
}
/**
 * Ensure the jupyterlab application package.
 */
function ensureJupyterlab() {
    // Get the current version of JupyterLab
    let cmd = 'python setup.py --version';
    let version = utils.run(cmd, { stdio: 'pipe' }, true);
    let basePath = path.resolve('.');
    let corePath = path.join(basePath, 'dev_mode', 'package.json');
    let corePackage = utils.readJSONFile(corePath);
    corePackage.jupyterlab.extensions = {};
    corePackage.jupyterlab.mimeExtensions = {};
    corePackage.jupyterlab.version = version;
    corePackage.jupyterlab.linkedPackages = {};
    corePackage.dependencies = {};
    let singletonPackages = corePackage.jupyterlab.singletonPackages;
    let vendorPackages = corePackage.jupyterlab.vendor;
    utils.getCorePaths().forEach(pkgPath => {
        let dataPath = path.join(pkgPath, 'package.json');
        let data;
        try {
            data = utils.readJSONFile(dataPath);
        }
        catch (e) {
            return;
        }
        if (data.private === true || data.name === '@jupyterlab/metapackage') {
            return;
        }
        // Make sure it is included as a dependency.
        corePackage.dependencies[data.name] = '^' + String(data.version);
        let relativePath = `../packages/${path.basename(pkgPath)}`;
        corePackage.jupyterlab.linkedPackages[data.name] = relativePath;
        // Add its dependencies to the core dependencies if they are in the
        // singleton packages or vendor packages.
        let deps = data.dependencies || {};
        for (let dep in deps) {
            if (singletonPackages.indexOf(dep) !== -1) {
                corePackage.dependencies[dep] = deps[dep];
            }
            if (vendorPackages.indexOf(dep) !== -1) {
                corePackage.dependencies[dep] = deps[dep];
            }
        }
        let jlab = data.jupyterlab;
        if (!jlab) {
            return;
        }
        // Handle extensions.
        ['extension', 'mimeExtension'].forEach(item => {
            let ext = jlab[item];
            if (ext === true) {
                ext = '';
            }
            if (typeof ext !== 'string') {
                return;
            }
            corePackage.jupyterlab[item + 's'][data.name] = ext;
        });
    });
    // Write the package.json back to disk.
    if (utils.writePackageData(corePath, corePackage)) {
        return ['Updated dev mode'];
    }
    return [];
}
/**
 * Ensure the repo integrity.
 */
function ensureIntegrity() {
    return __awaiter(this, void 0, void 0, function* () {
        let messages = {};
        // Pick up all the package versions.
        let paths = utils.getLernaPaths();
        // These two are not part of the workspaces but should be kept
        // in sync.
        paths.push('./jupyterlab/tests/mock_packages/extension');
        paths.push('./jupyterlab/tests/mock_packages/mimeextension');
        paths.forEach(pkgPath => {
            // Read in the package.json.
            let data;
            try {
                data = utils.readJSONFile(path.join(pkgPath, 'package.json'));
            }
            catch (e) {
                console.error(e);
                return;
            }
            pkgData[data.name] = data;
            pkgPaths[data.name] = pkgPath;
            pkgNames[pkgPath] = data.name;
            locals[data.name] = pkgPath;
        });
        // Update the metapackage.
        let pkgMessages = ensureMetaPackage();
        if (pkgMessages.length > 0) {
            let pkgName = '@jupyterlab/metapackage';
            if (!messages[pkgName]) {
                messages[pkgName] = [];
            }
            messages[pkgName] = messages[pkgName].concat(pkgMessages);
        }
        // Validate each package.
        for (let name in pkgData) {
            let options = {
                pkgPath: pkgPaths[name],
                data: pkgData[name],
                depCache,
                missing: MISSING[name],
                unused: UNUSED[name],
                locals
            };
            if (name === '@jupyterlab/metapackage') {
                options.noUnused = false;
            }
            let pkgMessages = yield ensure_package_1.ensurePackage(options);
            if (pkgMessages.length > 0) {
                messages[name] = pkgMessages;
            }
        }
        // Handle the top level package.
        let corePath = path.resolve('.', 'package.json');
        let coreData = utils.readJSONFile(corePath);
        if (utils.writePackageData(corePath, coreData)) {
            messages['top'] = ['Update package.json'];
        }
        // Handle the JupyterLab application top package.
        pkgMessages = ensureJupyterlab();
        if (pkgMessages.length > 0) {
            let pkgName = '@jupyterlab/application-top';
            if (!messages[pkgName]) {
                messages[pkgName] = [];
            }
            messages[pkgName] = messages[pkgName].concat(pkgMessages);
        }
        // Handle any messages.
        if (Object.keys(messages).length > 0) {
            console.log(JSON.stringify(messages, null, 2));
            if ('--force' in process.argv) {
                console.log('\n\nPlease run `jlpm run integrity` locally and commit the changes');
                process.exit(1);
            }
            utils.run('jlpm install');
            console.log('\n\nMade integrity changes!');
            console.log('Please commit the changes by running:');
            console.log('git commit -a -m "Package integrity updates"');
            return false;
        }
        console.log('Repo integrity verified!');
        return true;
    });
}
exports.ensureIntegrity = ensureIntegrity;
if (require.main === module) {
    ensureIntegrity();
}
