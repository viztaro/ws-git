//変数定義(websocket必須)
var host = location.origin.replace(/^http/, 'ws');				//host
// var host = location.origin.replace(/^https/, 'ws');
var ws = new WebSocket(host);									//websocket
//付け加え変数定義
var userid = Math.floor(Math.random() * 500);					//自デバイスのユーザIDをランダムで生成
var open_switch = 0;											//オープンしてるかどうかのフラグ
var num_dvc;													//自デバイスの値
//フラグ
var doing = 0;													//稽古中かを示すフラグ
var watching = 0;												//watchからの音声通知の有無を示すフラグ
var kinecting = 0;												//kinectから骨格認識通知の有無を示すフラグ
//training用変数定義
var count = 0;													//現在の順番
var scriptArray;												//台本の配列

//認識中のユーザ
var motion_user = 0;
//タイマーの名前
var timer = 0;

//以下の変数島田宣言
//登場人物の名前の配列
var actorNameArray;
//動きのタイミングの配列
var actionTimingArray;
//セリフの発話のタイミングの配列
var scriptTimingArray;
//動きをする役者の順番をidで格納する配列
var whoIsActionArray;
//セリフを喋る役者の順番をidで格納する配列
var whoIsScriptArray;
//選択した台本のセリフをかくのうする格納する配列
var linesArray;
//動きのないよう内容
var actionImageArray;
//稽古の開始からの経過時間の計測
var timeCounter = 0;
//時間を止めるとタイマーが０になるので０になる前のあたいを値を保持する変数
var timeKeeper = 0;
//台本の進行状況
var scriptProgress = 0;
//選択中の台本id
var script_ID;
//変更部分のidを保持
var changePart = -1;
//変更する箇所の台本における順番を格納する配列
var changePointArray = new Array();
//変更箇所の配列の進行具合を制御する変数
var changeArrayProgress = 0;


//********************オープン処理********************
ws.onopen = function(){
	ws.send(JSON.stringify({
		user: userid,
		type: 'connect',
		text: 'open'
	}));

}

//********************クローズイベント********************
ws.onclose = function(event){
	console.log("クローズ");
	ws.send(JSON.stringify({
		user: userid,
		type: 'connect',
		text: 'close'
	}));
}

window.onunload = function(event){
    // 切断
    ws.onclose("切断理由");
//	ws.send(JSON.stringify({
//		user: userid,
//		type: 'connect',
//		text: 'close'
//	}));
	
}


