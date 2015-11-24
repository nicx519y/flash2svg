var SymbolSlider = function (config, container, context, direction) {
	MySymbolInstance.call(this, config, container, context);

	this._rangeMin = 0;								//最小值
	this._rangeMax = 10;							//最大值
	this._stepAmount = 10;							//刻度步数
	this._position = 0;								//目前的刻度指针

	this._scaleDistance = 66;						//刻度区域移动距离
	//方向 默认 水平
	this._direction = direction || 'horizontal'; 	// or 'vertical'
	this._label = null;								//文字实例
	this._scale = null;								//刻度实例
	this._handler = null;							//handler实例
	this._bg = null;								//bg实例
	this._isHanding = false;						//标识是否在拖动
	this._originalHandlerX = 0;						//保存handler的初始x
	this._onChangeHandler = null;					//值改变的时候调用
	this._onChangeContext = null;
	this._oldPosition = 0;
	this._textToFixed = 0;							//值显示保留的小数点位数
	this._minStepUnit = 5;							//最小的步长显示单元
	this._isReady = false;
	var self = this;

	//在原件加载完毕并且渲染第一帧以后执行初始化
	// this.setRenderFirstFrameHandler(self.setSlider);
	self.setSlider();
	this.dynamicLabelsFlag = false;
};


SymbolSlider.prototype = new MySymbolInstance;

