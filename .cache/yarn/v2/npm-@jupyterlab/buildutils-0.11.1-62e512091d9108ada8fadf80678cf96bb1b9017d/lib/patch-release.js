"use strict";
/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const utils = __importStar(require("./utils"));
// Make sure we have required command line arguments.
if (process.argv.length < 3) {
    let msg = '** Must supply a target package';
    process.stderr.write(msg);
    process.exit(1);
}
// Use npm here so this file can be used outside of JupyterLab.
utils.run('npm run build:packages');
utils.run('npm run build:themes');
// Extract the desired package target(s).
process.argv.slice(2).forEach(target => {
    let packagePath = path.resolve(path.join('packages', target));
    if (!fs.existsSync(packagePath)) {
        console.log('Invalid package path', packagePath);
        process.exit(1);
    }
    // Perform the patch operations.
    console.log('Patching', target, '...');
    utils.run('npm version patch', { cwd: packagePath });
    utils.run('npm publish', { cwd: packagePath });
    // Extract the new package info.
    let data = utils.readJSONFile(path.join(packagePath, 'package.json'));
    let name = data.name;
    let version = data.version;
    // Make the release commit
    utils.run('git commit -a -m "Release ' + name + '@' + version + '"');
    utils.run('git tag ' + name + '@' + version);
});
// Update the static folder.
utils.run('npm run build:update');
// Integrity update
utils.run('npm run integrity');
utils.run('git commit -a -m "Integrity update"');
console.log('\n\nFinished, make sure to push the commit(s) and tag(s).');
