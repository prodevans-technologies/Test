import { IDisposable } from '@phosphor/disposable';
import { ISignal } from '@phosphor/signaling';
/**
 * A readonly poll that calls an asynchronous function with each tick.
 *
 * @typeparam T - The resolved type of the factory's promises.
 * Defaults to `any`.
 *
 * @typeparam U - The rejected type of the factory's promises.
 * Defaults to `any`.
 */
export interface IPoll<T = any, U = any> {
    /**
     * A signal emitted when the poll is disposed.
     */
    readonly disposed: ISignal<this, void>;
    /**
     * The polling frequency data.
     */
    readonly frequency: IPoll.Frequency;
    /**
     * Whether the poll is disposed.
     */
    readonly isDisposed: boolean;
    /**
     * The name of the poll.
     */
    readonly name: string;
    /**
     * The poll state, which is the content of the currently-scheduled poll tick.
     */
    readonly state: IPoll.State<T, U>;
    /**
     * A promise that resolves when the currently-scheduled tick completes.
     *
     * #### Notes
     * Usually this will resolve after `state.interval` milliseconds from
     * `state.timestamp`. It can resolve earlier if the user starts or refreshes the
     * poll, etc.
     */
    readonly tick: Promise<IPoll<T, U>>;
    /**
     * A signal emitted when the poll state changes, i.e., a new tick is scheduled.
     */
    readonly ticked: ISignal<IPoll<T, U>, IPoll.State<T, U>>;
}
/**
 * A namespace for `IPoll` types.
 */
export declare namespace IPoll {
    /**
     * The polling frequency parameters.
     *
     * #### Notes
     * We implement the "decorrelated jitter" strategy from
     * https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/.
     * Essentially, if consecutive retries are needed, we choose an integer:
     * `sleep = min(max, rand(interval, backoff * sleep))`
     * This ensures that the poll is never less than `interval`, and nicely
     * spreads out retries for consecutive tries. Over time, if (interval < max),
     * the random number will be above `max` about (1 - 1/backoff) of the time
     * (sleeping the `max`), and the rest of the time the sleep will be a random
     * number below `max`, decorrelating our trigger time from other pollers.
     */
    type Frequency = {
        /**
         * Whether poll frequency backs off (boolean) or the backoff growth rate
         * (float > 1).
         *
         * #### Notes
         * If `true`, the default backoff growth rate is `3`.
         */
        readonly backoff: boolean | number;
        /**
         * The basic polling interval in milliseconds (integer).
         */
        readonly interval: number;
        /**
         * The maximum milliseconds (integer) between poll requests.
         */
        readonly max: number;
    };
    /**
     * The phase of the poll when the current tick was scheduled.
     */
    type Phase = 'constructed' | 'disposed' | 'reconnected' | 'refreshed' | 'rejected' | 'resolved' | 'standby' | 'started' | 'stopped' | 'when-rejected' | 'when-resolved';
    /**
     * Definition of poll state at any given time.
     *
     * @typeparam T - The resolved type of the factory's promises.
     * Defaults to `any`.
     *
     * @typeparam U - The rejected type of the factory's promises.
     * Defaults to `any`.
     */
    type State<T = any, U = any> = {
        /**
         * The number of milliseconds until the current tick resolves.
         */
        readonly interval: number;
        /**
         * The payload of the last poll resolution or rejection.
         *
         * #### Notes
         * The payload is `null` unless the `phase` is `'reconnected`, `'resolved'`,
         * or `'rejected'`. Its type is `T` for resolutions and `U` for rejections.
         */
        readonly payload: T | U | null;
        /**
         * The current poll phase.
         */
        readonly phase: Phase;
        /**
         * The timestamp for when this tick was scheduled.
         */
        readonly timestamp: number;
    };
}
/**
 * A class that wraps an asynchronous function to poll at a regular interval
 * with exponential increases to the interval length if the poll fails.
 *
 * @typeparam T - The resolved type of the factory's promises.
 * Defaults to `any`.
 *
 * @typeparam U - The rejected type of the factory's promises.
 * Defaults to `any`.
 */
