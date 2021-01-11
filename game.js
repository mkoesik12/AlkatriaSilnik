const gameSettings = {
	clientInfo: {
		host: window.server_host,
		token: window.player_token
	},
	serverCodes: {
		s1: 1,
		s2: "multi_code",
		s3: 2,
		s4: "new_mail",
		s5: "ping",
		s6: 99,
		s7: "reset_move",
		s8: "player_backpack",
		s9: 4,
		s10: 5,
		s11: "server_reboot",
		s12: "remove_auction",
		s13: 964,
		s14: "move_outfit",
		s15: 10,
		s16: 71,
		s17: 30,
		s18: 75,
		s19: "start_tutorial",
		s20: "skip_tutorial",
		s21: 1092,
		s22: 1020,
		s23: 1091,
		s24: 1090,
		s25: 1015,
		s26: 1001,
		s27: "teleport",
		s28: 101,
		s29: "quest_history",
		s30: 368,
		s31: 367,
		s32: 433,
		s33: 102,
		s34: 1094,
		s35: "move_me",
		s36: "postoffice_window",
		s37: "npc_messages",
		s38: "minimap",
		s39: "attack_speed",
		s40: 1051,
		s41: 1030,
		s42: "clan_payment",
		s43: 733,
		s44: 732,
		s45: 886,
		s46: "death",
		s47: "global_shop_window",
		s48: "shop_window",
		s49: "spell_effect",
		s50: "player_stats",
		s51: 1009,
		s52: "item",
		s53: "auction_window",
		s54: "casino_window",
		s55: "blacksmith_window",
		s56: 85,
		s57: "loot",
		s58: "friends",
		s59: 1052,
		s60: 1056,
		s61: 54,
		s62: 55,
		s63: "npc",
		s64: "mails",
		s65: "mail_send",
		s66: 78,
		s67: 8585,
		s68: 543,
		s69: 51,
		s70: 940,
		s71: "load_game",
		s72: "spells",
		s73: 1018,
		s74: 1471,
		s75: 941,
		s76: 939,
		s77: "small_window",
		s78: 1002,
		s79: "buy_items",
		s80: "sell_items",
		s81: 685,
		s82: 764,
		s83: 1016,
		s84: 1504,
		s85: "error",
		s86: "death",
		s87: "removeBackpack",
		s88: "reload",
		s89: "refresh",
		s90: 1004,
		s91: 1005,
		s92: 1007,
		s93: "depo_window",
		s94: "clans_list",
		s95: "clans",
		s96: 87877,
		s97: "post_send",
		s98: "alert",
		s99: "auction_bought",
		s100: "auction",
		s101: 84,
		s102: "my_clan",
		s103: "show_clan",
		s104: "cutscene",
		s105: "add_friend",
		s106: 1003,
		s107: "remove_friend",
		s108: 877,
		s109: 878,
		s110: 676,
		s111: 654,
		s112: "resize_window",
		s113: "show_tile",
		s114: "exhaust_tile",
		s115: "forge_window",
		s116: "customname_item_window",
		s117: "craft_details",
		s118: "crafting_window"
	},
	clientStorage: {
		pingTimeClient: 0,
		pingTimeServer: 0,
		stopGame: false,
		keysStatus: 0,
		backDirs: [2,1,3,4]
	},
	serverWS: `wss://alkatria.pl/${window.server_host}`,
	serverSocket: null
};

const gameLib = {
	axios: "https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.js"
};