//********************メッセージ受信イベント********************
ws.onmessage = function (event) {
	//-----メッセージの代入-----
	var messages = JSON.parse(event.data);
//	console.log(messages);


	//-----typeがping-----
	if(messages.type == "ping"){
		write_ping(userid, messages.text);
	
	//-----typeがconnect-----
	} else if(messages.type == "connect"){

		//==websocket処理部分==
		//オープン
		if(messages.text == "open"){
			//自分が最初にオープンした時の動作
			if(open_switch == 0){
				userid = messages.user;
				open_switch = 1;
				update_connect_status();
				update_pc_status(userid);
			}
			//共通
			write_log(messages.user, " device opened<br>");
			
		//クローズ
		} else if(messages.text == "close"){
			write_log(messages.user, " device closed<br>");
			
		//==open時、デバイス登録状況を更新==
		} else if(messages.text == "open_device"){
			
			if(userid!="PC1"&&userid!="PC2"&&userid!="PC3"&&userid!="Tablet1"&&userid!="Tablet2"&&userid!="Tablet3"){
			
				if(messages.user == "PC.1"){
					write_log(messages.user, ":登録済み<br>");
					update_pc1();
				} else if(messages.user == "PC.2"){
					write_log(messages.user, ":登録済み<br>");
					update_pc2();
				} else if(messages.user == "PC.3"){
					write_log(messages.user, ":登録済み<br>");
					update_pc3();
				} else if(messages.user == "TABLET.1"){
					write_log(messages.user, ":登録済み<br>");
					update_tablet1();
				} else if(messages.user == "TABLET.2"){
					write_log(messages.user, ":登録済み<br>");
					update_tablet2();
				} else if(messages.user == "TABLET.3"){
					write_log(messages.user, ":登録済み<br>");
					update_tablet3();
				}
			}
			
		//===デバイス登録部分===
		} else if(messages.text == "PC.1"){
			write_log(messages.user, ":PC.1に登録完了<br>");
			update_pc1();
			if(messages.user == userid) userid = "PC1";
		} else if(messages.text == "PC.2"){
			write_log(messages.user, ":PC.2に登録完了<br>");
			update_pc2();
			if(messages.user == userid) userid = "PC2";
		} else if(messages.text == "PC.3"){
			write_log(messages.user, ":PC.3に登録完了<br>");
			update_pc3();
			if(messages.user == userid) userid = "PC3";
		} else if(messages.text == "TABLET.1"){
			write_log(messages.user, ":TABLET.1に登録完了<br>");
			update_tablet1();
			if(messages.user == userid) userid = "Tablet1";
		} else if(messages.text == "TABLET.2"){
			write_log(messages.user, ":TABLET.2に登録完了<br>");
			update_tablet2();
			if(messages.user == userid) userid = "Tablet2";
		} else if(messages.text == "TABLET.3"){
			write_log(messages.user, ":TABLET.3に登録完了<br>");
			update_tablet3();
			if(messages.user == userid) userid = "Tablet3";
			
		//kinect接続部分
		} else if(messages.user == "KINECT"){
			write_log(messages.user, " 接続完了");
		}
		
	//-----typeがchat-----
	} else if(messages.type == "chat"){
		write_chat(messages.user, messages.text);


	//-----typeがdatabase-----
	}else if(messages.type == "raise"){
	//サーバ→Watch 一方通行 Watchのアプリ起動させる
	
	
	//-----typeがtraining_prepare-----
	} else if(messages.type == "training_prepare"){
	//サーバ→Watch 一方通行 稽古前準備 台本情報を送る
	
	//-----typeがtraining_send-----
	} else if(messages.type == "training_send"){
	//サーバ→Watch 一方通行 稽古モード
	
	
	//-----typeがtraining-----
	} else if(messages.type == "training"){
	//稽古モード Watchからの受信処理
	
		//稽古中フラグ・Watchへ通知中フラグ が立っていることを確認
		if(doing == 1 && watching != 0){
			console.log("受信音声: " + "端末 " + messages.user + " - メッセージ " + messages.text);
			if(messages.user == "Tablet1"){
				//判定処理
				judgeTraining(1);
				DisplayMessages(1, messages.text);
			} else if(messages.user == "Tablet2"){
				//判定処理
				judgeTraining(2);
				DisplayMessages(2, messages.text);
			} else if(messages.user == "Tablet3"){
				//判定処理
				judgeTraining(3);
				DisplayMessages(3, messages.text);
//				nankai += 1;
//				console.log("何回目の判定メソッド：" + nankai);
			
			}
			
			if(messages.text == "please_stop" && doing == 1){
				onStopButton();
			} else if(messages.text == "please_back_1" && doing == 0){
				onRestartBack1Button();
			} else if(messages.text == "please_back_first" && doing == 0){
				onStartButton();
			}
		}
	
	//-----typeがkinect_send-----
	} else if(messages.type == "kinect_send"){
	//サーバ→Kinect 一方通行 稽古モード
	
	
	//-----typeがkinect-----
	} else if(messages.type == "kinect"){
	//kinectからの受信処理
		
		//稽古中フラグ・Kinectへ通知中フラグ が立っていることを確認
		if(doing == 1 && kinecting != 0){
//			if(motion_user == messages.user){
				//true or false を判断するため、judgeTrainingにtextを飛ばす
				judgeTraining(messages.text);
//				console.log("いいタイミングでkinect認識！");
//			} else if(messages.user == "debug"){
//				judgeTraining(messages.text);
//			}
			
		//システムなしモード
		} else if(doing == 0 && kinecting != 0){
//			if(motion_user == messages.user){
				judgeMotionTraining(messages.text);
//			}
		}

		
		console.log("kinectからの受信: " + messages.text);
	
	
//*************************DBとのやりとりのための分岐,島田追加*********************************************	
//DB系の処理分岐
	}else if(messages.type == "db_result"){
	// console.log(event.data);
	var chat_fld = document.getElementById("chat_field");

//登場人物の名前を取得
//たぶんOK
		if(messages.function == "actorListBySceneID"){
			
			actorNameArray = new Array();
			for(var i=0; i < messages.text.length; i++){
				actorNameArray[i] = "";
			}
		//配列初期化
			for(var key in messages.text){
				// console.log(messages.text[key].actor_name);
				// chat_fld.innerHTML += "function: " + messages.function + " data: " + messages.text[key].actor_name + "<br>";
				actorNameArray[key] = messages.text[key].actor_name;
				// console.log("Name: " + actorNameArray[key]);
			}
			
			
			//変更するインタフェース部分の生成
			var pullDown = document.getElementById("change_database");
			var htmlCreate = "";
			
			//一度htmlのインタフェース部分を初期化(ボタンが押されるたびに増えるのを防ぐ)
			pullDown.innerHTML = htmlCreate;
			
			htmlCreate += '変更する位置：<input type="text" id="henkou_sitei"/><br>';
			htmlCreate += '登場人物：<form name="selectCharacter"><select name="_select">'; 
			for(var i=0; i < actorNameArray.length; i++){
				htmlCreate += '<option id = "addActor" value="' + actorNameArray.concat([i]) + '">' + actorNameArray[i] + '</option>';
			}
			htmlCreate += '</select></form><br>';
			
			htmlCreate += 'ト書き：<input type="text" id="togaki_naiyou"/><br>';
			htmlCreate += '<input type="button" id="daihon_button" onclick="onDatabaseChangeButton()" value="追加"/><br>';
			htmlCreate += '<input type="button" id="change_point" onClick="onChangePoint()" value="変更"/><br>';	

			pullDown.innerHTML += htmlCreate;
	
	//シーンIDと役者IDから役者名取得
	//修正必要
		}else if(messages.function == "readActorNameBySceneAndID"){
		
			
	//台本のタイトル取得		
		}else if(messages.function == "readScriptTitleByID"){
			for(var key in messages.text){
				// console.log(messages.text[key].title);
				chat_fld.innerHTML += "function: " + messages.function + " data: " + messages.text[key].title + "<br>";
			}
	
			document.getElementById("scripttitle").innerHTML = messages.text[0].title;
	
	
		// }else if(messages.function == "readScriptSceneTitleByID"){
		// 	for(var key in messages.text){
		// 		console.log(messages.text[key].scene);
		// 		chat_fld.innerHTML += "function: " + messages.function + " data: " + messages.text[key].scene + "<br>";
		// 	}
	//動きのタイミングの取得
		}else if(messages.function == "readActionTimingDataByScriptID"){
			var convertArray = convertStringDataInto1DFloatArray(messages.text[0].timing);
			actionTimingArray = new Array();
			// console.log("debug: " + messages.text[0].timing);

			//配列初期化
			for(var i=0; i < convertArray.length; i++){
				actionTimingArray[i] = "";
			}		
			for(var key in convertArray){
				// console.log(messages.text[key].timing);
				// chat_fld.innerHTML += "function: " + messages.function + " data: " + messages.text[key].timing + "<br>";
				actionTimingArray[key] = convertArray[key];
				// console.log("convertArray: " + convertArray[key].timing);
				// console.log("action timing: " + actionTimingArray[key]);
			}
			
	//動きをする人の順番取得	
		}else if(messages.function == "readWhoIsActionDataByScriptID"){
			var convertArray = convertStringDataInto1DIntArray(messages.text[0].actor);
			// console.log("debug: " + messages.text[0].actor);
			whoIsActionArray = new Array();
			//配列初期化
			for(var i=0; i < convertArray.length; i++){
				whoIsActionArray[i] = "";
			}	
			for(var key in convertArray){
				// console.log(messages.text[key].actor);
				// chat_fld.innerHTML += "function: " + messages.function + " data: " + messages.text[key].actor + "<br>";
				whoIsActionArray[key] = convertArray[key];
				// console.log("who action: " + convertArray[key]);
				// console.log(whoIsActionArray[key]);
			}
			
	//セリフをいう人の順番を取得（IDで）
		}else if(messages.function == "readWhoIsScriptDataByScene"){
				var convertArray = convertStringDataInto1DIntArray(messages.text[0].actor);
				whoIsScriptArray = new Array();
				//配列初期化
			for(var i=0; i < convertArray.length; i++){
				whoIsScriptArray[i] = "";
			}
			for(var key in convertArray){
				// console.log(messages.text[key].actor);
				// chat_fld.innerHTML += "function: " + messages.function + " data: " + messages.text[key].actor + "<br>";
				whoIsScriptArray[key] = convertArray[key];
				// console.log(whoIsScriptArray[key]);
			}
	//セリフの内容を取得
		}else if(messages.function == "readLinesScriptDataByScene"){
			// for(key in messages.text){
			// 	// console.log("messages.text[0].line= " + messages.text[0].line);
			// 	console.log(messages.text[key].line);
			// 	chat_fld.innerHTML += "function: " + messages.function + " data: " + messages.text[key].line + "<br>";
			// 	console.log(convertStringDataInto1DStringArray(messages.text[key].line));
			// }　
				// chat_fld.innerHTML += "function: " + messages.function + " data: " + messages.text[0].line + "<br>";
			var convertArray = convertStringDataInto1DStringArray(messages.text[0].line);
			linesArray = new Array();
			//配列初期化
			for(var i=0; i < convertArray.length; i++){
				linesArray[i] = "";
				}
			for(var key in convertArray){
				// console.log(convertArray[key]);
				// chat_fld.innerHTML += convertArray[key] + "<br>";
				linesArray[key] = convertArray[key];
				// console.log("line: " + linesArray[key]);
			}
	//セリフの発話のタイミングの取得
		}else if(messages.function == "readTimingScriptDataByScene"){
			var convertArray = convertStringDataInto1DFloatArray(messages.text[0].timing);
			scriptTimingArray = new Array();
			//配列初期化
			for(var i=0; i < convertArray.length; i++){
				scriptTimingArray[i] = "";
			}
			for(var key in convertArray){
				// console.log(convertArray[key]);
				// chat_fld.innerHTML += convertArray[key] + "<br>";
				scriptTimingArray[key] = convertArray[key];
				// console.log("script timing: " + scriptTimingArray[key]);
			}
			
		}else if(messages.function == "readActionImageDataByScriptID"){
			var convertArray = convertStringDataInto1DStringArray(messages.text[0].image);
			actionImageArray = new Array();
			//配列初期化
			for(var i=0; i < convertArray.length; i++){
				actionImageArray[i] = "";
			}
			for(var key in convertArray){
				// console.log(convertArray[key]);
				// chat_fld.innerHTML += convertArray[key] + "<br>";
				actionImageArray[key] = convertArray[key];
				// console.log("action image: " + actionImageArray[key]);
			}
			
		//台本の選択ボタンを押したときに最後に呼び出されるからここで最後に牧さんの配列の形に変換
		createScriptTable();

		}
		// var data = JSON.parse(event); 
		// console.log(JSON.getString("text"));
		// DBdebug_chat(messages.function, messages.text);

//*******************************************************************************
		
	//-----一応その他のtypeだった場合-----
	}else if(messages.type == "db_access"){
		console.log("DB access!");
	}else {
		// console.log(event.data);
		// console.log(messages.data);
		console.log("その他のtypeを受信: " + messages);
	}


};

	
//********************共通機能イベント********************

//サーバに送信メソッド
function send(Userid, Type, Text){
	ws.send(JSON.stringify({
		user: Userid,
		type: Type,
		text: Text
	}));
}

function db_send(function_name){
	ws.send(JSON.stringify({
		func_name: function_name,
		type: 'db_access',
		script_id: script_ID
	}));
}

//Androidに稽古情報を送信メソッド
function trainingsend(Count, Userid, Type, Actor, Script, Motion){
	ws.send(JSON.stringify({
		count: Count,
		user: Userid,
		type: Type,
		actor: Actor,
		script: Script,
		motion: Motion
	}));
}

//Kinectに動き情報を送信メソッド
function motionsend(Userid, Type, Motion){
	ws.send(JSON.stringify({
		user: Userid,
		type: Type,
		motion: Motion
	}));
}

//********************接続ボックス内のイベント********************

