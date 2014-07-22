var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();

app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.get('/score/:albumName/:artistName', function(req, res) {
    url = 'http://www.metacritic.com/music/' + req.params.albumName.replace(/\s+/g, '-').toLowerCase() + "/" + req.params.artistName.replace(/\s+/g, '-').toLowerCase();
    console.log(url);
    request(url, function(error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);
            console.log(html);

            // Finally, we'll define the variables we're going to capture
            var json = {
                title: req.params.albumName,
                score: ''
            };

            $('span[itemprop=ratingValue]').filter(function() {
                var data = $(this);
                json.score = data.text();
            });
            res.json(json);
        }
    })
});

app.listen('8081');
console.log('Magic happens on port 8081');
exports = module.exports = app;