const path = require('path');
var http = require('http');
const process = require('process');
var express = require('express'),
    app = module.exports.app = express();

var server = http.createServer(app);
var io = require('socket.io').listen(server);  //pass a http.Server instance
server.listen(3000,process.argv[2]);  //listen on port 3000
console.log("created server: "+process.argv[2]+":3000");

app.use(express.static(path.join(__dirname, 'public')));

app.get('/*', (req, res, next) => {
	res.sendFile(path.join(__dirname, 'index.html'));
});

var chatDialogs = [];
var persons = [];
var lastPersonId = 0;
var bookmarks = "заметочки";
var maps = {};

io.sockets.on('connection', function (socket) {
	console.log('user connected');
	let newPerson = {id:lastPersonId,avatar:"https://pp.userapi.com/c621706/v621706182/1d5f0/IYY9iKcBzlo.jpg",nick:"player",race:"челик",params:[],
		printing:false,
		mute:false,
		editProfile:true,
		status:""
	};

	persons.push(newPerson)
	socket.emit('localConnect', lastPersonId);
	io.sockets.emit('serverBookmarks', bookmarks);
	io.sockets.emit('serverChangePersonData', persons);
	io.sockets.emit('serverChangeMaps', maps);
	lastPersonId++;

	chatDialogs.forEach(function(data){
		socket.emit(data[0], data[1]);
	});

	////chat
	socket.on('clientChat', function (data) {
		io.sockets.emit('serverChat', data);
		chatDialogs.push(['serverChat',data]);
	});
	socket.on('clientTaskChat', function (data) {
		io.sockets.emit('serverTaskChat', data);
		chatDialogs.push(['serverTaskChat',data]);
	});
	////

	//update persons
	socket.on('clientChangePersonData', function (data) {
		persons = data;
		io.sockets.emit('serverChangePersonData', persons);
	});
	
	//maps
	socket.on('clientChangeMaps', function (data) {
		maps = data;
		io.sockets.emit('serverChangeMaps', maps);
	});

	//bookmarks
	socket.on('clientBookmarks', function (data) {
		bookmarks = data;
		io.sockets.emit('serverBookmarks', bookmarks);
	});

	//person print
	socket.on('clientPrint', function (data) {
		let txt="";
		persons[data.id].printing = data.isPrint;
		persons.forEach(function(pers){
			if(pers.printing)
				txt+='<br>'+pers.nick+' печатает...';
		});
		io.sockets.emit('serverPrint', txt);
	});

	socket.on('disconnect', function (socket) {
		// lastPersonId-=1;
		io.sockets.emit('serverChangePersonData', persons);
		console.log('user disconnected');
	});
});