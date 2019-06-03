"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PathHeaderStyle_1 = require("../componentsStyle/PathHeaderStyle");
const React = require("react");
const typestyle_1 = require("typestyle");
const git_1 = require("../git");
const apputils_1 = require("@jupyterlab/apputils");
class PathHeader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            refresh: props.refresh,
            gitApi: new git_1.Git()
        };
    }
    render() {
        let relativePath = this.props.currentFileBrowserPath.split('/');
        return (React.createElement("div", { className: PathHeaderStyle_1.repoStyle },
            React.createElement("span", { className: PathHeaderStyle_1.repoPathStyle }, relativePath[relativePath.length - 1] +
                ' / ' +
                this.props.currentBranch),
            React.createElement("button", { className: typestyle_1.classes(PathHeaderStyle_1.gitPullStyle(this.props.isLightTheme), 'jp-Icon-16'), title: 'Pull latest changes', onClick: () => this.executeGitPull() }),
            React.createElement("button", { className: typestyle_1.classes(PathHeaderStyle_1.gitPushStyle(this.props.isLightTheme), 'jp-Icon-16'), title: 'Push committed changes', onClick: () => this.executeGitPush() }),
            React.createElement("button", { className: typestyle_1.classes(PathHeaderStyle_1.repoRefreshStyle, 'jp-Icon-16'), onClick: () => this.props.refresh() })));
    }
    /**
     * Execute the `/git/pull` API
     */
    executeGitPull() {
        this.state.gitApi.pull(this.props.currentFileBrowserPath)
            .then(response => {
            if (response.code != 0) {
                this.showErrorDialog('Pull failed', response.message);
            }
        })
            .catch(() => this.showErrorDialog('Pull failed'));
    }
    /**
     * Execute the `/git/push` API
     */
    executeGitPush() {
        this.state.gitApi.push(this.props.currentFileBrowserPath)
            .then(response => {
            if (response.code != 0) {
                this.showErrorDialog('Push failed', response.message);
            }
        })
            .catch(() => this.showErrorDialog('Push failed'));
    }
    /**
     * Displays the error dialog when the Git Push/Pull operation fails.
     * @param title the title of the error dialog
     * @param body the message to be shown in the body of the modal.
     */
    showErrorDialog(title, body = '') {
        return apputils_1.showDialog({
            title: title,
            body: body,
            buttons: [apputils_1.Dialog.warnButton({ label: 'DISMISS' })]
        }).then(() => {
            // NO-OP
        });
    }
}
exports.PathHeader = PathHeader;
