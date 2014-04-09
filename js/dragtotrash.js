/*****
	jQuery Drag To Trash v1.0
	author: allenjin
	License: Apache License, Version 2.0 http://www.apache.org/licenses/LICENSE-2.0
****/
(function($){

	$.fn.dragtrash = function(options){

		var opts = $.extend({}, $.fn.dragtrash.defaults, options);
		var container = $(this);
		var draggedItem = null;
		var pos = null;
		var offset = null;
		var o_top = null;
		var o_left = null;
		var scroll = null;
		var trashBin = null;
		var bgColor = null;
		var isInclude = false;
		var modal = null;
		init();

		function init(){
			
			var tagName = $(this).children().size() == 0 ? "li" : $(this).children(":first").get(0).tagName.toLowerCase();

			if(opts.dragSelector == ""){
				opts.dragSelector = tagName;
			}
			if(opts.trashSelector == ""){
				console.log('You should give trashSelector!');
				return ;
			}	
			trashBin = $(opts.trashSelector);
			bgColor = trashBin.css('background-color');
			container.mousedown(grapItem).bind("dragtrash-uninit", uninit);
			styleDragHandlers(true);
			modal = $(opts.modalSelector);
			modal.hide();
		}

		function uninit(){
			container.unbind("mousedown", grabItem).unbind("dragtrash-uninit");
			styleDragHandlers(false);
		}

		function grapItem(e){

			e.preventDefault();
			var dragHandle = e.target;
			while (!$(dragHandle).is(opts.dragSelector)) {
				if (dragHandle == this) return;
				dragHandle = dragHandle.parentNode;
			}
			$(dragHandle).attr("data-cursor", $(dragHandle).css("cursor"));
			$(dragHandle).css("cursor", "pointer");
			var item = this;
			var trigger = function() {
				dragStart.call(item, e);
				container.unbind("mousemove", trigger);
			};
			container.mousemove(trigger).mouseup(function() { container.unbind("mousemove", trigger); $(dragHandle).css("cursor", $(dragHandle).attr("data-cursor")); });

		}

		function dropItem(){
			if (draggedItem == null)
				return false;
			var orig = draggedItem.attr("data-origstyle");
			draggedItem.attr("style", orig);
			if (orig == "")
				draggedItem.removeAttr("style");
			draggedItem.removeAttr("data-origstyle");

			styleDragHandlers(true);

			window.clearInterval(scroll.scrollY);
			window.clearInterval(scroll.scrollX);
			//if position changed call dragEnd
			if(isInclude){
				dragEnd();
				draggedItem.hide();
				trashBin.css('background-color', bgColor );
			}
			draggedItem.removeAttr("data-origpos");

			draggedItem = null;
			$(document).unbind("mousemove", moveItem);
			$(document).unbind("mouseup", dropItem);
			if (opts.scrollContainer != window)
				$(window).unbind("DOMMouseScroll mousewheel", wheel);
			return false;
		}

		function getItems(){
			return  container.children(opts.dragSelector);
		}

		function styleDragHandlers(cursor){
			getItems().map(function() { return container.is(opts.dragSelector) ? this : container.find(opts.dragSelector).get(); }).css("cursor", cursor ? "move" : "");
		}

		function dragStart(e){
			draggedItem = $(e.target).closest(opts.dragSelector);
			draggedItem.attr("data-origpos", getItems().index(draggedItem));

			//calculate mouse offset relative to draggedItem
			var mt = parseInt(draggedItem.css("marginTop"));
			var ml = parseInt(draggedItem.css("marginLeft"));

			offset = draggedItem.offset();
			offset.top = e.pageY - offset.top + (isNaN(mt) ? 0 : mt) - 1;
			offset.left = e.pageX - offset.left + (isNaN(ml) ? 0 : ml) - 1;
			o_top = offset.top;
			o_left = offset.left;

			var h = draggedItem.height();
			var w = draggedItem.width();

			//style draggedItem while dragging
			var orig = draggedItem.attr("style");
			draggedItem.attr("data-origstyle", orig ? orig : "");
			draggedItem.css({ position: "absolute", opacity: 0.8, "z-index": 999, height: h, width: w });

			//auto-scroll setup
			scroll = { moveX: 0, moveY: 0, maxX: $(document).width() - $(window).width(), maxY: $(document).height() - $(window).height() };
			scroll.scrollY = window.setInterval(function() {
				if (opts.scrollContainer != window) {
					$(opts.scrollContainer).scrollTop($(opts.scrollContainer).scrollTop() + scroll.moveY);
					return;
				}
				var t = $(opts.scrollContainer).scrollTop();
				if (scroll.moveY > 0 && t < scroll.maxY || scroll.moveY < 0 && t > 0) {
					$(opts.scrollContainer).scrollTop(t + scroll.moveY);
					draggedItem.css("top", draggedItem.offset().top + scroll.moveY + 1);
				}
			}, 10);

			scroll.scrollX = window.setInterval(function() {
				if (opts.scrollContainer != window) {
					$(opts.scrollContainer).scrollLeft($(opts.scrollContainer).scrollLeft() + scroll.moveX);
					return;
				}
				var l = $(opts.scrollContainer).scrollLeft();
				if (scroll.moveX > 0 && l < scroll.maxX || scroll.moveX < 0 && l > 0) {
					$(opts.scrollContainer).scrollLeft(l + scroll.moveX);
					draggedItem.css("left", draggedItem.offset().left + scroll.moveX + 1);
				}
			}, 10);

			setPos(e.pageX, e.pageY);
			$(document).bind("mousemove", moveItem);
			$(document).bind("mouseup", dropItem);
			if (opts.scrollContainer != window)
				$(window).bind("DOMMouseScroll mousewheel", wheel);

		}

		function dragEnd(){
			if(draggedItem == null || draggedItem == undefined)
				return false;
			modal.show();
			var item = draggedItem;
			$('.trash-negative').unbind().on('click',function(){
				item.show();
				opts.trashNegativeListener.call(item);
				modal.hide();
			});
			$('.trash-positive').unbind().on('click',function(){
				item.remove();
				opts.trashPositiveListener.call(item);
				modal.hide();
			});
		}

		function moveItem(e){
			if (draggedItem == null)
				return false;
			setPos(e.pageX, e.pageY);

			var t_h = trashBin.height();
			var t_w = trashBin.width();
			var t_offset = trashBin.offset();
			var t_minx = t_offset.left;
			var t_maxx = t_offset.left + t_w;
			var t_miny = t_offset.top;
			var t_maxy = t_offset.top + t_h;

			var d_h = draggedItem.height();
			var d_w = draggedItem.width();
			var d_offset = draggedItem.offset();

			var d_minx = d_offset.left;
			var d_maxx = d_offset.left + d_w;
			var d_miny = d_offset.top;
			var d_maxy = d_offset.top + d_h;

			var minx = Math.max(t_minx,d_minx);
			var maxx = Math.min(t_maxx,d_maxx);
			var miny = Math.max(t_miny,d_miny);
			var maxy = Math.min(t_maxy,d_maxy);
			
			if(minx > maxx || miny > maxy){
				trashBin.css('background-color', bgColor );
				isInclude = false;
			}else{
				trashBin.css('background-color', '#F99');
				isInclude = true;
			}

		}

		function setPos(x, y){

			var top = y - o_top;
			var left = x - o_left;

			//adjust top, left calculations to parent element instead of window if it's relative or absolute
			draggedItem.parents().each(function() {
				if ($(this).css("position") != "static" && (!$.browser.mozilla || $(this).css("display") != "table")) {
					var offset = $(this).offset();
					top -= offset.top;
					left -= offset.left;
					return false;
				}
			});

			//set x or y auto-scroll amount
			if (opts.scrollContainer == window) {
				y -= $(window).scrollTop();
				x -= $(window).scrollLeft();
				y = Math.max(0, y - $(window).height() + 5) + Math.min(0, y - 5);
				x = Math.max(0, x - $(window).width() + 5) + Math.min(0, x - 5);
			} else {
				var cont = $(opts.scrollContainer);
				var offset = cont.offset();
				y = Math.max(0, y - cont.height() - offset.top) + Math.min(0, y - offset.top);
				x = Math.max(0, x - cont.width() - offset.left) + Math.min(0, x - offset.left);
			}
			
			scroll.moveX = x == 0 ? 0 : x * opts.scrollSpeed / Math.abs(x);
			scroll.moveY = y == 0 ? 0 : y * opts.scrollSpeed / Math.abs(y);

			//move draggedItem to new mouse cursor location
			draggedItem.css({ top: top, left: left });
		}

		function wheel(){
			if (($.browser.safari || $.browser.mozilla) && container && opts.scrollContainer != window) {
				var cont = $(opts.scrollContainer);
				var offset = cont.offset();
				if (e.pageX > offset.left && e.pageX < offset.left + cont.width() && e.pageY > offset.top && e.pageY < offset.top + cont.height()) {
					var delta = e.detail ? e.detail * 5 : e.wheelDelta / -2;
					cont.scrollTop(cont.scrollTop() + delta);
					e.preventDefault();
				}
			}
		}

		return this;
	};

	$.fn.dragtrash.defaults = {
		dragSelector : "",
		modalSelector : "",
		trashNegativeListener : function() {},
		trashPositiveListener : function() {},
		trashSelector : "",
		scrollContainer: window,
		scrollSpeed: 5
	};

})(jQuery);