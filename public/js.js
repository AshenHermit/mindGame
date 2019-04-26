//господи, как же все хуево без реакта...

var html = document.getElementsByTagName('html')[0];
var socket = io.connect(window.location.href);
var thisMessages = [];
var persons = [];
var thisId = 0;
var editorId = 0;

var updateMap,
	editMap,
	generateMap;

var lastContextYClick = [];
var curContextId = 0;
var addContextYClick = true;

var contextSelectedElement;

socket.on('localConnect', function (data) {
	thisId = data;
});

function updateMapList(){
	
}

socket.on('serverBookmarks', function (data) {
	if(thisId!=editorId) $('.bookmarks').html(data);
});
socket.on('serverPrint', function (data) {
	$('.printingText').html(data);
});

socket.on('serverChat', function (data) {
	$("#chat").append('<div data-person="мешух" class="chat-message"><img class="message-avatar" src="'+persons[data.personId].avatar+'"><span '+((data.personId==editorId)?'style="color:var(--main-color);font-weight: 900;"':'style="font-weight: 900;"')+' class="mesTxt">'+data.message+'</span></div>');
	let el = document.getElementById('chat');
	if(el.scrollHeight - (el.scrollTop+el.clientHeight)<=200);
		setTimeout(function(){el.scrollBy(0,9999);},100);
});
socket.on('personDisconnect', function (data) {
	console.log(data);
});
socket.on('serverChangePersonData', updatePersons);

function updatePersons(data,skipEditorCheck=false){
	var cards = document.getElementById('cards').children;
	for (var c = 0; c < cards.length; c++) {
		if(data[c].disconnected) {cards[c].style.display = "none";}
		else{cards[c].style.display = "block";}
	}
	for(var p = 0; p<data.length; p++){
		let content="";
		let arrayContent = [];
		// data[thisId].params.push({type:"property", name:"стояк", value:50});
		let pCtn = 0;
		data[p].params.forEach(function(param){
			let edit = (thisId==editorId) ? 'contenteditable="true"' : '';
			let paramElm = "";
			if(param.type=="property") paramElm='<div data-id="'+pCtn+'" data-type="property" style="background-color:#1a1d26;" class="card-content-line"><span '+edit+' class="prop">'+param.name+'</span>: '+((thisId==editorId) ? '<div onclick="deleteParam(this);" class="deleteLine"></div>' : '')+'<span '+edit+' class="card-line-value">'+param.value+'</span></div>'
			if(param.type=="effect") paramElm='<div data-id="'+pCtn+'" data-type="effect" style="background-color:#1a1d26;" class="card-content-line"><span '+edit+' class="prop">'+param.name+'</span>: <span '+edit+' class="card-line-value">'+param.value+'</span></div>'
			content+=paramElm;arrayContent.push(paramElm);
			pp++;
		});
		if(cards[p]==undefined){//<div class="card-content-line">стояк: <span class="card-line-value">50</span></div>
			$("#cards").append('<div spellcheck="false" data-id="'+p+'" class="card"> <img '+((p==thisId) ? 'style="cursor: pointer;" onclick="editProfile('+String("'avatar'")+');"':"")+'class="message-avatar card-avatar" src="'+data[p].avatar+'"><span class="mesTxt card-name" '+((p==thisId) ? 'style="cursor: pointer;" onclick="editProfile('+String("'nick'")+');"':"")+'>'+data[p].nick+'</span> <span '+((p==thisId) ? 'style="cursor: pointer;" onclick="editProfile('+String("'race'")+');"':"")+' class="race">('+data[p].race+')</span> <div class="card-content">'+content+'</div>'+((thisId==editorId) ? '<button class="addProp" onclick="addProp(this);">add property</button>' : '')+'</div>');
			if(data[p].disconnected) document.getElementById('cards').lastElementChild.style.display = "none";
		}else{
			cards[p].children[0].src = data[p].avatar;
			cards[p].children[1].innerHTML = data[p].nick;
			cards[p].children[2].innerHTML = '('+data[p].race+')';
			if (thisId!=editorId || skipEditorCheck) {
				// cards[p].children[3].innerHTML = content;
				let elparams = $(cards[p].children[3]).children().toArray();
				for (var pp = 0; pp < persons[p].params.length; pp++) {
					if(data[p].params[pp]==undefined) {
						$(cards[p].children[3].children[pp]).remove();
					}
				}
				for (var dp = 0; dp < data[p].params.length; dp++) {
					if(elparams[dp]!=undefined){
						if(data[p].params[dp].changed){
							elparams[dp].children[0].innerHTML=data[p].params[dp].name;
							elparams[dp].children[1].innerHTML='<span style="color:#4a4d54;">'+persons[p].params[dp].value+' > </span>'+data[p].params[dp].value;
							elparams[dp].style.backgroundColor="#1a1d26";
						}else{
							elparams[dp].children[0].innerHTML=data[p].params[dp].name;
							elparams[dp].children[1].innerHTML=data[p].params[dp].value;
							elparams[dp].style.backgroundColor="#252a35";
						}
						// if(data[p].params)
					}else{
						$(cards[p].children[3]).append(arrayContent[dp]);
					}
				}
			}
		}
		if(p==thisId) cards[p].children[1].style.color="var(--main-color)";
		if(p==editorId) cards[p].style.backgroundColor="#1d2029";
	}
	updateContextMenuElements();

	//if its me
	if(data[thisId].mute){$('#chatInput').attr('disabled', '');}
	else{$('#chatInput').removeAttr('disabled');}

	persons = data;
}//end

