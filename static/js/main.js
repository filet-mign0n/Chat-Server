$(document).ready(function () {
	'use strict';

	var field, socket, output;
	socket = io.connect(window.location.href);

	field = $('textarea#message');

	output = $('div.conversation');

	$('a#submitbutton').on('click', function () {

		var msg;
		msg = field.val();
		socket.emit('send', {message: msg});
		field.val('');
	});

	socket.on('message', function(data) {
		output.append('<p>' + data + '</p>');

	});

});