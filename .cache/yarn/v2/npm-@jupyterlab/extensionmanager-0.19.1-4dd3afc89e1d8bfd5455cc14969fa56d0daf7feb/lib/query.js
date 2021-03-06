"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * An object for searching an NPM registry.
 *
 * Searches the NPM registry via web API:
 * https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
 */
class Searcher {
    /**
     * Create a Searcher object.
     *
     * @param repoUri The URI of the NPM registry to use.
     * @param cdnUri The URI of the CDN to use for fetching full package data.
     */
    constructor(repoUri = 'https://registry.npmjs.org/', cdnUri = 'https://unpkg.com') {
        this.repoUri = repoUri;
        this.cdnUri = cdnUri;
    }
    /**
     * Search for a jupyterlab extension.
     *
     * @param query The query to send. `keywords:"jupyterlab-extension"` will be appended to the query.
     * @param page The page of results to fetch.
     * @param pageination The pagination size to use. See registry API documentation for acceptable values.
     */
    searchExtensions(query, page = 0, pageination = 250) {
        const uri = new URL('/-/v1/search', this.repoUri);
        // Note: Spaces are encoded to '+' signs!
        let text = `${query} keywords:"jupyterlab-extension"`;
        uri.searchParams.append('text', text);
        uri.searchParams.append('size', pageination.toString());
        uri.searchParams.append('from', (pageination * page).toString());
        return fetch(uri.toString()).then((response) => {
            if (response.ok) {
                return response.json();
            }
            return [];
        });
    }
    /**
     * Fetch package.json of a package
     *
     * @param name The package name.
     * @param version The version of the package to fetch.
     */
    fetchPackageData(name, version) {
        const uri = new URL(`/${name}@${version}/package.json`, this.cdnUri);
        return fetch(uri.toString()).then((response) => {
            if (response.ok) {
                return response.json();
            }
            return null;
        });
    }
}
exports.Searcher = Searcher;
/**
 * Check whether the NPM org is a Jupyter one.
 */
function isJupyterOrg(name) {
    /**
     * A list of whitelisted NPM orgs.
     */
    const whitelist = ['jupyterlab', 'jupyter-widgets'];
    const parts = name.split('/');
    const first = parts[0];
    return (parts.length > 1 && // Has a first part
        first && // with a finite length
        first[0] === '@' && // corresponding to an org name
        whitelist.indexOf(first.slice(1)) !== -1 // in the org whitelist.
    );
}
exports.isJupyterOrg = isJupyterOrg;
