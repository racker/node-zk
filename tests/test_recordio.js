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

var Archive = require('../lib/recordio').Archive;
var Int64 = require('node-int64');

exports['test_simple'] = function(test, assert) {
  var origBuffer = new Buffer('foo'),
      arc1,
      arc1buf,
      arc2,
      newBuf;

  arc1 = new Archive();
  arc1.serialize_int(42);
  arc1.serialize_buffer(origBuffer);

  arc1buf = arc1.toBuffer();
  assert.isNotNull(newBuf);

  arc2 = new Archive();

  arc2.fromBuffer(arc1buf);
  assert.equal(42, arc2.deserialize_int());
  newBuf = arc2.deserialize_buffer();
  assert.isNotNull(newBuf);
  assert.equal(3, newBuf.length);

  test.finish();
};

exports['test_strings'] = function(test, assert) {
  var arc1,
      arc1buf,
      arc2,
      newBuf;

  arc1 = new Archive();
  arc1.serialize_string("hello world");
  arc1.serialize_string("end universe");

  arc1buf = arc1.toBuffer();
  assert.isNotNull(arc1buf);

  arc2 = new Archive();
  arc2.fromBuffer(arc1buf);

  assert.equal("hello world", arc2.deserialize_string());
  assert.equal("end universe", arc2.deserialize_string());

  test.finish();
};

exports['test_longs'] = function(test, assert) {
  var arc1,
      arc1buf,
      arc2,
      bignum = new Int64("1152921504606846976");

  arc1 = new Archive();
  arc1.serialize_long(52);
  arc1.serialize_long(bignum);

  arc1buf = arc1.toBuffer();
  assert.isNotNull(arc1buf);

  arc2 = new Archive();
  arc2.fromBuffer(arc1buf);

  assert.equal(52, arc2.deserialize_long());
  assert.equal("2921504606846976", arc2.deserialize_long().toOctetString());

  test.finish();
};
