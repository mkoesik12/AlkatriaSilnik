var socket;

game = {
	windows: {},
	data: [],

	stopGame: false,

	keyLeft: false,
	keyRight: false,
	keyUp: false,
	keyDown: false,
	ctrlKey: false,
	shiftKey: false,
	chatKey: 0,

	map: false,

	dayStatus: 0,

	keysStatus: 0,

	hasClan: 0,

	targetStartX: 0,
	targetStartY: 0,
	lastLog: {},
	lock_tile: {},

	monsters: [],
	crafting: [],
	players: [],
	npcs: [],
	events: [],

	host: null,

	loadingBar: (percent) => {
		const width = (821 * (percent / 100));
		document.querySelector(".loading-percent").innerText = `${percent}%`;
		document.querySelector(".loading-status").style.width = `${width}px`;
	},

	isLocked: (x, y) => {
		return false;
	},

	init: () => {
		game.host = `wss://alkatria.pl/${server_host}`;

		document.querySelector(".opacity-full").style.display = "none";
		document.querySelector(".loading-info").innerText = "Ładowanie gry...";
		try {
			socket = new WebSocket(game.host);
			socket.onopen = (msg) => {
				socket.send(JSON.stringify({code: 1, window: [window.innerWidth, window.innerHeight], token: player_token}));
				requestAnimationFrame(animate);
				game.ping();
			};
			socket.onmessage = (msg) => { 
				game.lastLog = msg.data;
				const data = JSON.parse(msg.data);
				if (data.code === 'json') data = ajaxRequest(`/json.php?token=${data.hash}`, {}, false, "GET");
				game.parseServerPacket(data);
			};
			socket.onclose = (msg) => { 
				document.querySelector(".opacity-full").style.display = "block";
				document.querySelector(".loading-percent").innerText = "Trwa łączenie z serwerem...";
				setTimeout(() => {
					game.init();
				}, 1000);
			};
		} catch (ex) { 
			console.log(ex); 
		}
	},

	singlePacket: (code, action) => {
		game.sendPacket(code, { action: action });
	},

	itemPacket: (code, action, item) => {
		game.sendPacket(code, { action: action, item: item });
	},

	sendPacket: (code, data) => {
		if (socket.readyState === 1) socket.send(JSON.stringify({code: code, data: data}));
	},

	chatMessage: (data) => {
		data.message = data.message.replace(/(http:\/\/[^\s]+)/gi , "<a href='$1' target='_blank'>$1</a>");
		data.message = data.message.replace(/(https:\/\/[^\s]+)/gi , "<a href='$1' target='_blank'>$1</a>");
		var text;
		
		if (data.player != undefined) {
			text = `${data.time} <span class="player-chat" data-name="${data.name}">${data.player}</span>: $	{data.message};
		} else if (data.time == undefined) {
			text = data.message;
		} else {
			text = `${data.time}: ${data.message}`;
		}
		
		data.color !== undefined ? document.querySelector(`.chat-messages-${data.channel}`).append(fromHTML(`<span title="${data.date}" style="color: ${data.color}">${text}</span><br>`)) : document.querySelector(`.chat-messages-${data.channel}`).append(fromHTML(`<span title="${data.date}">${text}</span><br>`));
		
		if (this.channel !== data.channel) document.querySelector(`.chat-messages-${data.channel}`).className += "new-message";
		
		document.getElementById(`chat-messages-${data.channel}`).scrollTop = document.getElementById(`chat-messages-${data.channel}`).scrollHeight;
	},

	npcDirs: [1, 2, 4, 3],
	backDirs: [2, 1, 4, 3],

	ping_time: 0,

	ping: (ping) => {
		if (ping === undefined) ping = "start";

		game.ping_time = Date.now();
		game.sendPacket("ping", { ping: ping });
	},

	refresh: () => {
		this.stopGame = false;
		game.sendPacket("refresh", {});
	},

	parseServerPacket: (data) => {
		if (this.stopGame && data.code < 3) return;
		switch (data.code) {
			case 1:
				game.chatMessage(data);
				break;
			case 'multi_code':
				data.items.forEach((val) => {
					if (typeof val !== "object") val = JSON.parse(val);
				   	if (val.code === "json") val = ajaxRequest(`json.php?token=${val.hash}`, {}, false, "GET");
				   	game.parseServerPacket(val);
			   	});
				break;
			case 2:
				map.update(data);
				break;
			case 'new_mail':
				if (document.querySelector(".icon-count").length > 0) {
					let mailsCount = parseInt(document.querySelector(".icon-count").innerText);
					mailsCount++;
					document.querySelector(".icon-count").innerText = mailsCount.toString();
				} else {
					document.querySelector(".icon-mail").append(fromHTML("<div class='icon-count'>1</div>"));
				}
				break;
			case 'ping':
				const CurrPing = Date.now() - game.ping_time;
				if (CurrPing < 99) document.querySelector('.game-ping').style.color = "lime";
				if (CurrPing > 100) document.querySelector('.game-ping').style.color = "orange";
				if (CurrPing > 300) document.querySelector('.game-ping').style.color = "red";
				document.querySelector(".game-ping").innerText = `${CurrPing}ms`;

				setTimeout((ping) => {
					game.ping(ping);
				}, 1000, CurrPing);
				break;
			case 99:
				game.broadCast(data.message);
				break;

			case 'reset_move':
				player.move = 0;
				break;

			case 'player_backpack':
				player.refreshBackpack(data.backpack);
				break;

			case 4:
				player.displayBackpack(data.data, "");
				break;
			case 5:
				this.className = "";
				this.effectName = "";
				
				this.type = NaN;
				if (data.data[1] !== undefined) {
					this.spellData = data.data[0];
					this.type = 0
				} else {
					this.spellData = data.data[1];
					this.type = 1;
				}
				
				if (this.spellData.attack_type > 0) this.className = `damage-type-${this.spellData.attack_type}`;

				if (this.spellData.spell_effect !== undefined) this.effectName = `animation damage-spell-${this.spellData.spell_effect}`;

				if (this.spellData.ammo || this.spellData.attack_effect) {
					game.showAttackAnimation(this.spellData);
				} else {
					this.effectName = `slash-${this.spellData.dir}`;
				}

				map.showDamage(this.spellData, this.className, this.effectName);

				if (this.type === 1) {
					setTimeout(function() {
						map.showDamage(this.spellData, className, effectName);
					}, 180);
				}
				break;
			case 'server_reboot':
				alert("server_reboot");
				break;
			case 'remove_auction':
				document.querySelector(`tr[data-auction="${data.id}"]`).remove();
				game.showSmallAlert(data.message);
				break;
			case 964:
				if (data.message) {
					if (this.channel !== 2) document.querySelector(".channel-2").classList.add("new-message");
					document.querySelector(".chat-messages-2").append(fromHTML(`${this.getHour()} ${data.message}<br>`));
				}
				if (data.monster === map.current_monster) {
					const width = 1.22 * data.percent;
					document.querySelector(".target-frame-health .health-bar").style.width = `${width}px`;
					document.querySelector(".target-frame-health .health-bar").innerText = `${data.percent}%`;
				}
				map.showHealth(data);
				player.setHealth(data.health, data.health_max);
				break;
			case 'move_outfit':
				if (data.player == player.id || !document.getElementById(`player_${data.player}`)) break;
				document.getElementById(`player_${data.player}`).style.backgroundPosition = player.outfits[data.dir - 1][0];
				break;
			case 10:
				map.movePlayer(data);
				break;
			case 71:
				map.loadOtherPlayer(data);
				break;
			case 30:
				npc.startTalk(data.npc, data.data);
				npc.setWindowAvatar(data);
				return;
			case 75:
				map.showDamage(data);
				break;
			case 'start_tutorial':
				document.querySelector(".shadow-game").classList.remove('active');
				game.keysStatus = 0;
				game.close_window();
				player.goToPosition(6, 7);
				break;
			case 'skip_tutorial':
				document.querySelector(".shadow-game").classList.remove('active');
				game.keysStatus = 0;
				game.close_window();
				break;
			case 1092:
				data.id === player.id ? document.querySelector(`#my-trade-item-${data.slot}`).remove() : document.querySelector(`#other-trade-item-${data.slot}`).remove();
				break;
			case 1020:
				document.querySelector(`tr[data-mail="${data.id}"]`).remove();
				game.showSmallAlert('Usunięto wiadomość', 1);
				break;
			case 1091:
				var count = '';
				if (data.count > 1) count = data.count;
				if (data.id === player.id) {
					document.querySelector(`.backpack-item-${data.slot}`).addClass('item-hidden');
					document.querySelector("#trade-my-offers").append(fromHTML(`<div data-slot="${data.slot}" onClick="player.tradeRemove('${data.slot}');" id="my-trade-item-${data.slot}" data-price="${data.price}" class="item trade-item item-${data.item.id}" data-tip="${data.item.description}<br>Cena: ${data.price}"><div class="count">${count}</div></div>`));
				} else {
					document.querySelector('#trade-other-offers').append(fromHTML(`<div data-slot="${data.slot}" data-item="${data.item.id}" onClick="player.tradeAccept('${data.slot}');" id="other-trade-item-${data.slot}" data-price="${data.price}" class="item trade-item item-${data.item.id}" data-tip="${data.item.description}<br>Cena: ${data.price}"><div class="count">${count}</div></div>`));
				}
				break;
			case 1090:
				game.keysStatus = 1;
				game.load_window('window-players-trade', 'Handel', 'window-players-trade');
				windowDisplay.displayBackpack('plecak', data.backpack, 5);
				player.trade_player = data.id;
				$('.trade-with').html(data.player);
				break;

			case 1015:
				$('#tile_'+data.x+'-'+data.y).remove();
				$('#tile_'+data.x+'-'+data.y+'_tip').remove();
				alert(data.msg);
				break;

			case 1001:
				$('.clan-members tbody tr[data-id="'+data.player+'"]').remove();
				break;

			case 'tp':
				alert(15);

				//player.stopMove = 1;
				//map.loadMap(data.data);
				break;

			case 'teleport':
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

			case 101:
				break;

			case 'quest_history':
				windowDisplay.showQuestHistory(data.data);
				break;

			case 368:
				if (data.type == 1) {
					$('.spell-shortcut-'+data.slot).remove();
				} else {
					$('.shortcut-box').append('<div data-slot="'+data.slot+'" style="background: url(/assets/spells/icon_'+data.data.id+'.png);" data-spell="'+data.data.id+'" data-type="'+data.data.type+'" id="spell-shortcut-'+data.slot+'" class="spell-shortcut draggable spell-shortcut-'+data.slot+' spell-'+data.data.id+' spell" data-tip="'+data.data.name+'"></div>');
				}
				break;

			case 367:
				$('.skill-points').html(data.points);
				$('#skill-item-'+data.spell).addClass('draggable');
				$('.skill-level-'+data.spell).html(data.level);
				break;

			case 433:
				spells.parsePacket(data);
				break;

			case 102:
				player.move = 0;
				game.keysStatus = 1;
				setTimeout(function() {
					player.movePlayer(game.backDirs[data.dir - 1], 1);
					game.keysStatus = 0;
				}, 300);
				break;

			case 1094:
				if (data.gold) {
					player.setGold(data.gold);
				}//ed if

				if (data.id != player.id) {
					$('#my-trade-item-'+data.slot_offer).remove();
				} else {
					$('#other-trade-item-'+data.slot_offer).remove();
				}//end if

				if (data.message != undefined) {
					game.showSmallAlert(data.message);
				}

				if (data.item) {
					var count = '';

					if (data.item.count > 1) {
						count = data.item.count;
					}

					$('#plecak').append('<div data-id="'+data.item.id+'" data-count="'+data.item.count+'" data-tip-type="'+data.item.type+'" onClick="player.tradeItem('+data.to_slot+')" id="item_'+data.to_slot+'" data-tip="'+data.item.description+'" class="item backpack-item-'+data.to_slot+' item-'+data.item.id+' backpack-item"><div class="count">'+count+'</div></div>');
				}

				if (data.slot != undefined) {
					$('.backpack-item-'+data.slot).remove();
				}
				break;

			case 'move_me':
				player.animate(500);
				player.mapMovePlayer(data.x, data.y, data.dir);
				break;

			case 'postoffice_window':
				game.keysStatus = 1;
				npc.postoffice_window(data);
				break;

			case 'npc_messages':
				npc.reTalk(data.data);
				break;

			case 'minimap':
				$('#mini-map-image').attr('src', '/assets/maps/minimap/map_'+data.data.id+'.png');
				$('.mini-map-name').html(data.data.name);
				$('.map_'+data.data.id).append('<div class="current-mini-map"></div>');
				windowDisplay.displayMiniMap(data.data);
				break;

			case 'attack_speed':
				player.attack_speed = data.value;
				break;

			case 1051:
				if (data.player.id == map.current_player) {
					map.current_player = 0;
				}//end if

				$('#player_'+data.player.id).remove();
				$('#player_'+data.player.id+'-layer').remove();
				break;

			case 1030:
				if (data.message) {
					if (this.channel != 2) {
						$('.channel-2').addClass('new-message');
					}

					$('.chat-messages-2').append(this.getHour()+' '+data.message+'<br>');
				}

				if (data.spell_effect != undefined) {
					// feat: show spell effect
				}

				player.setHealth(data.health, data.health_max);
				break;

			case 'clan_payment':
				$('.clan-balance').html(data.balance);
				player.setGold(data.gold+'$');
				var i = $('.payments-history tbody tr').length + 1;
				$('.payments-history tbody').append('<tr><td>'+i+'.</td><td>'+data.name+'</td><td>'+data.value+'</td><td>'+data.type+'</td><td>'+data.date+'</td></tr>');
				break;

			case 733:
				windowDisplay.displayWars(data.data);
				break;

			case 732:
				windowDisplay.displayDiplomacy(data.data);
				break;

			case 886:
				if (data.data.remove_id != undefined) {
					$('.clan-ally-list tbody tr[data-id="'+data.data.remove_id+'"]').remove();
					$('.clan-enemy tbody tr[data-id="'+data.data.remove_id+'"]').remove();
				}
				break;

			case 'death':
				game.stopGame       = true;
				map.current_monster = 0;
				map.current_player  = 0;
				$('body').addClass('black-bg');
				$('.loading').removeClass('hidden');
				$('.loading-death').removeClass('hidden');
				$('.loading-content').addClass('hidden');
				document.getElementById('death-time').innerHTML = data.time;
				player.setHealth(1, data.health);

				var timeleft      = data.time;
				var downloadTimer = setInterval(function() {
				  	timeleft--;
				  	document.getElementById('death-time').innerHTML = timeleft;
				}, 1000);

				setTimeout(function() {
					game.sendPacket(1019, {});
					game.stopGame = false;
					$('.loading-death').addClass('hidden');
					$('.loading-content').removeClass('hidden');
					clearInterval(downloadTimer);
				}, (data.time * 1000));
				break;

			case 'global_shop_widow':
				npc.global_shop_window(data);
				break;

			case 'shop_window':
				npc.shop_window(data);
				windowDisplay.displayBackpack('plecak', data.backpack, 10);
				break;

			case 'spell_effect':
				spells.showPlayerAnimation('#player_'+data.player, data);
				break;

			case 'player_stats':
				player.displayStats(data.data);
				break;

			case 1009:
				windowDisplay.displayClanMembers(data.list);
				if (data.ranks.length > 0) {
					$('.select-clan-rank').html('');
					$.each(data.ranks, function(key, v) {
						$('.select-clan-rank').append('<option value="'+v.id+'">'+v.name+'</option>');
					});
				} else {
					alert('musisz dodać rangi');
					game.switchDisplay('clans', 'ranks');
				}//end if
				break;

			case 'item':
				if (data.data == undefined || data.data.type == undefined) {
					break;
				}

				if (data.data != undefined && data.data.attack_speed != undefined) {
					player.attack_speed = data.data.attack_speed;
				}

				//@ handle move
				if (data.data.type == 'move_magazine') {
					game.sendPacket(31, { state: 1004 });
				} else if (data.data.type === 'shortcut_to_backpack') {
					$('.shortcut-item-'+data.data.from).appendTo('.player-backpack');
					$('.shortcut-item-'+data.data.from).addClass('backpack-item-'+data.data.to);
					$('.backpack-item-'+data.data.to).removeClass('shortcut-item-'+data.data.from);
					$('.backpack-item-'+data.data.to).removeAttr('style');
					$('.backpack-item-'+data.data.to).removeClass('shortcut-item');
					$('.backpack-item-'+data.data.to).addClass('backpack-item');
					$('.backpack-item-'+data.data.to).data('slot', data.data.to);
				} else {
					game.sendPacket(2, { window: 'backpack' });
				}//end if
				break;

			case 'auction_window':
				npc.auction_window(data);
				break;

			case 'casino_window':
				npc.casino_window(data);
				break;

			case 'blacksmith_window':
				windowDisplay.openWindow('Kowal', 'npc-blacksmith', 'npc-blacksmith');
				windowDisplay.displayBackpack('plecak', data.backpack, 3);
				break;

			case 85:
				switch (data.type) {
					case 'remove_invite':
						$('.clan-invite-'+data.id).remove();
						break;

					default:
						alert('undefined clan type '+data.type);
						break;
				}//end switch
				break;

			case 'loot':
				player.setExperience(data.experience, data.to_level);
				player.showLootWindow(data.data);

				if (data.advance != undefined) {
					var text = 'Awansowałeś z poziomu '+data.advance.from+' do poziomu '+data.advance.to;

					if (data.advance.spell != undefined) {
						text += '<br><br>Odblokowano umiejętność: '+data.advance.spell;
					}

					game.broadCast(text);
					player.setHealth(data.advance.health, data.advance.health_max);
					player.setExperience(data.advance.experience, data.advance.to_level);
					$('.level-box').html(data.advance.to);
				}

				if (data.gold > 0) {
					$('.chat-messages-2').append(this.getHour()+' Otrzymano '+data.gold+' złota<br>');
					player.setGold(data.player_gold);
				}

				if (this.channel != 2) {
					$('.channel-2').addClass('new-message');
				}

				$('.chat-messages-2').append(this.getHour()+' Otrzymano '+data.gained+' doświadczenia<br>');
				break;

			case 'friends':
				windowDisplay.displayFriends(data.friends, data.enemies);
				break;

			case 1052:
				game.showModalQuestion('Gracz '+data.player+' zaprosił Cię do grupy.<br>Czy akceptujesz zaproszenie?');
				game.data = data;

				document.getElementById('modal-accept').onclick = function () {
					game.sendPacket(1052, { action: 'accept', player: game.data.id });
					game.closeModalQuestion();
				};

				document.getElementById('modal-remove').onclick = function () {
					game.sendPacket(1052, { action: 'revoke', player: game.data.id });
					game.closeModalQuestion();
				};
				break;

			case 1056:
				game.showModalQuestion('Gracz '+data.player+' zaprosił Cię do handlu.<br>Czy akceptujesz zaproszenie?');
				game.data = data;

				document.getElementById('modal-accept').onclick = function () {
					game.sendPacket(1051, { action: 2, player: game.data.id });
					game.closeModalQuestion();
				};

				document.getElementById('modal-remove').onclick = function () {
					game.sendPacket(1051, { action: 7, player: game.data.id });
					game.closeModalQuestion();
				};
				break;

			case 54:
				if (game.monsters[data.id]) {
                    game.monsters[data.id].is_death = true;
                }

				var event = new MapEvent(
					{
						type: 'monster_death',
						id: data.id,
					},
					320
				);
				game.events.push(event);
				break;

			case 55:
				map.updateData(data.data);
				break;

			case 'npc':
				npc.parsePacket(data.data);
				break;

			case 'mails':
				windowDisplay.mails = data.data;
				windowDisplay.displayMails(0);
				$('.mails-received-count').html(windowDisplay.mails[0].length);
				$('.mails-send-count').html(windowDisplay.mails[1].length);
				$('.mails-admin-count').html(windowDisplay.mails[3].length);
				break;

			case 'mail_send':
				windowDisplay.mails = data.data;
				$('.mails-received-count').html(windowDisplay.mails[0].length);
				$('.mails-send-count').html(windowDisplay.mails[1].length);
				alert('Wiadomość została wysłana');
				$('#form-mail').trigger('reset');
				windowDisplay.displayMailById(data.id, 1);
				break;

			case 78:
				var path = data.path;
				var l    = path.length;
				var i    = 0;

				for (i = 0; i < l; i++) {
					player.movePlayer(path[i], 0);
				}
				break;

			case 8585:
				$('.clan-ranks-table tbody td[data-rank="'+data.rank+'"]').remove();
				break;

			case 543:
				$('.clan-invites-list').css('display', 'block');
				$('.clan-invites tbody').append('<tr class="clan-invite-'+data.data.player_id+'"><td>'+data.data.name+'</td><td>'+data.data.rank+'</td><td>'+data.data.date+'</td><td><div class="button-1 trade-sell overlock font-20" onClick="game.itemPacket(\'clans\', \'remove_invite\', '+data.data.player_id+');">Usuń</div></td></tr>');
				$('#form-12').trigger('reset');
				break;

			case 51:
				$('.loot-'+data.slot).remove();
				break;

			case 940:
				$('.'+data.type+'-item-'+data.from).remove();
				$('.shortcut-item-'+data.to).html(data.count);
				break;

			case 'load_game':
				game.loadingBar(0);
				$('.loading').removeClass('hidden');
				var load = ajaxRequest('/json.php?token='+data.token, {}, false, 'GET');

				player.stopMove = 1;
				setTimeout(function() {
					map.loadMap(load.data);

					if (load.data.tutorial) {
						setTimeout(function() {
							$('.shadow-game').addClass('active');
							game.load_window('window-tutorial', 'Witaj w Alkatrii', 'window-tutorial', undefined, 'tutorial');
						}, 1000);
					}
				}, data.timeout);
				break;

			case 'spells':
				spells.showTree(data);
				break;

			case 1018:
				game.showSmallAlert(data.message);
				windowDisplay.resetForm('clan-rank');

				if ($('.clan-ranks-table tbody td[data-id="'+data.id+'"]').length > 0) {
					$('.clan-ranks-table tbody td[data-id="'+data.id+'"]').data('name', data.name);
				} else {
					if (data.permissions == undefined) {
						return;
					}

					$('.clan-ranks-table tr:first').append('<td class="rank-td" data-rank="'+data.id+'" data-id="'+data.id+'">'+data.name+'</td>');
					$('.clan-ranks-table tr:eq(1)').append('<td class="rank-td" data-rank="'+data.id+'"><input class="clan-permission" '+windowDisplay.toChecked(data.permissions.description)+' type="checkbox" value="1" data-type="description"></td>');
					$('.clan-ranks-table tr:eq(2)').append('<td class="rank-td" data-rank="'+data.id+'"><input class="clan-permission" '+windowDisplay.toChecked(data.permissions.diplomacy)+' type="checkbox" value="1" data-type="diplomacy"></td>');
					$('.clan-ranks-table tr:eq(3)').append('<td class="rank-td" data-rank="'+data.id+'"><input class="clan-permission" '+windowDisplay.toChecked(data.permissions.invite)+' type="checkbox" value="1" data-type="invite"></td>');
					$('.clan-ranks-table tr:eq(4)').append('<td class="rank-td" data-rank="'+data.id+'"><input class="clan-permission" '+windowDisplay.toChecked(data.permissions.members)+' type="checkbox" value="1" data-type="members"></td>');
					$('.clan-ranks-table tr:eq(5)').append('<td class="rank-td" data-rank="'+data.id+'"><input class="clan-permission" '+windowDisplay.toChecked(data.permissions.withdraw)+' type="checkbox" value="1" data-type="withdraw"></td>');
					$('.clan-ranks-table tr:eq(6)').append('<td class="rank-td" data-rank="'+data.id+'"><input class="clan-permission" '+windowDisplay.toChecked(data.permissions.deposit)+' type="checkbox" value="1" data-type="deposit"></td>');
					$('.clan-ranks-table tr:eq(7)').append('<td class="rank-td" data-rank="'+data.id+'"><div class="button-1 overlock" onClick="game.editClanRank('+data.id+');">Edytuj</div><div class="button-1 overlock" onClick="game.removeClanRank('+data.id+');">Usuń</div></td>');
				}
				break;

			case 1471:
				$('.rank-td').remove();
				var i = 1;
				var options = '';
				$.each(data.list, function(key, v) {
					options = '<div class="button-1 overlock" onClick="game.editClanRank('+v.id+');">Edytuj</div>';
					if (v.members < 1 && v.invites < 1) {
						options += '<br /><div class="button-1 overlock" onClick="game.removeClanRank('+v.id+');">Usuń</div>';
					}//end if

					$('.clan-ranks-table tr:first').append('<td class="rank-td" data-rank="'+v.id+'" data-id="'+v.id+'">'+v.name+'</td>');
					$('.clan-ranks-table tr:eq(1)').append('<td class="rank-td" data-rank="'+v.id+'"><input class="clan-permission" '+windowDisplay.toChecked(v.permissions.description)+' type="checkbox" value="1" data-type="description"></td>');
					$('.clan-ranks-table tr:eq(2)').append('<td class="rank-td" data-rank="'+v.id+'"><input class="clan-permission" '+windowDisplay.toChecked(v.permissions.diplomacy)+' type="checkbox" value="1" data-type="diplomacy"></td>');
					$('.clan-ranks-table tr:eq(3)').append('<td class="rank-td" data-rank="'+v.id+'"><input class="clan-permission" '+windowDisplay.toChecked(v.permissions.invite)+' type="checkbox" value="1" data-type="invite"></td>');
					$('.clan-ranks-table tr:eq(4)').append('<td class="rank-td" data-rank="'+v.id+'"><input class="clan-permission" '+windowDisplay.toChecked(v.permissions.members)+' type="checkbox" value="1" data-type="members"></td>');
					$('.clan-ranks-table tr:eq(5)').append('<td class="rank-td" data-rank="'+v.id+'"><input class="clan-permission" '+windowDisplay.toChecked(v.permissions.withdraw)+' type="checkbox" value="1" data-type="withdraw"></td>');
					$('.clan-ranks-table tr:eq(6)').append('<td class="rank-td" data-rank="'+v.id+'"><input class="clan-permission" '+windowDisplay.toChecked(v.permissions.deposit)+' type="checkbox" value="1" data-type="deposit"></td>');
					$('.clan-ranks-table tr:eq(7)').append('<td class="rank-td" data-rank="'+v.id+'">'+options+'</td>');

					i++;
				});
				break;

			case 941:
				switch (data.type) {
					case 'shortcut':
						$('.shortcut-item-'+data.to).addClass('shortcut-item-tmp');
						$('.shortcut-item-tmp').removeClass('shortcut-item-'+data.to);
						$('.shortcut-item-'+data.from).addClass('shortcut-item-'+data.to);
						$('.shortcut-item-'+data.to).removeClass('shortcut-item-'+data.from);
						$('.shortcut-item-tmp').addClass('shortcut-item-'+data.from);
						$('.shortcut-item-tmp').removeClass('shortcut-item-tmp');
						$('.shortcut-item-'+data.to).removeAttr('style');
						$('.shortcut-item-'+data.from).removeAttr('style');
						$('.shortcut-item-'+data.to).data('slot', data.to);
						$('.shortcut-item-'+data.from).data('slot', data.from);
						break;

					case 'backpack':
						$('.backpack-item-'+data.to).addClass('backpack-item-tmp');
						$('.backpack-item-tmp').removeClass('backpack-item-'+data.to);
						$('.backpack-item-'+data.from).addClass('backpack-item-'+data.to);
						$('.backpack-item-'+data.to).removeClass('backpack-item-'+data.from);
						$('.backpack-item-tmp').addClass('backpack-item-'+data.from);
						$('.backpack-item-tmp').removeClass('backpack-item-tmp');
						$('.backpack-item-'+data.to).removeAttr('style');
						$('.backpack-item-'+data.from).removeAttr('style');
						$('.backpack-item-'+data.to).data('slot', data.to);
						$('.backpack-item-'+data.from).data('slot', data.from);
						break;

					case 'backpack_shortcut':
						$('.shortcut-item-'+data.to).addClass('shortcut-item-tmp');
						$('.shortcut-item-tmp').removeClass('shortcut-item-'+data.to);
						$('.backpack-item-'+data.from).addClass('shortcut-item-'+data.to);
						$('.shortcut-item-'+data.to).removeClass('backpack-item-'+data.from);
						$('.shortcut-item-tmp').addClass('backpack-item-'+data.from);
						$('.shortcut-item-tmp').removeClass('shortcut-item-tmp');
						$('.shortcut-item-'+data.to).removeAttr('style');
						$('.backpack-item-'+data.from).removeAttr('style');
						$('.shortcut-item-'+data.to).data('slot', data.to);
						$('.backpack-item-'+data.from).data('slot', data.from);

						$('.backpack-item-'+data.from).appendTo('.player-backpack').removeClass('shortcut-item').addClass('backpack-item');
						$('.shortcut-item-'+data.to).appendTo('.shortcut-box').removeClass('backpack-item').addClass('shortcut-item');
						break;

					case 'shortcut_to_backpack':
						$('.backpack-item-'+data.to).addClass('backpack-item-tmp');
						$('.backpack-item-tmp').removeClass('backpack-item-'+data.to);
						$('.shortcut-item-'+data.from).addClass('backpack-item-'+data.to);
						$('.backpack-item-'+data.to).removeClass('shortcut-item-'+data.from);
						$('.backpack-item-tmp').addClass('shortcut-item-'+data.from);
						$('.backpack-item-tmp').removeClass('backpack-item-tmp');
						$('.backpack-item-'+data.to).removeAttr('style');
						$('.shortcut-item-'+data.from).removeAttr('style');
						$('.backpack-item-'+data.to).data('slot', data.to);
						$('.shortcut-item-'+data.from).data('slot', data.from);

						$('.shortcut-item-'+data.from).appendTo('.shortcut-box').removeClass('backpack-item').addClass('shortcut-item');
						$('.backpack-item-'+data.to).appendTo('.player-backpack').removeClass('shortcut-item').addClass('backpack-item');
						break;

					case 'switch_magazine':
						$('.deposit-item-'+data.to).addClass('deposit-item-tmp');
						$('.deposit-item-tmp').removeClass('deposit-item-'+data.to);
						$('.deposit-item-'+data.from).addClass('deposit-item-'+data.to);
						$('.deposit-item-'+data.to).removeClass('deposit-item-'+data.from);
						$('.deposit-item-tmp').addClass('deposit-item-'+data.from);
						$('.deposit-item-tmp').removeClass('deposit-item-tmp');
						$('.deposit-item-'+data.to).removeAttr('style');
						$('.deposit-item-'+data.from).removeAttr('style');
						$('.deposit-item-'+data.to).data('slot', data.to);
						$('.deposit-item-'+data.from).data('slot', data.from);
						break;

					case 'move_in_backpack':
						$('.backpack-item-'+data.from).addClass('backpack-item-'+data.to);
						$('.backpack-item-'+data.to).removeClass('backpack-item-'+data.from);
						$('.backpack-item-'+data.to).removeAttr('style');
						$('.backpack-item-'+data.to).data('slot', data.to);
						break;

					case 'merge_shortcut_to_backpack':
						$('.shortcut-item-'+data.remove).remove();
						$('.backpack-item-'+data.to).html(data.count);
						break;

					case 'merge_magazine':
						$('.deposit-item-'+data.from).remove();
						$('.deposit-item-'+data.to).html(data.count);
						break;

					default:
						alert('941: '+data.type);
						break;
				}//end switch
				break;

			case 939:
				if (data.type == 'backpack') {
					$('.backpack-item-'+data.from).appendTo('.shortcut-box');
					$('.backpack-item-'+data.from).addClass('shortcut-item-'+data.to);
					$('.backpack-item-'+data.from).addClass('shortcut-item');
					$('.backpack-item-'+data.from).removeAttr('style');
					$('.shortcut-item-'+data.to).data('slot', data.to);
					$('.shortcut-item-'+data.to).removeClass('backpack-item');
					$('.shortcut-item-'+data.to).removeClass('backpack-item-'+data.from);
				} else {
					$('.shortcut-item-'+data.from).addClass('shortcut-item-'+data.to);
					$('.shortcut-item-'+data.to).removeClass('shortcut-item-'+data.from);
					$('.shortcut-item-'+data.to).removeAttr('style');
					$('.shortcut-item-'+data.to).data('slot', data.to);
				}
				break;

			case 'small_window':
				alert(data.message);
				break;

			case 1002:
				if (data.text != undefined) {
					$('.clan-description').html(data.text);
				}//end if

				if (data.is_leader && data.members && data.members.length > 0) {
					$('.switch-leader').css('display', 'block');
					$('.select-leader').html('');
					$.each(data.members.members, function(key, v) {
						if (v.can_edit) {
							$('.select-leader').append('<option value="'+v.id+'">'+v.player+'</option>');
						}
					});
				} else {
					$('.switch-leader').css('display', 'none');
				}

				if (data.alert != undefined) {
					game.showSmallAlert(data.alert);
				}
				break;

			case 'buy_items':
				player.setGold(data.gold);
				game.showSmallAlert(data.message);
				$('.buy-item').remove();
				$('.buy-sum-price').html('0');
				windowDisplay.displayBackpack('plecak', data.backpack, 10);

				$('.sell-item').each(function(i, obj) {
					$('.player-item-'+$(this).data('val')).addClass('shop-offer-selected');
				});
				break;

			case 'sell_items':
				player.setGold(data.gold);
				game.showSmallAlert(data.message);
				$('.sell-item').remove();
				$('.sell-sum-price').html('0');
				windowDisplay.displayBackpack('plecak', data.backpack, 10);
				break;

			case 685:
				if (data.chest != undefined) {
					$('#chest_'+data.chest).addClass('open');
				}//end if

				if (data.gold != undefined) {
					player.setGold(data.gold);
				}//end if

				if (data.experience != undefined) {
					player.setExperience(data.experience, data.to_level);
				}//end if

				if (data.remove != undefined) {
					$(data.remove).remove();
				}//end if

				if (data.type != undefined && data.type == 'spell_points') {
					$('.spell-shortcut').remove();
				}//end if

				if (data.add != undefined) {
					var val   = data.add.data;
					var add   = '';
					var count = '';
					if (val.stackable) {
						count = 1;
					}//end if

					if (val.count > 1) {
						count = val.count;
					}//end if

					document.getElementById('plecak').appendChild(fromHTML('<div data-tip-type="'+val.type+'" data-slot="'+val.slot+'"'+add+' id="item_'+val.slot+'" class="backpack-item-'+val.slot+' item draggable backpack-item item-'+val.id+'" data-tip="'+val.description+'">'+count+'</div>'));
				}//end if

				var hour   = new Date().getHours();
				var minute = new Date().getMinutes();
				if (minute < 10) {
					minute = '0' + minute;
				}//end if

				if (hour < 10) {
					hour = '0' + hour;
				}//end if

				game.showSmallAlert(hour + ':'+ minute + ' ' + data.text, 1);
				$('.chat-messages-2').append(hour + ':'+ minute + ' ' + data.text);
				break;

			case 764:
				if ($('.channel-player-'+data.id).length < 1) {
					if (data.name.length > 5) {
						$('.chat-channels').append('<div data-tip="'+data.name+'" onClick="game.chatChannel(5, '+data.id+');" class="chat-channel overlock channel-player-'+data.id+'">'+data.name.substring(0, 5)+' <div style="display: inline-block" class="chat-channel-close" data-player="'+data.id+'">X</div></div>');
					} else {
						$('.chat-channels').append('<div onClick="game.chatChannel(5, '+data.id+');" class="chat-channel overlock channel-player-'+data.id+'">'+data.name+' <div style="display: inline-block" class="chat-channel-close" data-player="'+data.id+'">X</div></div>');
					}//end if

					$('.chat-content').append('<div id="chat-messages-player-'+data.id+'" class="chat-messages chat-messages-player-'+data.id+'" style="display: none"></div>');
				}//end if

				var hour   = new Date().getHours();
				var minute = new Date().getMinutes();

				if (this.channelPlayer != data.id && this.channel == 5) {
					$('.channel-player-'+data.id).addClass('new-message');
				}

				$('.chat-messages-player-'+data.id).append(hour + ':'+ minute + ' ' + data.player + ': ' + data.message +'<br>');
				document.getElementById('chat-messages-player-'+data.id).scrollTop = document.getElementById('chat-messages-player-'+data.id).scrollHeight;
				break;

			case 1016:
				if (data.message != undefined) {
					game.showSmallAlert(data.message);

					if (this.channel != 2) {
						$('.channel-2').addClass('new-message');
					}

					$('.chat-messages-2').append(this.getHour()+' '+data.message+'<br>');
				}

				if (data.big_message != undefined) {
					game.broadCast(data.big_message, 10000);
				}

				if (data.gold != undefined) {
					player.setGold(data.gold);
				}

				if (data.slot != undefined) {
					$('.backpack-item-'+data.slot).remove();
				}

				if (data.clear_html) {
					$(data.clear_html).html('');
				}

				if (data.effect != undefined) {
					var obj = 'tile_'+data.x+'-'+data.y;
					document.getElementById(obj).innerHTML = '<div class="damage-effect effect-1"></div>';

					setTimeout(function() {
						if (document.getElementById(obj)) {
							document.getElementById(obj).innerHTML = '';
						}
					}, 1400);
				}

				if (data.group_leave != undefined) {
					$('.group-window').remove();
				}

				if (data.group != undefined) {
					map.showClanWindow(data.group);
				}

				if (data.close_window != undefined) {
					$(data.close_window).remove();
					game.keysStatus = 0;
				}

				if (data.remove_group_player != undefined) {
					$('.group-member-'+data.remove_group_player).remove();
				}

				if (data.health != undefined) {
					player.setHealth(data.health, data.health_max);
				}

				if (data.item_show) {
					var val = data.item_show;
					var add = '';

					if (val.can_upgrade) {
						add = 'onClick="npc.blacksmithItem('+val.slot+')" ';
					}

					document.getElementById('plecak').appendChild(fromHTML('<div data-count="1" data-slot="'+val.slot+'"'+add+' data-tip-type="'+val.type+'" id="item_'+val.slot+'" class="item-class-'+val.slot_type+' backpack-item-'+val.slot+' item-type-'+val.type+' item  item-'+val.id+'" data-id="'+val.id+'" data-tip="'+val.description+'"></div>'));
				}
				break;

			case 1504:
				var divName = 'player_'+data.player+'-layer';

				if (player.id == data.player) {
					if (player.settings.yell_character) {
						break;
					}//end if

					divName = 'my-character-layer';
				}

				if ($('.player-yell-'+data.player).length > 0) {
					$('.player-yell-'+data.player).remove();
				}

				if (!document.getElementById(divName)) {
					break;
				}

				var position = game.calculateObjectPosition(divName);
				var guid     = game.getGuid();
				document.getElementById(divName).appendChild(fromHTML('<div class="player-yell player-yell-'+data.player+' '+guid+'">'+data.message+'</div>'));

				var event = new MapEvent(
		            {
		                type: 'remove_element',
		                name: '.'+guid
		            },
		            4500
		        );
		        game.events.push(event);
				break;

			case 'error':
				alert('Wystąpił błąd: ' + data.message);
				break;

			case 'death':
				$('.loading').addClass('death');
				setTimeout(function() {
					location.reload();
				}, 2000);
				break;

			case 'removeBackpack':
				$('#item-'+data.slot).remove();

				if (data.message != undefined) {
					alert(data.message);
				}

				if (data.type != undefined) {
					if (data.type == 'auction') {
						$('.backpack-item-'+data.slot).remove();
						$('input[name="price"]').val(0);
						$('.auction-item').html('');
						$('.item-slot').val('');
					}
				}
				break;

			case 'reload':
				setTimeout(function() {
					location.reload();
				}, 2000);
				break;

			case 'refresh':
				location.reload();
				break;

			case 1004:
				game.hasClan = 0;
				game.refreshClanMenu();
				game.switchDisplay('clans', 'list');
				break;

			case 1005:
				game.hasClan = 1;
				game.refreshClanMenu();
				game.switchDisplay('clans', 'list');
				break;

			case 1007:
				windowDisplay.displayClanInvites(data.list);
				break;

			case 'depo_window':
				windowDisplay.openDeposit(data);
				break;

			case 'clans_list':
			case 'clans':
				if (data.is_leader) {
					$('.is-leader').show();
					$('.clan-leader-settings').css('display', '');
				} else if (data.in_clan != undefined && data.in_clan) {
					$('.clan-member-settings').css('display', '');
				}

				if (data.permissions) {
					if (data.permissions.members == undefined || data.permissions.members == 0) {
						$('.perm-members').hide();
					}

					if (data.permissions.deposit == undefined || data.permissions.deposit == 0) {
						$('.perm-deposit').hide();
					}

					if (data.permissions.withdraw == undefined || data.permissions.withdraw == 0) {
						$('.perm-withdraw').hide();
					}

					if (data.permissions.description == undefined || data.permissions.description == 0) {
						$('.perm-description').hide();
					}

					if (data.permissions.diplomacy == undefined || data.permissions.diplomacy == 0) {
						$('.perm-diplomacy').hide();
					}

					if (data.permissions.members == undefined || data.permissions.members == 0) {
						$('.perm-members').hide();
					}

					if ((data.permissions.withdraw == undefined || data.permissions.withdraw == 0) && (data.permissions.deposit == undefined || data.permissions.deposit == 0)) {
						$('.perm-bank').hide();
					}
				}//end if

				windowDisplay.displayClans(data.data);
				break;

			case 87877:
				if (data.shortcut) {
					$('.shortcut-item-'+data.from).remove();
				} else {
					$('.backpack-item-'+data.from).remove();
				}
				break;

			case 'post_send':
				$('.current-trade-item').attr('class', 'current-trade-item item');
				npc.current_item = 0;
				$('#item_'+data.slot).remove();
				$('.postoffice-name').val('');
				game.showSmallAlert(data.message);
				break;

			case 'alert':
				game.showSmallAlert(data.message);
				break;

			case 'auction_bought':
				game.showSmallAlert(data.message);
				$('tr[data-auction="'+data.id+'"]').remove();
				player.setGold(data.gold);
				break;

			case 'auction':
				var action = data.action;

				if (action == 'backpack') {
					$('.auction-box').css('display', 'none');
					$('.auction-add').css('display', 'block');
					windowDisplay.displayBackpack('plecak', data.backpack, 1);
				} else if (action == 'buy') {

				} else if (action == 'sell') {

				} else if (action == 'history') {
					$('.auction-box').css('display', 'none');
					$('.auction-history').css('display', 'block');

					windowDisplay.historyData = data.list;
					windowDisplay.displayAuctionsHistory('current');
				} else {
					windowDisplay.displayAuctions(data);
				}//end if
				break;

			case 84: windowDisplay.displayQuests(data.data); break;

			case 'my_clan':
			case 'show_clan':
				windowDisplay.showClan(data);
				break;

			case 'cutscene':
				cutscene.run(data.hash);
				break;

			case 'add_friend':
				if (data.type == 1) {
					$('#input_przyjaciel').val("");
					windowDisplay.displayFriend(data.data, 1);
				} else {
					$('#input_wrog').val("");
					windowDisplay.displayFriend(data.data, 2);
				}
				break;

			case 1003:
				windowDisplay.displayClanBalance(data);
				break;

			case 'remove_friend':
				$('tr[data-friend="'+data.player+'"]').remove();
				break;

			case 877:
				$('#map-item-'+data.id).remove();
				break;

			case 878:
				map.addMapItem(data.item);
				break;

			case 676:
				player.setGold(data.money);

				if (data.amount != undefined) {
					$('.npc-offer-'+data.id).data('amount', data.amount);
					$('.current-amount').html(data.amount);
				}
				break;

			case 654:
				if (data.count == undefined) {
					$('.'+data.type+'-item-'+data.slot).remove();
				} else {
					$('.'+data.type+'-item-'+data.slot).html(data.count);
				}

				player.setHealth(data.health, data.health_max);
				break;

			case 'resize_window':
				map.setMapPositions(data.data);
				break;

			case 'show_tile':
				$('#tile_'+data.x+'-'+data.y+'_tip').css('display', '');

				if (data.file != undefined) {
					$('#tile_'+data.x+'-'+data.y).css('background', 'url(/assets/game_objects/'+data.file+')');
				}
				break;

			case 'exhaust_tile':
				$('#tile_'+data.x+'-'+data.y+'_tip').css('display', 'none');

				if (data.file != undefined) {
					$('#tile_'+data.x+'-'+data.y).css('background', 'url(/assets/game_objects/'+data.file+')');
				}
				break;

			case 'forge_window':
				player.current_element = '';
				if ($('.window-forge').length < 1) {
					game.load_window('window-forge', data.title, 'window-forge');
				} else {
					document.getElementById('itemList').innerHTML = '';
				}

				var slot   = 1;
				game.forge = data;

				data.forge.forEach(function(val) {
					count    = val.count;
					val.slot = slot;

					slot++;
				 	document.getElementById('itemList').appendChild(fromHTML('<div data-id="'+val.id+'" data-forge="'+val.forge+'" data-tip-type="'+val.type+'" data-slot="'+val.slot+'" data-tip="'+val.description+'" onClick="npc.forgeItem('+val.slot+')" id="backpack-item_'+val.slot+'" class="absolute backpack-item-'+val.slot+' item-class-'+val.slot_type+' item-type-'+val.type+' item item-'+val.id+'" data-tip="'+val.name+'">'+count+'</div>'));
			   	});
				break;

			case 'customname_item_window':
				player.current_element = '';
				if ($('#box_crafting').length < 1) {
					game.load_window('window-customname', 'Nazwij Przedmiot', 'window-customname');
				} else {
					document.getElementById('plecak').innerHTML = '';
					$('.customname-details').html('Wybierz przedmiot aby zobaczyć szczegóły');
				}

				game.keysStatus = 1;
				windowDisplay.displayBackpack('plecak', data.backpack, 32);
				break;

			case 'craft_details':
				$('.crafting-details').html('');
				$('.backpack-item-'+data.slot).removeClass('item-hidden');

				data.items.forEach(function(val) {
					var html = '<div class="craft-item"><div class="craft-item-name overlock font-20 mB15">'+val.name;

					if (val.can_craft) {
						html += ' <div class="button-1 overlock font-20 float-right" onClick="npc.craftConfirm('+val.id+', '+data.slot+')">Ulepsz</div>';
					}

					html += '</div>';
					html += '<div class="craft-item-desc mB20"><small>'+val.description+'</small>';

					if (val.gold > 0) {
						html += '<br><strong>'+val.gold+'</strong> złota';
					}//end if

					html += '</div>';

					if (val.has_craft){
						html += '<small>Przedmiot został ulepszony</small>';
					} else {
						html += val.items;
					}

					html += '<div class="clear2"></div></div>';

					$('.crafting-details').append(html);
			   	});
				break;

			case 'crafting_window':
				player.current_element = '';
				if ($('#box_crafting').length < 1) {
					game.load_window('window-crafting', 'Crafting', 'window-crafting');
				} else {
					document.getElementById('plecak').innerHTML = '';
					$('.crafting-details').html('Wybierz przedmiot aby zobaczyć szczegóły');
				}

				if (data.message) {
					game.broadCast(data.message);
				}

				if (data.gold) {
					player.setGold(data.gold);
				}//ed if

				var count = '';
				game.crafting = data;

				data.backpack.forEach(function(val) {
					count = '';

					if (val.count > 1) {
						count = val.count;
					}

				 	document.getElementById('plecak').appendChild(fromHTML('<div data-id="'+val.id+'" data-craft="'+val.craft+'" data-tip-type="'+val.type+'" data-slot="'+val.slot+'" data-tip-item="'+val.tip+'" onClick="npc.craftItem('+val.slot+')" id="backpack-item_'+val.slot+'" class="absolute item-class-'+val.slot_type+' crafting-item item-hidden backpack-item-'+val.slot+' item-type-'+val.type+' item item-'+val.id+'" data-tip="'+val.name+'">'+count+'</div>'));
			   	});
				break;

			default:
				console.log(data);
				if (data.code != undefined) {
					alert('Unknown packet: '+data.code);
				}
				break;
		}//end switch

		data = null;
	},

	removeClanRank: function(id) {
		game.sendPacket('clans', { action: 'remove_rank', id: id });
	},

	editClanRank: function(id) {
		var name = $('.clan-ranks-table tbody td[data-id="'+id+'"]').html();
		$('.clan-add-title').html('Edytuj rangę: '+name);
		$('#form-155 input[type="text"]').val(name);
		$('#form-155').append('<input type="hidden" name="edit_id" value="'+id+'">');
		$('#form-155 .button-save').html('Zapisz');
		$('#form-155 .button-back').show();
	},

	refreshClanMenu: function() {
		if (game.hasClan == 1) {
			$('.no-clan').hide();
			$('.has-clan').show();
			$('.is-leader').hide();
		} else {
			$('.has-clan').hide();
			$('.no-clan').show();
		}//end if
	},

	clearWindowsSettings: function() {
		this.showSmallAlert('Pozycje okien zostały wyczysczone');
		localStorage.clear();
		$('#window-content').empty();
		$('#display-window').html('');
	},

	load_window: function(name, title, copy, position, className) {
		$('#window-content').empty();
		$('#display-window').html('');

		if (this.windows[copy] == undefined) {
			var response = ajaxRequest('/templates/client/windows/'+copy+'.html', {}, false);
		    $('#display-window').append(response);
		    game.windows[copy] = response;
		} else {
			$('#display-window').append(game.windows[copy]);
		}

		$('#display-window').find('.title-text').text(title);
		$('#display-window').data('window', name);

		switch (name) {
			case 'backpack':
				game.sendPacket(2, {window: 'backpack'});
				break;

			case 'quests':
				game.sendPacket(2, {window: 'quests'});
				break;

			case 'settings':
				game.loadPlayerSettings(player.settings, 1);
				break;

			case 'skills':
				game.sendPacket('spells', {});
				break;

			case 'minimap':
				game.sendPacket('minimap', {});
				break;

			case 'mail':
				game.sendPacket('mails', { action: 0 });
				break;

			case 'friends':
				game.sendPacket('friends', {});
				break;

			case 'clans':
				game.refreshClanMenu();
 				game.sendPacket('clans', {});
				break;

			default:
				break;
		}//end switch

		$('#display-window').attr('class', 'window-centered');

		if (className != undefined) {
			$('#display-window').addClass(className);
		}

		if (position != undefined) {
			var pos = JSON.parse(localStorage.getItem(position));
			if (pos != undefined) {
				if (pos.top < 0) {
					pos.top = 10;
				}

				if (pos.left < 0) {
					pos.left = 10;
				}

				$(position).css('position', 'relative');
				$(position).css('top', pos.top+'px');
				$(position).css('left', pos.left+'px');
			}
		}
	},

	removeByName: function(name) {
		$(name).remove();
	},

	getGuid: function() {
	    var S4 = function() {
	       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	    };

	    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
	},

	switchContent: function(general, load) {
		$('.'+general).css('display', 'none');
		$('.'+load).css('display', 'block');
	},

	hasWindowOpen: 0,

	closeModalQuestion: function() {
		$('#modal-question').remove();
		$('.opacity-full').addClass('hidden');
	},

	showCountWindow: function(item) {
		if (game.windows['modal-question'] == undefined) {
			var response = ajaxRequest('/templates/client/windows/modal-count.html', {}, false);
		    $('#game').append(response);
		    game.windows['modal-count'] = response;
		} else {
			$('#game').append(game.windows['modal-count']);
		}

		$('.opacity-full').removeClass('hidden');
		$('#modal-question').find('.question-text').html('Podaj ilość przedmiotów<Br />');
	},

	showModalQuestion: function(question) {
		if (game.windows['modal-question'] == undefined) {
			var response = ajaxRequest('/templates/client/windows/modal-question.html', {}, false);
		    $('#game').append(response);
		    game.windows['modal-question'] = response;
		} else {
			$('#game').append(game.windows['modal-question']);
		}

		$('.opacity-full').removeClass('hidden');
		$('#modal-question').find('.question-text').html(question+'<br />');
	},

	close_window: function() {
		clearHTML('display-window');
		$('#display-window').data('window', '');
		game.keysStatus = 0;
	},

	stopPlayerTrade: function() {
		game.keysStatus = 0;
		game.sendPacket(1051, { action: 8, player: player.trade_player });
	},

	broadCast: function(message, duration) {
		$('#raidMessage').remove();
		$('#game').append('<div id="raidMessage" class="overlock-white" style="font-size: 25px">'+message+'</div>');

		if (duration == undefined) {
			duration = 15000;
		}

		var event = new MapEvent(
			{
				type: 'remove_element',
				name: '#raidMessage'
			},
			duration
		);
		game.events.push(event);
	},

	logout: function() {
		location.replace('http://alkatria.pl');
	},

	setCooldown: function(time, element){
		var guid = game.getGuid();
		var html = "<div class='cooldown "+guid+"'>\
                  <div class='cooldown-half'>\
                      <div class='cooldown-half-rotator cooldown-half-rotator-left'></div>\
                  </div>\
                  <div class='cooldown-half'>\
                      <div class='cooldown-half-rotator cooldown-half-rotator-right'></div>\
                  </div>\
              </div>";

        if ($('.'+guid).length < 1)
        	element.html(html);

        $("."+guid).css({"opacity":1});
        $("."+guid+" .cooldown-half-rotator-right").css({
            "transition":"transform "+(time/2000)+"s",
            "transition-timing-function":"linear",
            "transform":"rotate(180deg)"
        });
        setTimeout( function(){
            $("."+guid+" .cooldown-half-rotator-left").css({
                "transform":"rotate(180deg)",
                "transition":"transform "+(time/2000)+"s",
                "transition-timing-function":"linear"
            });
            setTimeout( function(){
				$(".cooldown-half-rotator-right").css({"transform":"rotate(0deg)","transition":"transform 0s"});
		  		$(".cooldown-half-rotator-left").css({"transform":"rotate(0deg)","transition":"transform 0s"});
				$(".cooldown").css({"opacity":0});
               // $('.'+guid).remove();
            }, time/2 );
        }, time/2 );
    },

    getHour: function() {
    	var d = new Date();
		return d.getHours()+':'+d.getMinutes();
    },

	channel: 1,
	channelPlayer: 0,
	chatChannel: function(id, player) {
		if (player == undefined) {
			this.channelPlayer = 0;
		}

		if (this.channel == id && ((player == undefined && this.channelPlayer > 0) || this.channelPlayer == player)) {
			return;
		}//end if

		this.channel = id;
		if (player == undefined) {
			this.channelPlayer = 0;
			$('.chat-channel').removeClass('active');
			$('.channel-'+id).addClass('active');
			$('.channel-'+id).removeClass('new-message');
			$('.chat-messages').css('display', 'none');
			$('.chat-messages-'+id).css('display', '');
			document.getElementById('chat-messages-'+id).scrollTop = document.getElementById('chat-messages-'+id).scrollHeight;
			game.sendPacket('chat_channel', { id: id });
		} else {
			this.channelPlayer = player;
			$('.chat-channel').removeClass('active');
			$('.channel-player-'+player).addClass('active');
			$('.channel-player-'+player).removeClass('new-message');
			$('.chat-messages').css('display', 'none');
			$('.chat-messages-player-'+player).css('display', '');
			document.getElementById('chat-messages-player-'+player).scrollTop = document.getElementById('chat-messages-player-'+player).scrollHeight;
			game.sendPacket('chat_channel', { id: id, player: player });
		}
	},

	calculateObjectPosition: function(name) {
		var el = $(name);

		return 0;
	},

	removeElement: function(i) {
		$(i).remove();
	},

	getElement: function(i) {
		return document.getElementById(i);
	},

	sendForm: function(id, code, action) {
		var data = {};

		$.each($('#form-'+id).serializeArray(), function() {
		    data[this.name] = this.value;
		});

		data['action'] = action;
		game.sendPacket(code, data);
	},

	sendBugReport: function(title, text) {
		var category = document.getElementById('bug_category').value;
		var text     = document.getElementById('bug_text').value;
		var data     = ajaxRequest('/game/bug/report/send', {category: category, text: text, x: player.x, y: player.y, map: map.current_map}, false, 'POST');

		if (data.success) {
			game.showBugReport(data.id);
		}//end if

		alert(data.message);
	},

	listBugReports: function() {

	},

	hide_display: function(hide, show) {
		$('.'+hide).addClass('hidden');
		$('.'+show).removeClass('hidden');
	},

	addTimer: function(div, seconds) {
		var guid = game.getGuid();
		var offset = $(div).offset();

		$(div).parent().append('<div style="left: '+$(div).css('left')+'; top: '+$(div).css('top')+';" class="timer" id="timer-'+guid+'">'+seconds+'</div>');

		setTimeout(function(guid, seconds) {
			game.updateTimer(guid, seconds);
		}, 1000, guid, seconds);
	},

	updateTimer: function(guid, seconds) {
		seconds--;
		document.getElementById('timer-'+guid).innerHTML = seconds;

		if (seconds > 1) {
			setTimeout(function(guid, seconds) {
				game.updateTimer(guid, seconds);
			}, 1000, guid, seconds);
		} else {
			setTimeout(function(guid) {
				$('#timer-'+guid).remove();
			}, 1000, guid);
		}
	},

	saveSettings: function() {
		var settings = {};

		settings['trade']        = this.toNumericValue(document.getElementById('trade').checked);
		settings['hotkeys']      = this.toNumericValue(document.getElementById('hotkeys').checked);
		settings['sound']        = this.toNumericValue(document.getElementById('sound').checked);
		settings['clan']         = this.toNumericValue(document.getElementById('clan').checked);
		settings['priv']         = this.toNumericValue(document.getElementById('priv').checked);
		settings['mouse']        = this.toNumericValue(document.getElementById('mouse').checked);
		settings['groups']       = this.toNumericValue(document.getElementById('groups').checked);
		settings['shortkey']     = this.toNumericValue(document.getElementById('shortkey').checked);
		settings['box_drag']     = this.toNumericValue(document.getElementById('box_drag').checked);
		settings['context_menu'] = this.toNumericValue(document.getElementById('context_menu').checked);
		settings['chat_info']    = this.toNumericValue(document.getElementById('chat_info').checked);
		settings['game_minimap'] = this.toNumericValue(document.getElementById('game_minimap').checked);
		settings['game_scale']   = this.toNumericValue(document.getElementById('game_scale').checked);
		settings['sound_volume'] = parseInt(document.getElementById('sound_volume').value);

		game.sendPacket('settings', { action: 2, data: settings });
		player.settings = settings;
		this.loadPlayerSettings(settings);
		this.loadSettings(settings);
		$('#display-window').empty();
		$('#display-window').data('window', '');
	},

	showSmallAlert: function(text, type) {
		var guid = game.getGuid();
		$('.small-info-alert').remove();
		$('body').append('<div class="small-info-alert '+guid+' small-alert-'+type+'">'+text+'</div>');
		setTimeout(function() {
            $('.'+guid).remove();
        }, 15000);
	},

	modalAlert: function(title, message) {

	},

	toNumericValue: function(n) {
		if (n == false) return 0;
		else return 1;
	},

	switch: function(name, hideName, className) {
		if (className == undefined) {
			className = 'block';
		}

		$(hideName).css('display', 'none');
		$(name).css('display', className);
	},

	mailSwitch: function(type) {
		$('.message-show-type').css('display', 'none');
		$('.mail-list-from').css('display', '');

		if (type != 3) {
			if (type == 4) {
				$('.mail-list-from').css('display', 'none');
			}

			$('.messages-list').css('display', 'block');
			windowDisplay.displayMails((type - 1));
		} else {
			$('.message-new').css('display', 'block');
		}
	},

	loadSettings: function(settings) {
		if (map.max_x < 30 || map.max_y < 30 || settings.game_minimap == 1) {
			$('.minimap-frame').css('display', 'none');
		} else {
			$('.minimap-frame').css('display', '');
		}
	},

	loadPlayerSettings: function(settings, display) {
		var key, value;

		if (display == 1) {
			for (key in player.settings) {
			   value = player.settings[key];

			   if (key == 'sound_volume') {
			   		document.getElementById(key).value = value;
			   } else if (value == 1) {
			   		document.getElementById(key).checked = 'checked';
			   }
			}
		} else {
			for (key in player.settings) {
			   
			}
		}//end if
	},

	removeSelection: function() {
		if (window.getSelection) {
			if (window.getSelection().empty) {
				window.getSelection().empty();
			} else if (window.getSelection().removeAllRanges) {
				window.getSelection().removeAllRanges();
			}
		} else if (document.selection) {
			document.selection.empty();
		}
	},

	ajaxDisplay: function(action, name, type) {
		$('.switch-box').css('display', 'none');
		$('.switch-'+name).css('display', 'block');

		if (type == 'bugslist') {
			var data = ajaxRequest('/game/bug/report/list', {}, false, 'POST');

			$('.bugs-list-table tbody').html('');
			$.each(data, function(key, v) {
				$('.bugs-list-table tbody').append('<tr style="cursor: pointer" onClick="game.showBugReport('+v.id+');"><td>'+v.id+'</td><td>'+v.category+'</td><td>'+v.description+'</td><td>'+v.add_date+'</td><td>'+v.status+'</td></tr>');
			});
		}
	},

	showBugReport: function(id) {
		$('.bug-answer').css('display', 'none');
		$('.bug-answer-table tbody').html('');
		this.ajaxDisplay('bugs-list', 'bugs-details');
		game.current_item = id;

		var data = ajaxRequest('/game/bug/report/details/'+id, {}, false, 'POST');
		$('.bug-number').html(id);
		$('.bug-description').html(data.description);
		$('.bug-status').html(data.status);
		$('.bug-category').html(data.category);
		$('.bug-position').html(data.position);
		$('.bug-date').html(data.add_date);

		if (data.can_reply) {
			$('.bug-answer').css('display', '');
		}

		$.each(data.answers, function(key, v) {
			$('.bug-answer-table tbody').append('<tr><td>'+(key + 1)+'.</td><td>'+v.answer+'</td><td>'+v.add_date+'</td><td>'+v.player_name+'</td></tr>');
		});
	},

	sendBugAnswer: function() {
		var id     = game.current_item;
		var answer = $('#bug_answer').val();

		if (answer != '') {
			$('#bug_answer').val('');
			ajaxRequest('/game/bug/report/answer/'+id, {answer: answer}, false, 'POST');
			game.showBugReport(id);
		}
	},

	switchDisplay: function(action, name) {
		$('.switch-box').css('display', 'none');
		$('.switch-'+name).css('display', 'block');
		this.singlePacket(action, name);
	},

	showAttackAnimation: function(data) {
        var effect = new MapEffect(data);
        game.events.push(effect);
	}
};

function angle(cx, cy, ex, ey) {
  var dy = ey - cy;
  var dx = ex - cx;
  var theta = Math.atan2(dy, dx); // range (-PI, PI]
  theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
  //if (theta < 0) theta = 360 + theta; // range [0, 360)
  return theta;
}

var now, delta, last;

var animate = function () {
    now   = Date.now();
    delta = now - last;
    last  = now;

    player.animate(delta);

    game.events.forEach(
    	function (element, index) {
    		if (element.execute(delta)) {
    			game.events.splice(index, 1);
    		}
		}
    );

    game.monsters.forEach(
    	function (element) {
    		element.update(delta);
		}
    );

    game.players.forEach(
    	function (element) {
    		element.update(delta);
		}
    );

    game.npcs.forEach(
    	function (element) {
    		element.update(delta);
		}
    );

    requestAnimationFrame(animate);
};
