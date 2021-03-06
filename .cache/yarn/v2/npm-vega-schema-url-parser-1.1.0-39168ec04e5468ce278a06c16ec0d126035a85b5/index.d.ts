/**
 * Parse a vega schema url into library and version.
 */
export default function (url: string): {
    library: "vega" | "vega-lite";
    version: string;
};
