
var ws = require('websocket').server;

var https = require('https');
var fs = require('fs');
var privateKey = fs.readFileSync('/home/ubuntu/websocket_server/pem/cakey.pem', 'utf8');
var certificate = fs.readFileSync('/home/ubuntu/websocket_server/pem/cacert.pem', 'utf8');
var credentials = { key: privateKey, cert: certificate, rejectUnauthorized: false };

var http = require('http');
var connectList = {};
var clientList = [];
var targetList = [];
var todclientList = [];
var todtargetList = [];
var pktadapterList = [];
var pktmobileList = [];
var uuidList = [];
var uuidMax = 100;
var CKTWebService = {
  key:              "66b78883f3fb4f2db31dc42fb7031e2b",
  host:             "service1.insyde.com",
  setTargetStatus:  "/CastKT/Service/CastKT.asmx/setTargetStatus",
  setTargetStatusWithMeetingInfo: "/CastKT/Service/CastKT.asmx/setTargetStatusWithMeetingInfo",
}
var ToDWebService = {
  key:              "d8878a53616f4550b5c131185f398721",
  host:             "service1.insyde.com",
  setTargetStatus:  "/TodKanTan/Service/Tod.asmx/setTargetStatus",
}

var server = http.createServer(function (request, response) {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.write('Hello World (ws) ' + getTime());
	response.end();
	});
server.listen(8080, function(){
  console.log(getTime() + ' Server is listening on port 8080');
});


var httpsServer = https.createServer(credentials, function (request, response) {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.write('Hello World (wss) ' + getTime());
	response.end();
});
httpsServer.listen(8181, function(){
    console.log(getTime() + ' Server is listening on port 8181');
});

function PostCode(obj, host, path) {
  // Build the post string from an object
  function jsonToQueryString(json) {
    return  Object.keys(json).map(function(key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
    }).join('&');
  }
  var post_data = jsonToQueryString(obj)
  //console.log("post:", post_data);

  var post_options = {
      host: host,
      path: path,
      port: '',
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(post_data)
      }
  };

  // Set up the request
  var post_req = require("http").request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          //console.log('Response: ' + chunk);
      });
  });

  // post the data
  post_req.write(post_data);
  post_req.end();
}

function GetPostdataForToD (id, TargetStatus) {
  return {
    Key:                ToDWebService.key,
    TargetUUID:         connectList[id].deviceuuid,
    TargetRoomId:       connectList[id].roomid,
    TargetStatus:       TargetStatus,
  };
}

function GetPostdata (id, TargetStatus) {
  return {
    Key:          CKTWebService.key,
    TargetUUID:         connectList[id].deviceuuid,
    TargetRoomId:       connectList[id].roomid,
    TargetName:         connectList[id].nickname,
    TargetStatus:       TargetStatus,
    PingCode:           connectList[id].pinCode,
    VersionNO:          connectList[id].version,
    MeetingTitle:       connectList[id].meetingtitle,
    MeetingPeriod:      connectList[id].meetingperiod,
    MeetingAttendCount: connectList[id].attendcount,
  };
}

function guid() {
  function n6() {
    return Math.floor((Math.random()) * 1000000).toString(10);
  }
  function padLeft(str,lenght){
    if(str.length >= lenght)
      return str;
    else
      return padLeft("0" +str,lenght);
  }
  return padLeft(n6(), 6);
}

ws = new ws({
  httpServer: server,
  maxReceivedFrameSize: 0x100000,
  autoAcceptConnections: false
});

//var WebSocketServer = require('websocket').server;

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
    server: httpsServer,
    //httpsServer : server,
    maxReceivedFrameSize: 0x100000,
    autoAcceptConnections: false
});



function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

function getTime(){
  var time = new Date();
  time.setHours(time.getHours());
  return time.getFullYear().toString() + '-'
     + (((time.getMonth()+1).toString().length < 2) ? "0" + (time.getMonth()+1).toString() : (time.getMonth()+1).toString()) + "-"
     + (((time.getDate()).toString().length < 2) ? "0" + (time.getDate()).toString() : (time.getDate()).toString()) + " "
     + (((time.getHours()).toString().length < 2) ? "0" + (time.getHours()).toString() : (time.getHours()).toString()) + ":"
     + (((time.getMinutes()).toString().length < 2) ? "0" + (time.getMinutes()).toString() : (time.getMinutes()).toString()) + ":"
     + (((time.getSeconds()).toString().length < 2) ? "0" + (time.getSeconds()).toString() : (time.getSeconds()).toString());
}

