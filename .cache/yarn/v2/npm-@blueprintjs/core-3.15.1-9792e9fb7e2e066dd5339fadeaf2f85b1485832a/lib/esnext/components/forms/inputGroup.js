/*
 * Copyright 2016 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import classNames from "classnames";
import * as React from "react";
import * as Classes from "../../common/classes";
import { DISPLAYNAME_PREFIX, removeNonHTMLProps, } from "../../common/props";
import { Icon } from "../icon/icon";
const DEFAULT_RIGHT_ELEMENT_WIDTH = 10;
export class InputGroup extends React.PureComponent {
    constructor() {
        super(...arguments);
        this.state = {
            rightElementWidth: DEFAULT_RIGHT_ELEMENT_WIDTH,
        };
        this.refHandlers = {
            rightElement: (ref) => (this.rightElement = ref),
        };
    }
    render() {
        const { className, intent, large, small, leftIcon, round } = this.props;
        const classes = classNames(Classes.INPUT_GROUP, Classes.intentClass(intent), {
            [Classes.DISABLED]: this.props.disabled,
            [Classes.LARGE]: large,
            [Classes.SMALL]: small,
            [Classes.ROUND]: round,
        }, className);
        const style = { ...this.props.style, paddingRight: this.state.rightElementWidth };
        return (React.createElement("div", { className: classes },
            React.createElement(Icon, { icon: leftIcon }),
            React.createElement("input", Object.assign({ type: "text" }, removeNonHTMLProps(this.props), { className: Classes.INPUT, ref: this.props.inputRef, style: style })),
            this.maybeRenderRightElement()));
    }
    componentDidMount() {
        this.updateInputWidth();
    }
    componentDidUpdate() {
        this.updateInputWidth();
    }
    maybeRenderRightElement() {
        const { rightElement } = this.props;
        if (rightElement == null) {
            return undefined;
        }
        return (React.createElement("span", { className: Classes.INPUT_ACTION, ref: this.refHandlers.rightElement }, rightElement));
    }
    updateInputWidth() {
        if (this.rightElement != null) {
            const { clientWidth } = this.rightElement;
            // small threshold to prevent infinite loops
            if (Math.abs(clientWidth - this.state.rightElementWidth) > 2) {
                this.setState({ rightElementWidth: clientWidth });
            }
        }
        else {
            this.setState({ rightElementWidth: DEFAULT_RIGHT_ELEMENT_WIDTH });
        }
    }
}
InputGroup.displayName = `${DISPLAYNAME_PREFIX}.InputGroup`;
//# sourceMappingURL=inputGroup.js.map