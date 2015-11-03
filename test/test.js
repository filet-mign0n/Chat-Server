/*jslint node: true */
/*global describe: false, before: false, after: false, it: false */
"use strict";
// Declare the variables used
var expect = require('chai').expect,
    request = require('request'),
    server = require('../index'),
    redis = require('redis'),
    io = require('socket.io-client'),
    client;
client = redis.createClient();
// Server tasks
describe('server', function () {
    // Beforehand, start the server
    before(function (done) {
        console.log('Starting the server');
        done();
    });
    // Afterwards, stop the server and empty the database
    after(function (done) {
        console.log('Stopping the server');
        client.flushdb();
        done();
    });
    // Test the index route
    describe('Test the index route', function () {
        it('should return a page with the title Babblr', function (done) {
            request.get({ url: 'http://localhost:5000/' }, function (error, response, body) {
                expect(body).to.include('Babblr');
                expect(response.statusCode).to.equal(200);
                expect(response.headers['content-type']).to.equal('text/html; charset=utf-8');
                done();
            });
        });
    });

    // Test sending a message
    describe('test sending a message', function () {
    	it('should return "message received"', function(done) {

    		var socket = io.connect('http://localhost:5000', {
    			'reconnection delay': 0,
    			'reopen delay': 0,
    			'force new connection': true
    		});

    		socket.on('message', function (data) {
    			expect(data).to.include('Message received');

    			client.lrange('chat:messages', 0, -1, function(err, messages) {

    				var message_list = [];
    				messages.forEach(function (message, i) {
    					message_list.push(message);
    				});
    				expect(message_list[0]).to.include('Message received');

    				socket.disconnect();
    				done();
    			});
    		});

    		socket.emit('send', {message: 'Message received'});
    	});
    });

    describe('test submitting to the login route', function() {
    	it('should store the username in the session and redirect the user to the index', function(done) {
    		request.post({ url: 'http://localhost:5000/login', 
    			form:{username: 'bobsmith'},
    			jar : true,
    			followRedirect: false},
    			function(error, response, body) {
    				expect(response.headers.location).to.equal('/');
    				expect(response.statusCode).to.equal(302);
    				
    				request.get({ url: 'http://localhost:5000/', jar:true }, function(error, response, body) {
    					expect(body).to.include('bobsmith');
    					done();
    				});

    				
    			});	
    	});
    });

    describe('Test empty login', function () {
        it('should show the login form', function (done) {
            request.post({ url: 'http://localhost:5000/login',
                form:{username: ''},
                followRedirect: false},
                function (error, response, body) {
                    expect(response.statusCode).to.equal(200);
                    expect(body).to.include('Please enter a handle');
                    done();
            });
        });
    });

    describe('Test logout', function () {
        it('should log the user out', function (done) {
            request.post({ url: 'http://localhost:5000/login',
                form:{username: 'bobsmith'},
                jar: true,
                followRedirect: false},
                function (error, response, body) {
                    expect(response.headers.location).to.equal('/');
                    expect(response.statusCode).to.equal(302);
                    // Check the username
                    request.get({ url: 'http://localhost:5000/', jar: true }, function (error, response, body) {
                        expect(body).to.include('bobsmith');
                        // Log the user out
                        request.get({ url: 'http://localhost:5000/logout', jar: true }, function (error, response, body) {
                            expect(body).to.include('Log in');
                            done();
                            });
                    });
            });
        });
    });

});




