//wss.on('request', function (request) {
//    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
//    if (request.origin != 'https://www.example.com') {
//        console.log("rejecting request from " + request.origin + " as not coming from our web site");
//        return;
//    }
//    var connection = request.accept(null, request.origin);
//    connection.on('message', function (message) {
//        console.log("Got a message");
//    });
//});


wss.on('connection', function connection(ws, req) {

    //console.log('wss req:', req.headers.origin);
    var uuid1 = null
    while (!uuid1) {
        var tmp = guid();
        if (uuidList.indexOf(tmp) < 0) {
            uuid1 = tmp;
        }
    }
    uuidList.push(uuid1);
    

    ws.on('message', function incoming(message) {
        this.uuid = uuid1;
        //connection = this;
        //connection.uuid = uuid1;
        connectList[uuid1] = {
            "connection": this,
            "deviceuuid": "",
            "nickname": "",
            "pinCode": "",
            "version": "",
            "meetingtitle": "",
            "meetingperiod": "",
            "attendcount": "",
        };
        
        console.log('wss message:', message);
        console.log('wss this.uuid1:', this.uuid, ' uuid1:', uuid1);
        //if (message.type == 'utf8') {
            try {
                //var msg = JSON.parse(message.utf8Data);
                var msg = JSON.parse(message);
                //    console.log(msg);
                if (msg.command) {
                    switch (msg.command) {
                        case 'registerdevice':
                            //console.log('Receive registerdevice');
                            if (msg.message.devicetype === 'target' || msg.message.devicetype === 'tod-target') {
                                if (!msg.message.uuid) {
                                    console.log("1wss user " + msg.message.devicetype + ":", this.uuid, "registerdevice type 1: no uuid info, use default uuid:", msg.message.uuid);
                                } else if (msg.message.uuid === this.uuid) {
                                    console.log("2wss user " + msg.message.devicetype + ":", this.uuid, "registerdevice type 2: uuid info is equal to default uuid:", msg.message.uuid);
                                } else if (uuidList.indexOf(msg.message.uuid) >= 0 && connectList[msg.message.uuid].deviceuuid.length == 0) {
                                    console.log("3wss user " + msg.message.devicetype + ":", this.uuid, "registerdevice type 3: uuid info is duplicateed, skip create new uuie:", msg.message.uuid);
                                } else if (uuidList.indexOf(msg.message.uuid) >= 0 && connectList[msg.message.uuid].deviceuuid.length >= 0) {
                                    console.log("4wss user " + msg.message.devicetype + ":", this.uuid, "registerdevice type 4: device is reconnect and deviceuuid is the same, use old setting:", msg.message.uuid, msg.message.deviceuuid);
                                    console.log("5wss uuid:", this.uuid, "change to", msg.message.uuid);
                                    connectList[msg.message.uuid].connection.overwrite = true;
                                    connectList[msg.message.uuid].connection = connectList[this.uuid].connection;
                                    var index = uuidList.indexOf(this.uuid);
                                    uuidList.splice(index, 1);
                                    delete connectList[this.uuid];

                                    //connectList[msg.message.uuid].connection.uuid = msg.message.uuid;
                                    this.uuid = msg.message.uuid; //-> this.uuid is equal to connectList[msg.message.uuid].connection.uuid

                                } else {
                                    console.log('6wss ' + "user " + msg.message.devicetype + ":", uuid, "registerdevice type 5: uuid info is not duplicateed, use self's own uuid:", msg.message.uuid);
                                    console.log('7wss ' + "uuid:", this.uuid, "change to", msg.message.uuid);
                                    connectList[msg.message.uuid] = connectList[this.uuid];
                                    var index = uuidList.indexOf(uuid);
                                    uuidList.splice(index, 1);
                                    delete connectList[uuid1];
                                    this.uuid = msg.message.uuid;
                                    uuidList.push(this.uuid);
                                }

                                connectList[this.uuid].deviceuuid = msg.message.deviceuuid;
                                connectList[this.uuid].roomid = this.uuid;
                                if (msg.message.devicetype === 'target' && targetList.indexOf(this.uuid) < 0) targetList.push(this.uuid);
                                if (msg.message.devicetype === 'tod-target') {
                                    if (todtargetList.indexOf(this.uuid) < 0) todtargetList.push(this.uuid);
                                    PostCode(GetPostdataForToD(this.uuid, 1), ToDWebService.host, ToDWebService.setTargetStatus);
                                }

                                //PostCode(GetPostdata(this.uuid, 1), CKTWebService.host, CKTWebService.setTargetStatusWithMeetingInfo);
                                connectList[this.uuid].connection.send(JSON.stringify({
                                    sender: 'Server',
                                    date: getTime(),
                                    command: 'assignuuid',
                                    message: {
                                        uuid: this.uuid,
                                    }
                                }));
                            } else if (msg.message.devicetype === 'client') {
                                if (clientList.indexOf(this.uuid) < 0) clientList.push(this.uuid);
                            } else if (msg.message.devicetype === 'tod-client') {
                                //console.log('wss tod-client:', todclientList.indexOf(this.uuid), todclientList, this.uuid);
                                if (todclientList.indexOf(this.uuid) < 0) todclientList.push(this.uuid);
                            } else if (msg.message.devicetype === 'pkt-mobile' || msg.message.devicetype === 'pkt-adapter') {
                                if (pktmobileList.indexOf(this.uuid) < 0 && msg.message.devicetype === 'pkt-mobile')
                                    pktmobileList.push(this.uuid);
                                if (pktadapterList.indexOf(this.uuid) < 0 && msg.message.devicetype === 'pkt-adapter')
                                    pktadapterList.push(this.uuid);
                                connectList[this.uuid].connection.send(JSON.stringify({
                                    sender: 'Server',
                                    date: getTime(),
                                    command: 'registerdeviceresult',
                                    message: {
                                        id: this.uuid,
                                    }
                                }));
                            } else {
                                console.log('8wss ' + 'registerdevice error: ' + msg.message);
                                break;
                            }

                            console.log('9wss ' + 'user', msg.message.devicetype, ': ' + this.uuid + ', ' + getTime() + ' is registered.');
                            console.log("user's deviceuuid:", connectList[this.uuid].deviceuuid);
                            console.log("  ## total uuid number:", uuidList.length);
                            console.log("    -> current uuid list: ", uuidList);
                            console.log("  ## total target number:", targetList.length);
                            console.log("    -> current target list: ", targetList);
                            console.log("  ## total client number:", clientList.length);
                            console.log("    -> current client list: ", clientList);
                            console.log("  ## total ToD-target number:", todtargetList.length);
                            console.log("    -> current ToD-target list: ", todtargetList);
                            console.log("  ## total ToD-client number:", todclientList.length);
                            console.log("    -> current ToD-client list: ", todclientList);
                            console.log("  ## total PassKanTan mobile number:", pktmobileList.length);
                            console.log("    -> current PassKanTan mobile list: ", pktmobileList);
                            console.log("  ## total PassKanTan adapter number:", pktadapterList.length);
                            console.log("    -> current PassKanTan adapter list: ", pktadapterList);
                            console.log('\n');
                            break;

                        case 'updateinfo':
                            // only for Target side, provide a way for Target to update Target's nickname/pinCode/version
                            connectList[this.uuid].nickname = (msg.message.nickname) ? msg.message.nickname : "";
                            connectList[this.uuid].pinCode = (msg.message.pinCode) ? msg.message.pinCode : "";
                            connectList[this.uuid].version = (msg.message.version) ? msg.message.version : "";
                            connectList[this.uuid].meetingperiod = (msg.message.meetingperiod) ? msg.message.meetingperiod : "";
                            connectList[this.uuid].attendcount = (msg.message.attendcount) ? msg.message.attendcount : "";
                            connectList[this.uuid].meetingtitle = (msg.message.meetingtitle) ? msg.message.meetingtitle : "";

                            PostCode(GetPostdata(this.uuid, 1), CKTWebService.host, CKTWebService.setTargetStatusWithMeetingInfo);

                            console.log('wss ' + 'user:', this.uuid, 'update info:', connectList[this.uuid].nickname, connectList[this.uuid].pinCode);
                            console.log('\n');
                            // don't send target info throught websocket, Client will request target info by WebService
                            break;
                            var roominfo = [];
                            roominfo.push({
                                "nickname": connectList[this.uuid].nickname,
                                "pinCode": connectList[this.uuid].pinCode,
                                "version": connectList[this.uuid].version,
                                "roomid": this.uuid,
                            });
                            for (var i = 0; i < clientList.length; i++) {
                                connectList[clientList[i]].connection.send(JSON.stringify({
                                    sender: 'Server',
                                    date: getTime(),
                                    command: 'targetroominfo',
                                    message: {
                                        roominfo: roominfo,
                                        roomremove: [],
                                    }
                                }));
                            }
                            break;

                        case 'requestroominfo':
                            // only for Client side, query Target info.
                            var roominfo = [];
                            for (var i = 0; i < targetList.length; i++) {
                                roominfo.push({
                                    "nickname": connectList[targetList[i]].nickname,
                                    "pinCode": connectList[targetList[i]].pinCode,
                                    "version": connectList[targetList[i]].version,
                                    "roomid": connectList[targetList[i]].roomid,
                                });
                            }
                            connectList[this.uuid].connection.send(JSON.stringify({
                                sender: 'Server',
                                date: getTime(),
                                command: 'targetroominfo',
                                message: {
                                    roominfo: roominfo,
                                    roomremove: [],
                                }
                            }));
                            break;

                        case 'requestuuid':
                            // Client request uuid from Target through this command
                            if (targetList.indexOf(msg.message.toId) >= 0 || todtargetList.indexOf(msg.message.toId) >= 0) {
                                msg.message.fromServerId = this.uuid;
                                connectList[msg.message.toId].connection.send(JSON.stringify({
                                    sender: 'Server',
                                    date: getTime(),
                                    command: 'requestuuid',
                                    message: msg.message,
                                }));

                                //ws.send(JSON.stringify({
                                //    sender: 'Server',
                                //    date: getTime(),
                                //    command: 'requestuuid',
                                //    message: msg.message,
                                //}));
                            }
                            break;

                        case 'assignuuid':
                            // Target assign uuid to Client through this command
                            if (msg.message.toServerId && uuidList.indexOf(msg.message.toServerId) >= 0) {
                                connectList[msg.message.toServerId].connection.send(JSON.stringify({
                                    sender: 'Server',
                                    date: getTime(),
                                    command: 'assignuuid',
                                    message: {
                                        "uuid": msg.message.uuid,
                                        "roomId": msg.message.roomId,
                                        "fromDevicetype": msg.message.fromDevicetype,
                                    }
                                }));
                            }
                            break;

                        case 'signal':
                            //# Any device CANNOT send signal without uuid
                            //# It means devices must registerdevice before send signal message
                            if (!this.uuid) break;
                            if (msg.message && uuidList.indexOf(msg.message.toServerId) >= 0) {
                                msg.message.info = {
                                    serverId: this.uuid,
                                    fromDevicetype: msg.message.deviceType,
                                };
                                connectList[msg.message.toServerId].connection.send(JSON.stringify({
                                    sender: 'Server',
                                    date: getTime(),
                                    command: msg.command,
                                    message: msg.message
                                }));
                            }
                            break;

                        case 'checktodtarget':
                            connectList[this.uuid].connection.send(JSON.stringify({
                                sender: 'Server',
                                date: getTime(),
                                command: "checktodtargetresult",
                                message: {
                                    todid: msg.message.toId,
                                    result: (todtargetList.indexOf(msg.message.toId) >= 0) ? true : false,
                                }
                            }));

                            break;

                        case 'checkpktmobile':
                            var result = (pktmobileList.indexOf(msg.message.id) >= 0) ? true : false;
                            connectList[this.uuid].connection.send(JSON.stringify({
                                sender: 'Server',
                                date: getTime(),
                                command: "checkpktmobileresult",
                                message: {
                                    mobileid: msg.message.id,
                                    result: result,
                                }
                            }));
                            break;

                        case 'stayawake':
                            //console.log('Receive stayawake from', uuid,'on', getTime());
                            break;

                        default:
                            console.log('wss ' + this.uuid, 'send command: ', msg.command, ' is not match!');
                            console.log("msg", msg);
                    }
                }
            } catch (e) {
                console.log(e);
            }

        //} else if (message.type == 'binary') {
        //    console.log('Received binary data.');
        //}



        console.log('wss received:', message);
        //onWs(message, ' wss - ');
    });

    //ws.send('something');
});