function editProfile(op,id=thisId){//operation
	if(thisId!=editorId) id = thisId;
	console.log(id);
	if(persons[id].editProfile){
		let txt = "";
		if(op=="avatar"){
			sPropmt("вставь ссылку на аватар, например из диалога вк","").then(function(txt){
				persons[id].avatar = (txt!="" && txt!=null) ? txt : persons[id].avatar;
				socket.emit('clientChangePersonData', persons);
			})
		}else
		if(op=="nick"){
			sPropmt("Твой ник будет изменен на:",persons[id].nick).then(function(txt){
				persons[id].nick = (txt!="" && txt!=null) ? txt : persons[id].nick;
				socket.emit('clientChangePersonData', persons);
			})
		}else
		if(op=="race"){
			sPropmt("Готов к перерождению? Твоя следующая раса:","челик").then(function(txt){
				persons[id].race = (txt!="" && txt!=null) ? txt : persons[id].race;
				socket.emit('clientChangePersonData', persons);
			})
		}else
		if(op=="status"){
			sPropmt("че с ним?",persons[id].status).then(function(txt){
				persons[id].status = (txt!="" && txt!=null) ? txt : persons[id].race;
				socket.emit('clientChangePersonData', persons);
			})
		}
	}else{
		swal.fire('а хуй те');
	}
}

function addProp(button) {
	$(button.parentNode.children[3]).append('<div data-id="'+button.parentNode.children[3].children.length+'" data-type="property" class="card-content-line"><span contenteditable="true" class="prop">prop</span>: <div onclick="deleteParam(this);" class="deleteLine"></div><span contenteditable="true" class="card-line-value">0</span></div>')
	//updatePersons(persons);
}
function deleteParam(button) {
	$(button.parentNode).remove();
	updatePropertyIds();
}
function savePersons(){
	var cards = document.getElementById('cards').children;
	for (var c = 0; c < cards.length; c++) {
		if(!persons[c].disconnected) {
			let prevParams = persons[c].params;
			persons[c].params = [];
			var props = $(cards[c].children[3]).children().toArray();
			console.log(props);
			let cnt = 0;
			props.forEach(function(prop){
				let dataType = $(prop).attr('data-type');
				let changed = true;
				if(prevParams[cnt]!=undefined) changed=(prevParams[cnt].value!=prop.children[2].innerText);
				if(dataType=='property')
					persons[c].params.push({type:dataType,name:prop.children[0].innerText,value:prop.children[2].innerText,changed:changed});
				if(dataType=='effect')
					persons[c].params.push({type:dataType,name:prop.children[0].innerText,value:"",changed:changed});
				cnt++;
			});
		}
	}
	console.log(persons);
	if(thisId==editorId) socket.emit('clientChangePersonData', persons);
}

