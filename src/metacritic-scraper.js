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

app.get('/score/:artistName', function(req, res) {
    url = 'http://www.metacritic.com/person/' + req.params.artistName.replace(/\s+/g, '-').toLowerCase();
    console.log(url);

    var headers = { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
        'Content-Type' : 'application/html' 
    };

    request({ url: url, headers: headers }, function(error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            // Finally, we'll define the variables we're going to capture
            var json = {
                artist: req.params.artistName,
                scores: []
            };

            // console.log($('.credits').text());

            $('.brief_metascore').each(function(i, item){
                json.scores.push({
                    album:$(item).find('a').text(),
                    score:$(item).find('.metascore_w').text()
                });
            });

            // $('span[itemprop=ratingValue]').filter(function() {
            //     var data = $(this);
            //     json.score = data.text();
            // });
            res.json(json);
        }
    })
});

app.listen('8081');
console.log('Magic happens on port 8081');
exports = module.exports = app;