//接続状態の更新
function update_connect_status(){
	var my_con_sts = document.getElementById("my_connect_status");
	my_con_sts.innerHTML = "OPEN";
}

//PCステータスの更新
function update_pc_status(Userid){
	var my_dvc_sts = document.getElementById("my_device_status");
	my_dvc_sts.innerHTML = Userid;
}

//デバイス通信状況の更新-pc1-
function update_pc1(){
	document.getElementById("con_pc1").innerHTML = "PC.1";
}

//デバイス通信状況の更新-pc2-
function update_pc2(){
	document.getElementById("con_pc2").innerHTML = "PC.2";
}

//デバイス通信状況の更新-pc3-
function update_pc3(){
	document.getElementById("con_pc3").innerHTML = "PC.3";
}

//デバイス通信状況の更新-tablet1-
function update_tablet1(){
	document.getElementById("con_tablet1").innerHTML = "TABLET.1";
}

//デバイス通信状況の更新-tablet2-
function update_tablet2(){
	document.getElementById("con_tablet2").innerHTML = "TABLET.2";
}

//デバイス通信状況の更新-tablet3-
function update_tablet3(){
	document.getElementById("con_tablet3").innerHTML = "TABLET.3";
}


//********************チャット、ログ、pingイベント********************

//チャットボックスに書き込み
function write_chat(Userid, Text){
	var chat_fld = document.getElementById("chat_field");
	chat_fld.innerHTML += "ユーザ " + Userid + ": " + Text + "<br>";
}


//ログボックスに書き込み
function write_log(Userid, Text){
	var log_fld = document.getElementById("log_field");
	log_fld.innerHTML += "ユーザ " + Userid + Text;
}

//pingボックスに書き込み
function write_ping(Userid, Text){
	var ping_fld = document.getElementById("ping_field");
	ping_fld.innerHTML += "ユーザ" + Userid + ": " + Text + "<br>";
}

//********************ボタンイベント********************

//-----デバイス登録部分-----

//デバイス登録ボタン
function onDeviceRadioButton(){
	//定義
	var pc1 = document.getElementById("pc1").checked;
	var pc2 = document.getElementById("pc2").checked;
	var pc3 = document.getElementById("pc3").checked;
	var tablet1 = document.getElementById("tablet1").checked;
	var tablet2 = document.getElementById("tablet2").checked;
	var tablet3 = document.getElementById("tablet3").checked;	
	
	//値の代入
	if(pc1==true){
		num_dvc = "PC.1";
	} else if(pc2==true){
		num_dvc = "PC.2";
	} else if(pc3==true){
		num_dvc = "PC.3";
	} else if(tablet1==true){
		num_dvc = "TABLET.1";
	} else if(tablet2==true){
		num_dvc = "TABLET.2";
	} else if(tablet3==true){
		num_dvc = "TABLET.3";
	}
	
	//デバイスステータスの更新
	update_pc_status(num_dvc);
	//他のデバイスに更新情報を送信
	send(userid, 'connect', num_dvc);
}

//デバイス変更ボタン
function onDeviceChangeRadioButton(){
	//未実装
}

//-----kinect部分-----
function onKinectCheckButton(){
	//前の順番の色付き背景を白に戻す
	RepairColor(scriptProgress);
	MessageChangeWhite(scriptProgress);
	//入力された値のcountを入力
	var kinect_count_ipt = document.getElementById("kinect_count_input");
	//kinectチェックメソッドへ
	KinectCheck(kinect_count_ipt.value);
}

//daihonデバッグボタン部分
function Scenario1Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("1"); }
function Scenario3Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("3"); }
function Scenario4Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("4"); }
function Scenario5Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("5"); }
function Scenario6Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("6"); }
function Scenario7Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("7"); }
function Scenario8Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("8"); }
function Scenario9Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("9"); }
function Scenario13Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("13"); }
function Scenario15Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("15"); }
function Scenario18Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("18"); }
function Scenario19Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("19"); }
function Scenario22Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("22"); }
function Scenario23Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("23"); }
function Scenario24Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("24"); }
function Scenario25Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("25"); }
function Scenario26Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("26"); }
function Scenario27Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("27"); }
function Scenario28Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("28"); }
function Scenario29Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("29"); }
function Scenario30Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("30"); }
function Scenario31Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("31"); }
function Scenario32Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("32"); }
function Scenario33Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("33"); }
function Scenario34Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("34"); }
function Scenario37Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("37"); }
function Scenario38Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("38"); }
function Scenario39Button(){ RepairColor(); MessageChangeWhite(); KinectCheck("39"); }

//watchデバッグボタン部分
function onDebugWatch1Button(){
	send("Tablet1", "training", "PCからデバッグ通知");
}
function onDebugWatch2Button(){
	send("Tablet2", "training", "PCからデバッグ通知");
}
function onDebugWatch3Button(){
	send("Tablet3", "training", "PCからデバッグ通知");
}


//-----台本、稽古部分-----

//+++++台本選択部分+++++

//台本1ボタン
function onScriptButton1(){
	getCSVFile("daihon1.csv");
	document.getElementById("number_script").innerHTML = "1";
	document.getElementById("scripttitle").innerHTML = "無差別";
}

//台本2ボタン
function onScriptButton2(){
	getCSVFile("daihon2.csv");
	document.getElementById("number_script").innerHTML = "2";
	document.getElementById("scripttitle").innerHTML = "喫茶店";
}

//台本3ボタン
function onScriptButton3(){
	getCSVFile("daihon3.csv");
	document.getElementById("number_script").innerHTML = "3";
	document.getElementById("scripttitle").innerHTML = "家族会議";
}

//台本4ボタン
function onScriptButton4(){
	getCSVFile("daihon4.csv");
	document.getElementById("number_script").innerHTML = "4";
	document.getElementById("scripttitle").innerHTML = "ある目線";
}

//台本5ボタン
function onScriptButton5(){
	getCSVFile("daihon5.csv");
}

//台本6ボタン
function onScriptButton6(){
	getCSVFile("daihon6.csv");
}

//台本7ボタン
function onScriptButton7(){
	getCSVFile("daihon7.csv");
}

//台本8ボタン
function onScriptButton8(){
	getCSVFile("daihon8.csv");
}

//台本決定ボタン
function onScriptDecideButton(){
//	console.log("台本決定したで");
	//Tablet1、2、3それぞれに初期状態のデータを送る
	trainingsend('0', 'Tablet1','training_prepare',scriptArray[0][1],scriptArray[0][2],scriptArray[0][3]);
	trainingsend('0', 'Tablet2','training_prepare',scriptArray[1][1],scriptArray[1][2],scriptArray[1][3]);
	trainingsend('0', 'Tablet3','training_prepare',scriptArray[2][1],scriptArray[2][2],scriptArray[2][3]);
	
}

//+++++稽古操作部分+++++

//Watch1起動ボタン1
function onWatchRaiseButton1(){
	send('Tablet1', 'raise', 'watch1_raise');
}

//Watch1起動ボタン2
function onWatchRaiseButton2(){
	send('Tablet2', 'raise', 'watch2_raise');
}

//Watch1起動ボタン1
function onWatchRaiseButton3(){
	send('Tablet3', 'raise', 'watch3_raise');
}


//稽古スタートボタン
function onStartButton(){
	
	//島田追加，タイマーをスタート
	timeCounterControl("start");
	
	//稽古中フラグを立てる
	doing = 1;
	document.getElementById("training_now").innerHTML = "稽古中";
	//前の順番の色付き背景を白に戻す
	RepairColor();
	//一番目の色を付加
	count = 1;
	//対象の順番の背景に色をつける
	AddColor();
	//対象ユーザ部分の背景に色をつける
	MessageChangeRed();
	//WatchとKinectに情報を送る
	// SendInfo();
	
	SendInfo(scriptProgress);
	scriptProgress++;
	//7秒後に動きが出来てるかどうかチェックし、だめなら音を出す
	// timer = setTimeout("SoundPlay()", 7000);
	//順番表示
	DisplayCount();
	document.getElementById("display_watching").innerHTML = watching;
	document.getElementById("display_kinecting").innerHTML = kinecting;
}

