(function(){

	const chatOutputElement = document.getElementById('chat-output');
	const worldOutputElement = document.getElementById('world-output');
	const consoleOutputElement = document.getElementById('console-output');

	let user = {};
	let lastChatSenderName;
	const socket = io();

	socket.on('register', onRegister);
	socket.on('chat', onReceivedChat);
	socket.on('crew', onReceivedCrew)

	init();

	window.game = {
		submitChat: submitChat,
		submitWorld: submitWorld,
		submitConsole: submitConsole
	};

	function init() {
		setupForms();
		document.addEventListener('keypress', onKeyPress);
	}

	function setupForms() {
		const chatElement = document.getElementById('chat');
		const forms = chatElement.getElementsByTagName('form');
		forms[0].addEventListener('submit', submitChat);
	}

	function onKeyPress(event) {
		if (event.keyCode === 13 || event.which === 13) {
			event.preventDefault();
			if (document.activeElement === document.getElementById('chat-input')) {
				submitChat();
			}
		}
	}

	function onReceivedCrew(crew) {
		console.log(crew);
		let h = '';
		crew.forEach((person) => {
			h += '<li>' + person.name + '</li>';
		});
		document.getElementById('crew-list').innerHTML = h;
	}

	function onReceivedChat(message, senderName) {
		// /console.log(data);
		const messageElement = document.createElement('div');
		let h = '<div class="chat-message">' + message + '</div>';
		if (senderName) {
			if (senderName !== lastChatSenderName) {
				h = '<div class="chat-sender">' + senderName + '</div>' + h;
				lastChatSenderName = senderName;
			}
		}
		messageElement.innerHTML = h;
		chatOutputElement.appendChild(messageElement);
		chatOutputElement.scrollTop = chatOutputElement.scrollHeight;
	}

	function onRegister(registeredUser) {
		user = registeredUser;
		console.log("Registered as user", user);
	}


	function submitChat(event) {
		if (event) {
			event.preventDefault();
		}
		const chatInputElement = document.getElementById('chat-input');
		const message = chatInputElement.innerHTML; // .textContent; // TODO: get this to work
		if (message.trim().length === 0) {
			return false;
		}
		socket.emit('chat', message);
		chatInputElement.innerHTML = '';
		return false;
	}

	function submitWorld() {
		return false;
	}

	function submitConsole() {
		return false;
	}

})();