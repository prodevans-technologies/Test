"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const datagrid_1 = require("@phosphor/datagrid");
const coreutils_1 = require("@phosphor/coreutils");
const parse_1 = require("./parse");
/*
Possible ideas for further implementation:

- Show a spinner or something visible when we are doing delayed parsing.
- The cache right now handles scrolling down great - it gets the next several hundred rows. However, scrolling up causes lots of cache misses - each new row causes a flush of the cache. When invalidating an entire cache, we should put the requested row in middle of the cache (adjusting for rows at the beginning or end). When populating a cache, we should retrieve rows both above and below the requested row.
- When we have a header, and we are guessing the parser to use, try checking just the part of the file *after* the header row for quotes. I think often a first header row is quoted, but the rest of the file is not and can be parsed much faster.
- autdetect the delimiter (look for comma, tab, semicolon in first line. If more than one found, parse first row with comma, tab, semicolon delimiters. One with most fields wins).
- Toolbar buttons to control the row delimiter, the parsing engine (quoted/not quoted), the quote character, etc.
- Investigate incremental loading strategies in the parseAsync function. In initial investigations, setting the chunk size to 100k in parseAsync seems cause instability with large files in Chrome (such as 8-million row files). Perhaps this is because we are recycling the row offset and column offset arrays quickly? It doesn't seem that there is a memory leak. On this theory, perhaps we just need to keep the offsets list an actual list, and pass it into the parsing function to extend without copying, and finalize it into an array buffer only when we are done parsing. Or perhaps we double the size of the array buffer each time, which may be wasteful, but at the end we trim it down if it's too wasteful (perhaps we have our own object that is backed by an array buffer, but has a push method that will automatically double the array buffer size as needed, and a trim function to finalize the array to exactly the size needed)? Or perhaps we don't use array buffers at all - compare the memory cost and speed of keeping the offsets as lists instead of memory buffers.
- Investigate a time-based incremental parsing strategy, rather than a row-based one. The parser could take a maximum time to parse (say 300ms), and will parse up to that duration, in which case the parser probably also needs a way to notify when it has reached the end of a file.
- For very large files, where we are only storing a small cache, scrolling is very laggy in Safari. It would be good to profile it.
*/
/**
 * Possible delimiter-separated data parsers.
 */
const PARSERS = {
    quotes: parse_1.parseDSV,
    noquotes: parse_1.parseDSVNoQuotes
};
/**
 * A data model implementation for in-memory delimiter-separated data.
 *
 * #### Notes
 * This model handles data with up to 2**32 characters.
 */