function onSend(el) {
	if(!persons[thisId].mute){
	let mesText = $(el.parentNode.children[0]).val();
	thisMessages.push(mesText);
	let imgIndex = Math.max(mesText.indexOf(".png"), mesText.indexOf(".jpg"), mesText.indexOf(".gif"));
	let execlude = Math.max(mesText.indexOf("div"), mesText.indexOf("video"));
	if(imgIndex!=-1 && execlude==-1){
		imgIndex = mesText.indexOf('http');
		let style = 'style="'+((mesText.indexOf(".png")!=-1) ? "border-width: 0px;" : '')+'"';
		if(imgIndex>0) mesText = mesText.slice(0,imgIndex)+'<br><a target="_blank" href="'+mesText.slice(mesText.indexOf('http'))+'"><img '+style+' class="message-image" src="'+mesText.slice(mesText.indexOf('http'))+'"></a>';
		if(imgIndex==0) mesText = '<a target="_blank" href="'+mesText.slice(mesText.indexOf('http'))+'"><img '+style+' class="message-image" src="'+mesText.slice(imgIndex)+'"></a>';
	}
	//<img style="width:128px;" src="https://psv4.userapi.com/c848320/u366638804/docs/d9/712125d9249f/gorshok.png">
	if(mesText.trim()!=""){
		socket.emit('clientChat', {
			personId: thisId,
			message: mesText
		});
	}
	$(el.parentNode.children[0]).val("");
	inputPrint(el.parentNode.children[0]);
	}
}

var disableElements = [
	'[onclick="savePersons();"]',
	'[onclick="saveMaps();"]',
	'[onclick="addMap();"]',
	'#math-prop-name',
	'#pseudo-prop'
];

function setElementsState(state) {
	disableElements.forEach(function(el){
		let jelem = $(el).eq(0);
		let isInput = false;
		if(jelem.prop("tagName")=="INPUT") {
			jelem = jelem.parent();
			isInput = true;
		}
		jelem.css('display', (state ? (isInput ? 'flex' : 'block') : 'none'));
	});
}

$(document).ready(onReady);
function onReady() {
	setContextMenuState(false,-1000,-1000)
	setTimeout(function(){
		if(thisId!=editorId){
			setElementsState(false);
			$('.bookmarks').attr('disabled', '');
		}else{
			setElementsState(true);
			$('.bookmarks').removeAttr('disabled');
		}
	},100);
}
$('.bookmarks').on('input',function (elem) {
	socket.emit('clientBookmarks', $(this).val());
});

$(document).on('keydown', function(e) {
	if(document.activeElement.tagName=="INPUT" && e.key=="Enter")
		document.activeElement.parentNode.children[1].click();
});

function inputPrint(input){
	socket.emit('clientPrint', {
		id:thisId,
		isPrint:($(input).val()!="")
	});
}

function promptPromise(message) {
  return new Promise(function(resolve, reject) {
    var result = window.prompt(message);
    if (result != null) {
    	resolve(result);
    } else {
    	reject(new Error('User cancelled'));
    }
  });
}

function updatePropertyIds(){
	let cards = $('.card').toArray();
	for (var c = 0; c < cards.length; c++) {
		let cardProps = cards[c].children[3].children;
		for (var cp = 0; cp < cardProps.length; cp++) {
			$(cardProps[cp]).attr('data-id', cp);
		}
	}
}

