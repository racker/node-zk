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

exports['test_ConnectRequest'] = function(test, assert) {
  var cr, b, cr2;

  cr = new ConnectRequest();
  cr.timeOut = 33;
  b = cr.serialize();

  cr2 = new ConnectRequest();

  assert.equal(b.length, cr2.speculative_deserialize(b));

  cr2.deserialize(b);
  assert.equal(cr.timeOut, cr2.timeOut);
  test.finish();
};
