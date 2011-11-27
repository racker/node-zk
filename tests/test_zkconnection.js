/**
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

var ConnectRequest = require('../lib/zookeeper-jute/connect_request').ConnectRequest
var ZkConnection = require('../lib/connection').ZkConnection;

exports['test_ZkConnection'] = function(test, assert) {
  var conn;

  conn = new ZkConnection(2181, "127.0.0.1");

  setTimeout(function() {
    console.error('sending destroy');
    conn.destroy();
  }, 1000);

  setTimeout(function() {
    console.error('sending destroy 2');
    conn.destroy();
  }, 2000);

  setTimeout(function() {
    console.error(conn);
    console.error(conn._conn);
  }, 3000);

  conn.on('end', function() {
    console.error('got end!');
    conn.destroy();
    test.finish();
  });
};
