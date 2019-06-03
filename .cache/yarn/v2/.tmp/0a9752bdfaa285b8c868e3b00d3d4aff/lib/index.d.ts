import { JupyterLabPlugin } from "@jupyterlab/application";
import { ITopBar } from "jupyterlab-topbar";
import "../style/index.css";
/**
 * Initialization data for the jupyterlab-topbar extension.
 */
declare const extension: JupyterLabPlugin<ITopBar>;
export default extension;
