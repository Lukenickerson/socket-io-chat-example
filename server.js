// Based on https://hackernoon.com/how-to-build-a-multiplayer-browser-game-4a793818c29b
// Dependencies
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const app = express();
const server = http.Server(app);
const io = socketIO(server);
const PORT = 5000;

app.set('port', PORT);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname, 'static/index.html'));
});

// Starts the server.
server.listen(PORT, function() {
	console.log('Starting server on port ' + PORT);
});

// Game variables
const ships = {};
const users = {};

// Setup Namespaces
const rootNamespace = io.of('/');

// Add the WebSocket handlers
rootNamespace.on('connection', onConnectNewSocket);


function onConnectNewSocket(socket) {
	const user = createNewUser(socket);
	sendNewUserAnnouncements(user);

	socket.on('disconnect', (reason) => { handleUserDisconnect(user, reason); });
	socket.on('chat', (message) => { handleChatReived(user, message); });
	socket.on('rename', (name) => { renameUser(user, newName); });
}

function handleChatReived(user, message) {
	// TODO: Strip html
	message = message.replace('<', '').replace('>', '');
	console.log(message);
	io.sockets.emit('chat', message, user.name);

	if (message.startsWith('/')) {
		const messageWords = message.split(' ');
		if (messageWords.length <= 0) {
			return;
		}
		if (messageWords[0] === '/rename') {
			if (messageWords.length >= 2) {
				renameUser(user, messageWords[1]);
			}
		}
	}
}

function handleUserDisconnect(user, reason) {
	user.socket.broadcast.emit('chat', user.name + ' has left.', 'System');
	removeUser(user.userId);
	sendCrew();
}

function sendNewUserAnnouncements(user) {
	console.log("New user connected:", user.userId);
	user.socket.emit('register', cloneUser(user));
	sendPersonalSystemMessage('You have joined as ' + user.name, user);
	user.socket.broadcast.emit('chat', user.name + ' has joined.', 'System');
	sendCrew();
}

function sendCrew() {
	rootNamespace.emit('crew', getCrew());
}

function sendPersonalSystemMessage(message, user) {
	user.socket.emit('chat', message, 'System');
}

function renameUser(user, newName) {
	let userWithName;
	for (let key in users) {
		const userChecked = users[key];
		if (newName === userChecked.name) {
			userWithName = userChecked;
			break;
		}
	}
	if (userWithName) {
		sendPersonalSystemMessage('A user with the name ' + newName + ' already exists.', user);
		return false;
	}
	const reservedNames = ['System'];
	if (reservedNames.indexOf(newName) !== -1) {
		sendPersonalSystemMessage('The name ' + newName + ' is invalid.', user);
		return false;		
	}
	user.name = newName;
	sendCrew();
	return true;
}

function createNewUser(socket) {
	const userName = getQuasiUniqueUserName(socket.id);
	const userId = userName + '-' + socket.id;
	const user = {
		userId: userId,
		name: userName + '-' + socket.id.substr(0,1),
		console: null,
		socketId: socket.id,
		socket: socket
	};
	users[userId] = user;
	return user;
}

function removeUser(userId) {
	delete users[userId];
	console.log("Removing ", userId);
}

function cloneUser(user) {
	return {
		userId: user.userId,
		name: user.name,
		socketId: user.socketId
	};
}

function getQuasiUniqueUserName() {
	const nameOptions = ['Explorer', 'Astronaut', 'Cosmonaut', 'Traveler', 'Adventurer'];
	const i = Math.floor(Math.random() * (nameOptions.length - 1));
	let name = nameOptions[i];
	return name + '-' + Math.round(Math.random() * 1000);
}

function getCrew() {
	const crew = [];
	for (let key in users) {
		crew.push(cloneUser(users[key]));
	}
	return crew;
}
