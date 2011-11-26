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

var ZkConnection = require('./connection').ZkConnection;
var misc = require('./misc');

var DEFAULT_OPTIONS = {
  timeout: 20000,
  deathTimeout: 30000,
};

/**
 * A high level Zookeeper Client
 *
 * @constructor
 * @param {Array} urls list of ZK (host:port) urls.
 * @param {Hash} options optional options. see DEFAULT_OPTIONS for a list of possible options.
 */
function ZkClient(urls, options) {
  this._urls = urls;
  this._urliter = 0;
  this._conn = null;
  this._options = misc.merge(DEFAULT_OPTIONS, options);
}


/**
 * Ensure a connection is available, callback is passed (err, connection)
 * If a connection is not available for options.deathTimeout, an error is fired.
 * @param {Function} callback Completion Callback.
 */
ZkClient.prototype._ensure = function(callback) {
  if (!this._conn) {
    this._reconnect();
  }

  /* TODO: handle reconnecting */
  callback(null, this._conn);
};

ZkClient.prototype._reconnect = function() {
  /* TODO: remember down servers */
  var hostport,
      url;

  url = this._urls[this._urliter % this._urls.length];
  this._urliter++;

  hostport = misc.splitAddress(url);

  this._conn = new ZkConnection(hostport[1], hostport[0], this._options);
};