//wss.on('connection', function connection(ws) {
//    ws.on('message', function incoming(message) {
//        onWs(ws, ' wss - ');
//        console.log('wss -' + ws.origin);
//    });
//    //ws.on('close', function close() {
//    //    console.log("DISCONNECTED");
//    //});
//});


ws.on('request', function (request) {
    //console.log('ws received:', request);
    onWs(request, ' ws - ');
});

function onWs(request, wsType) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log(getTime() + wsType + ' Connection from origin ' + request.origin + ' rejected.');
    console.log('\n');
    return;
  }

// #1  reject the income connection if the uuid in array is more than uuidMax
  var uuid = null;
  if(uuidList.length > uuidMax) {
    console.log('The total connection number: ' + uuidList,uuidList.length + ' is maximum, reject the current connection');
    request.reject();
    console.log(getTime() + wsType + ' Connection from origin ' + request.origin + ' rejected.');
    console.log('\n');
    return;
  }
  console.log('request.origin: ' + request.origin);
// #2  save the income connection to array if the protocol is match
  try {
    var connection = request.accept('test-server', request.origin);
  } catch (e) {
    console.log("[server] request.accept test-server error:", e,"request:",request);
    console.log('\n');
    return;
  }
//  console.log("Accept request", request);

// #3  make unique uuid and push to uuid array
  while (!uuid) {
    var tmp = guid();
    if (uuidList.indexOf(tmp) < 0 ) {
      uuid = tmp;
    }
  }
  uuidList.push(uuid);
  connection.uuid = uuid;
  connectList[uuid] = {
    "connection": connection,
    "deviceuuid": "",
    "nickname": "",
    "pinCode": "",
    "version": "",
    "meetingtitle" : "",
    "meetingperiod" : "",
    "attendcount" : "",
  };


  console.log(wsType + 'user(uuid): ' + uuid + ', ' + getTime() + ' is connected.');
  console.log('\n');

