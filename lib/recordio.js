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

var Int64 = require('node-int64');

var POW_24 = Math.pow(2, 24);
var POW_32 = Math.pow(2, 32);

function Archive()
{
  /* Read offset */
  this._off = 0;

  /* Write offset */
  this._used = 0;

  /* TODO: pick a better default */
  this._buf = new Buffer(128);
}

/* TODO: rethink this api */
Archive.prototype.toBuffer = function() {
  var b = new Buffer(this._used);
  this._buf.copy(b, 0, 0, this._used);
  return b;
}

Archive.prototype.fromBuffer = function(buf) {
  var b = new Buffer(buf.length);
  buf.copy(b, 0, 0, buf.length);
  this._buf = b;
  this._used = buf.length;
  return b;
}

Archive.prototype._ensure = function(size) {
  /* Ensure at least X bytes are left in the Archive */
  if (this._off + size > this._used) {
    throw new Error("Expected more bytes to be available. used:" + this._off + " offset:" + this._off + " wanted:" + size);
  }
}

Archive.prototype._resizePlus = function(minSize) {
  var nbuf, nsize;

  minSize += this._used;

  if (minSize > this._buf.length) {
    /* TODO: power of 2 increase buffer size? */
    nsize = minSize + 128;
    nbuf = new Buffer(nsize);
    this._buf.copy(mbuf, 0, 0, this._used);
    this._buf = mbuf;
  }
};


/* Serialize a 32bit int */
Archive.prototype.serialize_int = function(v) {
  this._resizePlus(4);

  this._buf[this._used + 3] = v & 0xff;
  v >>= 8;
  this._buf[this._used + 2] = v & 0xff;
  v >>= 8;
  this._buf[this._used + 1] = v & 0xff;
  v >>= 8;
  this._buf[this._used + 0] = v & 0xff;

  this._used += 4;
}

Archive.prototype.deserialize_int = function() {
  var off = this._off, v;

  this._ensure(4);

  v = this._buf[off + 3];
  v += this._buf[off + 2] << 8;
  v += this._buf[off + 1] << 16;
  v += this._buf[off] * POW_24;

  if (this._buf[off] & 0x80) {
    v -= POW_32;
  }

  this._off += 4;

  return v;
};

/* Serialize a 64bit int */
Archive.prototype.serialize_long = function(v) {
  this._resizePlus(8);

  /* Already an int64 object */
  if (v.buffer === undefined) {
    v = new Int64(v);
  }

  v.buffer.copy(this._buf, 0, this._used, 8);
  this._used += 8;
};

Archive.prototype.deserialize_long = function() {
  var v, tmpb;

  this._ensure(8);

  tmpb = new Buffer(8);

  this._buf.copy(tmpb, 0, this._off, this._off + 8);

  v = new Int64(tmpb);

  this._off += 8;

  return v;
};


Archive.prototype.serialize_bool = function(v) {
  this._resizePlus(1);
  /* http://download.oracle.com/javase/6/docs/api/java/io/DataOutput.html#writeBoolean(boolean) */
  this._buf[this._used] = v ? '\1' : '\0'; 
  this._used += 1;
}

Archive.prototype.deserialize_bool = function() {
  var v;

  this._ensure(1);

  if (this._buf[this._off] === 0) {
    v = false;
  }
  else if (this._buf[this._off] === 1) {
    v = true;
  }
  else {
    throw new Error("Unexpected value for deserializing boolean. value:" + this._buf[this._off] + " offset:" + this._off);
  }

  this._off += 1;

  return v;
}

Archive.prototype.serialize_buffer = function(buf) {
  /* TODO: what about length 0 buffers? */
  if (buf !== null) {
    this._resizePlus(1 + buf.length);
    this.serialize_int(buf.length);
    buf.copy(this._buf, this._used);
    this._used += buf.length;
  }
  else {
    this.serialize_int(-1);
  }
}

Archive.prototype.deserialize_buffer = function() {
  var v, tmpb, blen;

  blen = this.deserialize_int();

  if (blen === -1) {
    return null;
  }

  this._ensure(blen);

  tmpb = new Buffer(blen);

  this._buf.copy(tmpb, 0, this._off, this._off + blen);

  this._off += blen;

  return tmpb;
};


Archive.prototype.serialize_string = function(str) {
  var slen = Buffer.byteLength(str);
  this._resizePlus(1 + slen);
  this.serialize_int(slen);
  this._buf.write(str, this._used);
  this._used += slen;
}

Archive.prototype.deserialize_string = function() {
  var v, blen;

  blen = this.deserialize_int();

  if (blen < 0) {
    throw new Error('Unexpected error in deserialize string');
  }

  this._ensure(blen);

  v = this._buf.toString('utf8', this._off, this._off + blen);

  this._off += blen;

  return v;
};


Archive.prototype.serialize_start_record = function() {
  return;
};

Archive.prototype.serialize_end_record = function() {
  return;
};

Archive.prototype.serialize_start_vector = function(count) {
  return this.serialize_int(count);
};

Archive.prototype.serialize_end_vector = function() {
  return;
};


exports.Archive = Archive;

