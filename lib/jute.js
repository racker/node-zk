/*
 *  Copyright 2011 Rackspace
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */


var recordio = require('./recordio');
var Int64 = require('node-int64');

var F_INT = 'int';
var F_LONG = 'long';
var F_BOOL = 'bool';
var F_BUFFER = 'buffer';
var F_STRING = 'string';
var F_VECTOR = 'vector';
var F_OBJECT = 'object';

function addField(obj, field) {
  var defval;
  if (field.defaultValue === undefined) {
    switch (field.type) {
      case F_INT:
        defval = 0;
        break;
      case F_LONG:
        defval = new Int64(0);
        break;
      case F_BOOL:
        defval = false;
        break;
      case F_BUFFER:
      case F_STRING:
      case F_OBJECT:
        defval = null;
        break;
      case F_VECTOR:
        defval = [];
        break;
    }
  }
  else {
    if (typeof field.defaultValue === 'function') {
      defval = field.defaultValue();
    }
    else {
      defval = field.defaultValue;
    }
  }

  obj[field.name] = defval;
}

function JuteStruct(meta) {
  var self = this;

  this._meta = meta;

  this._meta.fields.forEach(function(field) {
    addField(self, field);
  });
};

JuteStruct.prototype.serialize = function(includeLength, destArc) {
  var i, j,
      field,
      value,
      arc;

  if (destArc === undefined) {
    arc = new recordio.Archive();
  }
  else {
    arc = destArc;
  }

  if (includeLength) {
    /**
     * A write path optimization to only need a single buffer object to 
     * send to the socket, we go back and edit this later.
     */
    arc.serialize_int("recordLength_placeholder", -1);
  }

  for (i = 0; i < this._meta.fields.length; i++) {
    field = this._meta.fields[i];
    value = this[field.name];
    switch (field.type) {
      case F_INT:
        arc.serialize_int(field.name, value);
        break;
      case F_LONG:
        arc.serialize_long(field.name, value);
        break;
      case F_BOOL:
        arc.serialize_bool(field.name, value);
        break;
      case F_BUFFER:
        arc.serialize_buffer(field.name, value);
        break;
      case F_STRING:
        arc.serialize_string(field.name, value);
        break;
      case F_OBJECT:
        /* Children objects must implement the serialize interface */
        value.serialize(false, arc);
        break;
      case F_VECTOR:
        arc.serialize_start_vector(field.name, value.length);
        for (j = 0; j < value.length; j++) {
          /* TODO: refactor and make cleaner */
          switch (field.vectorType) {
            case F_INT:
              arc.serialize_int(j, value);
              break;
            case F_LONG:
              arc.serialize_long(j, value);
              break;
            case F_BOOL:
              arc.serialize_bool(j, value);
              break;
            case F_BUFFER:
              arc.serialize_buffer(j, value);
              break;
            case F_STRING:
              arc.serialize_string(j, value);
              break;
            default:
              throw new Error('Invalid vector type ' + field.vectorType + ' for field '+ field.name)
              break;
          }
        }
        arc.serialize_end_vector(field.name);
        break;
    }
  }

  if (includeLength) {
    /**
     * A write path optimization to only need a single buffer object to 
     * send to the socket, we go back and edit this later.
     */
    i = arc._used;
    arc._used = 0;
    arc.serialize_int("recordLength_actual", i - 4);
    arc._used = i;
  }

  if (destArc === undefined) {
    var buf = arc.toBuffer();
    return buf;
  }
};