// #4  assign receive message event
  connection.on('message', function (message) {
      console.log('ws message:', message);
      console.log('ws this.uuid:', this.uuid, ' uuid:', uuid);

    if (message.type == 'utf8') {
      try {
        var msg = JSON.parse(message.utf8Data);
        if (msg.command) {
          switch (msg.command) {
            case 'registerdevice':
              if (msg.message.devicetype === 'target' || msg.message.devicetype === 'tod-target') {
                if(!msg.message.uuid) {
                    console.log(wsType + " 1user " + msg.message.devicetype + ":",this.uuid,"registerdevice type 1: no uuid info, use default uuid:", msg.message.uuid);
                } else if(msg.message.uuid === this.uuid) {
                    console.log(wsType + " 2user " + msg.message.devicetype + ":", this.uuid,"registerdevice type 2: uuid info is equal to default uuid:", msg.message.uuid);
                } else if(uuidList.indexOf(msg.message.uuid) >= 0 && connectList[msg.message.uuid].deviceuuid.length == 0) {
                    console.log(wsType + " 3user " + msg.message.devicetype + ":", this.uuid,"registerdevice type 3: uuid info is duplicateed, skip create new uuie:", msg.message.uuid);
                } else if(uuidList.indexOf(msg.message.uuid) >= 0 && connectList[msg.message.uuid].deviceuuid.length >= 0) {
                    console.log(wsType + " 4user " + msg.message.devicetype + ":", this.uuid,"registerdevice type 4: device is reconnect and deviceuuid is the same, use old setting:", msg.message.uuid, msg.message.deviceuuid);
                    console.log(wsType + " 5uuid:", this.uuid, "change to", msg.message.uuid);
                  connectList[msg.message.uuid].connection.overwrite = true;
                  connectList[msg.message.uuid].connection = connectList[this.uuid].connection;
                  var index = uuidList.indexOf(this.uuid);
                  uuidList.splice(index, 1);
                  delete connectList[this.uuid];

                  //connectList[msg.message.uuid].connection.uuid = msg.message.uuid;
                  this.uuid = msg.message.uuid; //-> this.uuid is equal to connectList[msg.message.uuid].connection.uuid

                } else {
                    console.log(wsType + " 6user " + msg.message.devicetype + ":", uuid,"registerdevice type 5: uuid info is not duplicateed, use self's own uuid:", msg.message.uuid);
                    console.log(wsType + " 7uuid:", this.uuid, "change to", msg.message.uuid);
                  connectList[msg.message.uuid] = connectList[this.uuid];
                  var index = uuidList.indexOf(uuid);
                  uuidList.splice(index, 1);
                  delete connectList[uuid];
                  this.uuid = msg.message.uuid;
                  uuidList.push(this.uuid);
                }

                connectList[this.uuid].deviceuuid = msg.message.deviceuuid;
                connectList[this.uuid].roomid = this.uuid;
                if (msg.message.devicetype === 'target' && targetList.indexOf(this.uuid) < 0) targetList.push(this.uuid);
                if (msg.message.devicetype === 'tod-target') {
                    if (todtargetList.indexOf(this.uuid) < 0) todtargetList.push(this.uuid);
                  PostCode(GetPostdataForToD(this.uuid, 1), ToDWebService.host, ToDWebService.setTargetStatus);
                }

                //PostCode(GetPostdata(this.uuid, 1), CKTWebService.host, CKTWebService.setTargetStatusWithMeetingInfo);
                connectList[this.uuid].connection.send(JSON.stringify({
                  sender: 'Server',
                  date: getTime(),
                  command : 'assignuuid',
                  message: {
                    uuid: this.uuid,
                }}));
              } else if ( msg.message.devicetype === 'client') {
                if (clientList.indexOf(this.uuid) < 0) clientList.push(this.uuid);
              } else if ( msg.message.devicetype === 'tod-client') {
                if (todclientList.indexOf(this.uuid) < 0) todclientList.push(this.uuid);
              } else if ( msg.message.devicetype === 'pkt-mobile' || msg.message.devicetype === 'pkt-adapter') {
                if (pktmobileList.indexOf(this.uuid) < 0  && msg.message.devicetype === 'pkt-mobile')
                  pktmobileList.push(this.uuid);
                if (pktadapterList.indexOf(this.uuid) < 0 && msg.message.devicetype === 'pkt-adapter')
                    pktadapterList.push(this.uuid);

                connectList[this.uuid].connection.send(JSON.stringify({
                  sender: 'Server',
                  date: getTime(),
                  command : 'registerdeviceresult',
                  message: {
                    id: this.uuid,
                }}));
              } else {
                  console.log(wsType + 'registerdevice error: ' + msg.message);
                break;
              }

              console.log(wsType + ' 8user', msg.message.devicetype,': '+ this.uuid + ', ' + getTime() + ' is registered.');
              console.log("user's deviceuuid:", connectList[this.uuid].deviceuuid);
              console.log("  ## total uuid number:", uuidList.length);
              console.log("    -> current uuid list: ", uuidList);
              console.log("  ## total target number:", targetList.length);
              console.log("    -> current target list: ", targetList);
              console.log("  ## total client number:", clientList.length);
              console.log("    -> current client list: ", clientList);
              console.log("  ## total ToD-target number:", todtargetList.length);
              console.log("    -> current ToD-target list: ", todtargetList);
              console.log("  ## total ToD-client number:", todclientList.length);
              console.log("    -> current ToD-client list: ", todclientList);
              console.log("  ## total PassKanTan mobile number:", pktmobileList.length);
              console.log("    -> current PassKanTan mobile list: ", pktmobileList);
              console.log("  ## total PassKanTan adapter number:", pktadapterList.length);
              console.log("    -> current PassKanTan adapter list: ", pktadapterList);
              console.log('\n');
              break;

            case 'updateinfo':
              // only for Target side, provide a way for Target to update Target's nickname/pinCode/version
              connectList[this.uuid].nickname =      (msg.message.nickname)      ? msg.message.nickname      : "";
              connectList[this.uuid].pinCode =       (msg.message.pinCode)       ? msg.message.pinCode       : "";
              connectList[this.uuid].version =       (msg.message.version)       ? msg.message.version       : "";
              connectList[this.uuid].meetingperiod = (msg.message.meetingperiod) ? msg.message.meetingperiod : "";
              connectList[this.uuid].attendcount =   (msg.message.attendcount)   ? msg.message.attendcount   : "";
              connectList[this.uuid].meetingtitle =  (msg.message.meetingtitle)  ? msg.message.meetingtitle  : "";

              PostCode(GetPostdata(this.uuid, 1), CKTWebService.host, CKTWebService.setTargetStatusWithMeetingInfo);

              console.log(wsType + 'user:', this.uuid, 'update info:', connectList[this.uuid].nickname, connectList[this.uuid].pinCode);
              console.log('\n');
              // don't send target info throught websocket, Client will request target info by WebService
              break;
              var roominfo = [];
              roominfo.push({
                "nickname": connectList[this.uuid].nickname,
                "pinCode": connectList[this.uuid].pinCode,
                "version": connectList[this.uuid].version,
                "roomid": this.uuid,
              });
              for (var i = 0; i < clientList.length ; i++) {
                connectList[clientList[i]].connection.send(JSON.stringify({
                  sender: 'Server',
                  date: getTime(),
                  command : 'targetroominfo',
                  message: {
                    roominfo: roominfo,
                    roomremove: [],
                  }
                }));
              }
              break;

            case 'requestroominfo':
              // only for Client side, query Target info.
              var roominfo = [];
              for (var i = 0; i < targetList.length ; i++) {
                roominfo.push({
                  "nickname": connectList[targetList[i]].nickname,
                  "pinCode": connectList[targetList[i]].pinCode,
                  "version": connectList[targetList[i]].version,
                  "roomid": connectList[targetList[i]].roomid,
                });
              }
              connectList[this.uuid].connection.send(JSON.stringify({
                sender: 'Server',
                date: getTime(),
                command : 'targetroominfo',
                message: {
                  roominfo: roominfo,
                  roomremove: [],
                }
              }));
              break;

            case 'requestuuid':
              // Client request uuid from Target through this command
                  if (targetList.indexOf(msg.message.toId) >= 0 || todtargetList.indexOf(msg.message.toId) >= 0) {
                      msg.message.fromServerId = this.uuid;
                      connectList[msg.message.toId].connection.send(JSON.stringify({
                          sender: 'Server',
                          date: getTime(),
                          command: 'requestuuid',
                          message: msg.message,
                      }));
                  }
              break;

            case 'assignuuid':
              // Target assign uuid to Client through this command
                  if (msg.message.toServerId && uuidList.indexOf(msg.message.toServerId) >= 0) {
                      connectList[msg.message.toServerId].connection.send(JSON.stringify({
                          sender: 'Server',
                          date: getTime(),
                          command: 'assignuuid',
                          message: {
                              "uuid": msg.message.uuid,
                              "roomId": msg.message.roomId,
                              "fromDevicetype": msg.message.fromDevicetype,
                          }
                      }));
                  }
              break;

            case 'signal':
              //# Any device CANNOT send signal without uuid
              //# It means devices must registerdevice before send signal message
              if( !this.uuid ) break;
              if (msg.message && uuidList.indexOf(msg.message.toServerId) >= 0) {
                  msg.message.info = {
                      serverId: this.uuid,
                      fromDevicetype: msg.message.deviceType,
                  };
                  connectList[msg.message.toServerId].connection.send(JSON.stringify({
                      sender: 'Server',
                      date: getTime(),
                      command: msg.command,
                      message: msg.message
                  }));
              }
              break;

            case 'checktodtarget':
              connectList[this.uuid].connection.send(JSON.stringify({
                sender: 'Server',
                date: getTime(),
                command : "checktodtargetresult",
                message: {
                  todid: msg.message.toId,
                  result: (todtargetList.indexOf(msg.message.toId) >=0 ) ? true : false,
                }
              }));
              break;

            case 'checkpktmobile':
              var result = (pktmobileList.indexOf(msg.message.id) >= 0) ? true : false;
              connectList[this.uuid].connection.send(JSON.stringify({
                sender: 'Server',
                date: getTime(),
                command : "checkpktmobileresult",
                message: {
                  mobileid: msg.message.id,
                  result: result,
                }
              }));
              break;

            case 'stayawake':
              //console.log('Receive stayawake from', uuid,'on', getTime());
              break;

            default:
                  console.log(wsType + this.uuid,' 9send command: ',msg.command,' is not match!');
              console.log("msg", msg);
          }
        }
      } catch (e) {
        console.log(e);
      }

    } else if (message.type == 'binary') {
      console.log('Received binary data.');
    }
  });

