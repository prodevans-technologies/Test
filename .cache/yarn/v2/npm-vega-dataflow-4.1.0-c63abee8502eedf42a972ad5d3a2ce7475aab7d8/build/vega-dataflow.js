(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vega-loader'), require('vega-util')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vega-loader', 'vega-util'], factory) :
  (factory((global.vega = {}),global.vega,global.vega));
}(this, (function (exports,vegaLoader,vegaUtil) { 'use strict';

  function UniqueList(idFunc) {
    var $ = idFunc || vegaUtil.identity,
        list = [],
        ids = {};

    list.add = function(_) {
      var id = $(_);
      if (!ids[id]) {
        ids[id] = 1;
        list.push(_);
      }
      return list;
    };

    list.remove = function(_) {
      var id = $(_), idx;
      if (ids[id]) {
        ids[id] = 0;
        if ((idx = list.indexOf(_)) >= 0) {
          list.splice(idx, 1);
        }
      }
      return list;
    };

    return list;
  }

  var TUPLE_ID_KEY = Symbol('vega_id'),
      TUPLE_ID = 1;

  /**
   * Checks if an input value is a registered tuple.
   * @param {*} t - The value to check.
   * @return {boolean} True if the input is a tuple, false otherwise.
   */
  function isTuple(t) {
    return !!(t && tupleid(t));
  }

  /**
   * Returns the id of a tuple.
   * @param {object} t - The input tuple.
   * @return {*} the tuple id.
   */
  function tupleid(t) {
    return t[TUPLE_ID_KEY];
  }

  /**
   * Sets the id of a tuple.
   * @param {object} t - The input tuple.
   * @param {*} id - The id value to set.
   * @return {object} the input tuple.
   */
  function setid(t, id) {
    t[TUPLE_ID_KEY] = id;
    return t;
  }

  /**
   * Ingest an object or value as a data tuple.
   * If the input value is an object, an id field will be added to it. For
   * efficiency, the input object is modified directly. A copy is not made.
   * If the input value is a literal, it will be wrapped in a new object
   * instance, with the value accessible as the 'data' property.
   * @param datum - The value to ingest.
   * @return {object} The ingested data tuple.
   */
  function ingest(datum) {
    var t = (datum === Object(datum)) ? datum : {data: datum};
    return tupleid(t) ? t : setid(t, TUPLE_ID++);
  }

  /**
   * Given a source tuple, return a derived copy.
   * @param {object} t - The source tuple.
   * @return {object} The derived tuple.
   */
  function derive(t) {
    return rederive(t, ingest({}));
  }

  /**
   * Rederive a derived tuple by copying values from the source tuple.
   * @param {object} t - The source tuple.
   * @param {object} d - The derived tuple.
   * @return {object} The derived tuple.
   */
  function rederive(t, d) {
    for (var k in t) d[k] = t[k];
    return d;
  }

  /**
   * Replace an existing tuple with a new tuple.
   * @param {object} t - The existing data tuple.
   * @param {object} d - The new tuple that replaces the old.
   * @return {object} The new tuple.
   */
  function replace(t, d) {
    return setid(d, tupleid(t));
  }

  function isChangeSet(v) {
    return v && v.constructor === changeset;
  }

  function changeset() {
    var add = [],  // insert tuples
        rem = [],  // remove tuples
        mod = [],  // modify tuples
        remp = [], // remove by predicate
        modp = [], // modify by predicate
        reflow = false;

    return {
      constructor: changeset,
      insert: function(t) {
        var d = vegaUtil.array(t), i = 0, n = d.length;
        for (; i<n; ++i) add.push(d[i]);
        return this;
      },
      remove: function(t) {
        var a = vegaUtil.isFunction(t) ? remp : rem,
            d = vegaUtil.array(t), i = 0, n = d.length;
        for (; i<n; ++i) a.push(d[i]);
        return this;
      },
      modify: function(t, field, value) {
        var m = {field: field, value: vegaUtil.constant(value)};
        if (vegaUtil.isFunction(t)) {
          m.filter = t;
          modp.push(m);
        } else {
          m.tuple = t;
          mod.push(m);
        }
        return this;
      },
      encode: function(t, set) {
        if (vegaUtil.isFunction(t)) modp.push({filter: t, field: set});
        else mod.push({tuple: t, field: set});
        return this;
      },
      reflow: function() {
        reflow = true;
        return this;
      },
      pulse: function(pulse, tuples) {
        var cur = {}, out = {}, i, n, m, f, t, id;

        // build lookup table of current tuples
        for (i=0, n=tuples.length; i<n; ++i) {
          cur[tupleid(tuples[i])] = 1;
        }

        // process individual tuples to remove
        for (i=0, n=rem.length; i<n; ++i) {
          t = rem[i];
          cur[tupleid(t)] = -1;
        }

        // process predicate-based removals
        for (i=0, n=remp.length; i<n; ++i) {
          f = remp[i];
          tuples.forEach(function(t) {
            if (f(t)) cur[tupleid(t)] = -1;
          });
        }

        // process all add tuples
        for (i=0, n=add.length; i<n; ++i) {
          t = add[i];
          id = tupleid(t);
          if (cur[id]) {
            // tuple already resides in dataset
            // if flagged for both add and remove, cancel
            cur[id] = 1;
          } else {
            // tuple does not reside in dataset, add
            pulse.add.push(ingest(add[i]));
          }
        }

        // populate pulse rem list
        for (i=0, n=tuples.length; i<n; ++i) {
          t = tuples[i];
          if (cur[tupleid(t)] < 0) pulse.rem.push(t);
        }

        // modify helper method
        function modify(t, f, v) {
          if (v) {
            t[f] = v(t);
          } else {
            pulse.encode = f;
          }
          if (!reflow) out[tupleid(t)] = t;
        }

        // process individual tuples to modify
        for (i=0, n=mod.length; i<n; ++i) {
          m = mod[i];
          t = m.tuple;
          f = m.field;
          id = cur[tupleid(t)];
          if (id > 0) {
            modify(t, f, m.value);
            pulse.modifies(f);
          }
        }

        // process predicate-based modifications
        for (i=0, n=modp.length; i<n; ++i) {
          m = modp[i];
          f = m.filter;
          tuples.forEach(function(t) {
            if (f(t) && cur[tupleid(t)] > 0) {
              modify(t, m.field, m.value);
            }
          });
          pulse.modifies(m.field);
        }

        // upon reflow request, populate mod with all non-removed tuples
        // otherwise, populate mod with modified tuples only
        if (reflow) {
          pulse.mod = rem.length || remp.length
            ? tuples.filter(function(t) { return cur[tupleid(t)] > 0; })
            : tuples.slice();
        } else {
          for (id in out) pulse.mod.push(out[id]);
        }

        return pulse;
      }
    };
  }

  var CACHE = '_:mod:_';

  /**
   * Hash that tracks modifications to assigned values.
   * Callers *must* use the set method to update values.
   */
  function Parameters() {
    Object.defineProperty(this, CACHE, {writable: true, value: {}});
  }

  var prototype = Parameters.prototype;

  /**
   * Set a parameter value. If the parameter value changes, the parameter
   * will be recorded as modified.
   * @param {string} name - The parameter name.
   * @param {number} index - The index into an array-value parameter. Ignored if
   *   the argument is undefined, null or less than zero.
   * @param {*} value - The parameter value to set.
   * @param {boolean} [force=false] - If true, records the parameter as modified
   *   even if the value is unchanged.
   * @return {Parameters} - This parameter object.
   */
  prototype.set = function(name, index, value, force) {
    var o = this,
        v = o[name],
        mod = o[CACHE];

    if (index != null && index >= 0) {
      if (v[index] !== value || force) {
        v[index] = value;
        mod[index + ':' + name] = -1;
        mod[name] = -1;
      }
    } else if (v !== value || force) {
      o[name] = value;
      mod[name] = vegaUtil.isArray(value) ? 1 + value.length : -1;
    }

    return o;
  };

  /**
   * Tests if one or more parameters has been modified. If invoked with no
   * arguments, returns true if any parameter value has changed. If the first
   * argument is array, returns trues if any parameter name in the array has
   * changed. Otherwise, tests if the given name and optional array index has
   * changed.
   * @param {string} name - The parameter name to test.
   * @param {number} [index=undefined] - The parameter array index to test.
   * @return {boolean} - Returns true if a queried parameter was modified.
   */
  prototype.modified = function(name, index) {
    var mod = this[CACHE], k;
    if (!arguments.length) {
      for (k in mod) { if (mod[k]) return true; }
      return false;
    } else if (vegaUtil.isArray(name)) {
      for (k=0; k<name.length; ++k) {
        if (mod[name[k]]) return true;
      }
      return false;
    }
    return (index != null && index >= 0)
      ? (index + 1 < mod[name] || !!mod[index + ':' + name])
      : !!mod[name];
  };

  /**
   * Clears the modification records. After calling this method,
   * all parameters are considered unmodified.
   */
  prototype.clear = function() {
    this[CACHE] = {};
    return this;
  };

  var OP_ID = 0;
  var PULSE = 'pulse';
  var NO_PARAMS = new Parameters();

  // Boolean Flags
  var SKIP     = 1,
      MODIFIED = 2;

  /**
   * An Operator is a processing node in a dataflow graph.
   * Each operator stores a value and an optional value update function.
   * Operators can accept a hash of named parameters. Parameter values can
   * either be direct (JavaScript literals, arrays, objects) or indirect
   * (other operators whose values will be pulled dynamically). Operators
   * included as parameters will have this operator added as a dependency.
   * @constructor
   * @param {*} [init] - The initial value for this operator.
   * @param {function(object, Pulse)} [update] - An update function. Upon
   *   evaluation of this operator, the update function will be invoked and the
   *   return value will be used as the new value of this operator.
   * @param {object} [params] - The parameters for this operator.
   * @param {boolean} [react=true] - Flag indicating if this operator should
   *   listen for changes to upstream operators included as parameters.
   * @see parameters
   */
  function Operator(init, update, params, react) {
    this.id = ++OP_ID;
    this.value = init;
    this.stamp = -1;
    this.rank = -1;
    this.qrank = -1;
    this.flags = 0;

    if (update) {
      this._update = update;
    }
    if (params) this.parameters(params, react);
  }

  var prototype$1 = Operator.prototype;

  /**
   * Returns a list of target operators dependent on this operator.
   * If this list does not exist, it is created and then returned.
   * @return {UniqueList}
   */
  prototype$1.targets = function() {
    return this._targets || (this._targets = UniqueList(vegaUtil.id));
  };

  /**
   * Sets the value of this operator.
   * @param {*} value - the value to set.
   * @return {Number} Returns 1 if the operator value has changed
   *   according to strict equality, returns 0 otherwise.
   */
  prototype$1.set = function(value) {
    if (this.value !== value) {
      this.value = value;
      return 1;
    } else {
      return 0;
    }
  };

  function flag(bit) {
    return function(state) {
      var f = this.flags;
      if (arguments.length === 0) return !!(f & bit);
      this.flags = state ? (f | bit) : (f & ~bit);
      return this;
    };
  }

  /**
   * Indicates that operator evaluation should be skipped on the next pulse.
   * This operator will still propagate incoming pulses, but its update function
   * will not be invoked. The skip flag is reset after every pulse, so calling
   * this method will affect processing of the next pulse only.
   */
  prototype$1.skip = flag(SKIP);

  /**
   * Indicates that this operator's value has been modified on its most recent
   * pulse. Normally modification is checked via strict equality; however, in
   * some cases it is more efficient to update the internal state of an object.
   * In those cases, the modified flag can be used to trigger propagation. Once
   * set, the modification flag persists across pulses until unset. The flag can
   * be used with the last timestamp to test if a modification is recent.
   */
  prototype$1.modified = flag(MODIFIED);

  /**
   * Sets the parameters for this operator. The parameter values are analyzed for
   * operator instances. If found, this operator will be added as a dependency
   * of the parameterizing operator. Operator values are dynamically marshalled
   * from each operator parameter prior to evaluation. If a parameter value is
   * an array, the array will also be searched for Operator instances. However,
   * the search does not recurse into sub-arrays or object properties.
   * @param {object} params - A hash of operator parameters.
   * @param {boolean} [react=true] - A flag indicating if this operator should
   *   automatically update (react) when parameter values change. In other words,
   *   this flag determines if the operator registers itself as a listener on
   *   any upstream operators included in the parameters.
   * @param {boolean} [initonly=false] - A flag indicating if this operator
   *   should calculate an update only upon its initiatal evaluation, then
   *   deregister dependencies and suppress all future update invocations.
   * @return {Operator[]} - An array of upstream dependencies.
   */
  prototype$1.parameters = function(params, react, initonly) {
    react = react !== false;
    var self = this,
        argval = (self._argval = self._argval || new Parameters()),
        argops = (self._argops = self._argops || []),
        deps = [],
        name, value, n, i;

    function add(name, index, value) {
      if (value instanceof Operator) {
        if (value !== self) {
          if (react) value.targets().add(self);
          deps.push(value);
        }
        argops.push({op:value, name:name, index:index});
      } else {
        argval.set(name, index, value);
      }
    }

    for (name in params) {
      value = params[name];

      if (name === PULSE) {
        vegaUtil.array(value).forEach(function(op) {
          if (!(op instanceof Operator)) {
            vegaUtil.error('Pulse parameters must be operator instances.');
          } else if (op !== self) {
            op.targets().add(self);
            deps.push(op);
          }
        });
        self.source = value;
      } else if (vegaUtil.isArray(value)) {
        argval.set(name, -1, Array(n = value.length));
        for (i=0; i<n; ++i) add(name, i, value[i]);
      } else {
        add(name, -1, value);
      }
    }

    this.marshall().clear(); // initialize values
    if (initonly) argops.initonly = true;

    return deps;
  };

  /**
   * Internal method for marshalling parameter values.
   * Visits each operator dependency to pull the latest value.
   * @return {Parameters} A Parameters object to pass to the update function.
   */
  prototype$1.marshall = function(stamp) {
    var argval = this._argval || NO_PARAMS,
        argops = this._argops, item, i, n, op, mod;

    if (argops) {
      for (i=0, n=argops.length; i<n; ++i) {
        item = argops[i];
        op = item.op;
        mod = op.modified() && op.stamp === stamp;
        argval.set(item.name, item.index, op.value, mod);
      }

      if (argops.initonly) {
        for (i=0; i<n; ++i) {
          item = argops[i];
          item.op.targets().remove(this);
        }
        this._argops = null;
        this._update = null;
      }
    }
    return argval;
  };

  /**
   * Delegate method to perform operator processing.
   * Subclasses can override this method to perform custom processing.
   * By default, it marshalls parameters and calls the update function
   * if that function is defined. If the update function does not
   * change the operator value then StopPropagation is returned.
   * If no update function is defined, this method does nothing.
   * @param {Pulse} pulse - the current dataflow pulse.
   * @return The output pulse or StopPropagation. A falsy return value
   *   (including undefined) will let the input pulse pass through.
   */
  prototype$1.evaluate = function(pulse) {
    var update = this._update;
    if (update) {
      var params = this.marshall(pulse.stamp),
          v = update.call(this, params, pulse);

      params.clear();
      if (v !== this.value) {
        this.value = v;
      } else if (!this.modified()) {
        return pulse.StopPropagation;
      }
    }
  };

  /**
   * Run this operator for the current pulse. If this operator has already
   * been run at (or after) the pulse timestamp, returns StopPropagation.
   * Internally, this method calls {@link evaluate} to perform processing.
   * If {@link evaluate} returns a falsy value, the input pulse is returned.
   * This method should NOT be overridden, instead overrride {@link evaluate}.
   * @param {Pulse} pulse - the current dataflow pulse.
   * @return the output pulse for this operator (or StopPropagation)
   */
  prototype$1.run = function(pulse) {
    if (pulse.stamp <= this.stamp) return pulse.StopPropagation;
    var rv;
    if (this.skip()) {
      this.skip(false);
      rv = 0;
    } else {
      rv = this.evaluate(pulse);
    }
    this.stamp = pulse.stamp;
    return (this.pulse = rv || pulse);
  };

  /**
   * Add an operator to the dataflow graph. This function accepts a
   * variety of input argument types. The basic signature supports an
   * initial value, update function and parameters. If the first parameter
   * is an Operator instance, it will be added directly. If it is a
   * constructor for an Operator subclass, a new instance will be instantiated.
   * Otherwise, if the first parameter is a function instance, it will be used
   * as the update function and a null initial value is assumed.
   * @param {*} init - One of: the operator to add, the initial value of
   *   the operator, an operator class to instantiate, or an update function.
   * @param {function} [update] - The operator update function.
   * @param {object} [params] - The operator parameters.
   * @param {boolean} [react=true] - Flag indicating if this operator should
   *   listen for changes to upstream operators included as parameters.
   * @return {Operator} - The added operator.
   */
  function add(init, update, params, react) {
    var shift = 1,
      op;

    if (init instanceof Operator) {
      op = init;
    } else if (init && init.prototype instanceof Operator) {
      op = new init();
    } else if (vegaUtil.isFunction(init)) {
      op = new Operator(null, init);
    } else {
      shift = 0;
      op = new Operator(init, update);
    }

    this.rank(op);
    if (shift) {
      react = params;
      params = update;
    }
    if (params) this.connect(op, op.parameters(params, react));
    this.touch(op);

    return op;
  }

  /**
   * Connect a target operator as a dependent of source operators.
   * If necessary, this method will rerank the target operator and its
   * dependents to ensure propagation proceeds in a topologically sorted order.
   * @param {Operator} target - The target operator.
   * @param {Array<Operator>} - The source operators that should propagate
   *   to the target operator.
   */
  function connect(target, sources) {
    var targetRank = target.rank, i, n;

    for (i=0, n=sources.length; i<n; ++i) {
      if (targetRank < sources[i].rank) {
        this.rerank(target);
        return;
      }
    }
  }

  var STREAM_ID = 0;

  /**
   * Models an event stream.
   * @constructor
   * @param {function(Object, number): boolean} [filter] - Filter predicate.
   *   Events pass through when truthy, events are suppressed when falsy.
   * @param {function(Object): *} [apply] - Applied to input events to produce
   *   new event values.
   * @param {function(Object)} [receive] - Event callback function to invoke
   *   upon receipt of a new event. Use to override standard event processing.
   */
  function EventStream(filter, apply, receive) {
    this.id = ++STREAM_ID;
    this.value = null;
    if (receive) this.receive = receive;
    if (filter) this._filter = filter;
    if (apply) this._apply = apply;
  }

  /**
   * Creates a new event stream instance with the provided
   * (optional) filter, apply and receive functions.
   * @param {function(Object, number): boolean} [filter] - Filter predicate.
   *   Events pass through when truthy, events are suppressed when falsy.
   * @param {function(Object): *} [apply] - Applied to input events to produce
   *   new event values.
   * @see EventStream
   */
  function stream(filter, apply, receive) {
    return new EventStream(filter, apply, receive);
  }

  var prototype$2 = EventStream.prototype;

  prototype$2._filter = vegaUtil.truthy;

  prototype$2._apply = vegaUtil.identity;

  prototype$2.targets = function() {
    return this._targets || (this._targets = UniqueList(vegaUtil.id));
  };

  prototype$2.consume = function(_) {
    if (!arguments.length) return !!this._consume;
    this._consume = !!_;
    return this;
  };

  prototype$2.receive = function(evt) {
    if (this._filter(evt)) {
      var val = (this.value = this._apply(evt)),
          trg = this._targets,
          n = trg ? trg.length : 0,
          i = 0;

      for (; i<n; ++i) trg[i].receive(val);

      if (this._consume) {
        evt.preventDefault();
        evt.stopPropagation();
      }
    }
  };

  prototype$2.filter = function(filter) {
    var s = stream(filter);
    this.targets().add(s);
    return s;
  };

  prototype$2.apply = function(apply) {
    var s = stream(null, apply);
    this.targets().add(s);
    return s;
  };

  prototype$2.merge = function() {
    var s = stream();

    this.targets().add(s);
    for (var i=0, n=arguments.length; i<n; ++i) {
      arguments[i].targets().add(s);
    }

    return s;
  };

  prototype$2.throttle = function(pause) {
    var t = -1;
    return this.filter(function() {
      var now = Date.now();
      if ((now - t) > pause) {
        t = now;
        return 1;
      } else {
        return 0;
      }
    });
  };

  prototype$2.debounce = function(delay) {
    var s = stream();

    this.targets().add(stream(null, null,
      vegaUtil.debounce(delay, function(e) {
        var df = e.dataflow;
        s.receive(e);
        if (df && df.run) df.run();
      })
    ));

    return s;
  };

  prototype$2.between = function(a, b) {
    var active = false;
    a.targets().add(stream(null, null, function() { active = true; }));
    b.targets().add(stream(null, null, function() { active = false; }));
    return this.filter(function() { return active; });
  };

  /**
   * Create a new event stream from an event source.
   * @param {object} source - The event source to monitor. The input must
   *  support the addEventListener method.
   * @param {string} type - The event type.
   * @param {function(object): boolean} [filter] - Event filter function.
   * @param {function(object): *} [apply] - Event application function.
   *   If provided, this function will be invoked and the result will be
   *   used as the downstream event value.
   * @return {EventStream}
   */
  function events(source, type, filter, apply) {
    var df = this,
        s = stream(filter, apply),
        send = function(e) {
          e.dataflow = df;
          try {
            s.receive(e);
          } catch (error) {
            df.error(error);
          } finally {
            df.run();
          }
        },
        sources;

    if (typeof source === 'string' && typeof document !== 'undefined') {
      sources = document.querySelectorAll(source);
    } else {
      sources = vegaUtil.array(source);
    }

    for (var i=0, n=sources.length; i<n; ++i) {
      sources[i].addEventListener(type, send);
    }

    return s;
  }

  /**
   * Ingests new data into the dataflow. First parses the data using the
   * vega-loader read method, then pulses a changeset to the target operator.
   * @param {Operator} target - The Operator to target with ingested data,
   *   typically a Collect transform instance.
   * @param {*} data - The input data, prior to parsing. For JSON this may
   *   be a string or an object. For CSV, TSV, etc should be a string.
   * @param {object} format - The data format description for parsing
   *   loaded data. This object is passed to the vega-loader read method.
   * @returns {Dataflow}
   */
  function ingest$1(target, data, format) {
    return this.pulse(target, this.changeset().insert(vegaLoader.read(data, format)));
  }

  function loadPending(df) {
    var accept, reject,
        pending = new Promise(function(a, r) {
          accept = function() { a(df); };
          reject = r;
        });

    pending.requests = 0;

    pending.done = function() {
      if (--pending.requests === 0) {
        df.runAfter(function() {
          df._pending = null;
          try {
            df.run();
            if (df._pending) {
              df._pending.then(accept);
            } else {
              accept();
            }
          } catch (err) {
            reject(err);
          }
        });
      }
    };

    return (df._pending = pending);
  }

  /**
   * Request data from an external source, parse it, and pulse a changeset
   * to the specified target operator.
   * @param {Operator} target - The Operator to target with the loaded data,
   *   typically a Collect transform instance.
   * @param {string} url - The URL from which to load the data. This string
   *   is passed to the vega-loader load method.
   * @param {object} [format] - The data format description for parsing
   *   loaded data. This object is passed to the vega-loader read method.
   * @return {Promise} A Promise that resolves upon completion of the request.
   *   Resolves to a status code: 0 success, -1 load fail, -2 parse fail.
   */
  function request(target, url, format) {
    var df = this,
        status = 0,
        pending = df._pending || loadPending(df);

    pending.requests += 1;

    return df.loader()
      .load(url, {context:'dataflow'})
      .then(
        function(data) {
          return vegaLoader.read(data, format);
        },
        function(error) {
          status = -1;
          df.error('Loading failed', url, error);
        })
      .catch(
        function(error) {
          status = -2;
          df.error('Data ingestion failed', url, error);
        })
      .then(function(data) {
        df.pulse(target, df.changeset().remove(vegaUtil.truthy).insert(data || []));
        pending.done();
        return status;
      });
  }

  var SKIP$1 = {skip: true};

  /**
   * Perform operator updates in response to events. Applies an
   * update function to compute a new operator value. If the update function
   * returns a {@link ChangeSet}, the operator will be pulsed with those tuple
   * changes. Otherwise, the operator value will be updated to the return value.
   * @param {EventStream|Operator} source - The event source to react to.
   *   This argument can be either an EventStream or an Operator.
   * @param {Operator|function(object):Operator} target - The operator to update.
   *   This argument can either be an Operator instance or (if the source
   *   argument is an EventStream), a function that accepts an event object as
   *   input and returns an Operator to target.
   * @param {function(Parameters,Event): *} [update] - Optional update function
   *   to compute the new operator value, or a literal value to set. Update
   *   functions expect to receive a parameter object and event as arguments.
   *   This function can either return a new operator value or (if the source
   *   argument is an EventStream) a {@link ChangeSet} instance to pulse
   *   the target operator with tuple changes.
   * @param {object} [params] - The update function parameters.
   * @param {object} [options] - Additional options hash. If not overridden,
   *   updated operators will be skipped by default.
   * @param {boolean} [options.skip] - If true, the operator will
   *  be skipped: it will not be evaluated, but its dependents will be.
   * @param {boolean} [options.force] - If true, the operator will
   *   be re-evaluated even if its value has not changed.
   * @return {Dataflow}
   */
  function on(source, target, update, params, options) {
    var fn = source instanceof Operator ? onOperator : onStream;
    fn(this, source, target, update, params, options);
    return this;
  }

  function onStream(df, stream, target, update, params, options) {
    var opt = vegaUtil.extend({}, options, SKIP$1), func, op;

    if (!vegaUtil.isFunction(target)) target = vegaUtil.constant(target);

    if (update === undefined) {
      func = function(e) {
        df.touch(target(e));
      };
    } else if (vegaUtil.isFunction(update)) {
      op = new Operator(null, update, params, false);
      func = function(e) {
        var v, t = target(e);
        op.evaluate(e);
        isChangeSet(v = op.value) ? df.pulse(t, v, options) : df.update(t, v, opt);
      };
    } else {
      func = function(e) {
        df.update(target(e), update, opt);
      };
    }

    stream.apply(func);
  }

  function onOperator(df, source, target, update, params, options) {
    var func, op;

    if (update === undefined) {
      op = target;
    } else {
      func = vegaUtil.isFunction(update) ? update : vegaUtil.constant(update);
      update = !target ? func : function(_, pulse) {
        var value = func(_, pulse);
        if (!target.skip()) {
          target.skip(value !== this.value).value = value;
        }
        return value;
      };

      op = new Operator(null, update, params, false);
      op.modified(options && options.force);
      op.rank = 0;

      if (target) {
        op.skip(true); // skip first invocation
        op.value = target.value;
        op.targets().add(target);
      }
    }

    source.targets().add(op);
  }

  /**
   * Assigns a rank to an operator. Ranks are assigned in increasing order
   * by incrementing an internal rank counter.
   * @param {Operator} op - The operator to assign a rank.
   */
  function rank(op) {
    op.rank = ++this._rank;
  }

  /**
   * Re-ranks an operator and all downstream target dependencies. This
   * is necessary when upstream depencies of higher rank are added to
   * a target operator.
   * @param {Operator} op - The operator to re-rank.
   */
  function rerank(op) {
    var queue = [op],
        cur, list, i;

    while (queue.length) {
      this.rank(cur = queue.pop());
      if (list = cur._targets) {
        for (i=list.length; --i >= 0;) {
          queue.push(cur = list[i]);
          if (cur === op) vegaUtil.error('Cycle detected in dataflow graph.');
        }
      }
    }
  }

  /**
   * Sentinel value indicating pulse propagation should stop.
   */
  var StopPropagation = {};

  // Pulse visit type flags
  var ADD       = (1 << 0),
      REM       = (1 << 1),
      MOD       = (1 << 2),
      ADD_REM   = ADD | REM,
      ADD_MOD   = ADD | MOD,
      ALL       = ADD | REM | MOD,
      REFLOW    = (1 << 3),
      SOURCE    = (1 << 4),
      NO_SOURCE = (1 << 5),
      NO_FIELDS = (1 << 6);

  /**
   * A Pulse enables inter-operator communication during a run of the
   * dataflow graph. In addition to the current timestamp, a pulse may also
   * contain a change-set of added, removed or modified data tuples, as well as
   * a pointer to a full backing data source. Tuple change sets may not
   * be fully materialized; for example, to prevent needless array creation
   * a change set may include larger arrays and corresponding filter functions.
   * The pulse provides a {@link visit} method to enable proper and efficient
   * iteration over requested data tuples.
   *
   * In addition, each pulse can track modification flags for data tuple fields.
   * Responsible transform operators should call the {@link modifies} method to
   * indicate changes to data fields. The {@link modified} method enables
   * querying of this modification state.
   *
   * @constructor
   * @param {Dataflow} dataflow - The backing dataflow instance.
   * @param {number} stamp - The current propagation timestamp.
   * @param {string} [encode] - An optional encoding set name, which is then
   *   accessible as Pulse.encode. Operators can respond to (or ignore) this
   *   setting as appropriate. This parameter can be used in conjunction with
   *   the Encode transform in the vega-encode module.
   */
  function Pulse(dataflow, stamp, encode) {
    this.dataflow = dataflow;
    this.stamp = stamp == null ? -1 : stamp;
    this.add = [];
    this.rem = [];
    this.mod = [];
    this.fields = null;
    this.encode = encode || null;
  }

  var prototype$3 = Pulse.prototype;

  /**
   * Sentinel value indicating pulse propagation should stop.
   */
  prototype$3.StopPropagation = StopPropagation;

  /**
   * Boolean flag indicating ADD (added) tuples.
   */
  prototype$3.ADD = ADD;

  /**
   * Boolean flag indicating REM (removed) tuples.
   */
  prototype$3.REM = REM;

  /**
   * Boolean flag indicating MOD (modified) tuples.
   */
  prototype$3.MOD = MOD;

  /**
   * Boolean flag indicating ADD (added) and REM (removed) tuples.
   */
  prototype$3.ADD_REM = ADD_REM;

  /**
   * Boolean flag indicating ADD (added) and MOD (modified) tuples.
   */
  prototype$3.ADD_MOD = ADD_MOD;

  /**
   * Boolean flag indicating ADD, REM and MOD tuples.
   */
  prototype$3.ALL = ALL;

  /**
   * Boolean flag indicating all tuples in a data source
   * except for the ADD, REM and MOD tuples.
   */
  prototype$3.REFLOW = REFLOW;

  /**
   * Boolean flag indicating a 'pass-through' to a
   * backing data source, ignoring ADD, REM and MOD tuples.
   */
  prototype$3.SOURCE = SOURCE;

  /**
   * Boolean flag indicating that source data should be
   * suppressed when creating a forked pulse.
   */
  prototype$3.NO_SOURCE = NO_SOURCE;

  /**
   * Boolean flag indicating that field modifications should be
   * suppressed when creating a forked pulse.
   */
  prototype$3.NO_FIELDS = NO_FIELDS;

  /**
   * Creates a new pulse based on the values of this pulse.
   * The dataflow, time stamp and field modification values are copied over.
   * By default, new empty ADD, REM and MOD arrays are created.
   * @param {number} flags - Integer of boolean flags indicating which (if any)
   *   tuple arrays should be copied to the new pulse. The supported flag values
   *   are ADD, REM and MOD. Array references are copied directly: new array
   *   instances are not created.
   * @return {Pulse} - The forked pulse instance.
   * @see init
   */
  prototype$3.fork = function(flags) {
    return new Pulse(this.dataflow).init(this, flags);
  };

  /**
   * Creates a copy of this pulse with new materialized array
   * instances for the ADD, REM, MOD, and SOURCE arrays.
   * The dataflow, time stamp and field modification values are copied over.
   * @return {Pulse} - The cloned pulse instance.
   * @see init
   */
  prototype$3.clone = function() {
    var p = this.fork(ALL);
    p.add = p.add.slice();
    p.rem = p.rem.slice();
    p.mod = p.mod.slice();
    if (p.source) p.source = p.source.slice();
    return p.materialize(ALL | SOURCE);
  };

  /**
   * Returns a pulse that adds all tuples from a backing source. This is
   * useful for cases where operators are added to a dataflow after an
   * upstream data pipeline has already been processed, ensuring that
   * new operators can observe all tuples within a stream.
   * @return {Pulse} - A pulse instance with all source tuples included
   *   in the add array. If the current pulse already has all source
   *   tuples in its add array, it is returned directly. If the current
   *   pulse does not have a backing source, it is returned directly.
   */
  prototype$3.addAll = function() {
    var p = this;
    if (!this.source || this.source.length === this.add.length) {
      return p;
    } else {
      p = new Pulse(this.dataflow).init(this);
      p.add = p.source;
      return p;
    }
  };

  /**
   * Initialize this pulse based on the values of another pulse. This method
   * is used internally by {@link fork} to initialize a new forked tuple.
   * The dataflow, time stamp and field modification values are copied over.
   * By default, new empty ADD, REM and MOD arrays are created.
   * @param {Pulse} src - The source pulse to copy from.
   * @param {number} flags - Integer of boolean flags indicating which (if any)
   *   tuple arrays should be copied to the new pulse. The supported flag values
   *   are ADD, REM and MOD. Array references are copied directly: new array
   *   instances are not created. By default, source data arrays are copied
   *   to the new pulse. Use the NO_SOURCE flag to enforce a null source.
   * @return {Pulse} - Returns this Pulse instance.
   */
  prototype$3.init = function(src, flags) {
    var p = this;
    p.stamp = src.stamp;
    p.encode = src.encode;

    if (src.fields && !(flags & NO_FIELDS)) {
      p.fields = src.fields;
    }

    if (flags & ADD) {
      p.addF = src.addF;
      p.add = src.add;
    } else {
      p.addF = null;
      p.add = [];
    }

    if (flags & REM) {
      p.remF = src.remF;
      p.rem = src.rem;
    } else {
      p.remF = null;
      p.rem = [];
    }

    if (flags & MOD) {
      p.modF = src.modF;
      p.mod = src.mod;
    } else {
      p.modF = null;
      p.mod = [];
    }

    if (flags & NO_SOURCE) {
      p.srcF = null;
      p.source = null;
    } else {
      p.srcF = src.srcF;
      p.source = src.source;
    }

    return p;
  };

  /**
   * Schedules a function to run after pulse propagation completes.
   * @param {function} func - The function to run.
   */
  prototype$3.runAfter = function(func) {
    this.dataflow.runAfter(func);
  };

  /**
   * Indicates if tuples have been added, removed or modified.
   * @param {number} [flags] - The tuple types (ADD, REM or MOD) to query.
   *   Defaults to ALL, returning true if any tuple type has changed.
   * @return {boolean} - Returns true if one or more queried tuple types have
   *   changed, false otherwise.
   */
  prototype$3.changed = function(flags) {
    var f = flags || ALL;
    return ((f & ADD) && this.add.length)
        || ((f & REM) && this.rem.length)
        || ((f & MOD) && this.mod.length);
  };

  /**
   * Forces a "reflow" of tuple values, such that all tuples in the backing
   * source are added to the MOD set, unless already present in the ADD set.
   * @param {boolean} [fork=false] - If true, returns a forked copy of this
   *   pulse, and invokes reflow on that derived pulse.
   * @return {Pulse} - The reflowed pulse instance.
   */
  prototype$3.reflow = function(fork) {
    if (fork) return this.fork(ALL).reflow();

    var len = this.add.length,
        src = this.source && this.source.length;
    if (src && src !== len) {
      this.mod = this.source;
      if (len) this.filter(MOD, filter(this, ADD));
    }
    return this;
  };

  /**
   * Marks one or more data field names as modified to assist dependency
   * tracking and incremental processing by transform operators.
   * @param {string|Array<string>} _ - The field(s) to mark as modified.
   * @return {Pulse} - This pulse instance.
   */
  prototype$3.modifies = function(_) {
    var fields = vegaUtil.array(_),
        hash = this.fields || (this.fields = {});
    fields.forEach(function(f) { hash[f] = true; });
    return this;
  };

  /**
   * Checks if one or more data fields have been modified during this pulse
   * propagation timestamp.
   * @param {string|Array<string>} _ - The field(s) to check for modified.
   * @return {boolean} - Returns true if any of the provided fields has been
   *   marked as modified, false otherwise.
   */
  prototype$3.modified = function(_) {
    var fields = this.fields;
    return !(this.mod.length && fields) ? false
      : !arguments.length ? !!fields
      : vegaUtil.isArray(_) ? _.some(function(f) { return fields[f]; })
      : fields[_];
  };

  /**
   * Adds a filter function to one more tuple sets. Filters are applied to
   * backing tuple arrays, to determine the actual set of tuples considered
   * added, removed or modified. They can be used to delay materialization of
   * a tuple set in order to avoid expensive array copies. In addition, the
   * filter functions can serve as value transformers: unlike standard predicate
   * function (which return boolean values), Pulse filters should return the
   * actual tuple value to process. If a tuple set is already filtered, the
   * new filter function will be appended into a conjuntive ('and') query.
   * @param {number} flags - Flags indicating the tuple set(s) to filter.
   * @param {function(*):object} filter - Filter function that will be applied
   *   to the tuple set array, and should return a data tuple if the value
   *   should be included in the tuple set, and falsy (or null) otherwise.
   * @return {Pulse} - Returns this pulse instance.
   */
  prototype$3.filter = function(flags, filter) {
    var p = this;
    if (flags & ADD) p.addF = addFilter(p.addF, filter);
    if (flags & REM) p.remF = addFilter(p.remF, filter);
    if (flags & MOD) p.modF = addFilter(p.modF, filter);
    if (flags & SOURCE) p.srcF = addFilter(p.srcF, filter);
    return p;
  };

  function addFilter(a, b) {
    return a ? function(t,i) { return a(t,i) && b(t,i); } : b;
  }

  /**
   * Materialize one or more tuple sets in this pulse. If the tuple set(s) have
   * a registered filter function, it will be applied and the tuple set(s) will
   * be replaced with materialized tuple arrays.
   * @param {number} flags - Flags indicating the tuple set(s) to materialize.
   * @return {Pulse} - Returns this pulse instance.
   */
  prototype$3.materialize = function(flags) {
    flags = flags || ALL;
    var p = this;
    if ((flags & ADD) && p.addF) {
      p.add = materialize(p.add, p.addF);
      p.addF = null;
    }
    if ((flags & REM) && p.remF) {
      p.rem = materialize(p.rem, p.remF);
      p.remF = null;
    }
    if ((flags & MOD) && p.modF) {
      p.mod = materialize(p.mod, p.modF);
      p.modF = null;
    }
    if ((flags & SOURCE) && p.srcF) {
      p.source = p.source.filter(p.srcF);
      p.srcF = null;
    }
    return p;
  };

  function materialize(data, filter) {
    var out = [];
    vegaUtil.visitArray(data, filter, function(_) { out.push(_); });
    return out;
  }

  function filter(pulse, flags) {
    var map = {};
    pulse.visit(flags, function(t) { map[tupleid(t)] = 1; });
    return function(t) { return map[tupleid(t)] ? null : t; };
  }

  /**
   * Visit one or more tuple sets in this pulse.
   * @param {number} flags - Flags indicating the tuple set(s) to visit.
   *   Legal values are ADD, REM, MOD and SOURCE (if a backing data source
   *   has been set).
   * @param {function(object):*} - Visitor function invoked per-tuple.
   * @return {Pulse} - Returns this pulse instance.
   */
  prototype$3.visit = function(flags, visitor) {
    var p = this, v = visitor, src, sum;

    if (flags & SOURCE) {
      vegaUtil.visitArray(p.source, p.srcF, v);
      return p;
    }

    if (flags & ADD) vegaUtil.visitArray(p.add, p.addF, v);
    if (flags & REM) vegaUtil.visitArray(p.rem, p.remF, v);
    if (flags & MOD) vegaUtil.visitArray(p.mod, p.modF, v);

    if ((flags & REFLOW) && (src = p.source)) {
      sum = p.add.length + p.mod.length;
      if (sum === src.length) ; else if (sum) {
        vegaUtil.visitArray(src, filter(p, ADD_MOD), v);
      } else {
        // if no add/rem/mod tuples, visit source
        vegaUtil.visitArray(src, p.srcF, v);
      }
    }

    return p;
  };

  /**
   * Represents a set of multiple pulses. Used as input for operators
   * that accept multiple pulses at a time. Contained pulses are
   * accessible via the public "pulses" array property. This pulse doe
   * not carry added, removed or modified tuples directly. However,
   * the visit method can be used to traverse all such tuples contained
   * in sub-pulses with a timestamp matching this parent multi-pulse.
   * @constructor
   * @param {Dataflow} dataflow - The backing dataflow instance.
   * @param {number} stamp - The timestamp.
   * @param {Array<Pulse>} pulses - The sub-pulses for this multi-pulse.
   */
  function MultiPulse(dataflow, stamp, pulses, encode) {
    var p = this,
        c = 0,
        pulse, hash, i, n, f;

    this.dataflow = dataflow;
    this.stamp = stamp;
    this.fields = null;
    this.encode = encode || null;
    this.pulses = pulses;

    for (i=0, n=pulses.length; i<n; ++i) {
      pulse = pulses[i];
      if (pulse.stamp !== stamp) continue;

      if (pulse.fields) {
        hash = p.fields || (p.fields = {});
        for (f in pulse.fields) { hash[f] = 1; }
      }

      if (pulse.changed(p.ADD)) c |= p.ADD;
      if (pulse.changed(p.REM)) c |= p.REM;
      if (pulse.changed(p.MOD)) c |= p.MOD;
    }

    this.changes = c;
  }

  var prototype$4 = vegaUtil.inherits(MultiPulse, Pulse);

  /**
   * Creates a new pulse based on the values of this pulse.
   * The dataflow, time stamp and field modification values are copied over.
   * @return {Pulse}
   */
  prototype$4.fork = function(flags) {
    var p = new Pulse(this.dataflow).init(this, flags & this.NO_FIELDS);
    if (flags !== undefined) {
      if (flags & p.ADD) {
        this.visit(p.ADD, function(t) { return p.add.push(t); });
      }
      if (flags & p.REM) {
        this.visit(p.REM, function(t) { return p.rem.push(t); });
      }
      if (flags & p.MOD) {
        this.visit(p.MOD, function(t) { return p.mod.push(t); });
      }
    }
    return p;
  };

  prototype$4.changed = function(flags) {
    return this.changes & flags;
  };

  prototype$4.modified = function(_) {
    var p = this, fields = p.fields;
    return !(fields && (p.changes & p.MOD)) ? 0
      : vegaUtil.isArray(_) ? _.some(function(f) { return fields[f]; })
      : fields[_];
  };

  prototype$4.filter = function() {
    vegaUtil.error('MultiPulse does not support filtering.');
  };

  prototype$4.materialize = function() {
    vegaUtil.error('MultiPulse does not support materialization.');
  };

  prototype$4.visit = function(flags, visitor) {
    var p = this,
        pulses = p.pulses,
        n = pulses.length,
        i = 0;

    if (flags & p.SOURCE) {
      for (; i<n; ++i) {
        pulses[i].visit(flags, visitor);
      }
    } else {
      for (; i<n; ++i) {
        if (pulses[i].stamp === p.stamp) {
          pulses[i].visit(flags, visitor);
        }
      }
    }

    return p;
  };

  /**
   * Runs the dataflow. This method will increment the current timestamp
   * and process all updated, pulsed and touched operators. When run for
   * the first time, all registered operators will be processed. If there
   * are pending data loading operations, this method will return immediately
   * without evaluating the dataflow. Instead, the dataflow will be
   * asynchronously invoked when data loading completes. To track when dataflow
   * evaluation completes, use the {@link runAsync} method instead.
   * @param {string} [encode] - The name of an encoding set to invoke during
   *   propagation. This value is added to generated Pulse instances;
   *   operators can then respond to (or ignore) this setting as appropriate.
   *   This parameter can be used in conjunction with the Encode transform in
   *   the vega-encode module.
   */
  function run(encode) {
    var df = this,
        count = 0,
        level = df.logLevel(),
        op, next, dt, error;

    if (df._pending) {
      df.info('Awaiting requests, delaying dataflow run.');
      return 0;
    }

    if (df._pulse) {
      df.error('Dataflow invoked recursively. Use the runAfter method to queue invocation.');
      return 0;
    }

    if (!df._touched.length) {
      df.info('Dataflow invoked, but nothing to do.');
      return 0;
    }

    df._pulse = new Pulse(df, ++df._clock, encode);

    if (level >= vegaUtil.Info) {
      dt = Date.now();
      df.debug('-- START PROPAGATION (' + df._clock + ') -----');
    }

    // initialize queue, reset touched operators
    df._touched.forEach(function(op) { df._enqueue(op, true); });
    df._touched = UniqueList(vegaUtil.id);

    try {
      while (df._heap.size() > 0) {
        op = df._heap.pop();

        // re-queue if rank changes
        if (op.rank !== op.qrank) { df._enqueue(op, true); continue; }

        // otherwise, evaluate the operator
        next = op.run(df._getPulse(op, encode));

        if (level >= vegaUtil.Debug) {
          df.debug(op.id, next === StopPropagation ? 'STOP' : next, op);
        }

        // propagate the pulse
        if (next !== StopPropagation) {
          df._pulse = next;
          if (op._targets) op._targets.forEach(function(op) { df._enqueue(op); });
        }

        // increment visit counter
        ++count;
      }
    } catch (err) {
      error = err;
    }

    // reset pulse map
    df._pulses = {};
    df._pulse = null;

    if (level >= vegaUtil.Info) {
      dt = Date.now() - dt;
      df.info('> Pulse ' + df._clock + ': ' + count + ' operators; ' + dt + 'ms');
    }

    if (error) {
      df._postrun = [];
      df.error(error);
    }

    if (df._onrun) {
      try { df._onrun(df, count, error); } catch (err) { df.error(err); }
    }

    // invoke callbacks queued via runAfter
    if (df._postrun.length) {
      var postrun = df._postrun;
      df._postrun = [];
      postrun
        .sort(function(a, b) { return b.priority - a.priority; })
        .forEach(function(_) { invokeCallback(df, _.callback); });
    }

    return this;
  }

  function invokeCallback(df, callback) {
    try { callback(df); } catch (err) { df.error(err); }
  }

  /**
   * Runs the dataflow and returns a Promise that resolves when the
   * propagation cycle completes. The standard run method may exit early
   * if there are pending data loading operations. In contrast, this
   * method returns a Promise to allow callers to receive notification
   * when dataflow evaluation completes.
   * @return {Promise} - A promise that resolves to this dataflow.
   */
  function runAsync() {
    // return this._pending || Promise.resolve(this.run());
    return this._pending
      || (this.run() && this._pending)
      || Promise.resolve(this);
  }

  /**
   * Schedules a callback function to be invoked after the current pulse
   * propagation completes. If no propagation is currently occurring,
   * the function is invoked immediately.
   * @param {function(Dataflow)} callback - The callback function to run.
   *   The callback will be invoked with this Dataflow instance as its
   *   sole argument.
   * @param {boolean} enqueue - A boolean flag indicating that the
   *   callback should be queued up to run after the next propagation
   *   cycle, suppressing immediate invocation when propagation is not
   *   currently occurring.
   */
  function runAfter(callback, enqueue, priority) {
    if (this._pulse || enqueue) {
      // pulse propagation is currently running, queue to run after
      this._postrun.push({
        priority: priority || 0,
        callback: callback
      });
    } else {
      // pulse propagation already complete, invoke immediately
      invokeCallback(this, callback);
    }
  }

  /**
   * Enqueue an operator into the priority queue for evaluation. The operator
   * will be enqueued if it has no registered pulse for the current cycle, or if
   * the force argument is true. Upon enqueue, this method also sets the
   * operator's qrank to the current rank value.
   * @param {Operator} op - The operator to enqueue.
   * @param {boolean} [force] - A flag indicating if the operator should be
   *   forceably added to the queue, even if it has already been previously
   *   enqueued during the current pulse propagation. This is useful when the
   *   dataflow graph is dynamically modified and the operator rank changes.
   */
  function enqueue(op, force) {
    var p = !this._pulses[op.id];
    if (p) this._pulses[op.id] = this._pulse;
    if (p || force) {
      op.qrank = op.rank;
      this._heap.push(op);
    }
  }

  /**
   * Provide a correct pulse for evaluating an operator. If the operator has an
   * explicit source operator, we will try to pull the pulse(s) from it.
   * If there is an array of source operators, we build a multi-pulse.
   * Otherwise, we return a current pulse with correct source data.
   * If the pulse is the pulse map has an explicit target set, we use that.
   * Else if the pulse on the upstream source operator is current, we use that.
   * Else we use the pulse from the pulse map, but copy the source tuple array.
   * @param {Operator} op - The operator for which to get an input pulse.
   * @param {string} [encode] - An (optional) encoding set name with which to
   *   annotate the returned pulse. See {@link run} for more information.
   */
  function getPulse(op, encode) {
    var s = op.source,
        stamp = this._clock,
        p;

    if (s && vegaUtil.isArray(s)) {
      p = s.map(function(_) { return _.pulse; });
      return new MultiPulse(this, stamp, p, encode);
    }

    p = this._pulses[op.id];
    if (s) {
      s = s.pulse;
      if (!s || s === StopPropagation) {
        p.source = [];
      } else if (s.stamp === stamp && p.target !== op) {
        p = s;
      } else {
        p.source = s.source;
      }
    }

    return p;
  }

  var NO_OPT = {skip: false, force: false};

  /**
   * Touches an operator, scheduling it to be evaluated. If invoked outside of
   * a pulse propagation, the operator will be evaluated the next time this
   * dataflow is run. If invoked in the midst of pulse propagation, the operator
   * will be queued for evaluation if and only if the operator has not yet been
   * evaluated on the current propagation timestamp.
   * @param {Operator} op - The operator to touch.
   * @param {object} [options] - Additional options hash.
   * @param {boolean} [options.skip] - If true, the operator will
   *   be skipped: it will not be evaluated, but its dependents will be.
   * @return {Dataflow}
   */
  function touch(op, options) {
    var opt = options || NO_OPT;
    if (this._pulse) {
      // if in midst of propagation, add to priority queue
      this._enqueue(op);
    } else {
      // otherwise, queue for next propagation
      this._touched.add(op);
    }
    if (opt.skip) op.skip(true);
    return this;
  }

  /**
   * Updates the value of the given operator.
   * @param {Operator} op - The operator to update.
   * @param {*} value - The value to set.
   * @param {object} [options] - Additional options hash.
   * @param {boolean} [options.force] - If true, the operator will
   *   be re-evaluated even if its value has not changed.
   * @param {boolean} [options.skip] - If true, the operator will
   *   be skipped: it will not be evaluated, but its dependents will be.
   * @return {Dataflow}
   */
  function update(op, value, options) {
    var opt = options || NO_OPT;
    if (op.set(value) || opt.force) {
      this.touch(op, opt);
    }
    return this;
  }

  /**
   * Pulses an operator with a changeset of tuples. If invoked outside of
   * a pulse propagation, the pulse will be applied the next time this
   * dataflow is run. If invoked in the midst of pulse propagation, the pulse
   * will be added to the set of active pulses and will be applied if and
   * only if the target operator has not yet been evaluated on the current
   * propagation timestamp.
   * @param {Operator} op - The operator to pulse.
   * @param {ChangeSet} value - The tuple changeset to apply.
   * @param {object} [options] - Additional options hash.
   * @param {boolean} [options.skip] - If true, the operator will
   *   be skipped: it will not be evaluated, but its dependents will be.
   * @return {Dataflow}
   */
  function pulse(op, changeset, options) {
    this.touch(op, options || NO_OPT);

    var p = new Pulse(this, this._clock + (this._pulse ? 0 : 1)),
        t = op.pulse && op.pulse.source || [];
    p.target = op;
    this._pulses[op.id] = changeset.pulse(p, t);

    return this;
  }

  function Heap(comparator) {
    this.cmp = comparator;
    this.nodes = [];
  }

  var prototype$5 = Heap.prototype;

  prototype$5.size = function() {
    return this.nodes.length;
  };

  prototype$5.clear = function() {
    this.nodes = [];
    return this;
  };

  prototype$5.peek = function() {
    return this.nodes[0];
  };

  prototype$5.push = function(x) {
    var array = this.nodes;
    array.push(x);
    return siftdown(array, 0, array.length-1, this.cmp);
  };

  prototype$5.pop = function() {
    var array = this.nodes,
        last = array.pop(),
        item;

    if (array.length) {
      item = array[0];
      array[0] = last;
      siftup(array, 0, this.cmp);
    } else {
      item = last;
    }
    return item;
  };

  prototype$5.replace = function(item) {
    var array = this.nodes,
        retval = array[0];
    array[0] = item;
    siftup(array, 0, this.cmp);
    return retval;
  };

  prototype$5.pushpop = function(item) {
    var array = this.nodes, ref = array[0];
    if (array.length && this.cmp(ref, item) < 0) {
      array[0] = item;
      item = ref;
      siftup(array, 0, this.cmp);
    }
    return item;
  };

  function siftdown(array, start, idx, cmp) {
    var item, parent, pidx;

    item = array[idx];
    while (idx > start) {
      pidx = (idx - 1) >> 1;
      parent = array[pidx];
      if (cmp(item, parent) < 0) {
        array[idx] = parent;
        idx = pidx;
        continue;
      }
      break;
    }
    return (array[idx] = item);
  }

  function siftup(array, idx, cmp) {
    var start = idx,
        end = array.length,
        item = array[idx],
        cidx = 2 * idx + 1, ridx;

    while (cidx < end) {
      ridx = cidx + 1;
      if (ridx < end && cmp(array[cidx], array[ridx]) >= 0) {
        cidx = ridx;
      }
      array[idx] = array[cidx];
      idx = cidx;
      cidx = 2 * idx + 1;
    }
    array[idx] = item;
    return siftdown(array, start, idx, cmp);
  }

  /**
   * A dataflow graph for reactive processing of data streams.
   * @constructor
   */
  function Dataflow() {
    this._log = vegaUtil.logger();
    this.logLevel(vegaUtil.Error);

    this._clock = 0;
    this._rank = 0;
    try {
      this._loader = vegaLoader.loader();
    } catch (e) {
      // do nothing if loader module is unavailable
    }

    this._touched = UniqueList(vegaUtil.id);
    this._pulses = {};
    this._pulse = null;

    this._heap = new Heap(function(a, b) { return a.qrank - b.qrank; });
    this._postrun = [];
  }

  var prototype$6 = Dataflow.prototype;

  /**
   * The current timestamp of this dataflow. This value reflects the
   * timestamp of the previous dataflow run. The dataflow is initialized
   * with a stamp value of 0. The initial run of the dataflow will have
   * a timestap of 1, and so on. This value will match the
   * {@link Pulse.stamp} property.
   * @return {number} - The current timestamp value.
   */
  prototype$6.stamp = function() {
    return this._clock;
  };

  /**
   * Gets or sets the loader instance to use for data file loading. A
   * loader object must provide a "load" method for loading files and a
   * "sanitize" method for checking URL/filename validity. Both methods
   * should accept a URI and options hash as arguments, and return a Promise
   * that resolves to the loaded file contents (load) or a hash containing
   * sanitized URI data with the sanitized url assigned to the "href" property
   * (sanitize).
   * @param {object} _ - The loader instance to use.
   * @return {object|Dataflow} - If no arguments are provided, returns
   *   the current loader instance. Otherwise returns this Dataflow instance.
   */
  prototype$6.loader = function(_) {
    if (arguments.length) {
      this._loader = _;
      return this;
    } else {
      return this._loader;
    }
  };

  /**
   * Empty entry threshold for garbage cleaning. Map data structures will
   * perform cleaning once the number of empty entries exceeds this value.
   */
  prototype$6.cleanThreshold = 1e4;

  // OPERATOR REGISTRATION
  prototype$6.add = add;
  prototype$6.connect = connect;
  prototype$6.rank = rank;
  prototype$6.rerank = rerank;

  // OPERATOR UPDATES
  prototype$6.pulse = pulse;
  prototype$6.touch = touch;
  prototype$6.update = update;
  prototype$6.changeset = changeset;

  // DATA LOADING
  prototype$6.ingest = ingest$1;
  prototype$6.request = request;

  // EVENT HANDLING
  prototype$6.events = events;
  prototype$6.on = on;

  // PULSE PROPAGATION
  prototype$6.run = run;
  prototype$6.runAsync = runAsync;
  prototype$6.runAfter = runAfter;
  prototype$6._enqueue = enqueue;
  prototype$6._getPulse = getPulse;

  // LOGGING AND ERROR HANDLING

  function logMethod(method) {
    return function() {
      return this._log[method].apply(this, arguments);
    };
  }

  /**
   * Logs an error message. By default, logged messages are written to console
   * output. The message will only be logged if the current log level is high
   * enough to permit error messages.
   */
  prototype$6.error = logMethod('error');

  /**
   * Logs a warning message. By default, logged messages are written to console
   * output. The message will only be logged if the current log level is high
   * enough to permit warning messages.
   */
  prototype$6.warn = logMethod('warn');

  /**
   * Logs a information message. By default, logged messages are written to
   * console output. The message will only be logged if the current log level is
   * high enough to permit information messages.
   */
  prototype$6.info = logMethod('info');

  /**
   * Logs a debug message. By default, logged messages are written to console
   * output. The message will only be logged if the current log level is high
   * enough to permit debug messages.
   */
  prototype$6.debug = logMethod('debug');

  /**
   * Get or set the current log level. If an argument is provided, it
   * will be used as the new log level.
   * @param {number} [level] - Should be one of None, Warn, Info
   * @return {number} - The current log level.
   */
  prototype$6.logLevel = logMethod('level');

  /**
   * Abstract class for operators that process data tuples.
   * Subclasses must provide a {@link transform} method for operator processing.
   * @constructor
   * @param {*} [init] - The initial value for this operator.
   * @param {object} [params] - The parameters for this operator.
   * @param {Operator} [source] - The operator from which to receive pulses.
   */
  function Transform(init, params) {
    Operator.call(this, init, null, params);
  }

  var prototype$7 = vegaUtil.inherits(Transform, Operator);

  /**
   * Overrides {@link Operator.evaluate} for transform operators.
   * Internally, this method calls {@link evaluate} to perform processing.
   * If {@link evaluate} returns a falsy value, the input pulse is returned.
   * This method should NOT be overridden, instead overrride {@link evaluate}.
   * @param {Pulse} pulse - the current dataflow pulse.
   * @return the output pulse for this operator (or StopPropagation)
   */
  prototype$7.run = function(pulse) {
    if (pulse.stamp <= this.stamp) return pulse.StopPropagation;

    var rv;
    if (this.skip()) {
      this.skip(false);
    } else {
      rv = this.evaluate(pulse);
    }
    rv = rv || pulse;

    if (rv !== pulse.StopPropagation) this.pulse = rv;
    this.stamp = pulse.stamp;

    return rv;
  };

  /**
   * Overrides {@link Operator.evaluate} for transform operators.
   * Marshalls parameter values and then invokes {@link transform}.
   * @param {Pulse} pulse - the current dataflow pulse.
   * @return {Pulse} The output pulse (or StopPropagation). A falsy return
       value (including undefined) will let the input pulse pass through.
   */
  prototype$7.evaluate = function(pulse) {
    var params = this.marshall(pulse.stamp),
        out = this.transform(params, pulse);
    params.clear();
    return out;
  };

  /**
   * Process incoming pulses.
   * Subclasses should override this method to implement transforms.
   * @param {Parameters} _ - The operator parameter values.
   * @param {Pulse} pulse - The current dataflow pulse.
   * @return {Pulse} The output pulse (or StopPropagation). A falsy return
   *   value (including undefined) will let the input pulse pass through.
   */
  prototype$7.transform = function() {};

  var transforms = {};

  function definition(type) {
    var t = transform(type);
    return t && t.Definition || null;
  }

  function transform(type) {
    type = type && type.toLowerCase();
    return transforms.hasOwnProperty(type) ? transforms[type] : null;
  }

  // Utilities

  exports.UniqueList = UniqueList;
  exports.changeset = changeset;
  exports.isChangeSet = isChangeSet;
  exports.Dataflow = Dataflow;
  exports.EventStream = EventStream;
  exports.Parameters = Parameters;
  exports.Pulse = Pulse;
  exports.MultiPulse = MultiPulse;
  exports.Operator = Operator;
  exports.Transform = Transform;
  exports.derive = derive;
  exports.rederive = rederive;
  exports.ingest = ingest;
  exports.isTuple = isTuple;
  exports.replace = replace;
  exports.tupleid = tupleid;
  exports.definition = definition;
  exports.transform = transform;
  exports.transforms = transforms;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