export declare class Poll<T = any, U = any> implements IDisposable, IPoll<T, U> {
    /**
     * Instantiate a new poll with exponential backoff in case of failure.
     *
     * @param options - The poll instantiation options.
     */
    constructor(options: Poll.IOptions<T, U>);
    /**
     * The name of the poll.
     */
    readonly name: string;
    /**
     * A signal emitted when the poll is disposed.
     */
    readonly disposed: ISignal<this, void>;
    /**
     * The polling frequency parameters.
     */
    frequency: IPoll.Frequency;
    /**
     * Whether the poll is disposed.
     */
    readonly isDisposed: boolean;
    /**
     * Indicates when the poll switches to standby.
     */
    standby: Poll.Standby | (() => boolean | Poll.Standby);
    /**
     * The poll state, which is the content of the current poll tick.
     */
    readonly state: IPoll.State<T, U>;
    /**
     * A promise that resolves when the poll next ticks.
     */
    readonly tick: Promise<this>;
    /**
     * A signal emitted when the poll ticks and fires off a new request.
     */
    readonly ticked: ISignal<this, IPoll.State<T, U>>;
    /**
     * Dispose the poll.
     */
    dispose(): void;
    /**
     * Refreshes the poll. Schedules `refreshed` tick if necessary.
     *
     * @returns A promise that resolves after tick is scheduled and never rejects.
     */
    refresh(): Promise<void>;
    /**
     * Starts the poll. Schedules `started` tick if necessary.
     *
     * @returns A promise that resolves after tick is scheduled and never rejects.
     */
    start(): Promise<void>;
    /**
     * Stops the poll. Schedules `stopped` tick if necessary.
     *
     * @returns A promise that resolves after tick is scheduled and never rejects.
     */
    stop(): Promise<void>;
    /**
     * Schedule the next poll tick.
     *
     * @param next - The next poll state data to schedule. Defaults to standby.
     *
     * @param next.cancel - Cancels state transition if function returns `true`.
     *
     * @returns A promise that resolves when the next poll state is active.
     *
     * #### Notes
     * This method is protected to allow sub-classes to implement methods that can
     * schedule poll ticks.
     */
    protected schedule(next?: Partial<IPoll.State & {
        cancel: (last: IPoll.State) => boolean;
    }>): Promise<void>;
    /**
     * Execute a new poll factory promise or stand by if necessary.
     */
    private _execute;
    private _disposed;
    private _factory;
    private _frequency;
    private _standby;
    private _state;
    private _tick;
    private _ticked;
    private _timeout;
}
/**
 * A namespace for `Poll` types, interfaces, and statics.
 */
export declare namespace Poll {
    /**
     * A promise factory that returns an individual poll request.
     *
     * @typeparam T - The resolved type of the factory's promises.
     *
     * @typeparam U - The rejected type of the factory's promises.
     */
    type Factory<T, U> = (state: IPoll.State<T, U>) => Promise<T>;
    /**
     * Indicates when the poll switches to standby.
     */
    type Standby = 'never' | 'when-hidden';
    /**
     * Instantiation options for polls.
     *
     * @typeparam T - The resolved type of the factory's promises.
     * Defaults to `any`.
     *
     * @typeparam U - The rejected type of the factory's promises.
     * Defaults to `any`.
     */
    interface IOptions<T = any, U = any> {
        /**
         * A factory function that is passed a poll tick and returns a poll promise.
         */
        factory: Factory<T, U>;
        /**
         * The polling frequency parameters.
         */
        frequency?: Partial<IPoll.Frequency>;
        /**
         * The name of the poll.
         * Defaults to `'unknown'`.
         */
        name?: string;
        /**
         * Indicates when the poll switches to standby or a function that returns
         * a boolean or a `Poll.Standby` value to indicate whether to stand by.
         * Defaults to `'when-hidden'`.
         *
         * #### Notes
         * If a function is passed in, for any given context, it should be
         * idempotent and safe to call multiple times. It will be called before each
         * tick execution, but may be called by clients as well.
         */
        standby?: Standby | (() => boolean | Standby);
        /**
         * If set, a promise which must resolve (or reject) before polling begins.
         */
        when?: Promise<any>;
    }
    /**
     * Delays are 32-bit integers in many browsers so intervals need to be capped.
     *
     * #### Notes
     * https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout#Maximum_delay_value
     */
    const MAX_INTERVAL = 2147483647;
}