// #5  assign close connection event
  connection.on('close', function(connection){
    var msg = 'user: '+ uuid + ', ' + getTime() + ' is disconnected.' ;

    if (this.overwrite) {
        console.log(wsType + this.uuid, " is overwrite, skip onclose event once.");
      return;
    }

    console.log(wsType + 'user:', this.uuid, connectList[this.uuid].nickname, getTime(), ' is disconnected.');
    var index = uuidList.indexOf(this.uuid);
    uuidList.splice(index, 1);
    if ( clientList.indexOf(this.uuid) >= 0)
      clientList.splice(clientList.indexOf(this.uuid), 1);
    else if ( targetList.indexOf(this.uuid) >= 0) {
      PostCode(GetPostdata(this.uuid, 2), CKTWebService.host, CKTWebService.setTargetStatusWithMeetingInfo);
      targetList.splice(targetList.indexOf(this.uuid), 1);
    } else if (todtargetList.indexOf(this.uuid) >= 0) {
      PostCode(GetPostdataForToD(this.uuid, 2), ToDWebService.host, ToDWebService.setTargetStatus);
      todtargetList.splice(todtargetList.indexOf(this.uuid), 1);
    } else if ( todclientList.indexOf(this.uuid) >= 0)
      todclientList.splice(todclientList.indexOf(this.uuid), 1);
    else if ( pktadapterList.indexOf(this.uuid) >= 0)
      pktadapterList.splice(pktadapterList.indexOf(this.uuid), 1);
    else if ( pktmobileList.indexOf(this.uuid) >= 0)
      pktmobileList.splice(pktmobileList.indexOf(this.uuid), 1);

    delete connectList[this.uuid];

    for (var i = 0 ; i < connectList.length ; i ++){
      connectList[i].connection.send(JSON.stringify({
        user: 'Server',
        date: getTime(),
        message: msg
      }));
    }
    var roomremove = [];
    roomremove.push(this.uuid);
    for (var i = 0; i < clientList.length ; i++) {
      connectList[clientList[i]].connection.send(JSON.stringify({
        sender: 'Server',
        date: getTime(),
        command : 'targetroominfo',
        message: {
          roominfo: [],
          roomremove: roomremove,
        }
      }));
    }
    console.log(wsType);
    console.log("  ## total uuid number:", uuidList.length);
    console.log("    -> current uuid list: ", uuidList);
    console.log("  ## total target number:", targetList.length);
    console.log("    -> current target list: ", targetList);
    console.log("  ## total client number:", clientList.length);
    console.log("    -> current client list: ", clientList);
    console.log("  ## total ToD-target number:", todtargetList.length);
    console.log("    -> current ToD-target list: ", todtargetList);
    console.log("  ## total ToD-client number:", todclientList.length);
    console.log("    -> current ToD-client list: ", todclientList);
    console.log("  ## total PassKanTan mobile number:", pktmobileList.length);
    console.log("    -> current PassKanTan mobile list: ", pktmobileList);
    console.log("  ## total PassKanTan adapter number:", pktadapterList.length);
    console.log("    -> current PassKanTan adapter list: ", pktadapterList);
    console.log('\n');


  });
    }
//});

//});

var interval = setInterval(function() {
  for (var i = 0; i < targetList.length; i++) {
    PostCode(GetPostdata(targetList[i], 1), CKTWebService.host, CKTWebService.setTargetStatusWithMeetingInfo);
  }
  for (var i = 0; i < todtargetList.length; i++) {
    PostCode(GetPostdataForToD(todtargetList[i], 1), ToDWebService.host, ToDWebService.setTargetStatus);
  }
}, 60000);
