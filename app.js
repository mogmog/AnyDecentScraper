#!/usr/bin/env node

var sys = require('sys'),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    events = require('events'),
    request = require('request'),
    jsdom = require('jsdom'),
    async       = require('async');

var DEFAULT_PORT = 8000;

var prefix = 'http://www.anydecentmusic.com/'

function main(argv) {
    new HttpServer({
        'GET': createServlet(StaticServlet)
    }).start(Number(argv[2]) || DEFAULT_PORT);
}

function createServlet(Class) {
    var servlet = new Class();
    return servlet.handleRequest.bind(servlet);
}

function HttpServer(handlers) {
    this.handlers = handlers;
    this.server = http.createServer(this.handleRequest_.bind(this));
}

HttpServer.prototype.start = function(port) {
    this.port = port;
    this.server.listen(port);
    sys.puts('Http Server running at http://localhost:' + port + '/');
};

HttpServer.prototype.parseUrl_ = function(urlString) {
    var parsed = url.parse(urlString);
    parsed.pathname = url.resolve('/', parsed.pathname);
    return url.parse(url.format(parsed), true);
};

HttpServer.prototype.handleRequest_ = function(req, res) {
    var logEntry = req.method + ' ' + req.url;
    if (req.headers['user-agent']) {
        logEntry += ' ' + req.headers['user-agent'];
    }
    sys.puts(logEntry);
    req.url = this.parseUrl_(req.url);
    var handler = this.handlers[req.method];
    if (!handler) {
        res.writeHead(501);
        res.end();
    } else {
        handler.call(this, req, res);
    }
};

/**
 * Handles static content.
 */
function StaticServlet() {
    var jsdom  = require('jsdom');
    var fs     = require('fs');
}

StaticServlet.prototype.lookupSearch = function(artist, callback){
    jsdom.env({
        url: prefix + 'search-results.aspx?search=' + artist,
        src: [fs.readFileSync("lib/jquery/jquery.min.js").toString()],
        done: function(errors, window) {
            callback(window.$('.search_result_album a.cover').map(function(){return window.$(this).attr('href');}));
        }
    });

};

StaticServlet.prototype.lookupScores = function(request_from_client, response_to_client){

    var that = this;

    if (request_from_client.url.path.indexOf('artist') > -1) {
        var artist = request_from_client.url.path.split("/")[2];

        this.lookupSearch(artist, function(results) {

            var tasks = [];

            /*results is a pseudo array that actually contains properties , so can't use forEach*/
            for (var i = 0; i < results.length; i++) {

                tasks.push((function (i) {
                    return function (callback) {
                        jsdom.env({
                            url: prefix + results[i],
                            src: [fs.readFileSync("lib/jquery/jquery.min.js").toString()],
                            done: function(errors, window) {
                                callback(null, window.$('p.score').text());
                            }
                        });
                    };
                })(i));

            };

            async.series(tasks, function (err, results) {
                that.sendScores(results, request_from_client, response_to_client);
            });
        });
    }
};

StaticServlet.prototype.sendScores = function(scores, request_from_client, response_to_client) {
    response_to_client.write(JSON.stringify(scores));
    response_to_client.end();
}

StaticServlet.prototype.handleRequest = function(req, res) {
    return this.lookupScores(req, res);
}

main(process.argv);
