import { JupyterLab } from "@jupyterlab/application";
import * as React from "react";
import { CommitModifiedFile, SingleCommitInfo } from "../git";
export interface ISinglePastCommitInfoProps {
    topRepoPath: string;
    data: SingleCommitInfo;
    app: JupyterLab;
    diff: (app: JupyterLab, filename: string, revisionA: string, revisionB: string) => void;
    refresh: () => void;
    currentTheme: string;
}
export interface ISinglePastCommitInfoState {
    displayDelete: boolean;
    displayReset: boolean;
    info: string;
    filesChanged: string;
    insertionCount: string;
    deletionCount: string;
    modifiedFiles: Array<CommitModifiedFile>;
    loadingState: "loading" | "error" | "success";
}
export declare class SinglePastCommitInfo extends React.Component<ISinglePastCommitInfoProps, ISinglePastCommitInfoState> {
    constructor(props: ISinglePastCommitInfoProps);
    showPastCommitWork: () => Promise<void>;
    showDeleteCommit: () => void;
    hideDeleteCommit: () => void;
    showResetToCommit: () => void;
    hideResetToCommit: () => void;
    render(): JSX.Element;
}