//一時停止ボタン
function onStopButton(){
	
	//島田追加，タイマーをストップ
	timeCounterControl("stop");

	//timerを一度停止する
	clearTimeout(timer);
	//稽古中フラグを閉じる
	doing = 0;
	document.getElementById("training_now").innerHTML = "停止中";
	//通知フラグも閉じる
	watching = 0;
	kinecting = 0;
	//kinectチェック前という文字を表示する、文字黒くする
	// document.getElementById("check_kinect_text").innerHTML = "Kinectチェック前";
	// document.getElementById("check_kinect_text").style.backgroundColor="white";

	document.getElementById("display_watching").innerHTML = watching;
	document.getElementById("display_kinecting").innerHTML = kinecting;
}

//再スタートボタン
function onRestartButton(){
	//島田追加，タイマーをリスタート
	timeCounterControl("restart");

	//稽古中フラグを立てる
	doing = 1;
	document.getElementById("training_now").innerHTML = "稽古中";
	//countは一つ下げる(NextNotification()でcount+1するので)
	count -= 1;
	scriptProgress -=1;
	//通知フラグも閉じる
	watching = 0;
	kinecting = 0;
	//稽古を再開する
	NextNotification();
}

//-1から再スタートボタン
function onRestartBack1Button(){
	//timerを一度停止する
	clearTimeout(timer);
	
	//前の順番の色付き背景を白に戻す
	RepairColor();

	//稽古中フラグを立てる
	doing = 1;
	document.getElementById("training_now").innerHTML = "稽古中";
	//countは二つ下げる(NextNotification()でcount+1するので)
	count -= 2;
	//通知フラグも閉じる
	watching = 0;
	kinecting = 0;
	//稽古を再開する
	NextNotification();
}

//-2から再スタートボタン
function onRestartBack2Button(){
	//timerを一度停止する
	clearTimeout(timer);
	
	//前の順番の色付き背景を白に戻す
	RepairColor();

	//稽古中フラグを立てる
	doing = 1;
	document.getElementById("training_now").innerHTML = "稽古中";
	//countは3つ下げる(NextNotification()でcount+1するので)
	count -= 3;
	//稽古を再開する
	NextNotification();
}

//-----ボックス部分-----

//チャット入力送信ボタン
function onChatSendButton() {
	var chat_ipt = document.getElementById("chat_input");
	send(userid, 'chat', chat_ipt.value);
	motionsend(1,'kinect_send', 'text');	//役者名とモーションを通知

}



//島田追加  DBとの接続テスト用--------------------------------------------------------
function onDBChatSendButton(){
	var chat_ipt = document.getElementById("chat_input");

	if(chat_ipt.value != ""){
	console.log(chat_ipt.value);
	db_send(chat_ipt.value);//chatにindex.jsのメソッド名を入力する
	}
}

function dbFunctionSendButtonWithScriptID(function_name, script_id){
	ws.send(JSON.stringify({
		func_name: function_name,
		type: 'db_access',
		script_id: script_id
	}));
}




function dbFunctionSendButtonWithScriptIDAndActorID(function_name, script_id, actor_id){
	ws.send(JSON.stringify({
		func_name: function_name,
		type: 'db_access',
		script_id: script_id,
		acrtor_id: actor_id
	}));
}

function dbDataConvert(){

}

//---------------------------------------------------------------


//********************台本、稽古 機能イベント********************

//+++++-----台本の読み込み-----+++++

//CSVファイルの読み込み
function getCSVFile(daihon) {
    var xhr = new createXMLHttpRequest();
    xhr.onload = function() {
		//CSVファイルが存在すれば、配列に格納
		createScriptTable(xhr.responseText);
    };
	 //読み込む台本CSVファイルの定義
    xhr.open("get", daihon, true);
    xhr.send(null)
}



//島田追加---------------------------------------------------------------------------------++++++++++++++++++++++++++++++++++++++++++++
//台本変換系-------------------------------------------------------------------------------++++++++++++++++++++++++++++++++++++++++++++
//-----------------------------------------------------------------------------------------++++++++++++++++++++++++++++++++++++++++++++
//-----------------------------------------------------------------------------------------++++++++++++++++++++++++++++++++++++++++++++
//-----------------------------------------------------------------------------------------++++++++++++++++++++++++++++++++++++++++++++
//-----------------------------------------------------------------------------------------++++++++++++++++++++++++++++++++++++++++++++

//デバッグ用
function DBdebug_chat(func_name, db_data){
	var chat_fld = document.getElementById("chat_field");
	// chat_fld.innerHTML += "Function: " + func_name + ", Result: " + db_data + "<br>";
	for(var key in db_data){
	chat_fld.innerHTML += "function: " + func_name + db_data[key].actor_name + "<br>";
	}; 
}

function onSetStartButton(){
	var start_position = document.getElementById("set_position").value;	//テキストフィールドから開始位置取得
	scriptProgress = Number(start_position)-1;	//台本の進行を管理する変数に位置を格納
	timeCounterControl("set_start");

	//以下の部分はonStartButton()と同じ
	doing = 1;
	document.getElementById("training_now").innerHTML = "稽古中";
	//前の順番の色付き背景を白に戻す
	RepairColor();
	//一番目の色を付加
	count = 1;
	//対象の順番の背景に色をつける
	AddColor();
	//対象ユーザ部分の背景に色をつける
	MessageChangeRed();
	//WatchとKinectに情報を送る
	// SendInfo();
	
	SendInfo(scriptProgress);
	scriptProgress++;
	//7秒後に動きが出来てるかどうかチェックし、だめなら音を出す
	timer = setTimeout("SoundPlay()", 7000);
	//順番表示
	DisplayCount();
	document.getElementById("display_watching").innerHTML = watching;
	document.getElementById("display_kinecting").innerHTML = kinecting;
}

//記録しなおす箇所を記録する配列に格納する
function onChangePoint(){
	var changePoint = document.getElementById("henkou_sitei").value;	//変更箇所の順番を取得
	var changePoint = Number(changePoint) - 1;	//表示されている順番をindexの番号に直すため
	var arrayLength = changePointArray.length;
	
	//入力欄を空にする
	document.getElementById("henkou_sitei").value = "";
	
	//入力された修正位置を配列に格納
	changePointArray[arrayLength] = Number(changePoint);
	
	//配列に格納された順番情報を昇順にソート
	changePointArray.sort(function(a, b){
		if(Number(a)<Number(b)) return -1;
		if(Number(a)>Number(b)) return 1;
		return 0;
	});
	
	console.log("change point: " + changePointArray);
	// send(scriptArray[changePoint][4], "change_point", changePoint);	//動きをする役者id, 処理分岐のタイプ, 変更する台本の順番
	
}

