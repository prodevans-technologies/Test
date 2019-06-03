import { JupyterLab } from '@jupyterlab/application';
import * as React from 'react';
/** Interface for PastCommits component props */
export interface IPastCommitsProps {
    currentFileBrowserPath: string;
    topRepoPath: string;
    inNewRepo: boolean;
    showList: boolean;
    stagedFiles: any;
    unstagedFiles: any;
    untrackedFiles: any;
    app: JupyterLab;
    refresh: any;
    diff: any;
    sideBarExpanded: boolean;
    currentTheme: string;
}
export declare class PastCommits extends React.Component<IPastCommitsProps, {}> {
    render(): JSX.Element;
}
