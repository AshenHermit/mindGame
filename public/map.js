const can = document.getElementById('map');
can.oncontextmenu = function() {return false;}
const ctx = can.getContext('2d');

var paintColor = "#f4ac5f";

var maps = {
	mapNames:[],
	map:{}
};

var canSize;
var currentMap="";
var canRealSize;
var canvasChanged = true;
var canMousePos = {x:0,y:0};
can.width = can.height = canSize = 40;
var leftDown = false;
var rightDown = false;


socket.on('serverChangeMaps', function (data) {
	if(thisId!=editorId && data.mapNames!=undefined) {
		maps = data;
		if(currentMap=="") currentMap = maps.mapNames[0];
		updateMapList();
		canvasChanged = true;
	}
});
function saveMaps(){
	socket.emit('clientChangeMaps', maps);
}

function addMap(){
	sPropmt('имя новой карты:','map_1').then(function(mapName){
		if(mapName!=null){
			currentMap = mapName;
			maps.mapNames.push(mapName);
			maps.map[mapName] = Map(canSize,"rgba(0,0,0,0)");
		}
		updateMapList();
		saveMaps();
	})
}

function renameMap(mapName){
	sPropmt('переименовать карту на:',mapName).then(function(newMapName){
		maps.mapNames[maps.mapNames.indexOf(mapName)] = newMapName;
		let tmpMap = maps.map[mapName];
		delete maps.map[mapName];
		maps.map[newMapName] = tmpMap;
		currentMap = newMapName;
		updateMapList();
		saveMaps();
	})
}
function deleteMap(mapName){
	sAsk('Точно?','Ты не сможешь ее вернуть...',"удоли ее нахуй",function(){
		maps.mapNames.splice(maps.mapNames.indexOf(mapName),1);
		delete maps.map[mapName];
		currentMap = maps.mapNames[0];
		updateMapList();
		saveMaps();
	});
}

function updateMapList(){
	let btns = "";
	maps.mapNames.forEach(function(mn){
		btns+='<div class="map-name '+((mn==currentMap)?'map-name-select':'')+'">'+mn+'</div>';
	});
	if(thisId==editorId) btns+='<div onclick="addMap();" class="map-name">+</div>';

	$('.map-select').html(btns);

	$('.map-name').not('[onclick="addMap();"]').on('click',function(e){
		$('.map-name-select').removeClass('map-name-select');
		console.log(e);
		$(e.target).addClass('map-name-select');
		currentMap = $(e.target).html();
		updateMap();
	})
}
updateMapList();

onResize();
$(window).on('resize',onResize);
function onResize(){
	canRealSize = parseInt($('.saveButton').eq(0).css('width')) - 4*2;
	$(can).css({
		width: canRealSize,
		height: canRealSize
	});
}
can.addEventListener('mousemove',function(e){
	let k = (canSize/canRealSize);
	canMousePos.x = Math.round(k*(e.layerX-10));
	canMousePos.y = Math.round(k*(e.layerY-10));
	canvasChanged = true;
});
can.addEventListener('mousedown',function(e){
	if(e.button==0) {leftDown = true;updateMap();}
	if(e.button==2) {rightDown = true;updateMap();}
	if(e.button==1) {
		paintColor = maps.map[currentMap][canMousePos.x][canMousePos.y];
		$('#color-picker').css('backgroundColor', paintColor);
	};
});
can.addEventListener('mouseup',function(e){
	if(e.button==0) leftDown = false;
	if(e.button==2) rightDown = false;
});

editMap = function(map,op){//op - operation
	if(op=="clear") sAsk('Очистить?','Ты не сможешь ее вернуть...',"да, чисти",function(){maps.map[map] = Map(canSize,"rgba(0,0,0,0)");updateMap();});
		
	if(op=="fill") {maps.map[map] = Map(canSize,paintColor);updateMap();};
	if(op=="rename") renameMap(map);
	if(op=="delete") deleteMap(map);
	updateMap();
}

updateMap = function(){
	ctx.clearRect(0,0,canSize,canSize);
	if(thisId==editorId){
		if(leftDown){
			maps.map[currentMap][canMousePos.x][canMousePos.y] = paintColor;
		}else
		if(rightDown){
			maps.map[currentMap][canMousePos.x][canMousePos.y] = "rgba(0,0,0,0)";
		}
	}

	for (var x = 0; x < canSize; x++) {
		for (var y = 0; y < canSize; y++) {
			ctx.fillStyle = maps.map[currentMap][x][y];
			ctx.fillRect(x,y,1,1);
		}
	}
	ctx.fillStyle = "rgba(255,255,255,0.4)";
	ctx.fillRect(canMousePos.x,canMousePos.y,1,1);
}

setInterval(function(){
	if(canvasChanged){
		canvasChanged = false;
		updateMap();
	}
},1000/60);

$('#color-picker').ColorPicker({
	onSubmit: function(hsb, hex, rgb, el) {
		paintColor = "#"+hex;
		$(el).css('backgroundColor', paintColor);
		$(el).ColorPickerHide();
	},
	onBeforeShow: function () {
		$(this).ColorPickerSetColor(paintColor);
	}
});

function Map(size,defVal = 0) {
	let array = new Array(size);
	for (var x = 0; x < array.length; x++) {
		array[x] = new Array(size);
		for (var y = 0; y < size; y++) {
			array[x][y] = defVal;
		}
	}
	return array;
}

generateMap = function(map,type){
	if(type=='cave'){
		let noise = 0.5;
		sPropmt('частота шума:',noise).then(function(inputNoise){
			if(parseFloat(inputNoise)!=NaN) noise = parseFloat(inputNoise);
			let gen = new ROT.Map.Cellular(canSize, canSize, { connected: true });
			gen.randomize(noise);
			for (var i=0; i<4; i++) gen.create();
			console.log(noise);
			gen.connect(function(data){}, 1);

			maps.map[map] = parseBitMap(gen._map);
			updateMap();
		});
	}
}

function parseBitMap(map){
	for (var x = 0; x < map.length; x++) {
		for (var y = 0; y < map[x].length; y++) {
			if(map[x][y]==0) map[x][y] = paintColor;
			else map[x][y] = "rgba(0,0,0,0)";
		}
	}
	return map;
}