"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const posix = __importStar(require("path-posix"));
/**
 * The namespace for path-related functions.
 *
 * Note that Jupyter server paths do not start with a leading slash.
 */
var PathExt;
(function (PathExt) {
    /**
     * Join all arguments together and normalize the resulting path.
     * Arguments must be strings. In v0.8, non-string arguments were silently ignored. In v0.10 and up, an exception is thrown.
     *
     * @param paths - The string paths to join.
     */
    function join(...paths) {
        const path = posix.join(...paths);
        return path === '.' ? '' : removeSlash(posix.join(...paths));
    }
    PathExt.join = join;
    /**
     * Return the last portion of a path. Similar to the Unix basename command.
     * Often used to extract the file name from a fully qualified path.
     *
     * @param path - The path to evaluate.
     *
     * @param ext - An extension to remove from the result.
     */
    function basename(path, ext) {
        return posix.basename(path, ext);
    }
    PathExt.basename = basename;
    /**
     * Get the directory name of a path, similar to the Unix dirname command.
     * When an empty path is given, returns the root path.
     *
     * @param path - The file path.
     */
    function dirname(path) {
        let dir = removeSlash(posix.dirname(path));
        return dir === '.' ? '' : dir;
    }
    PathExt.dirname = dirname;
    /**
     * Get the extension of the path.
     *
     * @param path - The file path.
     *
     * @returns the extension of the file.
     *
     * #### Notes
     * The extension is the string from the last occurrence of the `.`
     * character to end of string in the last portion of the path, inclusive.
     * If there is no `.` in the last portion of the path, or if the first
     * character of the basename of path [[basename]] is `.`, then an
     * empty string is returned.
     */
    function extname(path) {
        return posix.extname(path);
    }
    PathExt.extname = extname;
    /**
     * Normalize a string path, reducing '..' and '.' parts.
     * When multiple slashes are found, they're replaced by a single one; when the path contains a trailing slash, it is preserved. On Windows backslashes are used.
     * When an empty path is given, returns the root path.
     *
     * @param path - The string path to normalize.
     */
    function normalize(path) {
        if (path === '') {
            return '';
        }
        return removeSlash(posix.normalize(path));
    }
    PathExt.normalize = normalize;
    /**
     * Resolve a sequence of paths or path segments into an absolute path.
     * The root path in the application has no leading slash, so it is removed.
     *
     * @param parts - The paths to join.
     *
     * #### Notes
     * The right-most parameter is considered {to}.  Other parameters are considered an array of {from}.
     *
     * Starting from leftmost {from} parameter, resolves {to} to an absolute path.
     *
     * If {to} isn't already absolute, {from} arguments are prepended in right to left order, until an absolute path is found. If after using all {from} paths still no absolute path is found, the current working directory is used as well. The resulting path is normalized, and trailing slashes are removed unless the path gets resolved to the root directory.
     */
    function resolve(...parts) {
        return removeSlash(posix.resolve(...parts));
    }
    PathExt.resolve = resolve;
    /**
     * Solve the relative path from {from} to {to}.
     *
     * @param from - The source path.
     *
     * @param to - The target path.
     *
     * #### Notes
     * If from and to each resolve to the same path (after calling
     * path.resolve() on each), a zero-length string is returned.
     * If a zero-length string is passed as from or to, `/`
     * will be used instead of the zero-length strings.
     */
    function relative(from, to) {
        return removeSlash(posix.relative(from, to));
    }
    PathExt.relative = relative;
    /**
     * Normalize a file extension to be of the type `'.foo'`.
     *
     * @param extension - the file extension.
     *
     * #### Notes
     * Adds a leading dot if not present and converts to lower case.
     */
    function normalizeExtension(extension) {
        if (extension.length > 0 && extension.indexOf('.') !== 0) {
            extension = `.${extension}`;
        }
        return extension;
    }
    PathExt.normalizeExtension = normalizeExtension;
    /**
     * Remove the leading slash from a path.
     *
     * @param path: the path from which to remove a leading slash.
     */
    function removeSlash(path) {
        if (path.indexOf('/') === 0) {
            path = path.slice(1);
        }
        return path;
    }
    PathExt.removeSlash = removeSlash;
})(PathExt = exports.PathExt || (exports.PathExt = {}));
