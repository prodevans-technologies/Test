(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vega-statistics'), require('vega-dataflow'), require('vega-util'), require('d3-array')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vega-statistics', 'vega-dataflow', 'vega-util', 'd3-array'], factory) :
  (factory((global.vega = global.vega || {}, global.vega.transforms = {}),global.vega,global.vega,global.vega,global.d3));
}(this, (function (exports,vegaStatistics,vegaDataflow,vegaUtil,d3Array) { 'use strict';

  function multikey(f) {
    return function(x) {
      var n = f.length,
          i = 1,
          k = String(f[0](x));

      for (; i<n; ++i) {
        k += '|' + f[i](x);
      }

      return k;
    };
  }

  function groupkey(fields) {
    return !fields || !fields.length ? function() { return ''; }
      : fields.length === 1 ? fields[0]
      : multikey(fields);
  }

  function measureName(op, field, as) {
    return as || (op + (!field ? '' : '_' + field));
  }

  var AggregateOps = {
    'values': measure({
      name: 'values',
      init: 'cell.store = true;',
      set:  'cell.data.values()', idx: -1
    }),
    'count': measure({
      name: 'count',
      set:  'cell.num'
    }),
    '__count__': measure({
      name: 'count',
      set:  'this.missing + this.valid'
    }),
    'missing': measure({
      name: 'missing',
      set:  'this.missing'
    }),
    'valid': measure({
      name: 'valid',
      set:  'this.valid'
    }),
    'sum': measure({
      name: 'sum',
      init: 'this.sum = 0;',
      add:  'this.sum += +v;',
      rem:  'this.sum -= v;',
      set:  'this.sum'
    }),
    'mean': measure({
      name: 'mean',
      init: 'this.mean = 0;',
      add:  'var d = v - this.mean; this.mean += d / this.valid;',
      rem:  'var d = v - this.mean; this.mean -= this.valid ? d / this.valid : this.mean;',
      set:  'this.valid ? this.mean : undefined'
    }),
    'average': measure({
      name: 'average',
      set:  'this.valid ? this.mean : undefined',
      req:  ['mean'], idx: 1
    }),
    'variance': measure({
      name: 'variance',
      init: 'this.dev = 0;',
      add:  'this.dev += d * (v - this.mean);',
      rem:  'this.dev -= d * (v - this.mean);',
      set:  'this.valid > 1 ? this.dev / (this.valid-1) : undefined',
      req:  ['mean'], idx: 1
    }),
    'variancep': measure({
      name: 'variancep',
      set:  'this.valid > 1 ? this.dev / this.valid : undefined',
      req:  ['variance'], idx: 2
    }),
    'stdev': measure({
      name: 'stdev',
      set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid-1)) : undefined',
      req:  ['variance'], idx: 2
    }),
    'stdevp': measure({
      name: 'stdevp',
      set:  'this.valid > 1 ? Math.sqrt(this.dev / this.valid) : undefined',
      req:  ['variance'], idx: 2
    }),
    'stderr': measure({
      name: 'stderr',
      set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid * (this.valid-1))) : undefined',
      req:  ['variance'], idx: 2
    }),
    'distinct': measure({
      name: 'distinct',
      set:  'cell.data.distinct(this.get)',
      req:  ['values'], idx: 3
    }),
    'ci0': measure({
      name: 'ci0',
      set:  'cell.data.ci0(this.get)',
      req:  ['values'], idx: 3
    }),
    'ci1': measure({
      name: 'ci1',
      set:  'cell.data.ci1(this.get)',
      req:  ['values'], idx: 3
    }),
    'median': measure({
      name: 'median',
      set:  'cell.data.q2(this.get)',
      req:  ['values'], idx: 3
    }),
    'q1': measure({
      name: 'q1',
      set:  'cell.data.q1(this.get)',
      req:  ['values'], idx: 3
    }),
    'q3': measure({
      name: 'q3',
      set:  'cell.data.q3(this.get)',
      req:  ['values'], idx: 3
    }),
    'argmin': measure({
      name: 'argmin',
      init: 'this.argmin = undefined;',
      add:  'if (v < this.min) this.argmin = t;',
      rem:  'if (v <= this.min) this.argmin = undefined;',
      set:  'this.argmin || cell.data.argmin(this.get)',
      req:  ['min'], str: ['values'], idx: 3
    }),
    'argmax': measure({
      name: 'argmax',
      init: 'this.argmax = undefined;',
      add:  'if (v > this.max) this.argmax = t;',
      rem:  'if (v >= this.max) this.argmax = undefined;',
      set:  'this.argmax || cell.data.argmax(this.get)',
      req:  ['max'], str: ['values'], idx: 3
    }),
    'min': measure({
      name: 'min',
      init: 'this.min = undefined;',
      add:  'if (v < this.min || this.min === undefined) this.min = v;',
      rem:  'if (v <= this.min) this.min = NaN;',
      set:  'this.min = (isNaN(this.min) ? cell.data.min(this.get) : this.min)',
      str:  ['values'], idx: 4
    }),
    'max': measure({
      name: 'max',
      init: 'this.max = undefined;',
      add:  'if (v > this.max || this.max === undefined) this.max = v;',
      rem:  'if (v >= this.max) this.max = NaN;',
      set:  'this.max = (isNaN(this.max) ? cell.data.max(this.get) : this.max)',
      str:  ['values'], idx: 4
    })
  };

  var ValidAggregateOps = Object.keys(AggregateOps);

  function createMeasure(op, name) {
    return AggregateOps[op](name);
  }

  function measure(base) {
    return function(out) {
      var m = vegaUtil.extend({init:'', add:'', rem:'', idx:0}, base);
      m.out = out || base.name;
      return m;
    };
  }

  function compareIndex(a, b) {
    return a.idx - b.idx;
  }

  function resolve(agg, stream) {
    function collect(m, a) {
      function helper(r) { if (!m[r]) collect(m, m[r] = AggregateOps[r]()); }
      if (a.req) a.req.forEach(helper);
      if (stream && a.str) a.str.forEach(helper);
      return m;
    }
    var map = agg.reduce(
      collect,
      agg.reduce(function(m, a) {
        m[a.name] = a;
        return m;
      }, {})
    );
    var values = [], key;
    for (key in map) values.push(map[key]);
    return values.sort(compareIndex);
  }

  function compileMeasures(agg, field) {
    var get = field || vegaUtil.identity,
        all = resolve(agg, true), // assume streaming removes may occur
        init = 'var cell = this.cell; this.valid = 0; this.missing = 0;',
        ctr = 'this.cell = cell; this.init();',
        add = 'if(v==null){++this.missing; return;} if(v!==v) return; ++this.valid;',
        rem = 'if(v==null){--this.missing; return;} if(v!==v) return; --this.valid;',
        set = 'var cell = this.cell;';

    all.forEach(function(a) {
      init += a.init;
      add += a.add;
      rem += a.rem;
    });
    agg.slice().sort(compareIndex).forEach(function(a) {
      set += 't[\'' + a.out + '\']=' + a.set + ';';
    });
    set += 'return t;';

    ctr = Function('cell', ctr);
    ctr.prototype.init = Function(init);
    ctr.prototype.add = Function('v', 't', add);
    ctr.prototype.rem = Function('v', 't', rem);
    ctr.prototype.set = Function('t', set);
    ctr.prototype.get = get;
    ctr.fields = agg.map(function(_) { return _.out; });
    return ctr;
  }

  function TupleStore(key) {
    this._key = key ? vegaUtil.field(key) : vegaDataflow.tupleid;
    this.reset();
  }

  var prototype = TupleStore.prototype;

  prototype.reset = function() {
    this._add = [];
    this._rem = [];
    this._ext = null;
    this._get = null;
    this._q = null;
  };

  prototype.add = function(v) {
    this._add.push(v);
  };

  prototype.rem = function(v) {
    this._rem.push(v);
  };

  prototype.values = function() {
    this._get = null;
    if (this._rem.length === 0) return this._add;

    var a = this._add,
        r = this._rem,
        k = this._key,
        n = a.length,
        m = r.length,
        x = Array(n - m),
        map = {}, i, j, v;

    // use unique key field to clear removed values
    for (i=0; i<m; ++i) {
      map[k(r[i])] = 1;
    }
    for (i=0, j=0; i<n; ++i) {
      if (map[k(v = a[i])]) {
        map[k(v)] = 0;
      } else {
        x[j++] = v;
      }
    }

    this._rem = [];
    return (this._add = x);
  };

  // memoizing statistics methods

  prototype.distinct = function(get) {
    var v = this.values(),
        n = v.length,
        map = {},
        count = 0, s;

    while (--n >= 0) {
      s = get(v[n]) + '';
      if (!map.hasOwnProperty(s)) {
        map[s] = 1;
        ++count;
      }
    }

    return count;
  };

  prototype.extent = function(get) {
    if (this._get !== get || !this._ext) {
      var v = this.values(),
          i = vegaUtil.extentIndex(v, get);
      this._ext = [v[i[0]], v[i[1]]];
      this._get = get;
    }
    return this._ext;
  };

  prototype.argmin = function(get) {
    return this.extent(get)[0] || {};
  };

  prototype.argmax = function(get) {
    return this.extent(get)[1] || {};
  };

  prototype.min = function(get) {
    var m = this.extent(get)[0];
    return m != null ? get(m) : undefined;
  };

  prototype.max = function(get) {
    var m = this.extent(get)[1];
    return m != null ? get(m) : undefined;
  };

  prototype.quartile = function(get) {
    if (this._get !== get || !this._q) {
      this._q = vegaStatistics.quartiles(this.values(), get);
      this._get = get;
    }
    return this._q;
  };

  prototype.q1 = function(get) {
    return this.quartile(get)[0];
  };

  prototype.q2 = function(get) {
    return this.quartile(get)[1];
  };

  prototype.q3 = function(get) {
    return this.quartile(get)[2];
  };

  prototype.ci = function(get) {
    if (this._get !== get || !this._ci) {
      this._ci = vegaStatistics.bootstrapCI(this.values(), 1000, 0.05, get);
      this._get = get;
    }
    return this._ci;
  };

  prototype.ci0 = function(get) {
    return this.ci(get)[0];
  };

  prototype.ci1 = function(get) {
    return this.ci(get)[1];
  };

  /**
   * Group-by aggregation operator.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Array<function(object): *>} [params.groupby] - An array of accessors to groupby.
   * @param {Array<function(object): *>} [params.fields] - An array of accessors to aggregate.
   * @param {Array<string>} [params.ops] - An array of strings indicating aggregation operations.
   * @param {Array<string>} [params.as] - An array of output field names for aggregated values.
   * @param {boolean} [params.cross=false] - A flag indicating that the full
   *   cross-product of groupby values should be generated, including empty cells.
   *   If true, the drop parameter is ignored and empty cells are retained.
   * @param {boolean} [params.drop=true] - A flag indicating if empty cells should be removed.
   */
  function Aggregate(params) {
    vegaDataflow.Transform.call(this, null, params);

    this._adds = []; // array of added output tuples
    this._mods = []; // array of modified output tuples
    this._alen = 0;  // number of active added tuples
    this._mlen = 0;  // number of active modified tuples
    this._drop = true;   // should empty aggregation cells be removed
    this._cross = false; // produce full cross-product of group-by values

    this._dims = [];   // group-by dimension accessors
    this._dnames = []; // group-by dimension names

    this._measures = []; // collection of aggregation monoids
    this._countOnly = false; // flag indicating only count aggregation
    this._counts = null; // collection of count fields
    this._prev = null;   // previous aggregation cells

    this._inputs = null;  // array of dependent input tuple field names
    this._outputs = null; // array of output tuple field names
  }

  Aggregate.Definition = {
    "type": "Aggregate",
    "metadata": {"generates": true, "changes": true},
    "params": [
      { "name": "groupby", "type": "field", "array": true },
      { "name": "ops", "type": "enum", "array": true, "values": ValidAggregateOps },
      { "name": "fields", "type": "field", "null": true, "array": true },
      { "name": "as", "type": "string", "null": true, "array": true },
      { "name": "drop", "type": "boolean", "default": true },
      { "name": "cross", "type": "boolean", "default": false },
      { "name": "key", "type": "field" }
    ]
  };

  var prototype$1 = vegaUtil.inherits(Aggregate, vegaDataflow.Transform);

  prototype$1.transform = function(_, pulse) {
    var aggr = this,
        out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
        mod;

    this.stamp = out.stamp;

    if (this.value && ((mod = _.modified()) || pulse.modified(this._inputs))) {
      this._prev = this.value;
      this.value = mod ? this.init(_) : {};
      pulse.visit(pulse.SOURCE, function(t) { aggr.add(t); });
    } else {
      this.value = this.value || this.init(_);
      pulse.visit(pulse.REM, function(t) { aggr.rem(t); });
      pulse.visit(pulse.ADD, function(t) { aggr.add(t); });
    }

    // Indicate output fields and return aggregate tuples.
    out.modifies(this._outputs);

    // Should empty cells be dropped?
    aggr._drop = _.drop !== false;

    // If domain cross-product requested, generate empty cells as needed
    // and ensure that empty cells are not dropped
    if (_.cross && aggr._dims.length > 1) {
      aggr._drop = false;
      this.cross();
    }

    return aggr.changes(out);
  };

  prototype$1.cross = function() {
    var aggr = this,
        curr = aggr.value,
        dims = aggr._dnames,
        vals = dims.map(function() { return {}; }),
        n = dims.length;

    // collect all group-by domain values
    function collect(cells) {
      var key, i, t, v;
      for (key in cells) {
        t = cells[key].tuple;
        for (i=0; i<n; ++i) {
          vals[i][(v = t[dims[i]])] = v;
        }
      }
    }
    collect(aggr._prev);
    collect(curr);

    // iterate over key cross-product, create cells as needed
    function generate(base, tuple, index) {
      var name = dims[index],
          v = vals[index++],
          k, key;

      for (k in v) {
        tuple[name] = v[k];
        key = base ? base + '|' + k : k;
        if (index < n) generate(key, tuple, index);
        else if (!curr[key]) aggr.cell(key, tuple);
      }
    }
    generate('', {}, 0);
  };

  prototype$1.init = function(_) {
    // initialize input and output fields
    var inputs = (this._inputs = []),
        outputs = (this._outputs = []),
        inputMap = {};

    function inputVisit(get) {
      var fields = vegaUtil.array(vegaUtil.accessorFields(get)),
          i = 0, n = fields.length, f;
      for (; i<n; ++i) {
        if (!inputMap[f=fields[i]]) {
          inputMap[f] = 1;
          inputs.push(f);
        }
      }
    }

    // initialize group-by dimensions
    this._dims = vegaUtil.array(_.groupby);
    this._dnames = this._dims.map(function(d) {
      var dname = vegaUtil.accessorName(d);
      inputVisit(d);
      outputs.push(dname);
      return dname;
    });
    this.cellkey = _.key ? _.key : groupkey(this._dims);

    // initialize aggregate measures
    this._countOnly = true;
    this._counts = [];
    this._measures = [];

    var fields = _.fields || [null],
        ops = _.ops || ['count'],
        as = _.as || [],
        n = fields.length,
        map = {},
        field, op, m, mname, outname, i;

    if (n !== ops.length) {
      vegaUtil.error('Unmatched number of fields and aggregate ops.');
    }

    for (i=0; i<n; ++i) {
      field = fields[i];
      op = ops[i];

      if (field == null && op !== 'count') {
        vegaUtil.error('Null aggregate field specified.');
      }
      mname = vegaUtil.accessorName(field);
      outname = measureName(op, mname, as[i]);
      outputs.push(outname);

      if (op === 'count') {
        this._counts.push(outname);
        continue;
      }

      m = map[mname];
      if (!m) {
        inputVisit(field);
        m = (map[mname] = []);
        m.field = field;
        this._measures.push(m);
      }

      if (op !== 'count') this._countOnly = false;
      m.push(createMeasure(op, outname));
    }

    this._measures = this._measures.map(function(m) {
      return compileMeasures(m, m.field);
    });

    return {}; // aggregation cells (this.value)
  };

  // -- Cell Management -----

  prototype$1.cellkey = groupkey();

  prototype$1.cell = function(key, t) {
    var cell = this.value[key];
    if (!cell) {
      cell = this.value[key] = this.newcell(key, t);
      this._adds[this._alen++] = cell;
    } else if (cell.num === 0 && this._drop && cell.stamp < this.stamp) {
      cell.stamp = this.stamp;
      this._adds[this._alen++] = cell;
    } else if (cell.stamp < this.stamp) {
      cell.stamp = this.stamp;
      this._mods[this._mlen++] = cell;
    }
    return cell;
  };

  prototype$1.newcell = function(key, t) {
    var cell = {
      key:   key,
      num:   0,
      agg:   null,
      tuple: this.newtuple(t, this._prev && this._prev[key]),
      stamp: this.stamp,
      store: false
    };

    if (!this._countOnly) {
      var measures = this._measures,
          n = measures.length, i;

      cell.agg = Array(n);
      for (i=0; i<n; ++i) {
        cell.agg[i] = new measures[i](cell);
      }
    }

    if (cell.store) {
      cell.data = new TupleStore();
    }

    return cell;
  };

  prototype$1.newtuple = function(t, p) {
    var names = this._dnames,
        dims = this._dims,
        x = {}, i, n;

    for (i=0, n=dims.length; i<n; ++i) {
      x[names[i]] = dims[i](t);
    }

    return p ? vegaDataflow.replace(p.tuple, x) : vegaDataflow.ingest(x);
  };

  // -- Process Tuples -----

  prototype$1.add = function(t) {
    var key = this.cellkey(t),
        cell = this.cell(key, t),
        agg, i, n;

    cell.num += 1;
    if (this._countOnly) return;

    if (cell.store) cell.data.add(t);

    agg = cell.agg;
    for (i=0, n=agg.length; i<n; ++i) {
      agg[i].add(agg[i].get(t), t);
    }
  };

  prototype$1.rem = function(t) {
    var key = this.cellkey(t),
        cell = this.cell(key, t),
        agg, i, n;

    cell.num -= 1;
    if (this._countOnly) return;

    if (cell.store) cell.data.rem(t);

    agg = cell.agg;
    for (i=0, n=agg.length; i<n; ++i) {
      agg[i].rem(agg[i].get(t), t);
    }
  };

  prototype$1.celltuple = function(cell) {
    var tuple = cell.tuple,
        counts = this._counts,
        agg, i, n;

    // consolidate stored values
    if (cell.store) {
      cell.data.values();
    }

    // update tuple properties
    for (i=0, n=counts.length; i<n; ++i) {
      tuple[counts[i]] = cell.num;
    }
    if (!this._countOnly) {
      agg = cell.agg;
      for (i=0, n=agg.length; i<n; ++i) {
        agg[i].set(tuple);
      }
    }

    return tuple;
  };

  prototype$1.changes = function(out) {
    var adds = this._adds,
        mods = this._mods,
        prev = this._prev,
        drop = this._drop,
        add = out.add,
        rem = out.rem,
        mod = out.mod,
        cell, key, i, n;

    if (prev) for (key in prev) {
      cell = prev[key];
      if (!drop || cell.num) rem.push(cell.tuple);
    }

    for (i=0, n=this._alen; i<n; ++i) {
      add.push(this.celltuple(adds[i]));
      adds[i] = null; // for garbage collection
    }

    for (i=0, n=this._mlen; i<n; ++i) {
      cell = mods[i];
      (cell.num === 0 && drop ? rem : mod).push(this.celltuple(cell));
      mods[i] = null; // for garbage collection
    }

    this._alen = this._mlen = 0; // reset list of active cells
    this._prev = null;
    return out;
  };

  /**
   * Generates a binning function for discretizing data.
   * @constructor
   * @param {object} params - The parameters for this operator. The
   *   provided values should be valid options for the {@link bin} function.
   * @param {function(object): *} params.field - The data field to bin.
   */
  function Bin(params) {
    vegaDataflow.Transform.call(this, null, params);
  }

  Bin.Definition = {
    "type": "Bin",
    "metadata": {"modifies": true},
    "params": [
      { "name": "field", "type": "field", "required": true },
      { "name": "anchor", "type": "number" },
      { "name": "maxbins", "type": "number", "default": 20 },
      { "name": "base", "type": "number", "default": 10 },
      { "name": "divide", "type": "number", "array": true, "default": [5, 2] },
      { "name": "extent", "type": "number", "array": true, "length": 2, "required": true },
      { "name": "step", "type": "number" },
      { "name": "steps", "type": "number", "array": true },
      { "name": "minstep", "type": "number", "default": 0 },
      { "name": "nice", "type": "boolean", "default": true },
      { "name": "name", "type": "string" },
      { "name": "as", "type": "string", "array": true, "length": 2, "default": ["bin0", "bin1"] }
    ]
  };

  var prototype$2 = vegaUtil.inherits(Bin, vegaDataflow.Transform);

  prototype$2.transform = function(_, pulse) {
    var bins = this._bins(_),
        start = bins.start,
        step = bins.step,
        as = _.as || ['bin0', 'bin1'],
        b0 = as[0],
        b1 = as[1],
        flag;

    if (_.modified()) {
      pulse = pulse.reflow(true);
      flag = pulse.SOURCE;
    } else {
      flag = pulse.modified(vegaUtil.accessorFields(_.field)) ? pulse.ADD_MOD : pulse.ADD;
    }

    pulse.visit(flag, function(t) {
      var v = bins(t);
      // minimum bin value (inclusive)
      t[b0] = v;
      // maximum bin value (exclusive)
      // use convoluted math for better floating point agreement
      // see https://github.com/vega/vega/issues/830
      t[b1] = v == null ? null : start + step * (1 + (v - start) / step);
    });

    return pulse.modifies(as);
  };

  prototype$2._bins = function(_) {
    if (this.value && !_.modified()) {
      return this.value;
    }

    var field = _.field,
        bins  = vegaStatistics.bin(_),
        start = bins.start,
        stop  = bins.stop,
        step  = bins.step,
        a, d;

    if ((a = _.anchor) != null) {
      d = a - (start + step * Math.floor((a - start) / step));
      start += d;
      stop += d;
    }

    var f = function(t) {
      var v = field(t);
      if (v == null) {
        return null;
      } else {
        v = Math.max(start, Math.min(+v, stop - step));
        return start + step * Math.floor((v - start) / step);
      }
    };

    f.start = start;
    f.stop = stop;
    f.step = step;

    return this.value = vegaUtil.accessor(
      f,
      vegaUtil.accessorFields(field),
      _.name || 'bin_' + vegaUtil.accessorName(field)
    );
  };

  function SortedList(idFunc, source, input) {
    var $ = idFunc,
        data = source || [],
        add = input || [],
        rem = {},
        cnt = 0;

    return {
      add: function(t) { add.push(t); },
      remove: function(t) { rem[$(t)] = ++cnt; },
      size: function() { return data.length; },
      data: function(compare, resort) {
        if (cnt) {
          data = data.filter(function(t) { return !rem[$(t)]; });
          rem = {};
          cnt = 0;
        }
        if (resort && compare) {
          data.sort(compare);
        }
        if (add.length) {
          data = compare
            ? vegaUtil.merge(compare, data, add.sort(compare))
            : data.concat(add);
          add = [];
        }
        return data;
      }
    }
  }

  /**
   * Collects all data tuples that pass through this operator.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(*,*): number} [params.sort] - An optional
   *   comparator function for additionally sorting the collected tuples.
   */
  function Collect(params) {
    vegaDataflow.Transform.call(this, [], params);
  }

  Collect.Definition = {
    "type": "Collect",
    "metadata": {"source": true},
    "params": [
      { "name": "sort", "type": "compare" }
    ]
  };

  var prototype$3 = vegaUtil.inherits(Collect, vegaDataflow.Transform);

  prototype$3.transform = function(_, pulse) {
    var out = pulse.fork(pulse.ALL),
        list = SortedList(vegaDataflow.tupleid, this.value, out.materialize(out.ADD).add),
        sort = _.sort,
        mod = pulse.changed() || (sort &&
              (_.modified('sort') || pulse.modified(sort.fields)));

    out.visit(out.REM, list.remove);

    this.modified(mod);
    this.value = out.source = list.data(sort, mod);

    // propagate tree root if defined
    if (pulse.source && pulse.source.root) {
      this.value.root = pulse.source.root;
    }

    return out;
  };

  /**
   * Generates a comparator function.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Array<string>} params.fields - The fields to compare.
   * @param {Array<string>} [params.orders] - The sort orders.
   *   Each entry should be one of "ascending" (default) or "descending".
   */
  function Compare(params) {
    vegaDataflow.Operator.call(this, null, update, params);
  }

  vegaUtil.inherits(Compare, vegaDataflow.Operator);

  function update(_) {
    return (this.value && !_.modified())
      ? this.value
      : vegaUtil.compare(_.fields, _.orders);
  }

  /**
   * Count regexp-defined pattern occurrences in a text field.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - An accessor for the text field.
   * @param {string} [params.pattern] - RegExp string defining the text pattern.
   * @param {string} [params.case] - One of 'lower', 'upper' or null (mixed) case.
   * @param {string} [params.stopwords] - RegExp string of words to ignore.
   */
  function CountPattern(params) {
    vegaDataflow.Transform.call(this, null, params);
  }

  CountPattern.Definition = {
    "type": "CountPattern",
    "metadata": {"generates": true, "changes": true},
    "params": [
      { "name": "field", "type": "field", "required": true },
      { "name": "case", "type": "enum", "values": ["upper", "lower", "mixed"], "default": "mixed" },
      { "name": "pattern", "type": "string", "default": "[\\w\"]+" },
      { "name": "stopwords", "type": "string", "default": "" },
      { "name": "as", "type": "string", "array": true, "length": 2, "default": ["text", "count"] }
    ]
  };

  function tokenize(text, tcase, match) {
    switch (tcase) {
      case 'upper': text = text.toUpperCase(); break;
      case 'lower': text = text.toLowerCase(); break;
    }
    return text.match(match);
  }

  var prototype$4 = vegaUtil.inherits(CountPattern, vegaDataflow.Transform);

  prototype$4.transform = function(_, pulse) {
    function process(update) {
      return function(tuple) {
        var tokens = tokenize(get(tuple), _.case, match) || [], t;
        for (var i=0, n=tokens.length; i<n; ++i) {
          if (!stop.test(t = tokens[i])) update(t);
        }
      };
    }

    var init = this._parameterCheck(_, pulse),
        counts = this._counts,
        match = this._match,
        stop = this._stop,
        get = _.field,
        as = _.as || ['text', 'count'],
        add = process(function(t) { counts[t] = 1 + (counts[t] || 0); }),
        rem = process(function(t) { counts[t] -= 1; });

    if (init) {
      pulse.visit(pulse.SOURCE, add);
    } else {
      pulse.visit(pulse.ADD, add);
      pulse.visit(pulse.REM, rem);
    }

    return this._finish(pulse, as); // generate output tuples
  };

  prototype$4._parameterCheck = function(_, pulse) {
    var init = false;

    if (_.modified('stopwords') || !this._stop) {
      this._stop = new RegExp('^' + (_.stopwords || '') + '$', 'i');
      init = true;
    }

    if (_.modified('pattern') || !this._match) {
      this._match = new RegExp((_.pattern || '[\\w\']+'), 'g');
      init = true;
    }

    if (_.modified('field') || pulse.modified(_.field.fields)) {
      init = true;
    }

    if (init) this._counts = {};
    return init;
  };

  prototype$4._finish = function(pulse, as) {
    var counts = this._counts,
        tuples = this._tuples || (this._tuples = {}),
        text = as[0],
        count = as[1],
        out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
        w, t, c;

    for (w in counts) {
      t = tuples[w];
      c = counts[w] || 0;
      if (!t && c) {
        tuples[w] = (t = vegaDataflow.ingest({}));
        t[text] = w;
        t[count] = c;
        out.add.push(t);
      } else if (c === 0) {
        if (t) out.rem.push(t);
        counts[w] = null;
        tuples[w] = null;
      } else if (t[count] !== c) {
        t[count] = c;
        out.mod.push(t);
      }
    }

    return out.modifies(as);
  };

  /**
   * Perform a cross-product of a tuple stream with itself.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object):boolean} [params.filter] - An optional filter
   *   function for selectively including tuples in the cross product.
   * @param {Array<string>} [params.as] - The names of the output fields.
   */
  function Cross(params) {
    vegaDataflow.Transform.call(this, null, params);
  }

  Cross.Definition = {
    "type": "Cross",
    "metadata": {"generates": true},
    "params": [
      { "name": "filter", "type": "expr" },
      { "name": "as", "type": "string", "array": true, "length": 2, "default": ["a", "b"] }
    ]
  };

  var prototype$5 = vegaUtil.inherits(Cross, vegaDataflow.Transform);

  prototype$5.transform = function(_, pulse) {
    var out = pulse.fork(pulse.NO_SOURCE),
        data = this.value,
        as = _.as || ['a', 'b'],
        a = as[0], b = as[1],
        reset = !data
            || pulse.changed(pulse.ADD_REM)
            || _.modified('as')
            || _.modified('filter');

    if (reset) {
      if (data) out.rem = data;
      data = pulse.materialize(pulse.SOURCE).source;
      out.add = this.value = cross(data, a, b, _.filter || vegaUtil.truthy);
    } else {
      out.mod = data;
    }

    out.source = this.value;
    return out.modifies(as);
  };

  function cross(input, a, b, filter) {
    var data = [],
        t = {},
        n = input.length,
        i = 0,
        j, left;

    for (; i<n; ++i) {
      t[a] = left = input[i];
      for (j=0; j<n; ++j) {
        t[b] = input[j];
        if (filter(t)) {
          data.push(vegaDataflow.ingest(t));
          t = {};
          t[a] = left;
        }
      }
    }

    return data;
  }

  var Distributions = {
    kde:     vegaStatistics.randomKDE,
    mixture: vegaStatistics.randomMixture,
    normal:  vegaStatistics.randomNormal,
    uniform: vegaStatistics.randomUniform
  };

  var DISTRIBUTIONS = 'distributions',
      FUNCTION = 'function',
      FIELD = 'field';

  /**
   * Parse a parameter object for a probability distribution.
   * @param {object} def - The distribution parameter object.
   * @param {function():Array<object>} - A method for requesting
   *   source data. Used for distributions (such as KDE) that
   *   require sample data points. This method will only be
   *   invoked if the 'from' parameter for a target data source
   *   is not provided. Typically this method returns backing
   *   source data for a Pulse object.
   * @return {object} - The output distribution object.
   */
  function parse(def, data) {
    var func = def[FUNCTION];
    if (!Distributions.hasOwnProperty(func)) {
      vegaUtil.error('Unknown distribution function: ' + func);
    }

    var d = Distributions[func]();

    for (var name in def) {
      // if data field, extract values
      if (name === FIELD) {
        d.data((def.from || data()).map(def[name]));
      }

      // if distribution mixture, recurse to parse each definition
      else if (name === DISTRIBUTIONS) {
        d[name](def[name].map(function(_) { return parse(_, data); }));
      }

      // otherwise, simply set the parameter
      else if (typeof d[name] === FUNCTION) {
        d[name](def[name]);
      }
    }

    return d;
  }

  /**
   * Grid sample points for a probability density. Given a distribution and
   * a sampling extent, will generate points suitable for plotting either
   * PDF (probability density function) or CDF (cumulative distribution
   * function) curves.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {object} params.distribution - The probability distribution. This
   *   is an object parameter dependent on the distribution type.
   * @param {string} [params.method='pdf'] - The distribution method to sample.
   *   One of 'pdf' or 'cdf'.
   * @param {Array<number>} [params.extent] - The [min, max] extent over which
   *   to sample the distribution. This argument is required in most cases, but
   *   can be omitted if the distribution (e.g., 'kde') supports a 'data' method
   *   that returns numerical sample points from which the extent can be deduced.
   * @param {number} [params.steps=100] - The number of sampling steps.
   */
  function Density(params) {
    vegaDataflow.Transform.call(this, null, params);
  }

  var distributions = [
    {
      "key": {"function": "normal"},
      "params": [
        { "name": "mean", "type": "number", "default": 0 },
        { "name": "stdev", "type": "number", "default": 1 }
      ]
    },
    {
      "key": {"function": "uniform"},
      "params": [
        { "name": "min", "type": "number", "default": 0 },
        { "name": "max", "type": "number", "default": 1 }
      ]
    },
    {
      "key": {"function": "kde"},
      "params": [
        { "name": "field", "type": "field", "required": true },
        { "name": "from", "type": "data" },
        { "name": "bandwidth", "type": "number", "default": 0 }
      ]
    }
  ];

  var mixture = {
    "key": {"function": "mixture"},
    "params": [
      { "name": "distributions", "type": "param", "array": true,
        "params": distributions },
      { "name": "weights", "type": "number", "array": true }
    ]
  };

  Density.Definition = {
    "type": "Density",
    "metadata": {"generates": true},
    "params": [
      { "name": "extent", "type": "number", "array": true, "length": 2 },
      { "name": "steps", "type": "number", "default": 100 },
      { "name": "method", "type": "string", "default": "pdf",
        "values": ["pdf", "cdf"] },
      { "name": "distribution", "type": "param",
        "params": distributions.concat(mixture) },
      { "name": "as", "type": "string", "array": true,
        "default": ["value", "density"] }
    ]
  };

  var prototype$6 = vegaUtil.inherits(Density, vegaDataflow.Transform);

  prototype$6.transform = function(_, pulse) {
    var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);

    if (!this.value || pulse.changed() || _.modified()) {
      var dist = parse(_.distribution, source(pulse)),
          method = _.method || 'pdf';

      if (method !== 'pdf' && method !== 'cdf') {
        vegaUtil.error('Invalid density method: ' + method);
      }
      if (!_.extent && !dist.data) {
        vegaUtil.error('Missing density extent parameter.');
      }
      method = dist[method];

      var as = _.as || ['value', 'density'],
          domain = _.extent || d3Array.extent(dist.data()),
          step = (domain[1] - domain[0]) / (_.steps || 100),
          values = d3Array.range(domain[0], domain[1] + step/2, step)
            .map(function(v) {
              var tuple = {};
              tuple[as[0]] = v;
              tuple[as[1]] = method(v);
              return vegaDataflow.ingest(tuple);
            });

      if (this.value) out.rem = this.value;
      this.value = out.add = out.source = values;
    }

    return out;
  };

  function source(pulse) {
    return function() { return pulse.materialize(pulse.SOURCE).source; };
  }

  /**
   * Wraps an expression function with access to external parameters.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function} params.expr - The expression function. The
   *  function should accept both a datum and a parameter object.
   *  This operator's value will be a new function that wraps the
   *  expression function with access to this operator's parameters.
   */
  function Expression(params) {
    vegaDataflow.Operator.call(this, null, update$1, params);
    this.modified(true);
  }

  vegaUtil.inherits(Expression, vegaDataflow.Operator);

  function update$1(_) {
    var expr = _.expr;
    return this.value && !_.modified('expr')
      ? this.value
      : vegaUtil.accessor(
          function(datum) { return expr(datum, _); },
          vegaUtil.accessorFields(expr),
          vegaUtil.accessorName(expr)
        );
  }

  /**
   * Computes extents (min/max) for a data field.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - The field over which to compute extends.
   */
  function Extent(params) {
    vegaDataflow.Transform.call(this, [undefined, undefined], params);
  }

  Extent.Definition = {
    "type": "Extent",
    "metadata": {},
    "params": [
      { "name": "field", "type": "field", "required": true }
    ]
  };

  var prototype$7 = vegaUtil.inherits(Extent, vegaDataflow.Transform);

  prototype$7.transform = function(_, pulse) {
    var extent = this.value,
        field = _.field,
        min = extent[0],
        max = extent[1],
        mod;

    mod = pulse.changed()
       || pulse.modified(field.fields)
       || _.modified('field');

    if (mod || min == null) {
      min = +Infinity;
      max = -Infinity;
    }

    pulse.visit(mod ? pulse.SOURCE : pulse.ADD, function(t) {
      var v = field(t);
      if (v != null) {
        // coerce to number
        v = +v;
        // NaNs will fail all comparisons!
        if (v < min) min = v;
        if (v > max) max = v;
      }
    });

    if (!isFinite(min) || !isFinite(max)) {
      min = max = undefined;
    }
    this.value = [min, max];
  };

  /**
   * Provides a bridge between a parent transform and a target subflow that
   * consumes only a subset of the tuples that pass through the parent.
   * @constructor
   * @param {Pulse} pulse - A pulse to use as the value of this operator.
   * @param {Transform} parent - The parent transform (typically a Facet instance).
   * @param {Transform} target - A transform that receives the subflow of tuples.
   */
  function Subflow(pulse, parent) {
    vegaDataflow.Operator.call(this, pulse);
    this.parent = parent;
  }

  var prototype$8 = vegaUtil.inherits(Subflow, vegaDataflow.Operator);

  prototype$8.connect = function(target) {
    this.targets().add(target);
    return (target.source = this);
  };

  /**
   * Add an 'add' tuple to the subflow pulse.
   * @param {Tuple} t - The tuple being added.
   */
  prototype$8.add = function(t) {
    this.value.add.push(t);
  };

  /**
   * Add a 'rem' tuple to the subflow pulse.
   * @param {Tuple} t - The tuple being removed.
   */
  prototype$8.rem = function(t) {
    this.value.rem.push(t);
  };

  /**
   * Add a 'mod' tuple to the subflow pulse.
   * @param {Tuple} t - The tuple being modified.
   */
  prototype$8.mod = function(t) {
    this.value.mod.push(t);
  };

  /**
   * Re-initialize this operator's pulse value.
   * @param {Pulse} pulse - The pulse to copy from.
   * @see Pulse.init
   */
  prototype$8.init = function(pulse) {
    this.value.init(pulse, pulse.NO_SOURCE);
  };

  /**
   * Evaluate this operator. This method overrides the
   * default behavior to simply return the contained pulse value.
   * @return {Pulse}
   */
  prototype$8.evaluate = function() {
    // assert: this.value.stamp === pulse.stamp
    return this.value;
  };

  /**
   * Facets a dataflow into a set of subflows based on a key.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(Dataflow, string): Operator} params.subflow - A function
   *   that generates a subflow of operators and returns its root operator.
   * @param {function(object): *} params.key - The key field to facet by.
   */
  function Facet(params) {
    vegaDataflow.Transform.call(this, {}, params);
    this._keys = vegaUtil.fastmap(); // cache previously calculated key values

    // keep track of active subflows, use as targets array for listeners
    // this allows us to limit propagation to only updated subflows
    var a = this._targets = [];
    a.active = 0;
    a.forEach = function(f) {
      for (var i=0, n=a.active; i<n; ++i) f(a[i], i, a);
    };
  }

  var prototype$9 = vegaUtil.inherits(Facet, vegaDataflow.Transform);

  prototype$9.activate = function(flow) {
    this._targets[this._targets.active++] = flow;
  };

  prototype$9.subflow = function(key, flow, pulse, parent) {
    var flows = this.value,
        sf = flows.hasOwnProperty(key) && flows[key],
        df, p;

    if (!sf) {
      p = parent || (p = this._group[key]) && p.tuple;
      df = pulse.dataflow;
      sf = df.add(new Subflow(pulse.fork(pulse.NO_SOURCE), this))
        .connect(flow(df, key, p));
      flows[key] = sf;
      this.activate(sf);
    } else if (sf.value.stamp < pulse.stamp) {
      sf.init(pulse);
      this.activate(sf);
    }

    return sf;
  };

  prototype$9.transform = function(_, pulse) {
    var df = pulse.dataflow,
        self = this,
        key = _.key,
        flow = _.subflow,
        cache = this._keys,
        rekey = _.modified('key');

    function subflow(key) {
      return self.subflow(key, flow, pulse);
    }

    this._group = _.group || {};
    this._targets.active = 0; // reset list of active subflows

    pulse.visit(pulse.REM, function(t) {
      var id = vegaDataflow.tupleid(t),
          k = cache.get(id);
      if (k !== undefined) {
        cache.delete(id);
        subflow(k).rem(t);
      }
    });

    pulse.visit(pulse.ADD, function(t) {
      var k = key(t);
      cache.set(vegaDataflow.tupleid(t), k);
      subflow(k).add(t);
    });

    if (rekey || pulse.modified(key.fields)) {
      pulse.visit(pulse.MOD, function(t) {
        var id = vegaDataflow.tupleid(t),
            k0 = cache.get(id),
            k1 = key(t);
        if (k0 === k1) {
          subflow(k1).mod(t);
        } else {
          cache.set(id, k1);
          subflow(k0).rem(t);
          subflow(k1).add(t);
        }
      });
    } else if (pulse.changed(pulse.MOD)) {
      pulse.visit(pulse.MOD, function(t) {
        subflow(cache.get(vegaDataflow.tupleid(t))).mod(t);
      });
    }

    if (rekey) {
      pulse.visit(pulse.REFLOW, function(t) {
        var id = vegaDataflow.tupleid(t),
            k0 = cache.get(id),
            k1 = key(t);
        if (k0 !== k1) {
          cache.set(id, k1);
          subflow(k0).rem(t);
          subflow(k1).add(t);
        }
      });
    }

    if (cache.empty > df.cleanThreshold) df.runAfter(cache.clean);
    return pulse;
  };

  /**
   * Generates one or more field accessor functions.
   * If the 'name' parameter is an array, an array of field accessors
   * will be created and the 'as' parameter will be ignored.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {string} params.name - The field name(s) to access.
   * @param {string} params.as - The accessor function name.
   */
  function Field(params) {
    vegaDataflow.Operator.call(this, null, update$2, params);
  }

  vegaUtil.inherits(Field, vegaDataflow.Operator);

  function update$2(_) {
    return (this.value && !_.modified()) ? this.value
      : vegaUtil.isArray(_.name) ? vegaUtil.array(_.name).map(function(f) { return vegaUtil.field(f); })
      : vegaUtil.field(_.name, _.as);
  }

  /**
   * Filters data tuples according to a predicate function.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.expr - The predicate expression function
   *   that determines a tuple's filter status. Truthy values pass the filter.
   */
  function Filter(params) {
    vegaDataflow.Transform.call(this, vegaUtil.fastmap(), params);
  }

  Filter.Definition = {
    "type": "Filter",
    "metadata": {"changes": true},
    "params": [
      { "name": "expr", "type": "expr", "required": true }
    ]
  };

  var prototype$a = vegaUtil.inherits(Filter, vegaDataflow.Transform);

  prototype$a.transform = function(_, pulse) {
    var df = pulse.dataflow,
        cache = this.value, // cache ids of filtered tuples
        output = pulse.fork(),
        add = output.add,
        rem = output.rem,
        mod = output.mod,
        test = _.expr,
        isMod = true;

    pulse.visit(pulse.REM, function(t) {
      var id = vegaDataflow.tupleid(t);
      if (!cache.has(id)) rem.push(t);
      else cache.delete(id);
    });

    pulse.visit(pulse.ADD, function(t) {
      if (test(t, _)) add.push(t);
      else cache.set(vegaDataflow.tupleid(t), 1);
    });

    function revisit(t) {
      var id = vegaDataflow.tupleid(t),
          b = test(t, _),
          s = cache.get(id);
      if (b && s) {
        cache.delete(id);
        add.push(t);
      } else if (!b && !s) {
        cache.set(id, 1);
        rem.push(t);
      } else if (isMod && b && !s) {
        mod.push(t);
      }
    }

    pulse.visit(pulse.MOD, revisit);

    if (_.modified()) {
      isMod = false;
      pulse.visit(pulse.REFLOW, revisit);
    }

    if (cache.empty > df.cleanThreshold) df.runAfter(cache.clean);
    return output;
  };

  // use either provided alias or accessor field name
  function fieldNames(fields, as) {
    if (!fields) return null;
    return fields.map(function(f, i) {
      return as[i] || vegaUtil.accessorName(f);
    });
  }

  /**
   * Flattens array-typed field values into new data objects.
   * If multiple fields are specified, they are treated as parallel arrays,
   * with output values included for each matching index (or null if missing).
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Array<function(object): *>} params.fields - An array of field
   *   accessors for the tuple fields that should be flattened.
   * @param {Array<string>} [params.as] - Output field names for flattened
   *   array fields. Any unspecified fields will use the field name provided
   *   by the fields accessors.
   */
  function Flatten(params) {
    vegaDataflow.Transform.call(this, [], params);
  }

  Flatten.Definition = {
    "type": "Flatten",
    "metadata": {"generates": true},
    "params": [
      { "name": "fields", "type": "field", "array": true, "required": true },
      { "name": "as", "type": "string", "array": true }
    ]
  };

  var prototype$b = vegaUtil.inherits(Flatten, vegaDataflow.Transform);

  prototype$b.transform = function(_, pulse) {
    var out = pulse.fork(pulse.NO_SOURCE),
        fields = _.fields,
        as = fieldNames(fields, _.as || []),
        m = as.length;

    // remove any previous results
    out.rem = this.value;

    // generate flattened tuples
    pulse.visit(pulse.SOURCE, function(t) {
      var arrays = fields.map(function(f) { return f(t); }),
          maxlen = arrays.reduce(function(l, a) { return Math.max(l, a.length); }, 0),
          i = 0, j, d, v;

      for (; i<maxlen; ++i) {
        d = vegaDataflow.derive(t);
        for (j=0; j<m; ++j) {
          d[as[j]] = (v = arrays[j][i]) == null ? null : v;
        }
        out.add.push(d);
      }
    });

    this.value = out.source = out.add;
    return out.modifies(as);
  };

  /**
   * Folds one more tuple fields into multiple tuples in which the field
   * name and values are available under new 'key' and 'value' fields.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.fields - An array of field accessors
   *   for the tuple fields that should be folded.
   * @param {Array<string>} [params.as] - Output field names for folded key
   *   and value fields, defaults to ['key', 'value'].
   */
  function Fold(params) {
    vegaDataflow.Transform.call(this, [], params);
  }

  Fold.Definition = {
    "type": "Fold",
    "metadata": {"generates": true},
    "params": [
      { "name": "fields", "type": "field", "array": true, "required": true },
      { "name": "as", "type": "string", "array": true, "length": 2, "default": ["key", "value"] }
    ]
  };

  var prototype$c = vegaUtil.inherits(Fold, vegaDataflow.Transform);

  prototype$c.transform = function(_, pulse) {
    var out = pulse.fork(pulse.NO_SOURCE),
        fields = _.fields,
        fnames = fields.map(vegaUtil.accessorName),
        as = _.as || ['key', 'value'],
        k = as[0],
        v = as[1],
        n = fields.length;

    out.rem = this.value;

    pulse.visit(pulse.SOURCE, function(t) {
      for (var i=0, d; i<n; ++i) {
        d = vegaDataflow.derive(t);
        d[k] = fnames[i];
        d[v] = fields[i](t);
        out.add.push(d);
      }
    });

    this.value = out.source = out.add;
    return out.modifies(as);
  };

  /**
   * Invokes a function for each data tuple and saves the results as a new field.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.expr - The formula function to invoke for each tuple.
   * @param {string} params.as - The field name under which to save the result.
   * @param {boolean} [params.initonly=false] - If true, the formula is applied to
   *   added tuples only, and does not update in response to modifications.
   */
  function Formula(params) {
    vegaDataflow.Transform.call(this, null, params);
  }

  Formula.Definition = {
    "type": "Formula",
    "metadata": {"modifies": true},
    "params": [
      { "name": "expr", "type": "expr", "required": true },
      { "name": "as", "type": "string", "required": true },
      { "name": "initonly", "type": "boolean" }
    ]
  };

  var prototype$d = vegaUtil.inherits(Formula, vegaDataflow.Transform);

  prototype$d.transform = function(_, pulse) {
    var func = _.expr,
        as = _.as,
        mod = _.modified(),
        flag = _.initonly ? pulse.ADD
          : mod ? pulse.SOURCE
          : pulse.modified(func.fields) ? pulse.ADD_MOD
          : pulse.ADD;

    function set(t) {
      t[as] = func(t, _);
    }

    if (mod) {
      // parameters updated, need to reflow
      pulse = pulse.materialize().reflow(true);
    }

    if (!_.initonly) {
      pulse.modifies(as);
    }

    return pulse.visit(flag, set);
  };

  /**
   * Generates data tuples using a provided generator function.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(Parameters): object} params.generator - A tuple generator
   *   function. This function is given the operator parameters as input.
   *   Changes to any additional parameters will not trigger re-calculation
   *   of previously generated tuples. Only future tuples are affected.
   * @param {number} params.size - The number of tuples to produce.
   */
  function Generate(params) {
    vegaDataflow.Transform.call(this, [], params);
  }

  var prototype$e = vegaUtil.inherits(Generate, vegaDataflow.Transform);

  prototype$e.transform = function(_, pulse) {
    var data = this.value,
        out = pulse.fork(pulse.ALL),
        num = _.size - data.length,
        gen = _.generator,
        add, rem, t;

    if (num > 0) {
      // need more tuples, generate and add
      for (add=[]; --num >= 0;) {
        add.push(t = vegaDataflow.ingest(gen(_)));
        data.push(t);
      }
      out.add = out.add.length
        ? out.materialize(out.ADD).add.concat(add)
        : add;
    } else {
      // need fewer tuples, remove
      rem = data.slice(0, -num);
      out.rem = out.rem.length
        ? out.materialize(out.REM).rem.concat(rem)
        : rem;
      data = data.slice(-num);
    }

    out.source = this.value = data;
    return out;
  };

  var Methods = {
    value: 'value',
    median: d3Array.median,
    mean: d3Array.mean,
    min: d3Array.min,
    max: d3Array.max
  };

  var Empty = [];

  /**
   * Impute missing values.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - The value field to impute.
   * @param {Array<function(object): *>} [params.groupby] - An array of
   *   accessors to determine series within which to perform imputation.
   * @param {function(object): *} params.key - An accessor for a key value.
   *   Each key value should be unique within a group. New tuples will be
   *   imputed for any key values that are not found within a group.
   * @param {Array<*>} [params.keyvals] - Optional array of required key
   *   values. New tuples will be imputed for any key values that are not
   *   found within a group. In addition, these values will be automatically
   *   augmented with the key values observed in the input data.
   * @param {string} [method='value'] - The imputation method to use. One of
   *   'value', 'mean', 'median', 'max', 'min'.
   * @param {*} [value=0] - The constant value to use for imputation
   *   when using method 'value'.
   */
  function Impute(params) {
    vegaDataflow.Transform.call(this, [], params);
  }

  Impute.Definition = {
    "type": "Impute",
    "metadata": {"changes": true},
    "params": [
      { "name": "field", "type": "field", "required": true },
      { "name": "key", "type": "field", "required": true },
      { "name": "keyvals", "array": true },
      { "name": "groupby", "type": "field", "array": true },
      { "name": "method", "type": "enum", "default": "value",
        "values": ["value", "mean", "median", "max", "min"] },
      { "name": "value", "default": 0 }
    ]
  };

  var prototype$f = vegaUtil.inherits(Impute, vegaDataflow.Transform);

  function getValue(_) {
    var m = _.method || Methods.value, v;

    if (Methods[m] == null) {
      vegaUtil.error('Unrecognized imputation method: ' + m);
    } else if (m === Methods.value) {
      v = _.value !== undefined ? _.value : 0;
      return function() { return v; };
    } else {
      return Methods[m];
    }
  }

  function getField(_) {
    var f = _.field;
    return function(t) { return t ? f(t) : NaN; };
  }

  prototype$f.transform = function(_, pulse) {
    var out = pulse.fork(pulse.ALL),
        impute = getValue(_),
        field = getField(_),
        fName = vegaUtil.accessorName(_.field),
        kName = vegaUtil.accessorName(_.key),
        gNames = (_.groupby || []).map(vegaUtil.accessorName),
        groups = partition(pulse.source, _.groupby, _.key, _.keyvals),
        curr = [],
        prev = this.value,
        m = groups.domain.length,
        group, value, gVals, kVal, g, i, j, l, n, t;

    for (g=0, l=groups.length; g<l; ++g) {
      group = groups[g];
      gVals = group.values;
      value = NaN;

      // add tuples for missing values
      for (j=0; j<m; ++j) {
        if (group[j] != null) continue;
        kVal = groups.domain[j];

        t = {_impute: true};
        for (i=0, n=gVals.length; i<n; ++i) t[gNames[i]] = gVals[i];
        t[kName] = kVal;
        t[fName] = isNaN(value) ? (value = impute(group, field)) : value;

        curr.push(vegaDataflow.ingest(t));
      }
    }

    // update pulse with imputed tuples
    if (curr.length) out.add = out.materialize(out.ADD).add.concat(curr);
    if (prev.length) out.rem = out.materialize(out.REM).rem.concat(prev);
    this.value = curr;

    return out;
  };

  function partition(data, groupby, key, keyvals) {
    var get = function(f) { return f(t); },
        groups = [],
        domain = keyvals ? keyvals.slice() : [],
        kMap = {},
        gMap = {}, gVals, gKey,
        group, i, j, k, n, t;

    domain.forEach(function(k, i) { kMap[k] = i + 1; });

    for (i=0, n=data.length; i<n; ++i) {
      t = data[i];
      k = key(t);
      j = kMap[k] || (kMap[k] = domain.push(k));

      gKey = (gVals = groupby ? groupby.map(get) : Empty) + '';
      if (!(group = gMap[gKey])) {
        group = (gMap[gKey] = []);
        groups.push(group);
        group.values = gVals;
      }
      group[j-1] = t;
    }

    groups.domain = domain;
    return groups;
  }

  /**
   * Extend input tuples with aggregate values.
   * Calcuates aggregate values and joins them with the input stream.
   * @constructor
   */
  function JoinAggregate(params) {
    Aggregate.call(this, params);
  }

  JoinAggregate.Definition = {
    "type": "JoinAggregate",
    "metadata": {"modifies": true},
    "params": [
      { "name": "groupby", "type": "field", "array": true },
      { "name": "fields", "type": "field", "null": true, "array": true },
      { "name": "ops", "type": "enum", "array": true, "values": ValidAggregateOps },
      { "name": "as", "type": "string", "null": true, "array": true },
      { "name": "key", "type": "field" }
    ]
  };

  var prototype$g = vegaUtil.inherits(JoinAggregate, Aggregate);

  prototype$g.transform = function(_, pulse) {
    var aggr = this,
        mod = _.modified(),
        cells;

    // process all input tuples to calculate aggregates
    if (aggr.value && (mod || pulse.modified(aggr._inputs))) {
      cells = aggr.value = mod ? aggr.init(_) : {};
      pulse.visit(pulse.SOURCE, function(t) { aggr.add(t); });
    } else {
      cells = aggr.value = aggr.value || this.init(_);
      pulse.visit(pulse.REM, function(t) { aggr.rem(t); });
      pulse.visit(pulse.ADD, function(t) { aggr.add(t); });
    }

    // update aggregation cells
    aggr.changes();

    // write aggregate values to input tuples
    pulse.visit(pulse.SOURCE, function(t) {
      vegaUtil.extend(t, cells[aggr.cellkey(t)].tuple);
    });

    return pulse.reflow(mod).modifies(this._outputs);
  };

  prototype$g.changes = function() {
    var adds = this._adds,
        mods = this._mods,
        i, n;

    for (i=0, n=this._alen; i<n; ++i) {
      this.celltuple(adds[i]);
      adds[i] = null; // for garbage collection
    }

    for (i=0, n=this._mlen; i<n; ++i) {
      this.celltuple(mods[i]);
      mods[i] = null; // for garbage collection
    }

    this._alen = this._mlen = 0; // reset list of active cells
  };

  /**
   * Generates a key function.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Array<string>} params.fields - The field name(s) for the key function.
   * @param {boolean} params.flat - A boolean flag indicating if the field names
   *  should be treated as flat property names, side-stepping nested field
   *  lookups normally indicated by dot or bracket notation.
   */
  function Key(params) {
    vegaDataflow.Operator.call(this, null, update$3, params);
  }

  vegaUtil.inherits(Key, vegaDataflow.Operator);

  function update$3(_) {
    return (this.value && !_.modified()) ? this.value : vegaUtil.key(_.fields, _.flat);
  }

  /**
   * Load and parse data from an external source. Marshalls parameter
   * values and then invokes the Dataflow request method.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {string} params.url - The URL to load from.
   * @param {object} params.format - The data format options.
   */
  function Load(params) {
    vegaDataflow.Transform.call(this, null, params);
  }

  var prototype$h = vegaUtil.inherits(Load, vegaDataflow.Transform);

  prototype$h.transform = function(_, pulse) {
    pulse.dataflow.request(this.target, _.url, _.format);
  };

  /**
   * Extend tuples by joining them with values from a lookup table.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Map} params.index - The lookup table map.
   * @param {Array<function(object): *} params.fields - The fields to lookup.
   * @param {Array<string>} params.as - Output field names for each lookup value.
   * @param {*} [params.default] - A default value to use if lookup fails.
   */
  function Lookup(params) {
    vegaDataflow.Transform.call(this, {}, params);
  }

  Lookup.Definition = {
    "type": "Lookup",
    "metadata": {"modifies": true},
    "params": [
      { "name": "index", "type": "index", "params": [
          {"name": "from", "type": "data", "required": true },
          {"name": "key", "type": "field", "required": true }
        ] },
      { "name": "values", "type": "field", "array": true },
      { "name": "fields", "type": "field", "array": true, "required": true },
      { "name": "as", "type": "string", "array": true },
      { "name": "default", "default": null }
    ]
  };

  var prototype$i = vegaUtil.inherits(Lookup, vegaDataflow.Transform);

  prototype$i.transform = function(_, pulse) {
    var out = pulse,
        as = _.as,
        keys = _.fields,
        index = _.index,
        values = _.values,
        defaultValue = _.default==null ? null : _.default,
        reset = _.modified(),
        flag = reset ? pulse.SOURCE : pulse.ADD,
        n = keys.length,
        set, m, mods;

    if (values) {
      m = values.length;

      if (n > 1 && !as) {
        vegaUtil.error('Multi-field lookup requires explicit "as" parameter.');
      }
      if (as && as.length !== n * m) {
        vegaUtil.error('The "as" parameter has too few output field names.');
      }
      as = as || values.map(vegaUtil.accessorName);

      set = function(t) {
        for (var i=0, k=0, j, v; i<n; ++i) {
          v = index.get(keys[i](t));
          if (v == null) for (j=0; j<m; ++j, ++k) t[as[k]] = defaultValue;
          else for (j=0; j<m; ++j, ++k) t[as[k]] = values[j](v);
        }
      };
    } else {
      if (!as) {
        vegaUtil.error('Missing output field names.');
      }

      set = function(t) {
        for (var i=0, v; i<n; ++i) {
          v = index.get(keys[i](t));
          t[as[i]] = v==null ? defaultValue : v;
        }
      };
    }

    if (reset) {
      out = pulse.reflow(true);
    } else {
      mods = keys.some(function(k) { return pulse.modified(k.fields); });
      flag |= (mods ? pulse.MOD : 0);
    }
    pulse.visit(flag, set);

    return out.modifies(as);
  };

  /**
   * Computes global min/max extents over a collection of extents.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Array<Array<number>>} params.extents - The input extents.
   */
  function MultiExtent(params) {
    vegaDataflow.Operator.call(this, null, update$4, params);
  }

  vegaUtil.inherits(MultiExtent, vegaDataflow.Operator);

  function update$4(_) {
    if (this.value && !_.modified()) {
      return this.value;
    }

    var min = +Infinity,
        max = -Infinity,
        ext = _.extents,
        i, n, e;

    for (i=0, n=ext.length; i<n; ++i) {
      e = ext[i];
      if (e[0] < min) min = e[0];
      if (e[1] > max) max = e[1];
    }
    return [min, max];
  }

  /**
   * Merge a collection of value arrays.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Array<Array<*>>} params.values - The input value arrrays.
   */
  function MultiValues(params) {
    vegaDataflow.Operator.call(this, null, update$5, params);
  }

  vegaUtil.inherits(MultiValues, vegaDataflow.Operator);

  function update$5(_) {
    return (this.value && !_.modified())
      ? this.value
      : _.values.reduce(function(data, _) { return data.concat(_); }, []);
  }

  /**
   * Operator whose value is simply its parameter hash. This operator is
   * useful for enabling reactive updates to values of nested objects.
   * @constructor
   * @param {object} params - The parameters for this operator.
   */
  function Params(params) {
    vegaDataflow.Transform.call(this, null, params);
  }

  vegaUtil.inherits(Params, vegaDataflow.Transform);

  Params.prototype.transform = function(_, pulse) {
    this.modified(_.modified());
    this.value = _;
    return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS); // do not pass tuples
  };

  /**
   * Aggregate and pivot selected field values to become new fields.
   * This operator is useful to construction cross-tabulations.
   * @constructor
   * @param {Array<function(object): *>} [params.groupby] - An array of accessors
   *  to groupby. These fields act just like groupby fields of an Aggregate transform.
   * @param {function(object): *} params.field - The field to pivot on. The unique
   *  values of this field become new field names in the output stream.
   * @param {function(object): *} params.value - The field to populate pivoted fields.
   *  The aggregate values of this field become the values of the new pivoted fields.
   * @param {string} [params.op] - The aggregation operation for the value field,
   *  applied per cell in the output stream. The default is "sum".
   * @param {number} [params.limit] - An optional parameter indicating the maximum
   *  number of pivoted fields to generate. The pivoted field names are sorted in
   *  ascending order prior to enforcing the limit.
   */
  function Pivot(params) {
    Aggregate.call(this, params);
  }

  Pivot.Definition = {
    "type": "Pivot",
    "metadata": {"generates": true, "changes": true},
    "params": [
      { "name": "groupby", "type": "field", "array": true },
      { "name": "field", "type": "field", "required": true },
      { "name": "value", "type": "field", "required": true },
      { "name": "op", "type": "enum", "values": ValidAggregateOps, "default": "sum" },
      { "name": "limit", "type": "number", "default": 0 },
      { "name": "key", "type": "field" }
    ]
  };

  var prototype$j = vegaUtil.inherits(Pivot, Aggregate);

  prototype$j._transform = prototype$j.transform;

  prototype$j.transform = function(_, pulse) {
    return this._transform(aggregateParams(_, pulse), pulse);
  };

  // Shoehorn a pivot transform into an aggregate transform!
  // First collect all unique pivot field values.
  // Then generate aggregate fields for each output pivot field.
  function aggregateParams(_, pulse) {
    var key    = _.field,
    value  = _.value,
        op     = (_.op === 'count' ? '__count__' : _.op) || 'sum',
        fields = vegaUtil.accessorFields(key).concat(vegaUtil.accessorFields(value)),
        keys   = pivotKeys(key, _.limit || 0, pulse);

    return {
      key:      _.key,
      groupby:  _.groupby,
      ops:      keys.map(function() { return op; }),
      fields:   keys.map(function(k) { return get(k, key, value, fields); }),
      as:       keys.map(function(k) { return k + ''; }),
      modified: _.modified.bind(_)
    };
  }

  // Generate aggregate field accessor.
  // Output NaN for non-existent values; aggregator will ignore!
  function get(k, key, value, fields) {
    return vegaUtil.accessor(
      function(d) { return key(d) === k ? value(d) : NaN; },
      fields,
      k + ''
    );
  }

  // Collect (and optionally limit) all unique pivot values.
  function pivotKeys(key, limit, pulse) {
    var map = {},
        list = [];

    pulse.visit(pulse.SOURCE, function(t) {
      var k = key(t);
      if (!map[k]) {
        map[k] = 1;
        list.push(k);
      }
    });

    // TODO? Move this comparator to vega-util?
    list.sort(function(u, v) {
      return (u<v||u==null) && v!=null ? -1
        : (u>v||v==null) && u!=null ? 1
        : ((v=v instanceof Date?+v:v),(u=u instanceof Date?+u:u))!==u && v===v ? -1
        : v!==v && u===u ? 1 : 0;
    });

    return limit ? list.slice(0, limit) : list;
  }

  /**
   * Partitions pre-faceted data into tuple subflows.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(Dataflow, string): Operator} params.subflow - A function
   *   that generates a subflow of operators and returns its root operator.
   * @param {function(object): Array<object>} params.field - The field
   *   accessor for an array of subflow tuple objects.
   */
  function PreFacet(params) {
    Facet.call(this, params);
  }

  var prototype$k = vegaUtil.inherits(PreFacet, Facet);

  prototype$k.transform = function(_, pulse) {
    var self = this,
        flow = _.subflow,
        field = _.field;

    if (_.modified('field') || field && pulse.modified(vegaUtil.accessorFields(field))) {
      vegaUtil.error('PreFacet does not support field modification.');
    }

    this._targets.active = 0; // reset list of active subflows

    pulse.visit(pulse.MOD, function(t) {
      var sf = self.subflow(vegaDataflow.tupleid(t), flow, pulse, t);
      field ? field(t).forEach(function(_) { sf.mod(_); }) : sf.mod(t);
    });

    pulse.visit(pulse.ADD, function(t) {
      var sf = self.subflow(vegaDataflow.tupleid(t), flow, pulse, t);
      field ? field(t).forEach(function(_) { sf.add(vegaDataflow.ingest(_)); }) : sf.add(t);
    });

    pulse.visit(pulse.REM, function(t) {
      var sf = self.subflow(vegaDataflow.tupleid(t), flow, pulse, t);
      field ? field(t).forEach(function(_) { sf.rem(_); }) : sf.rem(t);
    });

    return pulse;
  };

  /**
   * Performs a relational projection, copying selected fields from source
   * tuples to a new set of derived tuples.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Array<function(object): *} params.fields - The fields to project,
   *   as an array of field accessors. If unspecified, all fields will be
   *   copied with names unchanged.
   * @param {Array<string>} [params.as] - Output field names for each projected
   *   field. Any unspecified fields will use the field name provided by
   *   the field accessor.
   */
  function Project(params) {
    vegaDataflow.Transform.call(this, null, params);
  }

  Project.Definition = {
    "type": "Project",
    "metadata": {"generates": true, "changes": true},
    "params": [
      { "name": "fields", "type": "field", "array": true },
      { "name": "as", "type": "string", "null": true, "array": true },
    ]
  };

  var prototype$l = vegaUtil.inherits(Project, vegaDataflow.Transform);

  prototype$l.transform = function(_, pulse) {
    var fields = _.fields,
        as = fieldNames(_.fields, _.as || []),
        derive = fields
          ? function(s, t) { return project(s, t, fields, as); }
          : vegaDataflow.rederive,
        out, lut;

    if (this.value) {
      lut = this.value;
    } else {
      pulse = pulse.addAll();
      lut = this.value = {};
    }

    out = pulse.fork(pulse.NO_SOURCE);

    pulse.visit(pulse.REM, function(t) {
      var id = vegaDataflow.tupleid(t);
      out.rem.push(lut[id]);
      lut[id] = null;
    });

    pulse.visit(pulse.ADD, function(t) {
      var dt = derive(t, vegaDataflow.ingest({}));
      lut[vegaDataflow.tupleid(t)] = dt;
      out.add.push(dt);
    });

    pulse.visit(pulse.MOD, function(t) {
      out.mod.push(derive(t, lut[vegaDataflow.tupleid(t)]));
    });

    return out;
  };

  function project(s, t, fields, as) {
    for (var i=0, n=fields.length; i<n; ++i) {
      t[as[i]] = fields[i](s);
    }
    return t;
  }

  /**
   * Proxy the value of another operator as a pure signal value.
   * Ensures no tuples are propagated.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {*} params.value - The value to proxy, becomes the value of this operator.
   */
  function Proxy(params) {
    vegaDataflow.Transform.call(this, null, params);
  }

  var prototype$m = vegaUtil.inherits(Proxy, vegaDataflow.Transform);

  prototype$m.transform = function(_, pulse) {
    this.value = _.value;
    return _.modified('value')
      ? pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS)
      : pulse.StopPropagation;
  };

  /**
   * Relays a data stream between data processing pipelines.
   * If the derive parameter is set, this transform will create derived
   * copies of observed tuples. This provides derived data streams in which
   * modifications to the tuples do not pollute an upstream data source.
   * @param {object} params - The parameters for this operator.
   * @param {number} [params.derive=false] - Boolean flag indicating if
   *   the transform should make derived copies of incoming tuples.
   * @constructor
   */
  function Relay(params) {
    vegaDataflow.Transform.call(this, null, params);
  }

  var prototype$n = vegaUtil.inherits(Relay, vegaDataflow.Transform);

  prototype$n.transform = function(_, pulse) {
    var out, lut;

    if (this.value) {
      lut = this.value;
    } else {
      out = pulse = pulse.addAll();
      lut = this.value = {};
    }

    if (_.derive) {
      out = pulse.fork(pulse.NO_SOURCE);

      pulse.visit(pulse.REM, function(t) {
        var id = vegaDataflow.tupleid(t);
        out.rem.push(lut[id]);
        lut[id] = null;
      });

      pulse.visit(pulse.ADD, function(t) {
        var dt = vegaDataflow.derive(t);
        lut[vegaDataflow.tupleid(t)] = dt;
        out.add.push(dt);
      });

      pulse.visit(pulse.MOD, function(t) {
        out.mod.push(vegaDataflow.rederive(t, lut[vegaDataflow.tupleid(t)]));
      });
    }

    return out;
  };

  /**
   * Samples tuples passing through this operator.
   * Uses reservoir sampling to maintain a representative sample.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {number} [params.size=1000] - The maximum number of samples.
   */
  function Sample(params) {
    vegaDataflow.Transform.call(this, [], params);
    this.count = 0;
  }

  Sample.Definition = {
    "type": "Sample",
    "metadata": {},
    "params": [
      { "name": "size", "type": "number", "default": 1000 }
    ]
  };

  var prototype$o = vegaUtil.inherits(Sample, vegaDataflow.Transform);

  prototype$o.transform = function(_, pulse) {
    var out = pulse.fork(pulse.NO_SOURCE),
        mod = _.modified('size'),
        num = _.size,
        res = this.value,
        cnt = this.count,
        cap = 0,
        map = res.reduce(function(m, t) {
          m[vegaDataflow.tupleid(t)] = 1;
          return m;
        }, {});

    // sample reservoir update function
    function update(t) {
      var p, idx;

      if (res.length < num) {
        res.push(t);
      } else {
        idx = ~~((cnt + 1) * vegaStatistics.random());
        if (idx < res.length && idx >= cap) {
          p = res[idx];
          if (map[vegaDataflow.tupleid(p)]) out.rem.push(p); // eviction
          res[idx] = t;
        }
      }
      ++cnt;
    }

    if (pulse.rem.length) {
      // find all tuples that should be removed, add to output
      pulse.visit(pulse.REM, function(t) {
        var id = vegaDataflow.tupleid(t);
        if (map[id]) {
          map[id] = -1;
          out.rem.push(t);
        }
        --cnt;
      });

      // filter removed tuples out of the sample reservoir
      res = res.filter(function(t) { return map[vegaDataflow.tupleid(t)] !== -1; });
    }

    if ((pulse.rem.length || mod) && res.length < num && pulse.source) {
      // replenish sample if backing data source is available
      cap = cnt = res.length;
      pulse.visit(pulse.SOURCE, function(t) {
        // update, but skip previously sampled tuples
        if (!map[vegaDataflow.tupleid(t)]) update(t);
      });
      cap = -1;
    }

    if (mod && res.length > num) {
      for (var i=0, n=res.length-num; i<n; ++i) {
        map[vegaDataflow.tupleid(res[i])] = -1;
        out.rem.push(res[i]);
      }
      res = res.slice(n);
    }

    if (pulse.mod.length) {
      // propagate modified tuples in the sample reservoir
      pulse.visit(pulse.MOD, function(t) {
        if (map[vegaDataflow.tupleid(t)]) out.mod.push(t);
      });
    }

    if (pulse.add.length) {
      // update sample reservoir
      pulse.visit(pulse.ADD, update);
    }

    if (pulse.add.length || cap < 0) {
      // output newly added tuples
      out.add = res.filter(function(t) { return !map[vegaDataflow.tupleid(t)]; });
    }

    this.count = cnt;
    this.value = out.source = res;
    return out;
  };

  /**
   * Generates data tuples for a specified sequence range of numbers.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {number} params.start - The first number in the sequence.
   * @param {number} params.stop - The last number (exclusive) in the sequence.
   * @param {number} [params.step=1] - The step size between numbers in the sequence.
   */
  function Sequence(params) {
    vegaDataflow.Transform.call(this, null, params);
  }

  Sequence.Definition = {
    "type": "Sequence",
    "metadata": {"changes": true},
    "params": [
      { "name": "start", "type": "number", "required": true },
      { "name": "stop", "type": "number", "required": true },
      { "name": "step", "type": "number", "default": 1 },
      { "name": "as", "type": "string", "default": "data" }
    ]
  };

  var prototype$p = vegaUtil.inherits(Sequence, vegaDataflow.Transform);

  prototype$p.transform = function(_, pulse) {
    if (this.value && !_.modified()) return;

    var out = pulse.materialize().fork(pulse.MOD),
        as = _.as || 'data';

    out.rem = this.value ? pulse.rem.concat(this.value) : pulse.rem;

    this.value = d3Array.range(_.start, _.stop, _.step || 1).map(function(v) {
      var t = {};
      t[as] = v;
      return vegaDataflow.ingest(t);
    });

    out.add = pulse.add.concat(this.value);

    return out;
  };

  /**
   * Propagates a new pulse without any tuples so long as the input
   * pulse contains some added, removed or modified tuples.
   * @param {object} params - The parameters for this operator.
   * @constructor
   */
  function Sieve(params) {
    vegaDataflow.Transform.call(this, null, params);
    this.modified(true); // always treat as modified
  }

  var prototype$q = vegaUtil.inherits(Sieve, vegaDataflow.Transform);

  prototype$q.transform = function(_, pulse) {
    this.value = pulse.source;
    return pulse.changed()
      ? pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS)
      : pulse.StopPropagation;
  };

  /**
   * An index that maps from unique, string-coerced, field values to tuples.
   * Assumes that the field serves as a unique key with no duplicate values.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - The field accessor to index.
   */
  function TupleIndex(params) {
    vegaDataflow.Transform.call(this, vegaUtil.fastmap(), params);
  }

  var prototype$r = vegaUtil.inherits(TupleIndex, vegaDataflow.Transform);

  prototype$r.transform = function(_, pulse) {
    var df = pulse.dataflow,
        field = _.field,
        index = this.value,
        mod = true;

    function set(t) { index.set(field(t), t); }

    if (_.modified('field') || pulse.modified(field.fields)) {
      index.clear();
      pulse.visit(pulse.SOURCE, set);
    } else if (pulse.changed()) {
      pulse.visit(pulse.REM, function(t) { index.delete(field(t)); });
      pulse.visit(pulse.ADD, set);
    } else {
      mod = false;
    }

    this.modified(mod);
    if (index.empty > df.cleanThreshold) df.runAfter(index.clean);
    return pulse.fork();
  };

  /**
   * Extracts an array of values. Assumes the source data has already been
   * reduced as needed (e.g., by an upstream Aggregate transform).
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - The domain field to extract.
   * @param {function(*,*): number} [params.sort] - An optional
   *   comparator function for sorting the values. The comparator will be
   *   applied to backing tuples prior to value extraction.
   */
  function Values(params) {
    vegaDataflow.Transform.call(this, null, params);
  }

  var prototype$s = vegaUtil.inherits(Values, vegaDataflow.Transform);

  prototype$s.transform = function(_, pulse) {
    var run = !this.value
      || _.modified('field')
      || _.modified('sort')
      || pulse.changed()
      || (_.sort && pulse.modified(_.sort.fields));

    if (run) {
      this.value = (_.sort
        ? pulse.source.slice().sort(_.sort)
        : pulse.source).map(_.field);
    }
  };

  function WindowOp(op, field, param, as) {
    var fn = WindowOps[op](field, param);
    return {
      init:   fn.init || vegaUtil.zero,
      update: function(w, t) { t[as] = fn.next(w); }
    };
  }

  var WindowOps = {
    row_number: function() {
      return {
        next: function(w) { return w.index + 1; }
      };
    },
    rank: function() {
      var rank;
      return {
        init: function() { rank = 1; },
        next: function(w) {
          var i = w.index,
              data = w.data;
          return (i && w.compare(data[i - 1], data[i])) ? (rank = i + 1) : rank;
        }
      };
    },
    dense_rank: function() {
      var drank;
      return {
        init: function() { drank = 1; },
        next: function(w) {
          var i = w.index,
              d = w.data;
          return (i && w.compare(d[i - 1], d[i])) ? ++drank : drank;
        }
      };
    },
    percent_rank: function() {
      var rank = WindowOps.rank(),
          next = rank.next;
      return {
        init: rank.init,
        next: function(w) {
          return (next(w) - 1) / (w.data.length - 1);
        }
      };
    },
    cume_dist: function() {
      var cume;
      return {
        init: function() { cume = 0; },
        next: function(w) {
          var i = w.index,
              d = w.data,
              c = w.compare;
          if (cume < i) {
            while (i + 1 < d.length && !c(d[i], d[i + 1])) ++i;
            cume = i;
          }
          return (1 + cume) / d.length;
        }
      };
    },
    ntile: function(field, num) {
      num = +num;
      if (!(num > 0)) vegaUtil.error('ntile num must be greater than zero.');
      var cume = WindowOps.cume_dist(),
          next = cume.next;
      return {
        init: cume.init,
        next: function(w) { return Math.ceil(num * next(w)); }
      };
    },

    lag: function(field, offset) {
      offset = +offset || 1;
      return {
        next: function(w) {
          var i = w.index - offset;
          return i >= 0 ? field(w.data[i]) : null;
        }
      };
    },
    lead: function(field, offset) {
      offset = +offset || 1;
      return {
        next: function(w) {
          var i = w.index + offset,
              d = w.data;
          return i < d.length ? field(d[i]) : null;
        }
      };
    },

    first_value: function(field) {
      return {
        next: function(w) { return field(w.data[w.i0]); }
      };
    },
    last_value: function(field) {
      return {
        next: function(w) { return field(w.data[w.i1 - 1]); }
      }
    },
    nth_value: function(field, nth) {
      nth = +nth;
      if (!(nth > 0)) vegaUtil.error('nth_value nth must be greater than zero.');
      return {
        next: function(w) {
          var i = w.i0 + (nth - 1);
          return i < w.i1 ? field(w.data[i]) : null;
        }
      }
    }
  };

  var ValidWindowOps = Object.keys(WindowOps);

  function WindowState(_) {
    var self = this,
        ops = vegaUtil.array(_.ops),
        fields = vegaUtil.array(_.fields),
        params = vegaUtil.array(_.params),
        as = vegaUtil.array(_.as),
        outputs = self.outputs = [],
        windows = self.windows = [],
        inputs = {},
        map = {},
        countOnly = true,
        counts = [],
        measures = [];

    function visitInputs(f) {
      vegaUtil.array(vegaUtil.accessorFields(f)).forEach(function(_) { inputs[_] = 1; });
    }
    visitInputs(_.sort);

    ops.forEach(function(op, i) {
      var field = fields[i],
          mname = vegaUtil.accessorName(field),
          name = measureName(op, mname, as[i]);

      visitInputs(field);
      outputs.push(name);

      // Window operation
      if (WindowOps.hasOwnProperty(op)) {
        windows.push(WindowOp(op, fields[i], params[i], name));
      }

      // Aggregate operation
      else {
        if (field == null && op !== 'count') {
          vegaUtil.error('Null aggregate field specified.');
        }
        if (op === 'count') {
          counts.push(name);
          return;
        }

        countOnly = false;
        var m = map[mname];
        if (!m) {
          m = (map[mname] = []);
          m.field = field;
          measures.push(m);
        }
        m.push(createMeasure(op, name));
      }
    });

    if (counts.length || measures.length) {
      self.cell = cell(measures, counts, countOnly);
    }

    self.inputs = Object.keys(inputs);
  }

  var prototype$t = WindowState.prototype;

  prototype$t.init = function() {
    this.windows.forEach(function(_) { _.init(); });
    if (this.cell) this.cell.init();
  };

  prototype$t.update = function(w, t) {
    var self = this,
        cell = self.cell,
        wind = self.windows,
        data = w.data,
        m = wind && wind.length,
        j;

    if (cell) {
      for (j=w.p0; j<w.i0; ++j) cell.rem(data[j]);
      for (j=w.p1; j<w.i1; ++j) cell.add(data[j]);
      cell.set(t);
    }
    for (j=0; j<m; ++j) wind[j].update(w, t);
  };

  function cell(measures, counts, countOnly) {
    measures = measures.map(function(m) {
      return compileMeasures(m, m.field);
    });

    var cell = {
      num:   0,
      agg:   null,
      store: false,
      count: counts
    };

    if (!countOnly) {
      var n = measures.length,
          a = cell.agg = Array(n),
          i = 0;
      for (; i<n; ++i) a[i] = new measures[i](cell);
    }

    if (cell.store) {
      var store = cell.data = new TupleStore();
    }

    cell.add = function(t) {
      cell.num += 1;
      if (countOnly) return;
      if (store) store.add(t);
      for (var i=0; i<n; ++i) {
        a[i].add(a[i].get(t), t);
      }
    };

    cell.rem = function(t) {
      cell.num -= 1;
      if (countOnly) return;
      if (store) store.rem(t);
      for (var i=0; i<n; ++i) {
        a[i].rem(a[i].get(t), t);
      }
    };

    cell.set = function(t) {
      var i, n;

      // consolidate stored values
      if (store) store.values();

      // update tuple properties
      for (i=0, n=counts.length; i<n; ++i) t[counts[i]] = cell.num;
      if (!countOnly) for (i=0, n=a.length; i<n; ++i) a[i].set(t);
    };

    cell.init = function() {
      cell.num = 0;
      if (store) store.reset();
      for (var i=0; i<n; ++i) a[i].init();
    };

    return cell;
  }

  /**
   * Perform window calculations and write results to the input stream.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(*,*): number} [params.sort] - A comparator function for sorting tuples within a window.
   * @param {Array<function(object): *>} [params.groupby] - An array of accessors by which to partition tuples into separate windows.
   * @param {Array<string>} params.ops - An array of strings indicating window operations to perform.
   * @param {Array<function(object): *>} [params.fields] - An array of accessors
   *   for data fields to use as inputs to window operations.
   * @param {Array<*>} [params.params] - An array of parameter values for window operations.
   * @param {Array<string>} [params.as] - An array of output field names for window operations.
   * @param {Array<number>} [params.frame] - Window frame definition as two-element array.
   * @param {boolean} [params.ignorePeers=false] - If true, base window frame boundaries on row
   *   number alone, ignoring peers with identical sort values. If false (default),
   *   the window boundaries will be adjusted to include peer values.
   */
  function Window(params) {
    vegaDataflow.Transform.call(this, {}, params);
    this._mlen = 0;
    this._mods = [];
  }

  Window.Definition = {
    "type": "Window",
    "metadata": {"modifies": true},
    "params": [
      { "name": "sort", "type": "compare" },
      { "name": "groupby", "type": "field", "array": true },
      { "name": "ops", "type": "enum", "array": true, "values": ValidWindowOps.concat(ValidAggregateOps) },
      { "name": "params", "type": "number", "null": true, "array": true },
      { "name": "fields", "type": "field", "null": true, "array": true },
      { "name": "as", "type": "string", "null": true, "array": true },
      { "name": "frame", "type": "number", "null": true, "array": true, "length": 2, "default": [null, 0] },
      { "name": "ignorePeers", "type": "boolean", "default": false }
    ]
  };

  var prototype$u = vegaUtil.inherits(Window, vegaDataflow.Transform);

  prototype$u.transform = function(_, pulse) {
    var self = this,
        state = self.state,
        mod = _.modified(),
        i, n;

    this.stamp = pulse.stamp;

    // initialize window state
    if (!state || mod) {
      state = self.state = new WindowState(_);
    }

    // retrieve group for a tuple
    var key = groupkey(_.groupby);
    function group(t) { return self.group(key(t)); }

    // partition input tuples
    if (mod || pulse.modified(state.inputs)) {
      self.value = {};
      pulse.visit(pulse.SOURCE, function(t) { group(t).add(t); });
    } else {
      pulse.visit(pulse.REM, function(t) { group(t).remove(t); });
      pulse.visit(pulse.ADD, function(t) { group(t).add(t); });
    }

    // perform window calculations for each modified partition
    for (i=0, n=self._mlen; i<n; ++i) {
      processPartition(self._mods[i], state, _);
    }
    self._mlen = 0;
    self._mods = [];

    // TODO don't reflow everything?
    return pulse.reflow(mod).modifies(state.outputs);
  };

  prototype$u.group = function(key) {
    var self = this,
        group = self.value[key];

    if (!group) {
      group = self.value[key] = SortedList(vegaDataflow.tupleid);
      group.stamp = -1;
    }

    if (group.stamp < self.stamp) {
      group.stamp = self.stamp;
      self._mods[self._mlen++] = group;
    }

    return group;
  };

  function processPartition(list, state, _) {
    var sort = _.sort,
        range = sort && !_.ignorePeers,
        frame = _.frame || [null, 0],
        data = list.data(sort),
        n = data.length,
        i = 0,
        b = range ? d3Array.bisector(sort) : null,
        w = {
          i0: 0, i1: 0, p0: 0, p1: 0, index: 0,
          data: data, compare: sort || vegaUtil.constant(-1)
        };

    for (state.init(); i<n; ++i) {
      setWindow(w, frame, i, n);
      if (range) adjustRange(w, b);
      state.update(w, data[i]);
    }
  }

  function setWindow(w, f, i, n) {
    w.p0 = w.i0;
    w.p1 = w.i1;
    w.i0 = f[0] == null ? 0 : Math.max(0, i - Math.abs(f[0]));
    w.i1 = f[1] == null ? n : Math.min(n, i + Math.abs(f[1]) + 1);
    w.index = i;
  }

  // if frame type is 'range', adjust window for peer values
  function adjustRange(w, bisect) {
    var r0 = w.i0,
        r1 = w.i1 - 1,
        c = w.compare,
        d = w.data,
        n = d.length - 1;

    if (r0 > 0 && !c(d[r0], d[r0-1])) w.i0 = bisect.left(d, d[r0]);
    if (r1 < n && !c(d[r1], d[r1+1])) w.i1 = bisect.right(d, d[r1]);
  }

  exports.aggregate = Aggregate;
  exports.bin = Bin;
  exports.collect = Collect;
  exports.compare = Compare;
  exports.countpattern = CountPattern;
  exports.cross = Cross;
  exports.density = Density;
  exports.expression = Expression;
  exports.extent = Extent;
  exports.facet = Facet;
  exports.field = Field;
  exports.filter = Filter;
  exports.flatten = Flatten;
  exports.fold = Fold;
  exports.formula = Formula;
  exports.generate = Generate;
  exports.impute = Impute;
  exports.joinaggregate = JoinAggregate;
  exports.key = Key;
  exports.load = Load;
  exports.lookup = Lookup;
  exports.multiextent = MultiExtent;
  exports.multivalues = MultiValues;
  exports.params = Params;
  exports.pivot = Pivot;
  exports.prefacet = PreFacet;
  exports.project = Project;
  exports.proxy = Proxy;
  exports.relay = Relay;
  exports.sample = Sample;
  exports.sequence = Sequence;
  exports.sieve = Sieve;
  exports.subflow = Subflow;
  exports.tupleindex = TupleIndex;
  exports.values = Values;
  exports.window = Window;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
