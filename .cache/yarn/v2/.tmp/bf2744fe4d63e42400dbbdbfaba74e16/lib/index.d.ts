import { GitWidget } from './components/GitWidget';
import { ILayoutRestorer, JupyterLab, JupyterLabPlugin } from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { Token } from '@phosphor/coreutils';
import '../style/variables.css';
import { GitClone } from "./gitClone";
/**
 * The default running sessions extension.
 */
declare const plugin: JupyterLabPlugin<IGitExtension>;
/**
 * Export the plugin as default.
 */
export default plugin;
export declare const EXTENSION_ID = "jupyter.extensions.git_plugin";
export declare const IGitExtension: Token<IGitExtension>;
/** Interface for extension class */
export interface IGitExtension {
    register_diff_provider(filetypes: string[], callback: IDiffCallback): void;
}
/** Function type for diffing a file's revisions */
export declare type IDiffCallback = (filename: string, revisionA: string, revisionB: string) => void;
/** Main extension class */
export declare class GitExtension implements IGitExtension {
    git_plugin: GitWidget;
    git_clone_widget: GitClone;
    constructor(app: JupyterLab, restorer: ILayoutRestorer, factory: IFileBrowserFactory);
    register_diff_provider(filetypes: string[], callback: IDiffCallback): void;
    performDiff(app: JupyterLab, filename: string, revisionA: string, revisionB: string): void;
    private diffProviders;
}
