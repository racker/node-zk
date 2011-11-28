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
var Int64 = require('node-int64');
var BufferList = require('bufferlist').BufferList;

var misc = require('./misc');
var recordio = require('./recordio');
var constants = require('./constants');

var ConnectRequest = require('./zookeeper-jute/connect_request').ConnectRequest
var ConnectResponse = require('./zookeeper-jute/connect_response').ConnectResponse
var ReplyHeaderFixedSize = require('./zookeeper-jute/reply_header').ReplyHeaderFixedSize;
var ReplyHeader = require('./zookeeper-jute/reply_header').ReplyHeader;
var WatcherEvent = require('./zookeeper-jute/watcher_event').WatcherEvent;


var DEFAULT_OPTIONS = {
  timeout: 20000,
  sessionId: null,
  sessionPassword: null,
  lastZxidSeen: null
};

var ZOO_CONNECTING_STATE = 0;
var ZOO_ASSOCIATING_STATE = 1;
var ZOO_CONNECTED_STATE = 2;

function ZkConnection(port, host, options) {
  var self = this;

  events.EventEmitter.call(this);
  if (!options) {
    options = DEFAULT_OPTIONS;
  }

  this._port = port;
  this._host = host;
  this._state = ZOO_CONNECTING_STATE;
  this._recordlen = 0;
  this._inbuf = new BufferList();
  this._inhdr = null;
  this._options = misc.merge(DEFAULT_OPTIONS, options);
  this._sentEnd = false;

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
  this._state = ZOO_ASSOCIATING_STATE;

  cr = new ConnectRequest();

  cr.protocolVersion = 0;

  cr.timeOut = this._options.timeout;

  if (this._options.lastZxidSeen) {
    cr.lastZxidSeen = this._options.lastZxidSeen;
  }

  if (this._options.sessionId) {
    cr.sessionId = this._options.sessionId;
  }

  if (this._options.sessionPassword) {
    cr.passwd = this._options.sessionPassword;
  }

  buf = cr.serialize(true);
  this._conn.write(buf);
};


ZkConnection.prototype._process_inbuf = function() {
  var lenbuf,
      recordbuf,
      replyHeaderBuf,
      didSomething;

  do {
    didSomething = false;
    if (this._state === ZOO_ASSOCIATING_STATE) {
      if (this._inbuf.length >= 4) {
        lenbuf = this._inbuf.take(4);
        this._inbuf.advance(4);
        /* TODO: configure max frame size */
        this._recordlen = recordio._deserialize_int(lenbuf, 0);
        didSomething = true;
      }

      if (this._recordlen !== 0 && this._inbuf.length >= this._recordlen) {
        recordbuf = this._inbuf.take(this._recordlen);
        this._inbuf.advance(this._recordlen);
        this._processConnectResponse(recordbuf);
        this._state = ZOO_CONNECTED_STATE;
        didSomething = true;
      }
    }

    if (this._state === ZOO_CONNECTED_STATE) {
      if (this._inhdr !== null) {
        didSomething = this._processReply();
      }
      else if (this._inbuf.length >= ReplyHeaderFixedSize) {
        replyHeaderBuf = this._inbuf.take(ReplyHeaderFixedSize);
        this._inhdr = new ReplyHeader(),
        this._inhdr.deserialize(replyHeaderBuf);
        this._inbuf.advance(ReplyHeaderFixedSize);
        this._options.lastZxidSeen =  this._inhdr.zxid;
        didSomething = true;
      }
    }
  } while (didSomething === true);

};

ZkConnection.prototype._processReply = function() {
  var obj,
      advance = 0,
      tmpbuf,
      hdr = this._inhdr;

  tmpbuf = this._inbuf.take(this._inbuf.length);

  console.error(this._inhdr);
  console.error(hdr);
  if (hdr.xid == constants.XID_WATCHER_EVENT) {
    obj = new WatcherEvent();
    advance = obj.speculative_deserialize(tmpbuf);
    if (advance > 0) {
      tmpbuf = tmpbuf.slice(0, advance);
      obj.deserialize(tmpbuf);
      /* TOOD: process this */
    }
  }

  /* TOOD: other xid types */

  if (advance > 0) {
    this._inbuf.advance(advance);
    this._inhdr = null;
    return true;
  }
  return false;
};

ZkConnection.prototype._processConnectResponse = function(buf) {
  var cr = new ConnectResponse();
  cr.deserialize(buf);
  this._options.timeout = cr.timeOut;
  this._options.sessionId = cr.sessionId;
  this._options.sessionPassword = cr.passwd;
  this.emit('connected', {sessionId: cr.sessionId, sessionPassword: cr.passwd});
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
  if (!this._sentEnd) {
    this._sentEnd = true;
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
