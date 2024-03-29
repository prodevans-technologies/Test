import { ReadonlyJSONObject } from '@phosphor/coreutils';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
/**
 * The default mime model implementation.
 */
export declare class MimeModel implements IRenderMime.IMimeModel {
    /**
     * Construct a new mime model.
     */
    constructor(options?: MimeModel.IOptions);
    /**
     * Whether the model is trusted.
     */
    readonly trusted: boolean;
    /**
     * The data associated with the model.
     */
    readonly data: ReadonlyJSONObject;
    /**
     * The metadata associated with the model.
     */
    readonly metadata: ReadonlyJSONObject;
    /**
     * Set the data associated with the model.
     *
     * #### Notes
     * Depending on the implementation of the mime model,
     * this call may or may not have deferred effects,
     */
    setData(options: IRenderMime.IMimeModel.ISetDataOptions): void;
    private _callback;
    private _data;
    private _metadata;
}
/**
 * The namespace for MimeModel class statics.
 */
export declare namespace MimeModel {
    /**
     * The options used to create a mime model.
     */
    interface IOptions {
        /**
         * Whether the model is trusted.  Defaults to `false`.
         */
        trusted?: boolean;
        /**
         * A callback function for when the data changes.
         */
        callback?: (options: IRenderMime.IMimeModel.ISetDataOptions) => void;
        /**
         * The initial mime data.
         */
        data?: ReadonlyJSONObject;
        /**
         * The initial mime metadata.
         */
        metadata?: ReadonlyJSONObject;
    }
}
