import { JupyterLab } from "@jupyterlab/application";
import * as React from "react";
import { GitBranchResult, SingleCommitInfo } from "../git";
/** Interface for PastCommits component props */
export interface IHistorySideBarProps {
    pastCommits: SingleCommitInfo[];
    branches: GitBranchResult["branches"];
    isExpanded: boolean;
    topRepoPath: string;
    currentTheme: string;
    app: JupyterLab;
    refresh: () => void;
    diff: (app: JupyterLab, filename: string, revisionA: string, revisionB: string) => void;
}
export declare class HistorySideBar extends React.Component<IHistorySideBarProps, {}> {
    render(): JSX.Element;
}
