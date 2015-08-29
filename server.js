var args = require('optimist').argv;
var config = require(args.config || './config.js');
var net = require('net');
var tls = require('tls');
var events = require('events');
var express = require('express');
var fs = require('fs');
var sets = require('simplesets');

global.log = require('./src/Logging');

var Session = require('./src/Session');
var Room = require('./src/Room');
var Plugins = require('./src/Plugins');


function Server() {

    this._sessions = new sets.Set();
    this._rooms = {};
    this._userList = Array();
    this._plugins = new Plugins(this);
}

Server.prototype.getRoom = function(roomId) {
    if(this._rooms[roomId] === undefined)  {
        this._rooms[roomId] = new Room(roomId);
    }

    return this._rooms[roomId];
};

// ## Check if username is in use ##
Server.prototype.isNameFree = function(name) {

    var free = true;
    this._sessions.each(function(s) {
        if(s.id === name) {
            free = false;
        }
    });
    return free;
};

// ## Start Socket Server ##
Server.prototype.start = function() {
    console.log('========================');
    console.log('Janus VR Presence Server');
    console.log('========================');
    log.info('Startup date/time: ' + Date());

    console.log('See server.log for activity information and config.js for configuration');
    console.log('Log level: ' + config.logLevel);
    console.log('Startup date/time: ' + Date());

    this.server = net.createServer(this.onConnect.bind(this));
    this.server.listen(config.port, "::", function(err){

        if(err) {
            log.error('Socket Server error listening on port: ' + config.port);
            process.exit(1);
        }

        log.info('Socket Server listening on port: ' + config.port);
        console.log('Socket Server listening on port: ' + config.port);

    });

    if(config.ssl) {

        this.ssl = tls.createServer(config.ssl.options, this.onConnect.bind(this));
        this.ssl.listen(config.ssl.port, "::", function(err){

            if(err) {
                log.error('SSL Server error listening on port: ' + config.ssl.port);
                process.exit(1);
            }

            console.log('SSL Server listening on port: ' + config.ssl.port);
            log.info('SSL Server listening on port: ' + config.ssl.port);

        });
    }

    this.startWebServer();
};


// ## start web server ##
Server.prototype.startWebServer = function() {

    var self = this;

    this.ws = express();


    var router = express.Router();

    router.get('/log', function(req,res){
        res.writeHead(200, {'Content-Type':'text/plain', 'Content-Length':-1, 'Transfer-Encoding': 'chunked'});
        var logFile = fs.createReadStream('server.log');
        logFile.pipe(res);
    });

    this.ws.use(router);
    this.ws.use(express.static(__dirname + '/public')); //serve out public website and firebox room associated with this server

    this.ws.listen(config.webServer, "::");
    log.info('Webserver started on port: ' + config.webServer);
    console.log('Start Date/Time: ' + Date());
};

// ## action on client connection ##
Server.prototype.onConnect = function(socket) {

    var self = this;
    var addr = socket.remoteAddress;
    log.info('Client connected ' + addr);

    var s = new Session(this, socket);
    this._sessions.add(s);

    socket.on('close', function() {
        log.info('Client disconnected: ' + addr);
        self._sessions.remove(s);
    });

    socket.on('error', function(err){
	log.error(addr);
        log.error('Socket error: ', err);
    });
};

(new Server()).start();
