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
var net = require('net');
var misc = require('./misc');
var Int64 = require('node-int64');

var ConnectRequest = require('./zookeeper-jute/connect_request').ConnectRequest


var DEFAULT_OPTIONS = {
  timeout: 20000,
  sessionId: null,
  lastZxidSeen: null,
  passwd: null
};


function ZkConnection(port, host, options) {
  var self = this;

  events.EventEmitter.call(this);
  if (!options) {
    options = DEFAULT_OPTIONS;
  }

  this._port = port;
  this._host = host;
  this._options = misc.merge(DEFAULT_OPTIONS, options);

  this._conn = net.createConnection(this._port, this._host);

  this._conn.on('connect', this._on_connect.bind(this));
  this._conn.on('data', this._on_data.bind(this));
  this._conn.on('end', this._on_end.bind(this));
  this._conn.on('error', this._on_error.bind(this));
  this._conn.on('close', this._on_close.bind(this));
}

util.inherits(ZkConnection, events.EventEmitter);

ZkConnection.prototype._on_connect = function() {
  var buf,
      cr;

  this._conn.setNoDelay(true);

  cr = new ConnectRequest();

  cr.protocolVersion = 0;

  cr.timeOut = this._options.timeout;

  if (this._options.lastZxidSeen) {
    cr.lastZxidSeen = this._options.lastZxidSeen;
  }

  if (this._options.sessionId) {
    cr.sessionId = this._options.sessionId;
  }
  else {
    cr.sessionId = new Int64(misc.getRandomInt(0, 2^32), misc.getRandomInt(0, 2^32));
  }

  if (this._options.passwd) {
    cr.passwd = this._options.passwd;
  }

  buf = cr.serialize(true);
  console.error(buf);
  console.error(buf.length);
  this._conn.write(buf);
};

ZkConnection.prototype._on_data = function(data) {
  console.error('on_data');
  console.error(data);
};

ZkConnection.prototype._on_end = function(fromError) {
  console.error('on_end:'+fromError);
};

ZkConnection.prototype._on_error = function(err) {
  console.error('on_error');
  console.error(err);
};

ZkConnection.prototype._on_close = function() {
  this.emit('close');
};

ZkConnection.prototype.write = function(msg) {
  console.error('write');
};


ZkConnection.prototype.destroy = function() {
  if (this._conn) {
    this._conn.destroy();
  }
};

exports.ZkConnection = ZkConnection;
