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


/**
 * Generate a random number between lower and upper bound.
 *
 * @param {Number} min Lower bound.
 * @param {Number} max Upper bound.
 * @return {Number} Random number between lower and upper bound.
 */
exports.getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};


/**
 * Generate a random string of upper lower case letters and decimal digits.
 *
 * @param {Number} len  The length of the string to return;.
 * @return {String} Random string.
 */
exports.randstr = function(len) {
  var chars, r, x;

  chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  r = [];

  for (x = 0; x < len; x++) {
    r.push(chars[exports.getRandomInt(0, chars.length - 1)]);
  }

  return r.join('');
};


/**
 * Very simple object merging.
 * Merges two objects together, returning a new object containing a
 * superset of all attributes.  Attributes in b are prefered if both
 * objects have identical keys.
 *
 * @param {Object} a Object to merge.
 * @param {Object} b Object to merge, wins on conflict.
 * @return {Object} The merged object.
 */
exports.merge = function(a, b) {
  var c = {}, attrname;

  for (attrname in a) {
    if (a.hasOwnProperty(attrname)) {
      c[attrname] = a[attrname];
    }
  }
  for (attrname in b) {
    if (b.hasOwnProperty(attrname)) {
      c[attrname] = b[attrname];
    }
  }
  return c;
};


/**
 * Split a host:port address into a host and port. This is basically python's
 * 'rpslit'.
 * @param {String} addr The address to split.
 * @return {Array} A [host, port] pair.
 */
exports.splitAddress = function(addr) {
  var idx = addr.lastIndexOf(':');

  if (idx === -1) {
    throw new Error('Address does not contain a colon (:)');
  }

  return [addr.slice(0, idx), addr.slice(idx + 1)];
};

/**
 * Return unix timestamp
 *
 * @param  {Date} date Date object to convert to Unix timestamp. If no date is
                       provided, current time is used.
 * @return {Number} Number of seconds passed from Unix epoch.
 */
exports.getUnixTimestamp = function(date) {
  var dateToFormat = date || new Date();

  return Math.round(dateToFormat / 1000);
};