F2slibs.ExtendPrototype(SymbolSlider.prototype, {
	/***
	* 重设slider
	*/
	setSlider: function () {
		var self = this;
		this._scale = this.getInst('SliderScale');
		this._handler = this.getInst('SliderHandler');
		this._bg = this.getInst('SliderBG');
		this._label = this.getInst('slidertext');
		this._blocker = this.getInst('blocker');
		if(this._blocker){
			this.blocking = false;
		}
		(!this._originalHandlerX) && (this._originalHandlerX = this._handler._x);
		this.drawScale();
		this.setSliderPosition();
		this.act();
		// this.numOfgraduations = 1;
		this.setText(this.realPosition);
		this._isReady = true;
	},
	/***
	* 加上交互逻辑
	*/
	act: function () {
		var self = this;
		var ox = 0;
		var opos = 0;

		var astart = function (evt) {
			evt.preventDefault();
			self._isHanding = true;
			ox = (evt.type === 'touchstart' ? evt.touches[0].pageX : evt.pageX);
			opos = self.position;
		};

		var amove = function (evt) {
			evt.preventDefault();
			if (self._isHanding === false) return;
			var pageX = (evt.type === 'touchmove' ? evt.touches[0].pageX : evt.pageX);
			self.position = opos + (pageX - ox) / (self._scaleDistance / self._stepAmount);
		};

		var aend = function (evt) {
			evt.preventDefault();
			self._isHanding = false;
		};

		if (F2slibs.isPC()) {
			this._handler.container.mousedown(astart);
			window.svg.mousemove(amove);
			window.svg.mouseup(aend);
		} else {
			this._handler.container.touchstart(astart);
			window.svg.touchmove(amove);
			window.svg.touchend(aend);
		}
	},
	/***
	* 根据position做UI上的初始化
	*/
	setSliderPosition: function () {
		this._position = Math.round(Math.max(Math.min(this._position, this._stepAmount), 0));
		var pos = this.position;
		var ox = this._originalHandlerX;
		var dis = this._scaleDistance;
		var min = this._rangeMin;
		var max = this._rangeMax;
		var step = this._stepAmount;

		var x = (dis / step) * pos;
		var realPosition = this.realPosition;
		this._handler._x = ox + x;

		if (this._oldPosition != pos) {
			this.setText(this.realPosition);
			(typeof this._onChangeHandler === 'function') &&
			this._onChangeHandler.call(this._onChangeContext, realPosition);
			this._oldPosition = pos;
		}
	},
	setText: function (text) {
		if (typeof this._textToFixed === 'number') {
			this._label.text = text.toFixed(this._textToFixed);
		} else {
			this._label.text = text;
		}
	},
	/***
	* 绘制刻度部分
	*/
	drawScale: function () {
		var stepDis = this._scaleDistance / this._stepAmount;
		var step = this._stepAmount;
		if(stepDis < this._minStepUnit){
			stepDis = this._minStepUnit;
			step = Math.ceil(this._scaleDistance / stepDis - 1);
			stepDis = this._scaleDistance / step;
		}
		
		with (this._scale) {
			clear();
			lineStyle(2, 0x000000);
			moveTo(-0.5, 0);
			lineTo(this._scaleDistance + 0.5, 0);
			lineStyle(1, 0x000000);
			moveTo(0, 0);
			lineTo(0, -5);
			for (var i = 0, len = step; i < len; i++) {
				var x = (i + 1) * stepDis;
				moveTo(x, 0);
				if (i !== len - 1)
					lineTo(x, -4);
				else
					lineTo(x, -6);
			}
		}
	},
	/***
	* position改变的时候回掉函数
	*/
	onChangeHandler: function (handler, context) {
		this._onChangeHandler = handler;
		this._onChangeContext = context || this;
	},
	__getterAndSetter__: {
		/***
			* 设置间隔区域最小值
			*/
		rangeMin: {
			set: function (val) {
				this._rangeMin = val;
				this._isReady && this.setSliderPosition();
				this.setText(this.realPosition);
			},
			get: function () {
				return this._rangeMin;
			}
		},
		/***
			* 设置区域最大值
			*/
		rangeMax: {
			set: function (val) {
				this._rangeMax = val;
				this._isReady && this.setSliderPosition();
				this.setText(this.realPosition);
			},
			get: function () {
				return this._rangeMax;
			}
		},
		/***
			* 设置刻度步数
			*/
		numOfgraduations: {
			set: function (val) {
				this._stepAmount = val;
				this._isReady && this.setSliderPosition();
				this._isReady && this.drawScale();
				this.setText(this.realPosition);
			},
			get: function () {
				return this._stepAmount;
			}
		},
		stepAmount : {
			set: function (val) {
				this._stepAmount = val;
				this._isReady && this.setSliderPosition();
				this._isReady && this.drawScale();
				this.setText(this.realPosition);
			},
			get: function () {
				return this._stepAmount;
			}
		},
		/***
		 * 最小的步长显示距离
		 */
		minStepUnit : {
			set: function(val){
				if(typeof val !== 'number') return;
				this._minStepUnit = val;
				this._isReady && this.drawScale();
			},
			get: function(){
				return this._minStepUnit;
			}
		},
		/***
			* 设置滑块位置(步数)
			*/
		position: {
			set: function (val) {
				if (typeof val !== 'number') return;
				this._position = val;
				this._isReady && this.setSliderPosition();
			},
			get: function () {
				return this._position;
			}
		},
		/***
			* 获取实际值
			*/
		realPosition: {
			get: function () {
				var range = this.rangeMax - this.rangeMin;
				var sr = range / this._stepAmount;
				return (sr * this.position + this.rangeMin);
			}
		},
		/***
			* 是否显示刻度
			*/
		autoScaleVisible: {
			set: function (val) {
				if (typeof val !== 'boolean') return;
				this._scale._visible = val;
			},
			get: function () {
				return this._scale._visible;
			}
		},
		/***
			* 设置是否显示动态文本
			*/
		dynamicLabelsFlag: {
			set: function (val) {
				if (typeof val !== 'boolean') return;
				this._label.container.attr({
					'visibility': (val ? 'visible' : 'hidden')
				});
			},
			get: function () {
				return (this._label.container.attr('visibility') !== 'hidden');
			}
		},
		/***
			* 设置是否锁住交互
			*/
		blocking: {
			set: function (val) {
				if (typeof val !== 'boolean') return;
				this._blocker._visible = val;
				this._blocker.container.select('path').attr({
					'pointer-events' : (val ? 'auto' : 'none')
				});
			},
			get: function () {
				return this._blocker._visible;
			}
		},
		/***
			* 设置label显示的数字小数点位数
			* @val [number or 'auto']
			*/
		labelToFixed: {
			set: function (val) {
				this._textToFixed = val;
				this._isReady && this.setText(this.realPosition);
			},
			get: function () {
				return this._textToFixed;
			}
		},
		text : {
			set : function(val){
				this.setText(val);
			},
			get : function(){
				return this._label.text;
			}
		}
	}
});