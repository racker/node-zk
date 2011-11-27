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
  arc1.serialize_int("leading int", 42);
  arc1.serialize_buffer("myBuffer", origBuffer);

  arc1buf = arc1.toBuffer();
  assert.isNotNull(newBuf);

  arc2 = new Archive();

  arc2.fromBuffer(arc1buf);
  assert.equal(42, arc2.deserialize_int("leading int"));
  newBuf = arc2.deserialize_buffer("myBuffer");
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
  arc1.serialize_string("str1", "hello world");
  arc1.serialize_string("str2", "end universe");

  arc1buf = arc1.toBuffer();
  assert.isNotNull(arc1buf);

  arc2 = new Archive();
  arc2.fromBuffer(arc1buf);

  assert.equal("hello world", arc2.deserialize_string("str1"));
  assert.equal("end universe", arc2.deserialize_string("str2"));

  test.finish();
};

exports['test_longs'] = function(test, assert) {
  var arc1,
      arc1buf,
      arc2,
      bignum = new Int64("1152921504606846976");

  arc1 = new Archive();
  arc1.serialize_long("long1", 52);
  arc1.serialize_long("long2", bignum);

  arc1buf = arc1.toBuffer();
  assert.isNotNull(arc1buf);

  arc2 = new Archive();
  arc2.fromBuffer(arc1buf);

  assert.equal(52, arc2.deserialize_long("long1"));
  assert.equal("2921504606846976", arc2.deserialize_long("long2").toOctetString());

  test.finish();
};


exports['test_buffers'] = function(test, assert) {
  var arc1,
      arc1buf,
      arc2,
      newBuf;

  arc1 = new Archive();
  arc1.serialize_buffer("buf1", new Buffer("hello world"));
  arc1.serialize_buffer("buf2", new Buffer("end universe"));

  arc1buf = arc1.toBuffer();
  assert.isNotNull(arc1buf);

  arc2 = new Archive();
  arc2.fromBuffer(arc1buf);

  assert.equal("hello world", arc2.deserialize_buffer("buf1").toString());
  assert.equal("end universe", arc2.deserialize_buffer("buf2").toString());

  test.finish();
};

exports['test_vectors'] = function(test, assert) {
  var arc1,
      arc1buf,
      arc2,
      newBuf,
      arr = ['foo', 'bar', 'blah', 'moooooooooooo'],
      i, j;

  arc1 = new Archive();
  arc1.serialize_int("first int", 200);
  arc1.serialize_start_vector("array start", arr.length);
  for (i = 0; i < arr.length; i++) {
    arc1.serialize_string(i, arr[i]);
  }
  arc1.serialize_end_vector("end vector");
  arc1.serialize_int("trailing int", 555);

  arc1buf = arc1.toBuffer();
  assert.isNotNull(arc1buf);

  arc2 = new Archive();
  arc2.fromBuffer(arc1buf);
  assert.equal(200, arc2.deserialize_int("first int"));
  i = arc2.deserialize_start_vector("array start");
  assert.equal(i, arr.length);
  for (j = 0; j < i; j++) {
    assert.equal(arr[j], arc2.deserialize_string(j));
  }
  arc2.deserialize_end_vector("end vector");
  assert.equal(555, arc2.deserialize_int("trailing int"));

  test.finish();
};