function onDatabaseChangeButton(){

	//入力内容の取得	
	var changePoint = document.getElementById("henkou_sitei").value;
	var newElement = document.getElementById("togaki_naiyou").value;
	var form = document.forms.selectCharacter;
	// var selectedActor = document.getElementById("selectActor");
	var addActor = actorNameArray[form._select.selectedIndex];
	// var addActor = actorNameArray[Number(document.getElementById("addActor").selectedIndex)];
	// var addActor = actorNameArray[Number(form._select.value)];	//プルダウンメニューで選択されているものを取得
	
	//追加位置がすでに変更を指定したト書きより前だったら変更箇所を一つずらす
	for(var i=0; i < changePointArray.length; i++){
		if(changePointArray[i] > changePoint){
			changePointArray[i]++;
		}
	}
	
	onChangePoint();	//新しく追加された要素も変更箇所の配列に入れる
	
	//ボタンが押され処理がされたら入力欄を空にする
	document.getElementById("henkou_sitei").value = "";
	document.getElementById("togaki_naiyou").value = "";
	// document.getElementById("addActor").innerHTML = "";	
	
	//changePoint -= 1;
	console.log(addActor);
	
	for(var i = scriptArray.length-1; i >= Number(changePoint-1); i--){	//挿入位置を開ける
		scriptArray[i][0] = Number(scriptArray[i][0]) + Number(3.0);	//挿入する位置以降の要素の時間情報をずらす
		// scriptArray[i+1] = scriptArray[i];	//配列の要素を一つずつずらす
		
		//それぞれの要素別々に入れないときちんと動作しない
		scriptArray[i+1] = new Array(5);	
		scriptArray[i+1][0] = scriptArray[i][0];
		scriptArray[i+1][1] = scriptArray[i][1];
		scriptArray[i+1][2] = scriptArray[i][2];
		scriptArray[i+1][3] = scriptArray[i][3];
		scriptArray[i+1][4] = scriptArray[i][4];

	}
	
	// console.log(actorNameArray.indexOf(addActor));

	if( Number(actorNameArray.indexOf(addActor)) >= 0 ){	//入力された名前の登場人物が台本にいれば行う.打ち間違い防止
		scriptArray[changePoint-1][0] = Number(scriptArray[(changePoint-2)][0]) + Number(3.0);	//前の要素の時間情報の3秒後
		scriptArray[changePoint-1][1] = addActor;	//役名
		scriptArray[changePoint-1][2] = 0;	//セリフの内容，今回は扱わない
		scriptArray[changePoint-1][3] = newElement;	//新しいト書き
		scriptArray[changePoint-1][4] = Number(actorNameArray.indexOf(addActor));
		// for(var i = 0; i < actorNameArray.length; i++){
		// 	if(actorNameArray[i] == addActor){	//入力された役名の役者idを入れる
		// 		scriptArray[changePoint][4] = i;
		// 	}
		// }

	}
	else {console.log("No Such Character");}	//入力された名前の登場人物がいなかったら

		// scriptArray[changePoint-1][0] = Number(scriptArray[(changePoint-2)][0]) + Number(3.0);	//前の要素の時間情報の3秒後
		// scriptArray[changePoint-1][1] = addActor;	//役名
		// scriptArray[changePoint-1][2] = 0;	//セリフの内容，今回は扱わない
		// scriptArray[changePoint-1][3] = newElement;	//新しいト書き
		// scriptArray[changePoint-1][4] = Number(actorNameArray.indexOf(addActor));

	
	// console.log("chaned scriptArray: " + scriptArray);
	makeArray(scriptArray.length, scriptArray);
	//+++++++++++++ここまでが台本の配列の更新処理+++++++++++++++++++++++++++
	
	//++++++++++++++ここからデータベース更新処理++++++++++++++++++++++++++++
	
	var splitActionArray = new Array;
	var splitScriptArray = new Array;
	var actionIndex = 0;
	var scriptIndex = 0;
	
	//台本の配列をaction関係とscript関係に分割
	for(var i = 0; i < scriptArray.length; i++){
		if(scriptArray[i][3] != 0 && scriptArray[i][1] != ""){	//ト書きがある場合
			splitActionArray[actionIndex] = new Array(3);	//actionについての２次元配列，時間，ト書き，役者
			splitActionArray[actionIndex][0] = scriptArray[i][0];	//時間情報
			splitActionArray[actionIndex][1] = scriptArray[i][4];	//役者id
			splitActionArray[actionIndex][2] = scriptArray[i][3];	//ト書き
			actionIndex++;
		}
		if(scriptArray[i][1] != ""){
			splitScriptArray[scriptIndex] = new Array(3);
			splitScriptArray[scriptIndex][0] = scriptArray[i][0];	//時間情報
			splitScriptArray[scriptIndex][1] = scriptArray[i][4];	//役者id
			splitScriptArray[scriptIndex][2] = scriptArray[i][2];	//セリフ
			scriptIndex++;
		}
	}
	
	//配列の中身確認用
	// for(var i = 0; i < splitActionArray.length; i++){
	// 	console.log("splitActionArray: " + splitActionArray[i]);
	// }

	// for(var i = 0; i < splitScriptArray.length; i++){
	// 	console.log("splitScriptArray: " + splitScriptArray[i]);
	// }
	
	//クエリを生成していく
	var actionQuery = new Array(3);
	var scriptQuery = new Array(3);
	
	//配列の初期化
	for(var i = 0; i < 3; i++){
		actionQuery[i] = "";
		scriptQuery[i] = "";
	}
	
	actionQuery[0] += "update action set timing = '";
	actionQuery[1] += "update action set actor = '";
	actionQuery[2] += "update action set image = '";

	
	scriptQuery[0] += "update script set timing = '";
	scriptQuery[1] += "update script set actor = '";
	scriptQuery[2] += "update script set line = '";

	
	var actionConvertArray = convertStringArrayIntoQuery(splitActionArray);	//クエリの配列を取得
	var scriptConvertArray = convertStringArrayIntoQuery(splitScriptArray);	//クエリの配列を取得
	
	// console.log(actionConvertArray);
	// console.log(scriptConvertArray);
	
	actionQuery[0] += actionConvertArray[0] + "' ";
	actionQuery[1] += actionConvertArray[1] + "' ";
	actionQuery[2] += actionConvertArray[2] + "' ";

	scriptQuery[0] += scriptConvertArray[0] + "' ";
	scriptQuery[1] += scriptConvertArray[1] + "' ";
	scriptQuery[2] += scriptConvertArray[2] + "' ";
	
	
	//保存先のscript_idの設定
	// actionQuery[0] += "where script_id = " + (script_ID+10) + ";";
	// actionQuery[1] += "where script_id = " + (script_ID+10) + ";";
	// actionQuery[2] += "where script_id = " + (script_ID+10) + ";";
	
	// scriptQuery[0] += "where script_id = " + (script_ID+10) + ";";
	// scriptQuery[1] += "where script_id = " + (script_ID+10) + ";";
	// scriptQuery[2] += "where script_id = " + (script_ID+10) + ";";
	
	// actionQuery[0] += "where script_id = " + (script_ID+1) + ";";
	// actionQuery[1] += "where script_id = " + (script_ID+1) + ";";
	// actionQuery[2] += "where script_id = " + (script_ID+1) + ";";
	
	// scriptQuery[0] += "where script_id = " + (script_ID+1) + ";";
	// scriptQuery[1] += "where script_id = " + (script_ID+1) + ";";
	// scriptQuery[2] += "where script_id = " + (script_ID+1) + ";";

	actionQuery[0] += "where script_id = " + script_ID + ";";
	actionQuery[1] += "where script_id = " + script_ID + ";";
	actionQuery[2] += "where script_id = " + script_ID + ";";
	
	scriptQuery[0] += "where script_id = " + script_ID + ";";
	scriptQuery[1] += "where script_id = " + script_ID + ";";
	scriptQuery[2] += "where script_id = " + script_ID + ";";


	// console.log(actionQuery[0]);
	// console.log(actionQuery[1]);
	// console.log(actionQuery[2]);
	// console.log(scriptQuery[0]);
	// console.log(scriptQuery[1]);
	// console.log(scriptQuery[2]);
	
	// var combineQuery = new Array(6);
	var combineQuery = actionQuery.concat(scriptQuery);
	console.log(combineQuery);
	console.log(scriptArray);
	send(0, "db_update", combineQuery);
}

function convertStringArrayIntoQuery(input){
	var convertQuery = new Array(3);	//クエリを格納する配列
	
	//配列の初期化
	for(var i = 0; i < 3; i++){
		convertQuery[i] = "";
	}
	
	for(var i=0; i < input.length-1; i++){	//最後の要素の一つ手前まで
		convertQuery[0] += input[i][0] + ",";	//時間情報
		convertQuery[1] += input[i][1] + ",";	//ト書きもしくはセリフの情報
		convertQuery[2] += input[i][2] + "@@";	//役者id
	}	
	
	convertQuery[0] += input[input.length-1][0];
	convertQuery[1] += input[input.length-1][1];
	convertQuery[2] += input[input.length-1][2];
	return convertQuery;
}

function convertStringDataInto2DArray(input){
	var splitArray = new Array();
	return splitArray = input.split("@");
}


//javascriptは型を宣言しないからこの２つはどっちかでもいいかも,それか明示的に使い分ける++++++++++++++++++++++
function convertStringDataInto1DFloatArray(input){
	var splitArray = new Array();
	return splitArray = input.split(",");
}

function convertStringDataInto1DIntArray(input){
	var splitArray = new Array();
	return splitArray = input.split(",");
}
//++++++++++++++++++++++++++++++++++++++++++++++++

function convertStringDataInto1DStringArray(input){
	var splitArray = new Array();
	return splitArray = input.split("@@");
}



