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
if (require.main === module) {
    // Make sure we have required command line arguments.
    if (process.argv.length !== 3) {
        let msg = '** Must supply a source package name\n';
        process.stderr.write(msg);
        process.exit(1);
    }
    let name = process.argv[2];
    let pkgPath = path.resolve(path.join('.', 'packages', name));
    if (!fs.existsSync(pkgPath)) {
        console.error('Package does not exist: ', name);
        process.exit(1);
    }
    let dest = path.resolve(`./tests/test-${name}`);
    if (fs.existsSync(dest)) {
        console.error('Test package already exists:', dest);
        process.exit(1);
    }
    fs.copySync(path.resolve(path.join(__dirname, '..', 'test-template')), dest);
    let jsonPath = path.join(dest, 'package.json');
    let data = utils.readJSONFile(jsonPath);
    if (name.indexOf('@jupyterlab/') === -1) {
        name = '@jupyterlab/test-' + name;
    }
    data.name = name;
    utils.writePackageData(jsonPath, data);
    fs.ensureDir(path.join(dest, 'src'));
}
