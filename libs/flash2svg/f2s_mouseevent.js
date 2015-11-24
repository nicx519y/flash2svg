var MouseEvent = function () {
	this.initDelegate();
};
MouseEvent.eventType = {
	RollOver: 'RollOver',
	RollOut: 'RollOut',
	Press: 'Press',
	Release: 'Release',
	MouseMove: 'MouseMove',
	MouseUp: 'MouseUp'
};
MouseEvent.prototype = {
	/***
	* 初始化鼠标事件代理
	* 鼠标事件支持 RollOver RollOut Press Release
	*/
	initDelegate: function () {
		var self = this;
		if(F2slibs.isPC()){
			this.container.mouseover(function(evt){
				self._overHandler.call(self, evt);
				self._outHandler.call(self, evt);
			}).mousedown(function (evt) {
				self._downHandler.call(self, evt);
				self._clickHandler.call(self, evt);
			}).mousemove(function (evt) {
				self._moveHandler.call(self, evt);
			}).mouseup(function(evt){
				self._upHandler.call(self, evt);
			});
		}else{
			this.container.touchstart(function(evt){
				self._touchStartHandler.call(self, evt);
			}).touchend(function(evt){
				self._touchEndHandler.call(self, evt);
			}).touchmove(function(evt){
				self._touchMoveHandler.call(self, evt);
			});
		}
	},
	/***
	 * 鼠标事件代理
	 */
	delegate: function (target, eventType, handler) {
		this.initDelegates();
		if (!eventType in this.delegates) return;
		this.delegates[eventType].push({
			'target': target,
			'handler': handler
		});
	},
	/***
	 * 删除鼠标事件代理
	 */
	undelegate: function (traget, eventType, handler) {
		this.initDelegates();
		if (!(eventType in this.delegates)) return;
		for (var i = 0, len = this.delegates[eventType].length; i < len; i++) {
			var t = this.delegates[eventType].target;
			var h = this.delegates[eventType].handler;
			if (t === target && h === handler) {
				this.delegates[eventType].splice(i, 1);
				break;
			}
		}
	},
	initDelegates : function(){
		if(!this.delegates){
			this.delegates = {};
			for (var i in MouseEvent.eventType){
				this.delegates[i] = [];
			}
		}
	},
	_touchStartHandler: function(evt){
		var myevt = this._transTouchEvent(evt);
		this._eventHandler('Press', myevt);
		this._eventHandler('Release', myevt);
	},
	_touchEndHandler: function(evt){
		var myevt = this._transTouchEvent(evt);
		this._eventHandler('MouseUp', myevt); 
	},
	_touchMoveHandler: function(evt){
		var myevt = this._transTouchEvent(evt);
		this._eventHandler('MouseMove', myevt);
	},
	_downHandler : function(evt){
		this._eventHandler('Press', evt);
	},
	_moveHandler : function(evt){
		this._eventHandler('MouseMove', evt);
	},
	_upHandler : function(evt){
		this._eventHandler('MouseUp', evt);
	},
	_overHandler : function(evt){
		this._eventHandler('RollOver', evt);
	},
	_outHandler : function(evt){
		this._eventHandler('RollOut', evt);
	},
	_clickHandler : function(evt){
		this._eventHandler('Release', evt);
	},
	_transTouchEvent: function(evt){
		var touch = evt.touches[0];
		var p = evt.path || F2slibs.getTagPath(touch ? touch.target : evt.target);
		var myevt = {
			path : p,
			target : (touch ? touch.target : evt.target),
			clientX : (touch ? touch.clientX : 0),
			clientY : (touch ? touch.clientY : 0)
		};
		return myevt;
	},
	_eventHandler: function(eventType, evt){
		evt.preventDefault && evt.preventDefault();
		var p = evt.path || F2slibs.getTagPath(evt.target);
		var handlers = this.delegates[eventType];
		$.each(handlers, function (idx, e) {
			var t = e.target;
			var h = e.handler;
			var isIn = p.indexOf(t.container.node) >= 0;
			
			if(eventType !== 'RollOut' && !isIn) return;
			if(eventType === 'RollOut' && isIn) return;
			
			if(eventType === 'RollOver'){
				if(t._inMouse === true) return;
				t._inMouse = true;
			}
			
			if(eventType === 'RollOut'){
				if(t._inMouse === false) return;
				t._inMouse = false;	
			}
			
			h.call(t, {
				type: eventType,
				target: t,
				_mouseX: evt.clientX,
				_mouseY: evt.clientY
			});
		});
	}
};
