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

var F_INT = 'int';
var F_LONG = 'long';
var F_BUFFER = 'buffer';
var F_STRING = 'string';
var F_VECTOR = 'vector';
var F_OBJECT = 'object';

function JuteStruct(meta) {
  this._meta = meta;
};

JuteStruct.serialize = function() {
  var arc = new recordio.Archive();
};

JuteStruct.deserialize = function(buffer) {
  var arc = new recordio.Archive();
};

exports.F_INT = F_INT;
exports.F_LONG = F_LONG;
exports.F_BUFFER = F_BUFFER;
exports.F_STRING = F_STRING;
exports.F_VECTOR = F_VECTOR;
exports.F_OBJECT = F_OBJECT;
exports.JuteStruct = JuteStruct;
