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

var events = require("events");
var util = require("util");

var DEFAULT_OPTIONS = {
  timeout: 20000,
};


function ZkConnection(port, host, options) {
  var self = this;

  events.EventEmitter.call(this);
  if (!options) {
    options = DEFAULT_OPTIONS;
  }

  this._port = port;
  this._host = host;
  this._timeout = options.timeout || DEFAULT_OPTIONS.timeout;

  this._conn = net.connect(this._port, this._host, function() {
    self._on_connect();
  });

  this._conn.setNoDelay(true);
  this._conn.on('data', this._on_data.bind(this));
  this._conn.on('end', this._on_end.bind(this));
  this._conn.on('error', this._on_error.bind(this));
  this._conn.on('close', this._on_close.bind(this));
}

util.inherits(ZkConnection, events.EventEmitter);

ZkConnection.prototype.write = function(msg) {
  
};


exports.ZkConnection = ZkConnection;