//context START ////////////////////////////////////////////////////////////////
function updateContextMenuElements(){
	$('.card').on('mousedown', function(e) {
		if(e.target.className=="card-content-line" || e.target.tagName=="SPAN"){
			setTimeout(function(){
				e.target.children[2].focus();
				$(e.target.children[2]).selectText();
			},10);
		}
	});
	$('.editor-input').on('focus', function(e) {
			$(this).select();
	});

	$('*').on('mousedown', function(e) {
		if(e.button==0) {
			if(e.target.parentNode.id=="context-menu"){ 
				lastContextYClick[curContextId] = e.pageY-parseInt(e.target.parentNode.offsetTop);
				console.log(e);
			}

			setContextMenuState(false);
			setTimeout(function(){setContextMenuState(false,-100,-100);},1000*0.2);
		}
	});
	if(thisId==editorId){
	$('.card, .map-select').on('contextmenu', function(e) {
		e.preventDefault();$('#context-menu').html('');

		setContextMenuState(false,e.pageX,e.pageY);
		if(e.target.className=="card"){//
			let slelectPers = parseInt($(e.target).attr('data-id'));
			$('#context-menu').append('<button class="addProp" onclick="contextChangePlayerCard('+slelectPers+','+String("'mute'")+')">'+(!persons[slelectPers].mute ? 'mute in chat' : 'toggle on in chat')+'</button>')
			$('#context-menu').append('<button class="addProp" onclick="contextChangePlayerCard('+slelectPers+','+String("'profEdit'")+')">'+(persons[slelectPers].editProfile ? 'disallow prof edit' : 'allow prof edit')+'</button>')
			$('#context-menu').append('<div style="padding:10px;" class="addProp"></div>');
			$('#context-menu').append('<button class="addProp" onclick="editProfile('+String("'nick'")+','+slelectPers+')">change nick</button>')
			$('#context-menu').append('<button class="addProp" onclick="editProfile('+String("'avatar'")+','+slelectPers+')">change avatar</button>')
			$('#context-menu').append('<button class="addProp" onclick="editProfile('+String("'race'")+','+slelectPers+')">change race</button>')
			$('#context-menu').append('<button class="addProp" onclick="editProfile('+String("'status'")+','+slelectPers+')">change status</button>') 
			contextSelectedElement = e.target;
			setContextMenuState(true,e.pageX,e.pageY,0);
		}else
		if(e.target.className=="card-content-line"){
			let slelectPers = parseInt($(e.target.parentNode.parentNode).attr('data-id'));
			let slelectParam = parseInt($(e.target).attr('data-id'));
			$('#context-menu').append('<button class="addProp" onclick="contextPastePrompt('+slelectPers+','+slelectParam+','+String("'add'")+')">+ from prompt</button>');
			$('#context-menu').append('<button class="addProp" onclick="contextPastePrompt('+slelectPers+','+slelectParam+','+String("'mul'")+')">* from prompt</button>');
			$('#context-menu').append('<button class="addProp" onclick="contextPastePrompt('+slelectPers+','+slelectParam+','+String("'set'")+')">= from prompt</button>');
			$('#context-menu').append('<div style="padding:10px;" class="addProp"></div>');
			$('#context-menu').append('<button class="addProp" onclick="contextPasteValue('+slelectPers+','+slelectParam+','+String("'add'")+')">+ prop</button>');
			$('#context-menu').append('<button class="addProp" onclick="contextPasteValue('+slelectPers+','+slelectParam+','+String("'sub'")+')">- prop</button>');
			$('#context-menu').append('<button class="addProp" onclick="contextPasteValue('+slelectPers+','+slelectParam+','+String("'set'")+')">= prop</button>');
			$('#context-menu').append('<div style="padding:10px;" class="addProp"></div>');
			$('#context-menu').append('<button class="addProp" onclick="contextPasteRandom('+slelectPers+','+slelectParam+','+String("'add'")+')">+ random</button>');
			$('#context-menu').append('<button class="addProp" onclick="contextPasteRandom('+slelectPers+','+slelectParam+','+String("'sub'")+')">- random</button>');
			$('#context-menu').append('<button class="addProp" onclick="contextPasteRandom('+slelectPers+','+slelectParam+','+String("'set'")+')">= random</button>');
			$('#context-menu').append('<div style="padding:10px;" class="addProp"></div>');
			$('#context-menu').append('<button class="addProp" onclick="contextSetForCount('+slelectPers+','+slelectParam+')">set for count</button>');
			contextSelectedElement = e.target;
			setContextMenuState(true,e.pageX,e.pageY,1);
		}else
		if($(e.target).hasClass('map-name') && e.target.onclick==null){
			let slelectedMap = $(e.target).html();
			$('#context-menu').append('<button class="addProp" onclick="editMap('+String("'"+slelectedMap+"'")+','+String("'clear'")+')">clear map</button>');
			$('#context-menu').append('<button class="addProp" onclick="editMap('+String("'"+slelectedMap+"'")+','+String("'fill'")+')">fill map</button>');
			$('#context-menu').append('<button class="addProp" onclick="editMap('+String("'"+slelectedMap+"'")+','+String("'rename'")+')">rename map</button>');
			$('#context-menu').append('<button class="addProp" onclick="editMap('+String("'"+slelectedMap+"'")+','+String("'delete'")+')">delete map</button>');
			$('#context-menu').append('<div style="padding:10px;" class="addProp"></div>');
			$('#context-menu').append('<button class="addProp" onclick="generateMap('+String("'"+slelectedMap+"'")+','+String("'cave'")+')">generate cave</button>');
			contextSelectedElement = e.target;
			setContextMenuState(true,e.pageX,e.pageY,2);
		}
	});
	}else{
		$('.card').on('contextmenu', function(e) {
		e.preventDefault();$('#context-menu').html('');

		setContextMenuState(false,e.pageX,e.pageY);
		if(e.target.className=="card"){//
			let slelectPers = parseInt($(e.target).attr('data-id'));
			$('#context-menu').append('<button disabled class="addProp"">'+persons[slelectPers].status+'</button>')
			contextSelectedElement = e.target;
			setContextMenuState(true,e.pageX,e.pageY,0);
		}
	});
	}
}
function setContextMenuState(state,x,y,id){
	if(id==null) id=0;
	curContextId = id;
	if(lastContextYClick[id]==undefined) lastContextYClick.push(0); 
	if(x!=null) $('#context-menu').css('left', x-(parseFloat($('#context-menu').innerWidth())/2));
	if(y!=null) $('#context-menu').css('top', y-lastContextYClick[id]);
	$('#context-menu').css('opacity', (state ? 1 : 0));
}
function contextChangePlayerCard(pid,op){
	if(op=="mute"){
		persons[pid].mute = !persons[pid].mute;
	}
	socket.emit('clientChangePersonData', persons);
	if(op=="profEdit"){
		persons[pid].editProfile = !persons[pid].editProfile;
	}
	socket.emit('clientChangePersonData', persons);
}
function contextPasteRandom(pid,parId,op){//op - operation
	let min = parseInt($('#rand-min').val())
	let max = parseInt($('#rand-max').val())
	let value = $('.card').eq(pid).children().eq(3).children().eq(parId).children().eq(2);
	if(op=="add") value.html(parseInt(value.html())+Math.randomRangeInt(min,max)+getOnlyLetters(value.html()));
	if(op=="sub") value.html(parseInt(value.html())-Math.randomRangeInt(min,max)+getOnlyLetters(value.html()));
	if(op=="set") value.html(Math.randomRangeInt(min,max)+getOnlyLetters(value.html()));
}
function contextPasteValue(pid,parId,op){//op - operation
	let mathPropName = $('#math-prop-name').val();
	let value = $('.card').eq(pid).children().eq(3).children().eq(parId).children().eq(2);
	let secValue = parseInt(getValueOfPropertyByName(pid,mathPropName));
	if(getValueOfPropertyByName(pid,mathPropName).indexOf('%')!=-1) secValue = Math.round((parseInt(value.html())/100)*secValue);

	if(op=="add") value.html(parseInt(value.html())+secValue+getOnlyLetters(value.html()));
	if(op=="sub") value.html(parseInt(value.html())-secValue+getOnlyLetters(value.html()));
	if(op=="set") value.html(secValue+getOnlyLetters(value.html()));
}
function contextPastePrompt(pid,parId,op){//op - operation
	let mathPropName = $('#math-prop-name').val();
	let value = $('.card').eq(pid).children().eq(3).children().eq(parId).children().eq(2);
	let secValue = prompt(value.parent().children().eq(0).html()+": "+value.html()+((op=='add')?'+':((op=='mul')?'*':'=')));
	let mathOperations = Math.max(secValue.indexOf('+'),secValue.indexOf('-'),secValue.indexOf('*'),secValue.indexOf('/'));
	if(mathOperations!=-1){secValue = eval(secValue);}else
	if(secValue.indexOf('%')!=-1) {secValue = Math.round((parseInt(value.html())/100)*parseInt(secValue));}

	if(op=="add") value.html(parseInt(value.html())+parseInt(secValue)+getOnlyLetters(value.html()));
	if(op=="mul") value.html(parseInt(value.html())*parseInt(secValue)+getOnlyLetters(value.html()));
	if(op=="set") value.html(parseInt(secValue)+getOnlyLetters(value.html()));
}
function contextSetForCount(pid,parId){
	let value = $('.card').eq(pid).children().eq(3).children().eq(parId).children().eq(0);
	$('#math-prop-name').val(value.html());
}
//context END ///////////////////////////////////////////////////


