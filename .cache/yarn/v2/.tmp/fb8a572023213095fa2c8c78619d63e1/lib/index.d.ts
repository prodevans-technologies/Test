import { JupyterLabPlugin } from '@jupyterlab/application';
/**
 * The command IDs used by the plugin.
 */
export declare namespace CommandIDs {
    const controlPanel: string;
    const logout: string;
}
/**
 * Initialization data for the jupyterlab_hub extension.
 */
declare const hubExtension: JupyterLabPlugin<void>;
export default hubExtension;
