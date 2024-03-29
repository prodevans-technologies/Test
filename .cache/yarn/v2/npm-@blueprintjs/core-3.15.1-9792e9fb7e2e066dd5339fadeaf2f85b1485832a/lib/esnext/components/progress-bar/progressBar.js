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
import { DISPLAYNAME_PREFIX } from "../../common/props";
import { clamp } from "../../common/utils";
export class ProgressBar extends React.PureComponent {
    render() {
        const { animate = true, className, intent, stripes = true, value } = this.props;
        const classes = classNames(Classes.PROGRESS_BAR, Classes.intentClass(intent), { [Classes.PROGRESS_NO_ANIMATION]: !animate, [Classes.PROGRESS_NO_STRIPES]: !stripes }, className);
        // don't set width if value is null (rely on default CSS value)
        const width = value == null ? null : 100 * clamp(value, 0, 1) + "%";
        return (React.createElement("div", { className: classes },
            React.createElement("div", { className: Classes.PROGRESS_METER, style: { width } })));
    }
}
ProgressBar.displayName = `${DISPLAYNAME_PREFIX}.ProgressBar`;
//# sourceMappingURL=progressBar.js.map