JuteStruct.prototype.deserialize = function(buffer) {
  var i,
      j,
      v,
      vlen,
      field,
      arc = new recordio.Archive();
  arc.fromBuffer(buffer);

  for (i = 0; i < this._meta.fields.length; i++) {
    field = this._meta.fields[i];
    switch (field.type) {
      case F_INT:
        this[field.name] = arc.deserialize_int(field.name);
        break;
      case F_LONG:
        this[field.name] = arc.deserialize_long(field.name);
        break;
      case F_BOOL:
        this[field.name] = arc.deserialize_bool(field.name);
        break;
      case F_BUFFER:
        this[field.name] = arc.deserialize_buffer(field.name);
        break;
      case F_STRING:
        this[field.name] = arc.deserialize_string(field.name);
        break;
      case F_OBJECT:
        /* TODO: child struct deserialization */
        throw new Error('not done this yet');
        break;
      case F_VECTOR:
        vlen = arc.deserialize_start_vector(field.name);
        v = new Array(v);
        for (j = 0; j < vlen; j++) {
          /* TODO: refactor and make cleaner */
          switch (field.vectorType) {
            case F_INT:
              v[j] = arc.deserialize_int(j);
              break;
            case F_LONG:
              v[j] = arc.deserialize_long(j);
              break;
            case F_BOOL:
              v[j] = arc.deserialize_bool(j);
              break;
            case F_BUFFER:
              v[j] = arc.deserialize_buffer(j);
              break;
            case F_STRING:
              v[j] = arc.deserialize_string(j);
              break;
            default:
              throw new Error('Invalid vector type ' + field.vectorType + ' for field '+ field.name)
              break;
          }
        }
        this[field.name] = v;
        arc.deserialize_end_vector(field.name);
        break;
    }
  }
};


JuteStruct.prototype.speculative_deserialize = function(buffer) {
  var off = 0,
      j,
      fieldsRead = 0,
      i,
      v,
      field,
      len = buffer.length,
      done = false,
      vcount,
      vsizeof;

  for (i = 0; i < this._meta.fields.length && off <= len && done === false; i++) {
    field = this._meta.fields[i];
    switch (field.type) {
      case F_INT:
        off += 4;
        break;
      case F_LONG:
        off += 8;
        break;
      case F_BOOL:
        off += 1;
        break;
      case F_STRING:
      case F_BUFFER:
        if (off + 4 <= len) {
          v = recordio._deserialize_int(buffer, off);
          off += 4;
          off += v;
        }
        else {
          done = true;
        }
        break;
      case F_OBJECT:
        /* TODO: child struct deserialization */
        throw new Error('not done this yet');
        break;
      case F_VECTOR:
        off += 4;
        if (off + 4 < len) {
          vcount = recordio._deserialize_int(buffer, off);
          switch (field.vectorType) {
            case F_INT:
              off += vlen * 4;
              break;
            case F_LONG:
              off += vlen * 8;
              break;
            case F_BOOL:
              off += vlen * 1;
              break;
            case F_BUFFER:
            case F_STRING:
              for (j = 0; j < vcount && done === false; j++) {
                if (off + 4 <= len) {
                  v = recordio._deserialize_int(buffer, off);
                  off += 4;
                  off += v;
                }
                else {
                  done = true;
                }
              }
              break;
            default:
              throw new Error('Invalid vector type ' + field.vectorType + ' for field '+ field.name)
              break;
          }
        }
        else {
          done = true;
        }
        break;
    }
  }

  if (off <= len) {
    return off;
  }
  else {
    return -1;
  }
};

exports.fieldsFixedSize = function(meta) {
  var len = 0;

  meta.fields.forEach(function(field) {
    switch (field.type) {
      case F_INT:
        len += 4;
        break;
      case F_LONG:
        len += 8;
        break;
      case F_BOOL:
        len += 1;
        break;
      case F_BUFFER:
      case F_STRING:
      case F_OBJECT:
      case F_VECTOR:
        throw new Error('Field contains variable length type ' + field.type + ' for field '+ field.name);
        break;
    }
  });

  return len;
};

exports.F_INT = F_INT;
exports.F_LONG = F_LONG;
exports.F_BOOL = F_BOOL;
exports.F_BUFFER = F_BUFFER;
exports.F_STRING = F_STRING;
exports.F_VECTOR = F_VECTOR;
exports.F_OBJECT = F_OBJECT;
exports.JuteStruct = JuteStruct;