function onScriptButton(script_id){

	script_ID = script_id;

	ws.send(JSON.stringify({
		func_name: 'readScriptTitleByID',
		type: 'db_access',
		script_id: script_id
	}));

	ws.send(JSON.stringify({
		func_name: 'readLinesScriptDataByScene',
		type: 'db_access',
		script_id: script_id
	}));
	
	ws.send(JSON.stringify({
		func_name: 'actorListBySceneID',
		type: 'db_access',
		script_id: script_id
	}));
	
	ws.send(JSON.stringify({
		func_name: 'readActionTimingDataByScriptID',
		type: 'db_access',
		script_id: script_id
	}));
	
	ws.send(JSON.stringify({
		func_name: 'readWhoIsActionDataByScriptID',
		type: 'db_access',
		script_id: script_id
	}));
	
	ws.send(JSON.stringify({
		func_name: 'readWhoIsScriptDataByScene',
		type: 'db_access',
		script_id: script_id
	}));
	
	ws.send(JSON.stringify({
		func_name: 'readTimingScriptDataByScene',
		type: 'db_access',
		script_id: script_id
	}));
	
	ws.send(JSON.stringify({
		func_name: 'readActionImageDataByScriptID',
		type: 'db_access',
		script_id: script_id
	}));

	// createScriptTable();
	
}


var timeCount = 0;
// var actuon = document.getElementById('chat_button');
var repeatFlag = 0;
var repeat; 

//経過時間を計るタイマーの制御
function timeCounterControl(control){
	
	//repeatFlag==1のときタイマー起動
	//稽古スタートを押すとはじめから
	//再スタートは止めたところのつづきから
	if(control == "start"){
		timeKeeper = 0;
		timeCount = 0;
		scriptProgress = 0;
		repeatFlag = 1;
	}else if(control == "stop"){
		timeKeeper += repeat;
		repeatFlag = 0;
	}else if(control == "restart"){
		repeatFlag =1;
	}else if(control == "set_start"){
		timeKeeper = Number(scriptArray[scriptProgress][0]) * 10.0 - 2.0;	//引いているのはボタンを押した瞬間に通知がいかないようにするため
		timeCount = Number(scriptArray[scriptProgress][0]) * 10.0 - 2.0;	//引いているのはボタンを押してほんのすこしだけ余裕をもたせるため
		console.log(timeCount);
		repeatFlag=1;
	}
}
 

//繰り返し処理
//各デバイスへの通知を行う処理
	repeat = setInterval(function() {
 		if(repeatFlag == 1){
   		timeCount += 1;
   		var secConvert = timeCount / 10.0;
   		
   		//時間情報を調整して通知
   		// var timeAdjust = Number(scriptArray[scriptProgress][0]) + Number(scriptProgress) * 2.0;
		//時間情報そのまま通知
		var timeAdjust = scriptArray[scriptProgress][0];
   		
   			// if(secConvert > scriptArray[scriptProgress][0]){ //セリフの時間情報が来たら通知
   			if(Number(timeAdjust) < Number(secConvert)){
   				// console.log("scriptArray[scriptProgress][0]: " + scriptArray[scriptProgress][0]);
   				// console.log("scriptProgress: " + scriptProgress);
   				// console.log("secConvert: " + secConvert);
   				// console.log("timeAdjust: " + timeAdjust);
   				// console.log((count + timeKeeper)/10);
				// console.log("Time: " + scriptArray[scriptProgress][0] + " Name: " + scriptArray[scriptProgress][1] + " Script: " + scriptArray[scriptProgress][2] + " Movement: " + scriptArray[scriptProgress][3] + " Move Actor: " + scriptArray[scriptProgress][4]);
				NextNotification();
				SendInfo(scriptProgress);

   				// scriptProgress++;
   			}
 		}
 		// else if(repeatFlag == 0){
 			// console.log("time stop");
 		// }
	}, 100);//setIntervalの第２引数でmsec単位で何秒ごとに処理を行うかを設定



//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------






//CSVの読み込みに必要なxhrの作成
function createXMLHttpRequest() {
    var XMLhttpObject = null;
    XMLhttpObject = new XMLHttpRequest();
    return XMLhttpObject;
}

//scriptArrayに台本を読み込ませる
// function createScriptTable(csvData){
function createScriptTable(){
	// var CR = String.fromCharCode(13);	//改行コード
 //   var c_tempArray = csvData.split(CR);	//縦配列、改行コードで分割
 //   var c_csvArray = new Array();			//横配列
	scriptArray = new Array();
	
	var actionLength = actionTimingArray.length;
	var scriptLength = scriptTimingArray.length;
	
	// console.log("action length:" + actionLength);
	// console.log("script length:" + scriptLength);
	
	var i=0; //actionTimingArrayのindex
	var j=0; //scriptTimingArrayのindex
	var k=0; //順番全体の長さ

	var maxLength = actionLength + scriptLength;
	
	// scriptArrayの初期化
    for(var x = 0; x < maxLength; x++){ 
    	 scriptArray[x] = new Array(5);　　//この書き方するとページが動作を停止する
    	 //console.log("create inner array");
    	 //scriptArray[x] = [,,,,];
		for(var y = 0; y<5; y++){
		// console.log("scriptArray init");
			scriptArray[x][y] = "";
		}
	}
	
	// console.log("scriptArray init end!");
	// var flag = 0;
	while(i < actionLength || j < scriptLength){
	// while(k < (maxLength)){
		if(i < actionLength && j < scriptLength){
			if(Number(scriptTimingArray[j]) < Number(actionTimingArray[i])){ //TEXT型で型でとってきてるから型変換して比較
				
			// console.log("script!");
			// console.log(actionTimingArray[i]);
			// console.log(scriptTimingArray[j]);

				scriptArray[k][0] = scriptTimingArray[j];
				scriptArray[k][1] = actorNameArray[whoIsScriptArray[j]];
				scriptArray[k][2] = linesArray[j];
				scriptArray[k][3] = 0;
				scriptArray[k][4] = whoIsScriptArray[j];
				j++;
				k++;
			}else if(Number(actionTimingArray[i]) < Number(scriptTimingArray[j])){

			// console.log("action!");
			// console.log(actionTimingArray[i]);
			// console.log(scriptTimingArray[j]);
			
				scriptArray[k][0] = actionTimingArray[i];
				scriptArray[k][1] = actorNameArray[whoIsActionArray[i]];
				scriptArray[k][2] = 0;
				if(actionImageArray[i] == ""){
					scriptArray[k][3] = 0;
				}else{
					scriptArray[k][3] = actionImageArray[i];
				}
				scriptArray[k][4] = whoIsActionArray[i];
				i++;
				k++;
			}else if(Number(actionTimingArray[i]) == Number(scriptTimingArray[j])){
				scriptArray[k][0] = scriptTimingArray[j];
				scriptArray[k][1] = actorNameArray[whoIsScriptArray[j]];
				scriptArray[k][2] = linesArray[j];
				scriptArray[k][3] = actionImageArray[i];
				scriptArray[k][4] = whoIsScriptArray[j];				
				i++;
				j++;
				k++;
			}
		}else if(i >= actionLength && j < scriptLength){
				scriptArray[k][0] = scriptTimingArray[j];
				scriptArray[k][1] = actorNameArray[whoIsScriptArray[j]];
				scriptArray[k][2] = linesArray[j];
				scriptArray[k][3] = 0;
				scriptArray[k][4] = whoIsScriptArray[j];
				j++;
				k++;
		}else if(i < actionLength && j >= scriptLength){
				scriptArray[k][0] = actionTimingArray[i];
				scriptArray[k][1] = actorNameArray[whoIsActionArray[i]];
				scriptArray[k][2] = 0;
				if(actionImageArray[i] == ""){
					scriptArray[k][3] = 0;
				}else{
					scriptArray[k][3] = actionImageArray[i];
				}
				scriptArray[k][4] = whoIsActionArray[i];
				i++;
				k++;			
		}
		
		// 	else if(actionTimingArray[i] == scriptTimingArray[j]){
		// //タイミングが同じ時だったらの分岐
		// //セリフと行動の役者が同じかどうかで分岐する必要あり
		// 	i++;
		// 	j++;
		// 	k++;
	// }
		
	}
	
	//島田修正，台本の配列に取得した情報を格納する格納する格納する
	
	

	//scriptArrayに台本csvファイルを格納
 //   for(var i = 0; i < c_tempArray.length;i++){
 //   	//c_tempArrayは台本のCSVファイルを行単位で格納した配列
 //   	//c_csvArrayは行単位のものをカンマでさらに分けて要素ごとに分割
	// 	c_csvArray = c_tempArray[i].split(",");		//セミコロンで分割
	// 	scriptArray[i] = new Array();
	// 	for(var j = 0; j<c_csvArray.length; j++){
			
	// 		//c_csvArrayのiはCSVファイルの行番号に対応，jはCSVファイルの各列の要素に対応
	// 		scriptArray[i][j] = c_csvArray[j];
	// 	}
	// }
	
//	console.log(scriptArray);

// console.log(scriptArray);
	//台本選択部分に反映
	makeScriptTable(actorNameArray.length, scriptArray);
	//台本進行状況に反映
	makeArray(k+1, scriptArray);
}


