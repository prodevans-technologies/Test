import * as React from 'react';
import { Git } from '../git';
export interface IPathHeaderState {
    refresh: any;
    gitApi: Git;
}
export interface IPathHeaderProps {
    currentFileBrowserPath: string;
    topRepoPath: string;
    refresh: any;
    currentBranch: string;
    isLightTheme: string;
}
export declare class PathHeader extends React.Component<IPathHeaderProps, IPathHeaderState> {
    constructor(props: IPathHeaderProps);
    render(): JSX.Element;
    /**
     * Execute the `/git/pull` API
     */
    private executeGitPull;
    /**
     * Execute the `/git/push` API
     */
    private executeGitPush;
    /**
     * Displays the error dialog when the Git Push/Pull operation fails.
     * @param title the title of the error dialog
     * @param body the message to be shown in the body of the modal.
     */
    private showErrorDialog;
}
