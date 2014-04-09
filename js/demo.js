(function(){

	function trashPositiveCall(){
		console.log('pos');
		//this is a callback when pressed positive btn
	}

	function trashNegativeCall(){
		console.log('neg');
		//this is a callback when pressed negative btn
	}

	$('ul.item-list').dragtrash({
		dragSelector : "li",	
		modalSelector : ".trash-modal", //this is a selector of modal
		trashPositiveListener : trashPositiveCall,	//the class of positive btn must be 'trash-positive'
		trashNegativeListener : trashNegativeCall,	//the class of negative btn must be 'trash-negative'
		trashSelector : "div.trash-box"	//this is a selector of trashbin 
	});


})();