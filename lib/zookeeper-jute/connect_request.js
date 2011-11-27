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
 * class ConnectRequest {
 *     int protocolVersion;
 *     long lastZxidSeen;
 *     int timeOut;
 *     long sessionId;
 *     buffer passwd;
 * }
 */

var meta = {
  'fields': [
    {'name': 'protocolVersion', 'type': jute.F_INT},
    {'name': 'lastZxidSeen', 'type': jute.F_LONG},
    {'name': 'timeOut', 'type': jute.F_INT},
    {'name': 'sessionId', 'type': jute.F_LONG},
    {'name': 'passwd', 'type': jute.F_BUFFER},
    {'name': 'readOnly', 'type': jute.F_BOOL}
  ]
};

function ConnectRequest() {
  jute.JuteStruct.call(this, meta)
}

util.inherits(ConnectRequest, jute.JuteStruct);

exports.ConnectRequest = ConnectRequest;