//台本選択-台本概要テーブルの表示
function makeScriptTable(length, scriptarray){
	//初期化
	document.getElementById("actor1_name").innerHTML = "none";
	document.getElementById("actor1_first").innerHTML = "none";
	document.getElementById("actor2_name").innerHTML = "none";
	document.getElementById("actor2_first").innerHTML = "none";
	document.getElementById("actor3_name").innerHTML = "none";
	document.getElementById("actor3_first").innerHTML = "none";
	//値の代入
	// for(var i = 0; i < length; i++){
	// 	if(scriptarray[i][0] == 0){
	// 		if(scriptarray[i][4] == 1){
	// 			document.getElementById("actor1_name").innerHTML = actorNameArray[0];
	// 			document.getElementById("actor1_first").innerHTML = scriptarray[i][3];
	// 		} else if(scriptarray[i][4] == 2){
	// 			document.getElementById("actor2_name").innerHTML = actorNameArray[1];
	// 			document.getElementById("actor2_first").innerHTML = scriptarray[i][3];
	// 		} else if(scriptarray[i][4] == 3){
	// 			document.getElementById("actor3_name").innerHTML = actorNameArray[3];
	// 			document.getElementById("actor3_first").innerHTML = scriptarray[i][3];
	// 		}
	// 	}
	// }
	
	document.getElementById("actor1_name").innerHTML = actorNameArray[0];
	document.getElementById("actor2_name").innerHTML = actorNameArray[1];
	document.getElementById("actor3_name").innerHTML = actorNameArray[2];

}

//台本進捗状況に台本テーブル表示
function makeArray(length, scriptarray){
	//配列を一旦格納する変数
	var resultTable = "";
	
	//格納する前に初期化
	resultTable = "";
	resultTable = "<table border=1 class=\"script\"><tr class=\"ttitle\"><th class=\"one\">順番</th><th class=\"two\">タイミング</th><th class=\"three\">役者</th><th class=\"four\">セリフ</th><th class=\"five\">動き</th></tr>";
	
	for(var i = 0; i < length; i++){
		if(scriptarray[i][1] != ""){
			for(var j = 0; j < 4; j++){
				// if(scriptarray[i][0] != 0){
			
					if(j == 0){
						// resultTable += "<tr class=\""+ scriptarray[i][j] +"\">";	//trにはクラス(0,1,2,3・・・)をつける
						resultTable += "<tr class=\""+ i +"\">";	//trにはクラス(0,1,2,3・・・)をつける
						resultTable += "<td>" + (i+1) + "</td>";
						resultTable +="<td>" + scriptarray[i][j] + "</td>";
					} else if(j == 3){
						resultTable +="<td>" + scriptarray[i][j] + "</td></tr>";
					} else {
						resultTable +="<td>" + scriptarray[i][j] + "</td>";
					}
				// }
			}
		}
	}
	resultTable += "</table>";

	//作成した配列を台本進行状況に表示する
	displayArray(resultTable);
}

//台本進行状況に台本の配列を表示
function displayArray(resulttable){
	var training_log = document.getElementById("training_field");
	training_log.innerHTML = resulttable;
}







//+++++-----台本の判定-----+++++

//台本の判定をする
function judgeTraining(result){
	//メモ：通知時にwatchフラグとkinectフラグを0に。片方の判定が来ればフラグを立てる。両方立っていれば処理を行う
	
	for(var i = 0; i < scriptArray.length; i++){
		if(scriptArray[i][0] == count){
		
			//watchからきた判定の処理、発言した役者(ユーザ)が合って入れば
			if(result == scriptArray[i][4]){	//ユーザ1or2or3
				watching -= 1;
				MessageChangeWhite();
//				console.log("watching" + watching);
			}
			//kinectからきた判定の処理
			if(result == "motion_ok"){
				kinecting -= 1;
			}
			console.log("判定する前！watching" + watching);
			//両方の判定結果が正しければ、次へ進む
			if(watching == 0 && kinecting == 0){
				console.log("ピンポンなんだ！" + count);
				//次の通知をする
				NextNotification();
				//正解音鳴らす
//				SoundPlay();
				//ここのbreakはまじで大事
				break;
			}
		}
	}
	//間違っていれば、ブーと音を鳴らす。そして一時停止。（間違いという判断は秒数が良い。秒は予備実験を元に決める必要がある）
	
	//順番表示
	DisplayCount();
	document.getElementById("display_watching").innerHTML = watching;
	document.getElementById("display_kinecting").innerHTML = kinecting;
}

//システムなしモード kinectだけの判定をする
function judgeMotionTraining(result){
	if(result == "motion_ok"){
		kinecting--;
		clearTimeout(timer);
		
		//kinectチェック前という文字を表示する、文字黒くする
		document.getElementById("check_kinect_text").innerHTML = "Kinectチェック前";
		document.getElementById("check_kinect_text").style.backgroundColor="white";
	}
	
	document.getElementById("display_watching").innerHTML = watching;
	document.getElementById("display_kinecting").innerHTML = kinecting;
}

//+++++----- 通知処理 -----+++++
//次の通知処理を行うメソッド(色付け含む)
function NextNotification(){
	//timerを一度停止する
	clearTimeout(timer);
	
	//前の順番の色付き背景を白に戻す
	RepairColor();
	
	//順番を+1する
	count += 1;
	scriptProgress += 1;
	
	//対象の順番の背景に色をつける
	AddColor();
	
	//対象ユーザ部分の背景に色をつける
	MessageChangeRed(scriptProgress);
	
	//WatchとKinectに情報を送る
	// SendInfo();
	
	// SendInfo(scriptProgress);
	
	// document.getElementById("display_watching").innerHTML = watching;
	// document.getElementById("display_kinecting").innerHTML = kinecting;
	
	//7秒後に動きが出来てるかどうかチェックし、だめなら音を出す
	// timer = setTimeout("SoundPlay()", 7000);
	
	//順番表示
	DisplayCount();
}

//WatchとKinectに情報を送るメソッド
// function SendInfo(){
// //	console.log("順番:" + count);
// 	for(var i = 0; i < scriptArray.length; i++){
// 		if(scriptArray[i][0] == count){
			
// 			//Watchにタイミングを通知 count | userid | type | actor | script | motion
// 			if(scriptArray[i][4] == 1){
// 				//台詞があった場合
// 				if(scriptArray[i][2] != 0){
// 					trainingsend(count, 'Tablet1', 'training_send', scriptArray[i][1], scriptArray[i][2], scriptArray[i][3]);
// 					watching += 1;
// 				//台詞がなかった場合
// 				} else if(scriptArray[i][2] == 0){
// 					trainingsend(count, 'Tablet1', 'training_send', scriptArray[i][1], '動きのみ', scriptArray[i][3]);
// 					//watchingフラグは立てない
// 				}
// 			}
// 			if(scriptArray[i][4] == 2){
// 				if(scriptArray[i][2] != 0){
// 					trainingsend(count, 'Tablet2', 'training_send', scriptArray[i][1], scriptArray[i][2], scriptArray[i][3]);
// 					watching += 1;
// 				//台詞がなかった場合
// 				} else if(scriptArray[i][2] == 0){
// 					trainingsend(count, 'Tablet2', 'training_send', scriptArray[i][1], '動きのみ', scriptArray[i][3]);
// 					//watchingフラグは立てない
// 				}
// 			}
// 			if(scriptArray[i][4] == 3){
// 				if(scriptArray[i][2] != 0){
// 					trainingsend(count, 'Tablet3', 'training_send', scriptArray[i][1], scriptArray[i][2], scriptArray[i][3]);
// 					watching += 1;
// 				//台詞がなかった場合
// 				} else if(scriptArray[i][2] == 0){
// 					trainingsend(count, 'Tablet3', 'training_send', scriptArray[i][1], '動きのみ', scriptArray[i][3]);
// 					//watchingフラグは立てない
// 				}
// 			}
			
