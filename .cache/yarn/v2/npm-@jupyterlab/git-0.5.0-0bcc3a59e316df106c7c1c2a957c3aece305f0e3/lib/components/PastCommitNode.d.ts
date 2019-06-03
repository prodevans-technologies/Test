import { JupyterLab } from "@jupyterlab/application";
import * as React from "react";
import { GitBranchResult, SingleCommitInfo } from "../git";
export interface IPastCommitNodeProps {
    pastCommit: SingleCommitInfo;
    branches: GitBranchResult["branches"];
    topRepoPath: string;
    currentTheme: string;
    app: JupyterLab;
    diff: (app: JupyterLab, filename: string, revisionA: string, revisionB: string) => void;
    refresh: () => void;
}
export interface IPastCommitNodeState {
    expanded: boolean;
}
export declare class PastCommitNode extends React.Component<IPastCommitNodeProps, IPastCommitNodeState> {
    constructor(props: IPastCommitNodeProps);
    getBranchesForCommit(): any[];
    expand(): void;
    collapse(): void;
    getNodeClass(): string;
    render(): JSX.Element;
}
