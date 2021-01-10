const gameSettings = {
	clientInfo: {
		host: window.server_host,
		token: window.player_token
	},
	serverWS: `wss://alkatria.pl/${gameSettings.clientInfo.host}`,
	serverSocket: null
}

const gameEngine = {
	loadingBar: (percent) => {
		const width = (821 * (percent / 100));
		document.querySelector(".loading-percent").innerText = `${percent}%`;
		document.querySelector(".loading-status").style.width = `${width}px`;
	},

	isLocked: () => {
		return false; // tia ja tez nie wiem po co to.
	},
	
	init: () => {
		document.querySelector('.opacity-full').classList.add("hidden");
		document.querySelector('.loading-info').innerText = "Ładowanie gry...";
		try {
			gameSettings.serverSocket = new WebSocket(gameSettings.serverWS);
			gameSettings.serverSocket.onopen = (msg) => {
				gameSettings.serverSocket.send(JSON.stringify({code: 1, window: [window.innerWidth, window.innerHeight], token: player_token}));
			};
			gameSettings.serverSocket.onmessage = (msg) => {
				const message = JSON.parse(msg.data);
				if (message.code === "json") {
				
				}
			};
		} catch(err) {
		
		}
	}
}