class DSVModel extends datagrid_1.DataModel {
    /**
     * Create a data model with static CSV data.
     *
     * @param options - The options for initializing the data model.
     */
    constructor(options) {
        super();
        this._rowCount = 1;
        // Cache information
        /**
         * The header strings.
         */
        this._header = [];
        /**
         * The column offset cache, starting with row _columnOffsetsStartingRow
         *
         * #### Notes
         * The index of the first character in the data string for row r, column c is
         * _columnOffsets[(r-this._columnOffsetsStartingRow)*numColumns+c]
         */
        this._columnOffsets = new Uint32Array(0);
        /**
         * The row that _columnOffsets[0] represents.
         */
        this._columnOffsetsStartingRow = 0;
        /**
         * The maximum number of rows to parse when there is a cache miss.
         */
        this._maxCacheGet = 1000;
        /**
         * The index for the start of each row.
         */
        this._rowOffsets = new Uint32Array(1);
        // Bookkeeping variables.
        this._delayedParse = null;
        this._startedParsing = false;
        this._doneParsing = false;
        this._isDisposed = false;
        this._ready = new coreutils_1.PromiseDelegate();
        let { data, delimiter = ',', rowDelimiter = undefined, quote = '"', quoteParser = undefined, header = true, initialRows = 500 } = options;
        this._data = data;
        this._delimiter = delimiter;
        this._quote = quote;
        this._quoteEscaped = new RegExp(quote + quote, 'g');
        this._initialRows = initialRows;
        // Guess the row delimiter if it was not supplied. This will be fooled if a
        // different line delimiter possibility appears in the first row.
        if (rowDelimiter === undefined) {
            let i = data.slice(0, 5000).indexOf('\r');
            if (i === -1) {
                rowDelimiter = '\n';
            }
            else if (data[i + 1] === '\n') {
                rowDelimiter = '\r\n';
            }
            else {
                rowDelimiter = '\r';
            }
        }
        this._rowDelimiter = rowDelimiter;
        if (quoteParser === undefined) {
            // Check for the existence of quotes if the quoteParser is not set.
            quoteParser = data.indexOf(quote) >= 0;
        }
        this._parser = quoteParser ? 'quotes' : 'noquotes';
        // Parse the data.
        this._parseAsync();
        // Cache the header row.
        if (header === true && this._columnCount > 0) {
            let h = [];
            for (let c = 0; c < this._columnCount; c++) {
                h.push(this._getField(0, c));
            }
            this._header = h;
        }
    }
    /**
     * Whether this model has been disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * A promise that resolves when the model has parsed all of its data.
     */
    get ready() {
        return this._ready.promise;
    }
    /**
     * Get the row count for a region in the data model.
     *
     * @param region - The row region of interest.
     *
     * @returns - The row count for the region.
     */
    rowCount(region) {
        if (region === 'body') {
            if (this._header.length === 0) {
                return this._rowCount;
            }
            else {
                return this._rowCount - 1;
            }
        }
        return 1;
    }
    /**
     * Get the column count for a region in the data model.
     *
     * @param region - The column region of interest.
     *
     * @returns - The column count for the region.
     */
    columnCount(region) {
        if (region === 'body') {
            return this._columnCount;
        }
        return 1;
    }
    /**
     * Get the data value for a cell in the data model.
     *
     * @param region - The cell region of interest.
     *
     * @param row - The row index of the cell of interest.
     *
     * @param column - The column index of the cell of interest.
     *
     * @param returns - The data value for the specified cell.
     */
    data(region, row, column) {
        let value;
        // Look up the field and value for the region.
        switch (region) {
            case 'body':
                if (this._header.length === 0) {
                    value = this._getField(row, column);
                }
                else {
                    value = this._getField(row + 1, column);
                }
                break;
            case 'column-header':
                if (this._header.length === 0) {
                    value = (column + 1).toString();
                }
                else {
                    value = this._header[column];
                }
                break;
            case 'row-header':
                value = (row + 1).toString();
                break;
            case 'corner-header':
                value = '';
                break;
            default:
                throw 'unreachable';
        }
        // Return the final value.
        return value;
    }
    /**
     * Dispose the resources held by this model.
     */
    dispose() {
        if (this._isDisposed) {
            return;
        }
        this._columnCount = undefined;
        this._rowCount = undefined;
        this._rowOffsets = null;
        this._columnOffsets = null;
        this._data = null;
        // Clear out state associated with the asynchronous parsing.
        if (this._doneParsing === false) {
            // Explicitly catch this rejection at least once so an error is not thrown
            // to the console.
            this.ready.catch(() => {
                return;
            });
            this._ready.reject(undefined);
        }
        if (this._delayedParse !== null) {
            window.clearTimeout(this._delayedParse);
        }
    }
    /**
     * Compute the row offsets and initialize the column offset cache.
     *
     * @param endRow - The last row to parse, from the start of the data (first
     * row is row 1).
     *
     * #### Notes
     * This method supports parsing the data incrementally by calling it with
     * incrementally higher endRow. Rows that have already been parsed will not be
     * parsed again.
     */
    _computeRowOffsets(endRow = 4294967295) {
        // If we've already parsed up to endRow, or if we've already parsed the
        // entire data set, return early.
        if (this._rowCount >= endRow || this._doneParsing === true) {
            return;
        }
        // Compute the column count if we don't already have it.
        if (this._columnCount === undefined) {
            // Get number of columns in first row
            this._columnCount = PARSERS[this._parser]({
                data: this._data,
                delimiter: this._delimiter,
                rowDelimiter: this._rowDelimiter,
                quote: this._quote,
                columnOffsets: true,
                maxRows: 1
            }).ncols;
        }
        // Parse the data up to and including the requested row, starting from the
        // last row offset we have.
        let { nrows, offsets } = PARSERS[this._parser]({
            data: this._data,
            startIndex: this._rowOffsets[this._rowCount - 1],
            delimiter: this._delimiter,
            rowDelimiter: this._rowDelimiter,
            quote: this._quote,
            columnOffsets: false,
            maxRows: endRow - this._rowCount + 1
        });
        // Return if we didn't actually get any new rows beyond the one we've
        // already parsed.
        if (this._startedParsing && nrows <= 1) {
            this._doneParsing = true;
            this._ready.resolve(undefined);
            return;
        }
        this._startedParsing = true;
        // Update the row count.
        let oldRowCount = this._rowCount;
        this._rowCount = oldRowCount + nrows - 1;
        // If we didn't reach the requested row, we must be done.
        if (this._rowCount < endRow) {
            this._doneParsing = true;
            this._ready.resolve(undefined);
        }
        // Copy the new offsets into a new row offset array.
        let oldRowOffsets = this._rowOffsets;
        this._rowOffsets = new Uint32Array(this._rowCount);
        this._rowOffsets.set(oldRowOffsets);
        this._rowOffsets.set(offsets, oldRowCount - 1);
        // Expand the column offsets array if needed
        // If the full column offsets array is small enough, build a cache big
        // enough for all column offsets. We allocate up to 128 megabytes:
        // 128*(2**20 bytes/M)/(4 bytes/entry) = 33554432 entries.
        let maxColumnOffsetsRows = Math.floor(33554432 / this._columnCount);
        // We need to expand the column offset array if we were storing all column
        // offsets before. Check to see if the previous size was small enough that
        // we stored all column offsets.
        if (oldRowCount <= maxColumnOffsetsRows) {
            // Check to see if the new column offsets array is small enough to still
            // store, or if we should cut over to a small cache.
            if (this._rowCount <= maxColumnOffsetsRows) {
                // Expand the existing column offset array for new column offsets.
                let oldColumnOffsets = this._columnOffsets;
                this._columnOffsets = new Uint32Array(this._rowCount * this._columnCount);
                this._columnOffsets.set(oldColumnOffsets);
                this._columnOffsets.fill(0xffffffff, oldColumnOffsets.length);
            }
            else {
                // If not, then our cache size is at most the maximum number of rows we
                // fill in the cache at a time.
                let oldColumnOffsets = this._columnOffsets;
                this._columnOffsets = new Uint32Array(Math.min(this._maxCacheGet, maxColumnOffsetsRows) * this._columnCount);
                // Fill in the entries we already have.
                this._columnOffsets.set(oldColumnOffsets.subarray(0, this._columnOffsets.length));
                // Invalidate the rest of the entries.
                this._columnOffsets.fill(0xffffffff, oldColumnOffsets.length);
                this._columnOffsetsStartingRow = 0;
            }
        }
        // We have more rows than before, so emit the rows-inserted change signal.
        let firstIndex = oldRowCount;
        if (this._header.length > 0) {
            firstIndex -= 1;
        }
        this.emitChanged({
            type: 'rows-inserted',
            region: 'body',
            index: firstIndex,
            span: this._rowCount - oldRowCount
        });
    }
    /**
     * Get the parsed string field for a row and column.
     *
     * @param row - The row number of the data item.
     * @param column - The column number of the data item.
     * @returns The parsed string for the data item.
     */
    _getField(row, column) {
        // Declare local variables.
        let value;
        let nextIndex;
        // Find the index for the first character in the field.
        let index = this._getOffsetIndex(row, column);
        // Initialize the trim adjustments.
        let trimRight = 0;
        let trimLeft = 0;
        // Find the end of the slice (the start of the next field), and how much we
        // should adjust to trim off a trailing field or row delimiter. First check
        // if we are getting the last column.
        if (column === this._columnCount - 1) {
            // Check if we are getting any row but the last.
            if (row < this._rowCount - 1) {
                // Set the next offset to the next row, column 0.
                nextIndex = this._getOffsetIndex(row + 1, 0);
                // Since we are not at the last row, we need to trim off the row
                // delimiter.
                trimRight += this._rowDelimiter.length;
            }
            else {
                // We are getting the last data item, so the slice end is the end of the
                // data string.
                nextIndex = this._data.length;
                // The string may or may not end in a row delimiter (RFC 4180 2.2), so
                // we explicitly check if we should trim off a row delimiter.
                if (this._data[nextIndex - 1] ===
                    this._rowDelimiter[this._rowDelimiter.length - 1]) {
                    trimRight += this._rowDelimiter.length;
                }
            }
        }
        else {
            // The next field starts at the next column offset.
            nextIndex = this._getOffsetIndex(row, column + 1);
            // Trim off the delimiter if it exists at the end of the field
            if (index < nextIndex && this._data[nextIndex - 1] === this._delimiter) {
                trimRight += 1;
            }
        }
        // Check to see if the field begins with a quote. If it does, trim a quote on either side.
        if (this._data[index] === this._quote) {
            trimLeft += 1;
            trimRight += 1;
        }
        // Slice the actual value out of the data string.
        value = this._data.slice(index + trimLeft, nextIndex - trimRight);
        // If we have a quoted field and we have an escaped quote inside it, unescape it.
        if (trimLeft === 1 && value.indexOf(this._quote) !== -1) {
            value = value.replace(this._quoteEscaped, this._quote);
        }
        // Return the value.
        return value;
    }
    /**
     * Get the index in the data string for the first character of a row and
     * column.
     *
     * @param row - The row of the data item.
     * @param column - The column of the data item.
     * @returns - The index into the data string where the data item starts.
     */
    _getOffsetIndex(row, column) {
        // Declare local variables.
        const ncols = this._columnCount;
        // Check to see if row *should* be in the cache, based on the cache size.
        let rowIndex = (row - this._columnOffsetsStartingRow) * ncols;
        if (rowIndex < 0 || rowIndex > this._columnOffsets.length) {
            // Row isn't in the cache, so we invalidate the entire cache and set up
            // the cache to hold the requested row.
            this._columnOffsets.fill(0xffffffff);
            this._columnOffsetsStartingRow = row;
            rowIndex = 0;
        }
        // Check to see if we need to fetch the row data into the cache.
        if (this._columnOffsets[rowIndex] === 0xffffffff) {
            // Figure out how many rows below us also need to be fetched.
            let maxRows = 1;
            while (maxRows <= this._maxCacheGet &&
                this._columnOffsets[rowIndex + maxRows * ncols] === 0xffffff) {
                maxRows++;
            }
            // Parse the data to get the column offsets.
            let { offsets } = PARSERS[this._parser]({
                data: this._data,
                delimiter: this._delimiter,
                rowDelimiter: this._rowDelimiter,
                quote: this._quote,
                columnOffsets: true,
                maxRows: maxRows,
                ncols: ncols,
                startIndex: this._rowOffsets[row]
            });
            // Copy results to the cache.
            for (let i = 0; i < offsets.length; i++) {
                this._columnOffsets[rowIndex + i] = offsets[i];
            }
        }
        // Return the offset index from cache.
        return this._columnOffsets[rowIndex + column];
    }
    /**
     * Parse the data string asynchronously.
     *
     * #### Notes
     * It can take several seconds to parse a several hundred megabyte string, so
     * we parse the first 500 rows to get something up on the screen, then we
     * parse the full data string asynchronously.
     */
    _parseAsync() {
        // Number of rows to get initially.
        let currentRows = this._initialRows;
        // Number of rows to get in each chunk thereafter. We set this high to just
        // get the rest of the rows for now.
        let chunkRows = Math.pow(2, 32) - 1;
        // We give the UI a chance to draw by delaying the chunk parsing.
        let delay = 30; // milliseconds
        // Define a function to parse a chunk up to and including endRow.
        let parseChunk = (endRow) => {
            try {
                this._computeRowOffsets(endRow);
            }
            catch (e) {
                // Sometimes the data string cannot be parsed with the full parser (for
                // example, we may have the wrong delimiter). In these cases, fall back to
                // the simpler parser so we can show something.
                if (this._parser === 'quotes') {
                    console.warn(e);
                    this._parser = 'noquotes';
                    this._resetParser();
                    this._computeRowOffsets(endRow);
                }
                else {
                    throw e;
                }
            }
            return this._doneParsing;
        };
        // Reset the parser to its initial state.
        this._resetParser();
        // Parse the first rows to give us the start of the data right away.
        let done = parseChunk(currentRows);
        // If we are done, return early.
        if (done) {
            return;
        }
        // Define a function to recursively parse the next chunk after a delay.
        let delayedParse = () => {
            // Parse up to the new end row.
            let done = parseChunk(currentRows + chunkRows);
            currentRows += chunkRows;
            // Gradually double the chunk size until we reach a million rows, if we
            // start below a million-row chunk size.
            if (chunkRows < 1000000) {
                chunkRows *= 2;
            }
            // If we aren't done, the schedule another parse.
            if (done) {
                this._delayedParse = null;
            }
            else {
                this._delayedParse = window.setTimeout(delayedParse, delay);
            }
        };
        // Parse full data string in chunks, delayed by a few milliseconds to give the UI a chance to draw.
        this._delayedParse = window.setTimeout(delayedParse, delay);
    }
    /**
     * Reset the parser state.
     */
    _resetParser() {
        this._columnCount = undefined;
        // First row offset is *always* 0, so we always have the first row offset.
        this._rowOffsets = new Uint32Array(1);
        this._rowCount = 1;
        this._startedParsing = false;
        this._columnOffsets = new Uint32Array(0);
        // Clear out state associated with the asynchronous parsing.
        if (this._doneParsing === false) {
            // Explicitly catch this rejection at least once so an error is not thrown
            // to the console.
            this.ready.catch(() => {
                return;
            });
            this._ready.reject(undefined);
        }
        this._doneParsing = false;
        this._ready = new coreutils_1.PromiseDelegate();
        if (this._delayedParse !== null) {
            window.clearTimeout(this._delayedParse);
            this._delayedParse = null;
        }
        this.emitChanged({ type: 'model-reset' });
    }
}
exports.DSVModel = DSVModel;
