(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-array'), require('vega-dataflow'), require('vega-util')) :
  typeof define === 'function' && define.amd ? define(['exports', 'd3-array', 'vega-dataflow', 'vega-util'], factory) :
  (factory((global.vega = global.vega || {}, global.vega.transforms = {}),global.d3,global.vega,global.vega));
}(this, (function (exports,d3Array,vegaDataflow,vegaUtil) { 'use strict';

  function array8(n) { return new Uint8Array(n); }

  function array16(n) { return new Uint16Array(n); }

  function array32(n) { return new Uint32Array(n); }

  /**
   * Maintains CrossFilter state.
   */
  function Bitmaps() {

    var width = 8,
        data = [],
        seen = array32(0),
        curr = array(0, width),
        prev = array(0, width);

    return {

      data: function() { return data; },

      seen: function() {
        return (seen = lengthen(seen, data.length));
      },

      add: function(array) {
        for (var i=0, j=data.length, n=array.length, t; i<n; ++i) {
          t = array[i];
          t._index = j++;
          data.push(t);
        }
      },

      remove: function(num, map) { // map: index -> boolean (true => remove)
        var n = data.length,
            copy = Array(n - num),
            reindex = data, // reuse old data array for index map
            t, i, j;

        // seek forward to first removal
        for (i=0; !map[i] && i<n; ++i) {
          copy[i] = data[i];
          reindex[i] = i;
        }

        // condense arrays
        for (j=i; i<n; ++i) {
          t = data[i];
          if (!map[i]) {
            reindex[i] = j;
            curr[j] = curr[i];
            prev[j] = prev[i];
            copy[j] = t;
            t._index = j++;
          } else {
            reindex[i] = -1;
          }
          curr[i] = 0; // clear unused bits
        }

        data = copy;
        return reindex;
      },

      size: function() { return data.length; },

      curr: function() { return curr; },

      prev: function() { return prev; },

      reset: function(k) { prev[k] = curr[k]; },

      all: function() {
        return width < 0x101 ? 0xff : width < 0x10001 ? 0xffff : 0xffffffff;
      },

      set: function(k, one) { curr[k] |= one; },

      clear: function(k, one) { curr[k] &= ~one; },

      resize: function(n, m) {
        var k = curr.length;
        if (n > k || m > width) {
          width = Math.max(m, width);
          curr = array(n, width, curr);
          prev = array(n, width);
        }
      }
    };
  }

  function lengthen(array, length, copy) {
    if (array.length >= length) return array;
    copy = copy || new array.constructor(length);
    copy.set(array);
    return copy;
  }

  function array(n, m, array) {
    var copy = (m < 0x101 ? array8 : m < 0x10001 ? array16 : array32)(n);
    if (array) copy.set(array);
    return copy;
  }

  function Dimension(index, i, query) {
    var bit = (1 << i);

    return {
      one:     bit,
      zero:    ~bit,
      range:   query.slice(),
      bisect:  index.bisect,
      index:   index.index,
      size:    index.size,

      onAdd: function(added, curr) {
        var dim = this,
            range = dim.bisect(dim.range, added.value),
            idx = added.index,
            lo = range[0],
            hi = range[1],
            n1 = idx.length, i;

        for (i=0;  i<lo; ++i) curr[idx[i]] |= bit;
        for (i=hi; i<n1; ++i) curr[idx[i]] |= bit;
        return dim;
      }
    };
  }

  /**
   * Maintains a list of values, sorted by key.
   */
  function SortedIndex() {
    var index = array32(0),
        value = [],
        size = 0;

    function insert(key, data, base) {
      if (!data.length) return [];

      var n0 = size,
          n1 = data.length,
          addv = Array(n1),
          addi = array32(n1),
          oldv, oldi, i;

      for (i=0; i<n1; ++i) {
        addv[i] = key(data[i]);
        addi[i] = i;
      }
      addv = sort(addv, addi);

      if (n0) {
        oldv = value;
        oldi = index;
        value = Array(n0 + n1);
        index = array32(n0 + n1);
        merge(base, oldv, oldi, n0, addv, addi, n1, value, index);
      } else {
        if (base > 0) for (i=0; i<n1; ++i) {
          addi[i] += base;
        }
        value = addv;
        index = addi;
      }
      size = n0 + n1;

      return {index: addi, value: addv};
    }

    function remove(num, map) {
      // map: index -> remove
      var n = size,
          idx, i, j;

      // seek forward to first removal
      for (i=0; !map[index[i]] && i<n; ++i);

      // condense index and value arrays
      for (j=i; i<n; ++i) {
        if (!map[idx=index[i]]) {
          index[j] = idx;
          value[j] = value[i];
          ++j;
        }
      }

      size = n - num;
    }

    function reindex(map) {
      for (var i=0, n=size; i<n; ++i) {
        index[i] = map[index[i]];
      }
    }

    function bisect(range, array) {
      var n;
      if (array) {
        n = array.length;
      } else {
        array = value;
        n = size;
      }
      return [
        d3Array.bisectLeft(array, range[0], 0, n),
        d3Array.bisectRight(array, range[1], 0, n)
      ];
    }

    return {
      insert:  insert,
      remove:  remove,
      bisect:  bisect,
      reindex: reindex,
      index:   function() { return index; },
      size:    function() { return size; }
    };
  }

  function sort(values, index) {
    values.sort.call(index, function(a, b) {
      var x = values[a],
          y = values[b];
      return x < y ? -1 : x > y ? 1 : 0;
    });
    return d3Array.permute(values, index);
  }

  function merge(base, value0, index0, n0, value1, index1, n1, value, index) {
    var i0 = 0, i1 = 0, i;

    for (i=0; i0 < n0 && i1 < n1; ++i) {
      if (value0[i0] < value1[i1]) {
        value[i] = value0[i0];
        index[i] = index0[i0++];
      } else {
        value[i] = value1[i1];
        index[i] = index1[i1++] + base;
      }
    }

    for (; i0 < n0; ++i0, ++i) {
      value[i] = value0[i0];
      index[i] = index0[i0];
    }

    for (; i1 < n1; ++i1, ++i) {
      value[i] = value1[i1];
      index[i] = index1[i1] + base;
    }
  }

  /**
   * An indexed multi-dimensional filter.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Array<function(object): *>} params.fields - An array of dimension accessors to filter.
   * @param {Array} params.query - An array of per-dimension range queries.
   */
  function CrossFilter(params) {
    vegaDataflow.Transform.call(this, Bitmaps(), params);
    this._indices = null;
    this._dims = null;
  }

  CrossFilter.Definition = {
    "type": "CrossFilter",
    "metadata": {},
    "params": [
      { "name": "fields", "type": "field", "array": true, "required": true },
      { "name": "query", "type": "array", "array": true, "required": true,
        "content": {"type": "number", "array": true, "length": 2} }
    ]
  };

  var prototype = vegaUtil.inherits(CrossFilter, vegaDataflow.Transform);

  prototype.transform = function(_, pulse) {
    if (!this._dims) {
      return this.init(_, pulse);
    } else {
      var init = _.modified('fields')
            || _.fields.some(function(f) { return pulse.modified(f.fields); });

      return init
        ? this.reinit(_, pulse)
        : this.eval(_, pulse);
    }
  };

  prototype.init = function(_, pulse) {
    var fields = _.fields,
        query = _.query,
        indices = this._indices = {},
        dims = this._dims = [],
        m = query.length,
        i = 0, key, index;

    // instantiate indices and dimensions
    for (; i<m; ++i) {
      key = fields[i].fname;
      index = indices[key] || (indices[key] = SortedIndex());
      dims.push(Dimension(index, i, query[i]));
    }

    return this.eval(_, pulse);
  };

  prototype.reinit = function(_, pulse) {
    var output = pulse.materialize().fork(),
        fields = _.fields,
        query = _.query,
        indices = this._indices,
        dims = this._dims,
        bits = this.value,
        curr = bits.curr(),
        prev = bits.prev(),
        all = bits.all(),
        out = (output.rem = output.add),
        mod = output.mod,
        m = query.length,
        adds = {}, add, index, key,
        mods, remMap, modMap, i, n, f;

    // set prev to current state
    prev.set(curr);

    // if pulse has remove tuples, process them first
    if (pulse.rem.length) {
      remMap = this.remove(_, pulse, output);
    }

    // if pulse has added tuples, add them to state
    if (pulse.add.length) {
      bits.add(pulse.add);
    }

    // if pulse has modified tuples, create an index map
    if (pulse.mod.length) {
      modMap = {};
      for (mods=pulse.mod, i=0, n=mods.length; i<n; ++i) {
        modMap[mods[i]._index] = 1;
      }
    }

    // re-initialize indices as needed, update curr bitmap
    for (i=0; i<m; ++i) {
      f = fields[i];
      if (!dims[i] || _.modified('fields', i) || pulse.modified(f.fields)) {
        key = f.fname;
        if (!(add = adds[key])) {
          indices[key] = index = SortedIndex();
          adds[key] = add = index.insert(f, pulse.source, 0);
        }
        dims[i] = Dimension(index, i, query[i]).onAdd(add, curr);
      }
    }

    // visit each tuple
    // if filter state changed, push index to add/rem
    // else if in mod and passes a filter, push index to mod
    for (i=0, n=bits.data().length; i<n; ++i) {
      if (remMap[i]) { // skip if removed tuple
        continue;
      } else if (prev[i] !== curr[i]) { // add if state changed
        out.push(i);
      } else if (modMap[i] && curr[i] !== all) { // otherwise, pass mods through
        mod.push(i);
      }
    }

    bits.mask = (1 << m) - 1;
    return output;
  };

  prototype.eval = function(_, pulse) {
    var output = pulse.materialize().fork(),
        m = this._dims.length,
        mask = 0;

    if (pulse.rem.length) {
      this.remove(_, pulse, output);
      mask |= (1 << m) - 1;
    }

    if (_.modified('query') && !_.modified('fields')) {
      mask |= this.update(_, pulse, output);
    }

    if (pulse.add.length) {
      this.insert(_, pulse, output);
      mask |= (1 << m) - 1;
    }

    if (pulse.mod.length) {
      this.modify(pulse, output);
      mask |= (1 << m) - 1;
    }

    this.value.mask = mask;
    return output;
  };

  prototype.insert = function(_, pulse, output) {
    var tuples = pulse.add,
        bits = this.value,
        dims = this._dims,
        indices = this._indices,
        fields = _.fields,
        adds = {},
        out = output.add,
        k = bits.size(),
        n = k + tuples.length,
        m = dims.length, j, key, add;

    // resize bitmaps and add tuples as needed
    bits.resize(n, m);
    bits.add(tuples);

    var curr = bits.curr(),
        prev = bits.prev(),
        all  = bits.all();

    // add to dimensional indices
    for (j=0; j<m; ++j) {
      key = fields[j].fname;
      add = adds[key] || (adds[key] = indices[key].insert(fields[j], tuples, k));
      dims[j].onAdd(add, curr);
    }

    // set previous filters, output if passes at least one filter
    for (; k<n; ++k) {
      prev[k] = all;
      if (curr[k] !== all) out.push(k);
    }
  };

  prototype.modify = function(pulse, output) {
    var out = output.mod,
        bits = this.value,
        curr = bits.curr(),
        all  = bits.all(),
        tuples = pulse.mod,
        i, n, k;

    for (i=0, n=tuples.length; i<n; ++i) {
      k = tuples[i]._index;
      if (curr[k] !== all) out.push(k);
    }
  };

  prototype.remove = function(_, pulse, output) {
    var indices = this._indices,
        bits = this.value,
        curr = bits.curr(),
        prev = bits.prev(),
        all  = bits.all(),
        map = {},
        out = output.rem,
        tuples = pulse.rem,
        i, n, k, f;

    // process tuples, output if passes at least one filter
    for (i=0, n=tuples.length; i<n; ++i) {
      k = tuples[i]._index;
      map[k] = 1; // build index map
      prev[k] = (f = curr[k]);
      curr[k] = all;
      if (f !== all) out.push(k);
    }

    // remove from dimensional indices
    for (k in indices) {
      indices[k].remove(n, map);
    }

    this.reindex(pulse, n, map);
    return map;
  };

  // reindex filters and indices after propagation completes
  prototype.reindex = function(pulse, num, map) {
    var indices = this._indices,
        bits = this.value;

    pulse.runAfter(function() {
      var indexMap = bits.remove(num, map);
      for (var key in indices) indices[key].reindex(indexMap);
    });
  };

  prototype.update = function(_, pulse, output) {
    var dims = this._dims,
        query = _.query,
        stamp = pulse.stamp,
        m = dims.length,
        mask = 0, i, q;

    // survey how many queries have changed
    output.filters = 0;
    for (q=0; q<m; ++q) {
      if (_.modified('query', q)) { i = q; ++mask; }
    }

    if (mask === 1) {
      // only one query changed, use more efficient update
      mask = dims[i].one;
      this.incrementOne(dims[i], query[i], output.add, output.rem);
    } else {
      // multiple queries changed, perform full record keeping
      for (q=0, mask=0; q<m; ++q) {
        if (!_.modified('query', q)) continue;
        mask |= dims[q].one;
        this.incrementAll(dims[q], query[q], stamp, output.add);
        output.rem = output.add; // duplicate add/rem for downstream resolve
      }
    }

    return mask;
  };

  prototype.incrementAll = function(dim, query, stamp, out) {
    var bits = this.value,
        seen = bits.seen(),
        curr = bits.curr(),
        prev = bits.prev(),
        index = dim.index(),
        old = dim.bisect(dim.range),
        range = dim.bisect(query),
        lo1 = range[0],
        hi1 = range[1],
        lo0 = old[0],
        hi0 = old[1],
        one = dim.one,
        i, j, k;

    // Fast incremental update based on previous lo index.
    if (lo1 < lo0) {
      for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
        k = index[i];
        if (seen[k] !== stamp) {
          prev[k] = curr[k];
          seen[k] = stamp;
          out.push(k);
        }
        curr[k] ^= one;
      }
    } else if (lo1 > lo0) {
      for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
        k = index[i];
        if (seen[k] !== stamp) {
          prev[k] = curr[k];
          seen[k] = stamp;
          out.push(k);
        }
        curr[k] ^= one;
      }
    }

    // Fast incremental update based on previous hi index.
    if (hi1 > hi0) {
      for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
        k = index[i];
        if (seen[k] !== stamp) {
          prev[k] = curr[k];
          seen[k] = stamp;
          out.push(k);
        }
        curr[k] ^= one;
      }
    } else if (hi1 < hi0) {
      for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
        k = index[i];
        if (seen[k] !== stamp) {
          prev[k] = curr[k];
          seen[k] = stamp;
          out.push(k);
        }
        curr[k] ^= one;
      }
    }

    dim.range = query.slice();
  };

  prototype.incrementOne = function(dim, query, add, rem) {
    var bits = this.value,
        curr = bits.curr(),
        index = dim.index(),
        old = dim.bisect(dim.range),
        range = dim.bisect(query),
        lo1 = range[0],
        hi1 = range[1],
        lo0 = old[0],
        hi0 = old[1],
        one = dim.one,
        i, j, k;

    // Fast incremental update based on previous lo index.
    if (lo1 < lo0) {
      for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
        k = index[i];
        curr[k] ^= one;
        add.push(k);
      }
    } else if (lo1 > lo0) {
      for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
        k = index[i];
        curr[k] ^= one;
        rem.push(k);
      }
    }

    // Fast incremental update based on previous hi index.
    if (hi1 > hi0) {
      for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
        k = index[i];
        curr[k] ^= one;
        add.push(k);
      }
    } else if (hi1 < hi0) {
      for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
        k = index[i];
        curr[k] ^= one;
        rem.push(k);
      }
    }

    dim.range = query.slice();
  };

  /**
   * Selectively filters tuples by resolving against a filter bitmap.
   * Useful for processing the output of a cross-filter transform.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {object} params.ignore - A bit mask indicating which filters to ignore.
   * @param {object} params.filter - The per-tuple filter bitmaps. Typically this
   *   parameter value is a reference to a {@link CrossFilter} transform.
   */
  function ResolveFilter(params) {
    vegaDataflow.Transform.call(this, null, params);
  }

  ResolveFilter.Definition = {
    "type": "ResolveFilter",
    "metadata": {},
    "params": [
      { "name": "ignore", "type": "number", "required": true,
        "description": "A bit mask indicating which filters to ignore." },
      { "name": "filter", "type": "object", "required": true,
        "description": "Per-tuple filter bitmaps from a CrossFilter transform." }
    ]
  };

  var prototype$1 = vegaUtil.inherits(ResolveFilter, vegaDataflow.Transform);

  prototype$1.transform = function(_, pulse) {
    var ignore = ~(_.ignore || 0), // bit mask where zeros -> dims to ignore
        bitmap = _.filter,
        mask = bitmap.mask;

    // exit early if no relevant filter changes
    if ((mask & ignore) === 0) return pulse.StopPropagation;

    var output = pulse.fork(pulse.ALL),
        data = bitmap.data(),
        curr = bitmap.curr(),
        prev = bitmap.prev(),
        pass = function(k) {
          return !(curr[k] & ignore) ? data[k] : null;
        };

    // propagate all mod tuples that pass the filter
    output.filter(output.MOD, pass);

    // determine add & rem tuples via filter functions
    // for efficiency, we do *not* populate new arrays,
    // instead we add filter functions applied downstream

    if (!(mask & (mask-1))) { // only one filter changed
      output.filter(output.ADD, pass);
      output.filter(output.REM, function(k) {
        return (curr[k] & ignore) === mask ? data[k] : null;
      });

    } else { // multiple filters changed
      output.filter(output.ADD, function(k) {
        var c = curr[k] & ignore,
            f = !c && (c ^ (prev[k] & ignore));
        return f ? data[k] : null;
      });
      output.filter(output.REM, function(k) {
        var c = curr[k] & ignore,
            f = c && !(c ^ (c ^ (prev[k] & ignore)));
        return f ? data[k] : null;
      });
    }

    // add filter to source data in case of reflow...
    return output.filter(output.SOURCE, function(t) { return pass(t._index); });
  };

  exports.crossfilter = CrossFilter;
  exports.resolvefilter = ResolveFilter;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