function setButtonRandom(button){
	let rand = Math.randomRangeInt(parseInt($('#rand-min').val()),parseInt($('#rand-max').val()));
	button.innerHTML=rand;
	// if($("#setRandomAsPseudo").prop("checked"))
}

window.addEventListener("beforeunload", function(e){
	persons[thisId].printing = false;
	persons[thisId].disconnected = true;
	// document.getElementById('cards').children[thisId].style.opacity = "0.3";
	socket.emit('clientChangePersonData', persons);
	console.log("logout");
}, false);

function toggleHelp(){
	$('.help-container').css('display', 'block');
	if($('.help-container').hasClass('fade-out')){
		$('.help-container').removeClass('fade-out')
	}else{
		$('.help-container').addClass('fade-out')
		document.getElementsByClassName('help-container')[0].focus();
	}
}







jQuery.fn.selectText = function(){
	var doc = document;
	var element = this[0];
	console.log(this, element);
	if (doc.body.createTextRange) {
	   var range = document.body.createTextRange();
	   range.moveToElementText(element);
	   range.select();
	} else if (window.getSelection) {
	   var selection = window.getSelection();        
	   var range = document.createRange();
	   range.selectNodeContents(element);
	   selection.removeAllRanges();
	   selection.addRange(range);
	}
};

Math.randomRangeInt = function(min,max){
	return this.round(this.random()*this.abs(max-min))+min;
}

function getOnlyLetters(str){
	return str.replace(parseInt(str),'')
}

function getValueOfPropertyByName(pid,propName){
	if(propName.indexOf('#')==-1 && propName.indexOf('№')==-1){
		let cardProps = $('.card').toArray()[pid].children[3].children;
		for (var cp = 0; cp < cardProps.length; cp++) {
			let prop = $(cardProps[cp]);
			console.log(prop.children().eq(0).html());
			if(prop.children().eq(0).html()==propName){
				return prop.children().eq(2).html();
				break;
			}
		}
	}else{
		return $('#pseudo-prop').val();
	}
}

function setMainColor(btn){
	html.style.setProperty("--main-color",btn.style.backgroundColor);
}

async function sPropmt(txt,out=""){
	let {value: text} = await Swal.fire({
		title: txt,
		input: 'text',
		inputValue: out,
		inputPlaceholder: "че?"
	})

	if(text!=undefined) out = text;
	return out;
}

async function sAsk(txt,txt2,ans,callback){
	Swal.fire({
		title: txt,
		text: txt2,
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: ans
	}).then((result) => {
		if (result.value)
			callback();
	})
}