// 			//kinectに通知
// 			//Motionがなし(=0)でなければ通知
// 			if(scriptArray[i][3] != 0){
// 				//やっぱりkinectに通知はしない
// //				motionsend(scriptArray[i][4],'kinect_send', scriptArray[i][3]);	//役者名とモーションを通知
// 				motion_user = scriptArray[i][4];
// 				kinecting++;
// 			}
// 			console.log("通知した！watching:" + watching + "  kinecting:" + kinecting);
// 		}
// 	}
// }

function SendInfo(progress){
	// console.log(scriptArray);
	console.log("Timer: " + (timeCount/10));
			//Watchにタイミングを通知 count | userid | type | actor | script | motion
			if(Number(scriptArray[progress][4]) == 0){
				//台詞があった場合
				if(scriptArray[progress][2] != 0){
					trainingsend(progress, 'Tablet1', 'training_send', scriptArray[progress][1], scriptArray[progress][2], scriptArray[progress][3]);
					watching += 1;
				//台詞がなかった場合
				} else if(scriptArray[progress][2] == 0){
					trainingsend(progress, 'Tablet1', 'training_send', scriptArray[progress][1], '動きのみ', scriptArray[progress][3]);
					//watchingフラグは立てない
				}
			}
			if(Number(scriptArray[progress][4]) == 1){
				if(scriptArray[progress][2] != 0){
					trainingsend(progress, 'Tablet2', 'training_send', scriptArray[progress][1], scriptArray[progress][2], scriptArray[progress][3]);
					watching += 1;
				//台詞がなかった場合
				} else if(scriptArray[progress][2] == 2){
					trainingsend(progress, 'Tablet2', 'training_send', scriptArray[progress][1], '動きのみ', scriptArray[progress][3]);
					//watchingフラグは立てない
				}
			}
			if(Number(scriptArray[progress][4]) == 2){
				if(scriptArray[progress][2] != 0){
					trainingsend(progress, 'Tablet3', 'training_send', scriptArray[progress][1], scriptArray[progress][2], scriptArray[progress][3]);
					watching += 1;
				//台詞がなかった場合
				} else if(scriptArray[progress][2] == 0){
					trainingsend(progress, 'Tablet3', 'training_send', scriptArray[progress][1], '動きのみ', scriptArray[progress][3]);
					//watchingフラグは立てない
				}
			}
			
			//kinectに通知
			//Motionがなし(=0)でなければ通知
			//記録を更新したい箇所であるかを判定
			// if(changeArrayProgress < changePointArray.length){	//変更箇所がまだあれば
				// console.log("1つ目");
				// console.log("progress: " + progress);
				// console.log("changePointArray: " + changePointArray[changeArrayProgress]);
				// if(Number(progress) == Number(changePointArray[changeArrayProgress])){	//現在通知する順番が記録を更新したい箇所であるかを判定
					// console.log("2つ目");
					// console.log("ト書きの内容: " + scriptArray[progress][3]);
					if(scriptArray[progress][3] != 0){	//入力された順番がちゃんと動きを伴うものかを判定
						// console.log("3つ目");
						//やっぱりkinectに通知はしない
//						motionsend(scriptArray[i][4],'kinect_send', scriptArray[i][3]);	//役者名とモーションを通知
						send(scriptArray[progress][4], "kinect_start", scriptArray[progress][3]);	//記録するタイミングであることを通知、動きをする役者とト書きを送信
						
						// console.log(scriptArray[progress]);
						motion_user = scriptArray[progress][4];
						kinecting++;
						console.log("kinectに記録開始を通知！ト書き: " + scriptArray[progress][3]);
						changeArrayProgress++;
					}
				// }
			// }
			// console.log("通知した！watching:" + watching + "  kinecting:" + kinecting);
}


//システムなしモード、Kinectによる動作チェック
function KinectCheck(Count){
	//timerを一度停止する
	clearTimeout(timer);
	
	//countに値を入れる
	count = Count;
	
	//kinectチェック中という文字を表示する、文字赤くする
	document.getElementById("check_kinect_text").innerHTML = "Kinectチェック中";
	document.getElementById("check_kinect_text").style.backgroundColor="red";
	
	//対象の順番の背景に色をつける
	AddColor();
	
	//対象ユーザ部分の背景に色をつける
	MessageChangeRed();

	//kinectingフラグを立てる
	SendToKinectInfo();

	//7秒後にまだフラグが立っていたらブーと音を鳴らす
	timer = setTimeout("SoundPlay()", 7000);
}

//システムなしモード kinectの通知だけする
function SendToKinectInfo(){
	for(var i = 0; i < scriptArray.length; i++){
		if(scriptArray[i][0] == count){
			//kinectに通知
			//Motionがなし(=0)でなければ通知
//			if(scriptArray[i][3] != 0){
				motion_user = scriptArray[i][4];
				kinecting++;
//			}
		}
	}
}




//+++++----- 音声メッセージ表示処理 -----+++++

//受信したメッセージを表示する
function DisplayMessages(user, text){
	if(user == 1) document.getElementById("watch_voice_reply1").innerHTML = text;
	if(user == 2) document.getElementById("watch_voice_reply2").innerHTML = text;
	if(user == 3) document.getElementById("watch_voice_reply3").innerHTML = text;
}


//+++++----- 色付け処理 -----+++++

//通知中ではないデバイスのメッセージの色を黒くする
function MessageChangeWhite(Progress){
			if(scriptArray[Progress][4] == 1) document.getElementById("watchvoicereply1").style.backgroundColor="white";
			if(scriptArray[Progress][4] == 2) document.getElementById("watchvoicereply2").style.backgroundColor="white";
			if(scriptArray[Progress][4] == 3) document.getElementById("watchvoicereply3").style.backgroundColor="white";

}

//通知中のデバイスのメッセージの色を黒くする
function MessageChangeRed(Progress){

			
			if(scriptArray[Progress][4] == 1) document.getElementById("watchvoicereply1").style.backgroundColor="red";
			if(scriptArray[Progress][4] == 2) document.getElementById("watchvoicereply2").style.backgroundColor="red";
			if(scriptArray[Progress][4] == 3) document.getElementById("watchvoicereply3").style.backgroundColor="red";

}

//前の順番の色付き背景を白に戻すメソッド
function RepairColor(){
	// var ClassElement_1 = document.getElementsByClassName(count);
	var ClassElement_1 = document.getElementsByClassName(scriptProgress);
	for(var i = 0; i < ClassElement_1.length; i++){
		ClassElement_1[i].style.backgroundColor = "#ffffff";
	}
}

//対象の順番の背景に色をつけるメソッド
function AddColor(){
	// var ClassElement = document.getElementsByClassName(count);
	var ClassElement = document.getElementsByClassName(scriptProgress);
	for(var i = 0; i < ClassElement.length; i++){
		ClassElement[i].style.backgroundColor = "#2F4F4F";
	}
}


//+++++----- 音鳴らす処理 -----+++++

//音を鳴らすメソッド
// function SoundPlay(){
// 	//音ファイルを鳴らす
// 	var audio_correct = new Audio("music/correct_sound.mp3");		//正解音
// 	var audio_wrong = new Audio("music/wrong_sound.mp3");			//ドラムロール音
// 	var audio_drumroll = new Audio("music/drumroll_sound.mp3");		//間違い音
	
// //	audio_drumroll.play();
// //	setTimeout(function musicplay(){ audio_correct.play(); }, 2700);	//遅延して再生
// //	audio_correct.play();
	
// 	if(kinecting != 0){
// 		//間違いの音を出す
// 		audio_wrong.play();
		
// 		//kinectチェック前という文字を表示する、文字黒くする
// 		document.getElementById("check_kinect_text").innerHTML = "Kinectチェック前";
// 		document.getElementById("check_kinect_text").style.backgroundColor="white";
// 	}
// 	//順番表示
// 	DisplayCount();
// }

//+++++----- 順番を表示する処理 -----+++++
function DisplayCount(){
	document.getElementById("training_count").innerHTML = scriptProgress;
}
