/** Interface for GitAllHistory request result,
 * has all repo information */
export interface GitAllHistory {
    code: number;
    data?: {
        show_top_level?: GitShowTopLevelResult;
        branch?: GitBranchResult;
        log?: GitLogResult;
        status?: GitStatusResult;
    };
}
/** Interface for GitShowTopLevel request result,
 * has the git root directory inside a repository */
export interface GitShowTopLevelResult {
    code: number;
    top_repo_path?: string;
}
/** Interface for GitShowPrefix request result,
 * has the prefix path of a directory in a repository,
 * with respect to the root directory. */
export interface GitShowPrefixResult {
    code: number;
    under_repo_path?: string;
}
/** Interface for GitShowPrefix request result,
 * has the prefix path of a directory in a repository,
 * with respect to the root directory. */
export interface GitCheckoutResult {
    code: number;
    message?: string;
}
/** Interface for GitBranch request result,
 * has the result of changing the current working branch */
export interface GitBranchResult {
    code: number;
    branches?: Array<{
        is_current_branch: boolean;
        is_remote_branch: boolean;
        name: string;
        upstream: string;
        tag: string;
    }>;
}
/** Interface for GitStatus request result,
 * has the status of each changed file */
export interface GitStatusFileResult {
    x: string;
    y: string;
    to: string;
    from: string;
}
/** Interface for GitStatus request result,
 * has the status of the entire repo */
export interface GitStatusResult {
    code: number;
    files?: [GitStatusFileResult];
}
/** Interface for GitLog request result,
 * has the info of a single past commit */
export interface SingleCommitInfo {
    commit: string;
    author: string;
    date: string;
    commit_msg: string;
    pre_commit: string;
}
/** Interface for GitCommit request result,
 * has the info of a committed file */
export interface CommitModifiedFile {
    modified_file_path: string;
    modified_file_name: string;
    insertion: string;
    deletion: string;
}
/** Interface for GitDetailedLog request result,
 * has the detailed info of a single past commit */
export interface SingleCommitFilePathInfo {
    code: number;
    modified_file_note?: string;
    modified_files_count?: string;
    number_of_insertions?: string;
    number_of_deletions?: string;
    modified_files?: [CommitModifiedFile];
}
/** Interface for GitLog request result,
 * has the info of all past commits */
export interface GitLogResult {
    code: number;
    commits?: [SingleCommitInfo];
}
/**
 * Structure for the result of the Git Clone API.
 */
export interface GitCloneResult {
    code: number;
    message?: string;
}
/**
 * Structure for the result of the Git Push & Pull API.
 */
export interface IGitPushPullResult {
    code: number;
    message?: string;
}
/** Parent class for all API requests */
export declare class Git {
    constructor();
    /** Make request for the Git Pull API. */
    pull(path: string): Promise<IGitPushPullResult>;
    /** Make request for the Git Push API. */
    push(path: string): Promise<IGitPushPullResult>;
    /** Make request for the Git Clone API. */
    clone(path: string, url: string): Promise<GitCloneResult>;
    /** Make request for all git info of repository 'path'
     * (This API is also implicitly used to check if the current repo is a Git repo)
     */
    allHistory(path: string): Promise<GitAllHistory>;
    /** Make request for top level path of repository 'path' */
    showTopLevel(path: string): Promise<GitShowTopLevelResult>;
    /** Make request for the prefix path of a directory 'path',
     * with respect to the root directory of repository  */
    showPrefix(path: string): Promise<GitShowPrefixResult>;
    /** Make request for git status of repository 'path' */
    status(path: string): Promise<GitStatusResult>;
    /** Make request for git commit logs of repository 'path' */
    log(path: string): Promise<GitLogResult>;
    /** Make request for detailed git commit info of
     * commit 'hash' in repository 'path' */
    detailedLog(hash: string, path: string): Promise<SingleCommitFilePathInfo>;
    /** Make request for a list of all git branches in repository 'path' */
    branch(path: string): Promise<GitBranchResult>;
    /** Make request to add one or all files into
     * the staging area in repository 'path' */
    add(check: boolean, filename: string, path: string): Promise<Response>;
    /** Make request to add all untracked files into
     * the staging area in repository 'path' */
    addAllUntracked(path: string): Promise<Response>;
    /** Make request to switch current working branch,
     * create new branch if needed,
     * or discard all changes,
     * or discard a specific file change
     * TODO: Refactor into seperate endpoints for each kind of checkout request */
    checkout(checkout_branch: boolean, new_check: boolean, branchname: string, checkout_all: boolean, filename: string, path: string): Promise<Response>;
    /** Make request to commit all staged files in repository 'path' */
    commit(message: string, path: string): Promise<Response>;
    /** Make request to move one or all files from the staged to the unstaged area */
    reset(check: boolean, filename: string, path: string): Promise<Response>;
    /** Make request to delete changes from selected commit */
    deleteCommit(message: string, path: string, commitId: string): Promise<Response>;
    /** Make request to reset to selected commit */
    resetToCommit(message: string, path: string, commitId: string): Promise<Response>;
    /** Make request to initialize a  new git repository at path 'path' */
    init(path: string): Promise<Response>;
}
