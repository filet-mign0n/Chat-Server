/*jslint node: true */
'use strict';

var app, base_url, bodyParser, client, express, hbs, io, port, RedisStore, rtg, session, sessionMiddleware, subscribe;

express = require('express');
app = express();
bodyParser = require('body-parser');
port = process.env.PORT || 5000;
base_url = process.env.BASE_URL || 'http://localhost:5000';
hbs = require('hbs');
session = require('express-session');
RedisStore = require('connect-redis')(session);


if (process.env.REDISTOGO_URL) {
	rtg = require('url').parse(process.env.REDISTOGO_URL);
	client = require('redis').createClient(rtg.port, rtg.hostname);
	subscribe = require('redis').createClient(rtg.port, rtg.hostname);
	client.auth(rtg.auth.split(":")[1]);
	subscribe.auth(rtg.auth.split(":")[1]);
} else {
	client = require('redis').createClient();
	subscribe = require('redis').createClient();
}

sessionMiddleware = session({
    store: new RedisStore({
        client: client

    }),
    secret: 'blibble'
});

app.use(sessionMiddleware);

app.set('views', __dirname + '/views');
app.set('view engine', "hbs");
app.engine('hbs', require('hbs').__express);
// Register partials
hbs.registerPartials(__dirname + '/views/partials');
// Set URL
app.set('base_url', base_url);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.get('/login', function(req, res) {
	res.render('login');
});

app.get('/logout', function(req, res) {
	req.session.username = null;
	res.redirect('/');
});

app.post('/login', function(req, res) {
	var username = req.body.username;

	if (username.length === 0) {
		res.render('login');
	} else {
		req.session.username = username;
		res.redirect('/');

	}
});

app.get('/', function (req, res) {
    
	client.lrange('chat:messages', 0, -1, function(err, messages) {
		if (err) {
			console.log(err);
		} else {

			var username = req.session.username;

			var message_list = [];
			messages.forEach(function(message, i) {
				 /* istanbul ignore next */
				message_list.push(message);
			});
			
			res.render('index', { messages: message_list, username: username});
		}
	});
});


// Serve static files
app.use(express.static(__dirname + '/static'));
// Listen
io = require('socket.io')({
}).listen(app.listen(port));
console.log("Listening on port " + port);

io.use(function(socket, next) {
	sessionMiddleware(socket.request, socket.request.res, next);
});

io.sockets.on('connection', function (socket) {
	
	subscribe.subscribe('ChatChannel');

	socket.on('send', function(data) {
		
		var username, message;

		message = data.message.replace(/<[^>]*>/g, '');

		username = socket.request.session.username;
		if (!username) {
			username = "Anonymous Coward";
		}
		message = username + ': ' + data.message;

		client.publish('ChatChannel', message);

		client.rpush('chat:messages', message);
	});

	var callback = function (channel, data) {
		socket.emit('message', data);
	};

	subscribe.on('message', callback);

	socket.on('disconnect', function () {
		subscribe.removeListener('message', callback);
	});
});




















