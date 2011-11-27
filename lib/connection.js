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
var BufferList = require('bufferlist').BufferList;
var recordio = require('./recordio');

var ConnectRequest = require('./zookeeper-jute/connect_request').ConnectRequest
var ConnectResponse = require('./zookeeper-jute/connect_response').ConnectResponse


var DEFAULT_OPTIONS = {
  timeout: 20000,
  sessionId: null,
  sessionPasswd: null,
  lastZxidSeen: null
};

var STATE_WAIT_RECORDLEN = 0;
var STATE_WAIT_RECORDDATA = 1;

function ZkConnection(port, host, options) {
  var self = this;

  events.EventEmitter.call(this);
  if (!options) {
    options = DEFAULT_OPTIONS;
  }

  this._port = port;
  this._host = host;
  this._state = STATE_WAIT_RECORDLEN;
  this._recordlen = 0;
  this._inbuf = new BufferList();
  this._options = misc.merge(DEFAULT_OPTIONS, options);
  this._sent_end = false;

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

  if (this._options.passwd) {
    cr.passwd = this._options.passwd;
  }

  buf = cr.serialize(true);
  this._conn.write(buf);
};


ZkConnection.prototype._process_inbuf = function() {
  var lenbuf,
      recordbuf,
      didSomething;

  do {
    didSomething = false;

    if (this._state == STATE_WAIT_RECORDLEN && this._inbuf.length >= 4) {
      lenbuf = this._inbuf.take(4);
      this._inbuf.advance(4);
      /* TODO: configure max frame size */
      this._recordlen = recordio._deserialize_int(lenbuf, 0);
      this._state = STATE_WAIT_RECORDDATA;
      didSomething = true;
    }

    if (this._state == STATE_WAIT_RECORDDATA && this._inbuf.length >= this._recordlen) {
      recordbuf = this._inbuf.take(this._recordlen);
      this._inbuf.advance(this._recordlen);
      this._state = STATE_WAIT_RECORDLEN;
      didSomething = true;
      this._process_connect_response(recordbuf);
    }
  } while (didSomething === true);

};

ZkConnection.prototype._process_connect_response = function(buf) {
  var cr = new ConnectResponse();
  cr.deserialize(buf);
  this._options.timeout = cr.timeout;
  this._options.sessionId = cr.sessionId;
  this._options.sessionPasswd = cr.passwd;
  console.error(this._options);
  this.emit('connected', this._options);
};

ZkConnection.prototype._on_data = function(data) {
  this._inbuf.write(data);
  this._process_inbuf();
};

ZkConnection.prototype._on_end = function(fromError) {
  this._conn.destroy();
  this._send_end();
  console.error('on_end:');
};

ZkConnection.prototype._on_error = function(err) {
  console.error('on_error');
  console.error(err);
  this.emit('error');
  this._send_end();
};

ZkConnection.prototype._on_close = function() {
  this.emit('close');
};

ZkConnection.prototype.write = function(msg) {
  console.error('write');
};

ZkConnection.prototype._send_end = function() {
  if (!this._sent_end) {
    this._sent_end = true;
    this.emit('end');
  }
};

ZkConnection.prototype.destroy = function() {
  if (this._conn !== null) {
    this._conn.destroy();
    this._conn = null;
  }
  this._send_end();
};

exports.ZkConnection = ZkConnection;
