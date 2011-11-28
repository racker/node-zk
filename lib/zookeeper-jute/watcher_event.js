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

var jute = require('../jute');
var util = require('util');

/**
 * class WatcherEvent {
 *    int type;  // event type
 *    int state; // state of the Keeper client runtime
 *    ustring path;
 * }
 */

var meta = {
  'fields': [
    {'name': 'type', 'type': jute.F_INT},
    {'name': 'state', 'type': jute.F_INT},
    {'name': 'path', 'type': jute.F_STRING},
  ]
};

function WatcherEvent() {
  jute.JuteStruct.call(this, meta)
}

util.inherits(WatcherEvent, jute.JuteStruct);

exports.WatcherEvent = WatcherEvent;
