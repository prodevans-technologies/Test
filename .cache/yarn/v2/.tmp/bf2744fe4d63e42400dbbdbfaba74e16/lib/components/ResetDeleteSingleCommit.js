"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const typestyle_1 = require("typestyle");
const SinglePastCommitInfoStyle_1 = require("../componentsStyle/SinglePastCommitInfoStyle");
const git_1 = require("../git");
class ResetDeleteSingleCommit extends React.Component {
    constructor(props) {
        super(props);
        this.onCancel = () => {
            this.setState({
                message: '',
                resetDeleteDisabled: true
            });
            this.props.onCancel();
        };
        this.updateMessage = (value) => {
            this.setState({
                message: value,
                resetDeleteDisabled: value === ''
            });
        };
        this.handleResetDelete = () => {
            let gitApi = new git_1.Git();
            if (this.props.action === 'reset') {
                gitApi
                    .resetToCommit(this.state.message, this.props.path, this.props.commitId)
                    .then(response => {
                    this.props.refresh();
                });
            }
            else {
                gitApi
                    .deleteCommit(this.state.message, this.props.path, this.props.commitId)
                    .then(response => {
                    this.props.refresh();
                });
            }
            this.props.onCancel();
        };
        this.state = {
            message: '',
            resetDeleteDisabled: true
        };
    }
    render() {
        return (React.createElement("div", null,
            React.createElement("div", { className: SinglePastCommitInfoStyle_1.WarningLabel }, this.props.action === 'delete'
                ? "These changes will be gone forever. Commit if you're sure?"
                : "All changes after this will be gone forever. Commit if you're sure?"),
            React.createElement("input", { type: "text", className: SinglePastCommitInfoStyle_1.MessageInput, onChange: event => this.updateMessage(event.currentTarget.value), placeholder: "Add a commit message to make changes" }),
            React.createElement("button", { className: typestyle_1.classes(SinglePastCommitInfoStyle_1.Button, SinglePastCommitInfoStyle_1.CancelButton), onClick: this.onCancel }, "Cancel"),
            React.createElement("button", { className: this.state.resetDeleteDisabled
                    ? typestyle_1.classes(SinglePastCommitInfoStyle_1.Button, SinglePastCommitInfoStyle_1.ResetDeleteDisabledButton)
                    : typestyle_1.classes(SinglePastCommitInfoStyle_1.Button, SinglePastCommitInfoStyle_1.ResetDeleteButton), disabled: this.state.resetDeleteDisabled, onClick: this.handleResetDelete }, this.props.action === 'delete'
                ? 'Delete these changes'
                : 'Revert to this commit')));
    }
}
exports.ResetDeleteSingleCommit = ResetDeleteSingleCommit;