const gameEngine = {
	loadScript: (url) => {
		const scriptElement = document.createElement("script");
		scriptElement.src = url;
		document.getElementsByTagName("head")[0].appendChild(scriptElement);
	},
	axiosRequest: (url, data, async, type) => {
	    if(typeof type === "undefined") type = "POST";
		if(type == "POST") data["token"] = gameSettings.clientInfo.token;
		const axiosRes = axios({
			method: type,
			url: `https://alkatria.pl${url}`,
			data: data,
		});
        return axiosRes;
	},
	loadingBar: (percent) => {
		const width = (821 * (percent / 100));
		document.querySelector(".loading-percent").innerText = `${percent}%`;
		document.querySelector(".loading-status").style.width = `${width}px`;
	},
	isLocked: () => {
		return false;
	},
	init: () => {
		loadScript(gameLib.axios);
		document.querySelector(".opacity-full").classList.add("hidden");
		document.querySelector(".loading-info").innerText = "Ładowanie gry...";
		try {
			gameSettings.serverSocket = new WebSocket(gameSettings.serverWS);
			gameSettings.serverSocket.onopen = (msg) => {
				gameSettings.serverSocket.send(JSON.stringify({code: 1, window: [window.innerWidth, window.innerHeight], token: player_token}));
			}
			gameSettings.serverSocket.onmessage = (msg) => {
				var message = JSON.parse(msg.data);
				if (message.code === "json") {
					message = gameEngine.axiosRequest(`/json.php?token=${data.hash}`, {}, false, 'GET');
				}
				gameEngine.parseServerPacket(message.data);
			}
			gameSettings.serverSocket.onclose = (msg) => {
				document.querySelector(".opacity-full").classList.remove("hidden");
				document.querySelector(".loading-percent").innerText = "Trwa łączenie z serwerem...";
				setTimeout(() => {
					gameEngine.init();
				}, 1000);
			}
		} catch(err) {
			console.log(err);
		}
	},
	sendPacket: (code, data) => {
		if (gameSettings.serverSocket.readyState === 1) gameSettings.serverSocket.send(JSON.stringify({code: code, data: data}));
	},
	singlePacket: (code, action) => {
		gameEngine.sendPacket(code, { action: action });
	},
	itemPacket: (code, action, item) => {
		gameEngine.sendPacket(code, { action: action, item: item });
	},
	chatMessage: (data) => {
		const msg = data.message;
		msg.replace(/(http.:\/\/[^\s]+)/gi, "<a href='$1' target='_blank'>$1</a>");
		if (data.player !== undefined) {
			this.msgSend = `${data.time} <span class="player-chat" data-name="${data.name}">${data.player}</span>: ${msg}`
		} else if (data.time === undefined) {
			this.msgSend = msg;
		} else {
			this.msgSend = `${data.time}: ${msg}`;
		}

		if (data.color !== undefined) {
			document.querySelector(`.chat-messages-${data.channel}`).append(fromHTML(`<span title=${data.date} style="color: ${data.color}">${this.msgSend}</span><br>`));
		} else {
			document.querySelector(`.chat-messages-${data.channel}`).append(fromHTML(`<span title=${data.date}>${this.msgSend}</span><br>`));
		}
		
		if (this.channel !== data.channel) {
			document.querySelector(`.channel-${data.channel}`).classList.add('new-message');
		}
		
		document.getElementById(`chat-messages-${data.channel}`).scrollTop = document.getElementById(`chat-messages-${data.channel}`).scrollHeight;
	},
	ping: (ping) => {
		if (ping == undefined) ping = "start";

		gameSettings.clientStorage.pingTimeServer = Date.now();
		gameEngine.sendPacket("ping", {ping: ping});
	},
	refresh: () => {
		gameSettings.clientStorage.stopGame = false;
		gameEngine.sendPacket("refresh", {});
	},
	broadCast: (message, duration) => {
		document.querySelector("#raidMessage").remove();
		document.querySelector("#game").append(fromHTML(`<div id="raidMessage" class="overlock-white" style="font-size: 25px">${message}</div>`));
		if (duration == undefined) duration = 15000;
		gameEngine.events.push(new MapEvent({
			type: "remove_element",
			name: "#raidMessage"
		}));
	},
	showAttackAnimation: (data) => {
        const effect = new MapEffect(data);
        gameEngine.events.push(effect);
	},
	showSmallAlert: (text, type) => {
		const uniqueID = gameEngine.getGuid();
		document.querySelector(".small-info-alert").remove();
		document.querySelector("body").append(fromHTML(`<div class="small-info-alert ${uniqueID} small-alert-${type}">${text}</div>`));
		setTimeout(() => {
            document.querySelector(`.${uniqueID}`).remove();
        }, 15000);
	},
	getGuid: () => {
	    const S4 = () => {
	       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	    };
	    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
	},
	parseServerPacket: (data) => {
		if (gameSettings.clientStorage.stopGame && data.code < 3) return;
		const code = gameSettings.serverCodes;
		switch (data.code) {
			case code.s1:
				gameEngine.chatMessage(data);
				break;
			case code.s2:
				data.items.forEach((serverInfo) => {
					if (typeof serverInfo !== "object") serverInfo = JSON.parse(serverInfo);
					if (serverInfo.code === "json") {
						serverInfo = gameEngine.axiosRequest(`/json.php?token=${data.hash}`, {}, false, "GET");
					}
					gameEngine.parseServerPacket(serverInfo.data);
				});
			case code.s3:
				map.update(data);
				break;
			case code.s4:
				if (document.querySelector(".icon-count").length > 0) {
					let mailsCount = parseInt(document.querySelector(".icon-count").innerText);
					mailsCount = mailsCount++;
					document.querySelector(".icon-count").innerText = mailsCount;
				} else {
					document.querySelector(".icon-mail").append(fromHTML("<div class='icon-count'>1</div>"));
				}
			case code.s5:
				gameSettings.clientStorage.pingTimeClient = Date.now() - gameSettings.clientStorage.pingTimeServer;
				document.querySelector(".game-ping").innerText = `${gameSettings.clientStorage.pingTimeClient}ms`;
				setTimeout((ping) => {
					gameEngine.ping(ping);
				}, 1000, gameSettings.clientStorage.pingTimeClient);
				break;
			case code.s6:
				gameEngine.broadCast(data.message);
				break;
			case code.s7:
				player.move = 0;
				break;
			case code.s8:
				player.refreshBackpack(data.backpack);
				break;
			case code.s9:
				player.displayBackpack(data.data, "");
				break;
			case code.s10:				
				var className, effectName;
				if (data.data[0].attack_type > 0) className = `damage-type-${data.data[0].attack_type}`;
				if (data.data[0].spell_effect !== undefined) effectName = `animation damage-spell-${data.data[0].spell_effect}`;
				if (data.data[0].ammo || data.data[0].attack_effect) {
					gameEngine.showAttackAnimation(data.data[0]);
				} else {
					effectName = `slash-${data.data[0].dir}`;
				}
				map.showDamage(data.data[0], className, effectName);
				if (data.data[1] !== undefined) {
					setTimeout(() => {
						map.showDamage(data.data[1], className, effectName);
					}, 180);
				}
				break;
			case code.s11:
				alert('Raczej nigdy nie zostanie to uzyte ale mimo wszystko jest to server_reboot');
				break;
			case code.s12:
				document.querySelector(`tr[data-auction="${data.id}"]`).remove();
				gameEngine.showSmallAlert(data.message);
				break;
			case code.s13:
				if (data.message) {
					if (this.channel !== 2) document.querySelector(".channel-2").classList.add("new-message");
					document.querySelector(".chat-messages-2").append(fromHTML(`${this.getHour()} ${data.message}<br>`));
				}
				if (data.monster == map.current_monster) {
					const width = 1.22 * data.percent;
					document.querySelector(".target-frame-health .health-bar").style.width = `${width}px`;
					document.querySelector(".target-frame-health .health-bar").innerText = `${data.percent}%`;
				}
				map.showHealth(data);
				player.setHealth(data.health, data.health_max);
				break;
			case code.s14:
				if (data.player === player.id || !document.getElementById(`player_${data.player}`)) break;
				document.getElementById(`player_${data.player}`).style.backgroundPosition = player.outfits[data.dir - 1][0];
				break;
			case code.s15:
				map.movePlayer(data);
				break;
			case code.s16:
				map.loadOtherPlayer(data);
				break;
			case code.s17:
				npc.startTalk(data.npc, data.data);
				npc.setWindowAvatar(data);
				return;
			case code.s18:
				map.showDamage(data);
				break;
			case code.s19:
				document.querySelector(".shadow-game").classList.remove("active");
				gameEngine.clientStorage.keysStatus = 0;
				gameEngine.close_window();
				player.goToPosition(6, 7);
				break;
			case code.s20:
				document.querySelector(".shadow-game").classList.remove("active");
				gameEngine.clientStorage.keysStatus = 0;
				gameEngine.close_window();
				break;
			case code.s21:
				if (data.id === player.id) {
					document.querySelector(`#my-trade-item-${data.slot}`).remove();
				} else {
					document.querySelector(`#other-trade-item-${data.slot}`).remove();
				}
				break;
			case code.s22:
				document.querySelector(`tr[data-mail="${data.id}"]`).remove();
				game.showSmallAlert("Usunięto wiadomość", 1);
				break;
			case code.s23:
				let count = 0;
				if (data.count > 1) {
					count = data.count;
				}
				if (data.id === player.id) {
					document.querySelector(`.backpack-item-${data.slot}`).classList.add('item-hidden');
					document.querySelector("#trade-my-offers").append(fromHTML(`<div data-slot="${data.slot}" onClick="player.tradeRemove(${data.slot});" id="my-trade-item-${data.slot}" data-price="${data.price}" class="item trade-item item-${data.item.id}" data-tip="${data.item.description}<br>Cena: ${data.price}"><div class="count">${count}</div></div>`));
				} else {
					
				}
			case code.s24:
				gameEngine.clientStorage.keysStatus = 1;
				gameEngine.load_window("window-players-trade", "Handel", "window-players-trade");
				windowDisplay.displayBackpack("plecak", data.backpack, 5);
				player.trade_player = data.id;
				document.querySelector(".trade-with").innerText = data.player;
				break;
			case code.s25:
				document.querySelector(`#tile_${data.x}-${data.y}`).remove();
				document.querySelector(`#tile_${data.x}-${data.y}_tip`).remove();
				alert(data.msg);
				break;
			case code.s26:
				document.querySelector(`.clan-members tbody tr[data-id="${data.player}"]`).remove();
				break;
			case code.s27:
				case 100:
					player.stopMove = 1;
					if (map.audio) {
						map.audio.pause();
						map.audio = null;
					}
					setTimeout(function() {
						map.loadMap(data.data);
					}, 300);
					break;
			case code.s28:
				break;
			case code.s29:
				windowDisplay.showQuestHistory(data.data);
				break;
			case code.s30:
				if (data.type === 1) {
					document.querySelector(`.spell-shortcut-${data.slot}`).remove();
				} else {
					document.querySelector(".shortcut-box").append(fromHTML(`<div data-slot="${data.slot}" style="background: url(/assets/spells/icon_${data.data.id}.png);" data-spell="${data.data.id}" data-type="${data.data.type}" id="spell-shortcut-${data.slot}" class="spell-shortcut draggable spell-shortcut-${data.slot} spell-${data.data.id} spell" data-tip="${data.data.name}"></div>`));
				}
				break;
			case code.s31:
				document.querySelector(".skill-points").innerText = data.points;
				document.querySelector(`#skill-item-${data.spell}`).classList.add('draggable');
				document.querySelector(`.skill-level-${data.spell}`).innerText = data.level;
				break;
			case code.s32:
				spells.parsePacket(data);
				break;
			case code.s33:
				player.move = 0;
				gameSettings.clientStorage.keysStatus = 1;
				setTimeout(() => {
					player.movePlayer(gameSettings.clientStorage.backDirs[data.dir - 1], 1);
					gameSettings.clientStorage.keysStatus = 0;
				}, 300);
				break;
			case code.s34:
				if (data.gold) player.setGold(data.gold);
				if (data.id !== player.id) {
					document.querySelector(`#my-trade-item-${data.slot_offer}`).remove();
				} else {
					document.querySelector(`#other-trade-item-${data.slot_offer}`).remove();
				}
				if (data.message !== undefined) game.showSmallAlert(data.message);
				if (data.item) {
					let count = 0;
					if (data.item.count > 1) {
						count = data.item.count;
					}
					document.querySelector("#plecak").append(fromHTML(`<div data-id="${data.item.id}" data-count="${data.item.count}" data-tip-type="${data.item.type}" onClick="player.tradeItem(${data.to_slot})" id="item_${data.to_slot}" data-tip="${data.item.description}" class="item backpack-item-${data.to_slot} item-${data.item.id} backpack-item"><div class="count">${count}</div></div>`));
				}
				if (data.slot !== undefined) document.querySelector(`.backpack-item-${data.slot}`).remove();
				break;
		}
	}
}
