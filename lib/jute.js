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

JuteStruct.prototype.serialize = function(destArc) {
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

  for (i = 0; i < this._meta.fields.length; i++) {
    field = this._meta.fields[i];
    value = this[field.name];
    switch (field.type) {
      case F_INT:
        arc.serialize_int(value);
        break;
      case F_LONG:
        arc.serialize_long(value);
        break;
      case F_BUFFER:
        arc.serialize_buffer(value);
        break;
      case F_STRING:
        arc.serialize_string(value);
        break;
      case F_OBJECT:
        /* Children objects must implement the serialize interface */
        value.serialize(arc);
        break;
      case F_VECTOR:
        arc.serialize_start_vector(value.length);
        for (j = 0; j < value.length; j++) {
          /* TODO: refactor and make cleaner */
          switch (field.vectorType) {
            case F_INT:
              arc.serialize_int(value);
              break;
            case F_LONG:
              arc.serialize_long(value);
              break;
            case F_BUFFER:
              arc.serialize_buffer(value);
              break;
            case F_STRING:
              arc.serialize_string(value);
              break;
            default:
              throw new Error('Invalid vector type ' + field.vectorType + ' for field '+ field.name)
              break;
          }
        }
        arc.serialize_end_vector();
        break;
    };
  }

  if (destArc === undefined) {
    return arc.toBuffer();
  }
};

JuteStruct.prototype.deserialize = function(buffer) {
  var i,
      j,
      v,
      vlen,
      arc = new recordio.Archive();
  arc.fromBuffer(buffer);

  for (i = 0; i < this._meta.fields.length; i++) {
    field = this._meta.fields[i];
    switch (field.type) {
      case F_INT:
        this[field.name] = arc.deserialize_int();
        break;
      case F_LONG:
        this[field.name] = arc.deserialize_long();
        break;
      case F_BUFFER:
        this[field.name] = arc.deserialize_buffer();
        break;
      case F_STRING:
        this[field.name] = arc.deserialize_string();
        break;
      case F_OBJECT:
        /* TODO: child struct deserialization */
        throw new Error('not done this yet');
        break;
      case F_VECTOR:
        vlen = arc.deserialize_start_vector();
        v = new Array(v);
        for (j = 0; j < vlen; j++) {
          /* TODO: refactor and make cleaner */
          switch (field.vectorType) {
            case F_INT:
              v[j] = arc.deserialize_int();
              break;
            case F_LONG:
              v[j] = arc.deserialize_long();
              break;
            case F_BUFFER:
              v[j] = arc.deserialize_buffer();
              break;
            case F_STRING:
              v[j] = arc.deserialize_string();
              break;
            default:
              throw new Error('Invalid vector type ' + field.vectorType + ' for field '+ field.name)
              break;
          }
        }
        this[field.name] = v;
        arc.deserialize_end_vector();
        break;
    };
  }
};

exports.F_INT = F_INT;
exports.F_LONG = F_LONG;
exports.F_BUFFER = F_BUFFER;
exports.F_STRING = F_STRING;
exports.F_VECTOR = F_VECTOR;
exports.F_OBJECT = F_OBJECT;
exports.JuteStruct = JuteStruct;
