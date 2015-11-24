var ASController = {
	autoRun: true,	//是否自动运行as脚本
    runScript: function (context, scriptStr, frameIdx) {
		if (!ASController.autoRun) return;
		if (!scriptStr || scriptStr == '') return;
        var as = ASController._initScript(scriptStr);
        (function () {
			with(this){
            	eval(as);
			}
        }).apply(context);
    },
	/***
	 * 获取用户自定义as
	 */
	getCodeCustom: function (itemName, frame) {
		var contextName = itemName;
		var frame = frame;
		var asCode = '';
		if (!contextName || contextName == '') {
			contextName = 'stage';
		}
		
		//自定义添加的as
		var customCodeContainer = $('#AsCode_i_' + contextName.replace(/\//g, '____') + '_f_' + frame);
		if (customCodeContainer && customCodeContainer.length > 0) {
			asCode += customCodeContainer.html();
		}

		return asCode;
	},
	getCodeFormConfig: function (config, context) {
		var asNo = config.as;
		var asCode = '';

		if (asNo) {
			//从页面中的<script>标签中获取as code
			asCode += $('#AsCode_No' + asNo.replace('#', '')).html();
		}

		if (asCode && asCode != null && asCode != '')
			return asCode;

		return '';
	},
    _initScript: function (scriptStr) {
        if (!scriptStr || scriptStr == '') return null;
		var as = scriptStr;
		for (var i = 0, len = ASFunction.contextReplace.length; i < len; i++) {
			var cr = ASFunction.contextReplace[i];
			as = as.replace(cr[0], cr[1]);
		}

		var funs = [];
        var code = '';
		
        var runCode = code + '\n' + as;
        return runCode;
	}
};

var ASFunction = {
	contextReplace: [
		[/\sand\s/g, ' && '],
		[/\s?not\s/g, ' !'],
		[/\sor\s/g, ' || '],
		[/\sadd\s/g, ' + ']
	],
	/***
	 * 为容器元素模拟as鼠标事件
	 */
	bindMouseEvents: function (container) {
		var self = this;
		(!self.mouseEventHandlers) && (self.mouseEventHandlers = {});
		
		$.each(['RollOver', 'RollOut', 'Press', 'Release', 'MouseMove', 'MouseUp'], function(idx, etype){
			window.SvgStage.delegate(self, etype, function (evt) {
				if (self.mouseEventHandlers['on' + etype] && typeof self.mouseEventHandlers['on' + etype] == 'function') {
					self.mouseEventHandlers['on' + etype].apply(self, [evt]);
				}
			});
		});
		
	},
	mouseEvents: {
		__getterAndSetter__: {
			onRollOver: {
				get: function () {
					return this.mouseEventHandlers.onRollOver;
				},
				set: function (handler) {
					this.mouseEventHandlers.onRollOver = handler;
				}
			},
			onRollOut: {
				get: function () {
					return this.mouseEventHandlers.onRollOut;
				},
				set: function (handler) {
					this.mouseEventHandlers.onRollOut = handler;
				}
			},
			onMouseMove: {
				get: function () {
					return this.mouseEventHandlers.onMouseMove;
				},
				set: function (handler) {
					this.mouseEventHandlers.onMouseMove = handler;
				}
			},
			onPress: {
				get: function () {
					return this.mouseEventHandlers.onPress;
				},
				set: function (handler) {
					this.mouseEventHandlers.onPress = handler;
				}
			},
			onRelease: {
				get: function () {
					return this.mouseEventHandlers.onRelease;
				},
				set: function (handler) {
					this.mouseEventHandlers.onRelease = handler;
				}
			}
		}
	},
	/***
	 * as的画图api
	 */
	graphics: {
		lineStyle: function (thick, color, alpha) {
			this.graphics.lineStyle.apply(this.graphics, arguments);
		},
		moveTo: function (x, y) {
			this.graphics.moveTo.apply(this.graphics, arguments);
		},
		lineTo: function (x, y) {
			this.graphics.lineTo.apply(this.graphics, arguments);
		},
		/***
		 * not finished
		 */
		lineGradientStyle: function (
			type, colors, alphas, ratios, matrix,
			spreadMethod,
			interpolationMethod,
			focalPointRatio
			) {
			this.graphics.lineGradientStyle.apply(this.graphics, arguments);
		},
		curveTo: function (x1, y1, x2, y2) {
			this.graphics.curveTo.apply(this.graphics, arguments);
		},
		beginFill: function (color, alpha) {
			this.graphics.beginFill.apply(this.graphics, arguments);
		},
		/***
		 * type : linear or radial
		 */
		beginGradientFill: function (
			type, colors, alphas, ratios, matrix,
			spreadMethod,
			interpolationMethod,
			focalPointRatio
			) {
			this.graphics.beginGradientFill.apply(this.graphics, arguments);
		},
		endFill: function () {
			this.graphics.endFill.apply(this.graphics, arguments);
		},
		clear: function () {
			this.graphics.clear.apply(this.graphics, arguments);
		},
		drawALine: function (instance, x1, y1, x2, y2, color, thick, alpha) {
			var inst;
			if (typeof instance == 'string')
				inst = this[instance];
			else if (instance instanceof MySymbolInstance)
				inst = instance;
			if (!inst) return null;

			inst.lineStyle(thick, color, alpha);
			inst.moveTo(x1, y1);
			inst.lineTo(x2, y2);
			return inst;
		}
	},
	/***
	 * Item的一些as函数实现，
	 * 包括时间轴操作函数goto, play, stop, gotoAndStop, gotoAndPlay
	 * 以及onEnterFrame
	 * 添加和删除元素的函数 attachMovie, dupicateMovieClip, detachMovie
	 */
	symbolItem: {
		getInst: function (instanceId) {
			return this.instanceElements[instanceId];
		},
		// setInst: function (instanceId, ele, notCover) {
		// 	if (!notCover && this.instanceElements[instanceId]) {
		// 		console.error('Item :: setInst : instance[' + instanceId + '] be created!');
		// 		return;
		// 	}
		// 	this.instanceElements[instanceId] = ele;
		// 	// this.__initInstGetter__(instanceId);
		// },
		// getInstAll: function () {
		// 	return this.instanceElements;
		// },
		
		on: function (eventType, handler) {
			if (this.name != 'stage') {
				this.getOwnner().on(eventType, handler);
			} else {
				if(eventType in MouseEvent.eventType)
					this['on' + eventType] = handler;
			}
		},
		/***
		 * as操作帧从1开始计数，所以index参数+1
		 */
		goto: function (index) {
			this.timeline && this.timeline.goto(index);
		},
		play: function () {
			this.nextFrame();
			this.timeline && this.timeline.play();
		},
		stop: function () {
			this.timeline && this.timeline.stop();
		},
		gotoAndStop: function (index) {
			this.timeline && this.timeline.gotoAndStop(index);
		},
		gotoAndPlay: function (index) {
			this.timeline && this.timeline.gotoAndPlay(index);
		},
		nextFrame: function () {
			var f = this.timeline.getNextFrame();
			this.timeline.gotoAndStop(f);
		},
		prevFrame: function () {
			var f = this.timeline._getOriginalPrevFrame();
			this.timeline.gotoAndStop(f);
		},
		/***
		 * 设置一个随帧执行的函数
		 * 不受时间轴执行影响
		 */
		setOnEnterFrameHandler: function (handler, context) {
			this.timeline.customEnterFrameObj.handler = handler;
			this.timeline.customEnterFrameObj.context = context;
		},
		/***
		* 获取动态
		*/
		getNextHighestDepth: function () {
			var layer = this.getDynamicLayerContainer();
			var eles = layer.selectAll('g[layer='+layer.attr('id')+']');
			return eles.length;
		},
		/***
		 * 复制指定MC实例
		 */
		dupicateMovieClip: function (instance, newInstanceId, depth) {
			if (typeof instace == 'object' && !(instance instanceof MySymbolInstance)) {
				console.error('Item.dupicateMovieClip :: instance not defined.');
			}
			if (typeof instance == 'string' && !this.getInst(instance)) {
				console.error('Item.dupicateMovieClip :: instanceId ' + instance + ' not be created.');
				return;
			};
			if (this.getInst(newInstanceId)) {
				console.error('Item.dupicateMovieClip :: instanceId ' + newInstanceId + ' be created.');
				return;
			};
			var ele;
			if (typeof instance == 'string') ele = this.getInst(instance);
			if (typeof instance == 'object') ele = instance;
			
			var conf = ele.config;
			var element = MyElement.createElement(conf, this.getDynamicLayerContainer(), this);
			element.add();
			element.setInstanceId(newInstanceId);
			
			this.insertElementByDepth(element, depth, this.getDynamicLayerContainer());
			
			return element;
		},
		/***
		 * 动态添加一个MC
		 */
		attachMovie: function (libName, instanceId, depth) {
			if (this[instanceId]) return false;

			var element = MyElement.createSymbolInstanceByLibName(
				libName,
				this.getDynamicLayerContainer(),
				this
			);
			// element.setParentContext(this);
			element.setInstanceId(instanceId);
			element.run();

			this.insertElementByDepth(element, depth, this.getDynamicLayerContainer());
			
			return element;
		},
		/***
		 * 动态删除一个MC
		 */
		detachMovie: function (instanceId) {
			var ele = this.getInst(instanceId);
			if (!ele || !ele.container.parent()) return false;
			ele.container.remove();
			return true;
		},
		/***
		 * 设置一个mc属性
		 */
		setProperty: function (instanceId, propertyName, propertyValue) {
			var ele = this[instanceId];
			if (!ele) return false;
			ele._setTransformProp(propertyName, propertyValue);
		},
		/***
		 * 创建一个空白MC
		 */
		createEmptyMovieClip: function (instanceId, depth) {
			var conf = {
				'libraryItem': 'custom_empty',
				'type': 'instance',
				'instanceType': 'symbol',
				'symbolType': 'movie clip',
				'instanceId': instanceId
			};

			var element = MyElement.createElement(
				conf,
				this.getDynamicLayerContainer(),
				this
				);
			element.setInstanceId(instanceId);
			element.run();

			this.insertElementByDepth(element, depth, this.getDynamicLayerContainer());
			
			return element;
		},
		__getterAndSetter__ : {
			
			/***
			 * 获取当前帧数
			 */
			_currentframe : {
				get : function(){
					return (this.timeline.currentframe + 1);
				}
			},
			/***
			 * 获取总帧数
			 */
			_totalframes : {
				get : function(){
					return (this.timeline.frameCount);
				}
			},
			/***
			 * 设置随帧函数
			 */
			onEnterFrame : {
				set : function(handler){
					this.setOnEnterFrameHandler(handler, this);
				},
				get : function(){
					return this.timeline.customEnterFrameObj.handler;
				}
			}
		}
	},
	symbolInstance: {
		on: function (eventType, handler) {
			if (eventType in MouseEvent.eventType) {
				this['on' + eventType] = handler;
			}
		},
		startDrag: function () {
			this.container.startDrag();
		},
		stopDrag: function () {
			this.container.stopDrag();
		},
		/***
		 * 获取该element在所在图层的depth
		 */
		getDepth: function () {
			var parent = this.container.parent();
			var eles = parent.selectAll('g[layer='+parent.attr('id')+']').items;
			return eles.indexOf(this.container);
		},
		/***
		 * 跟另一个元素交换depth
		 */
		swapDepths: function (target) {
			var layerContainer = this.container.parent();
			var eles = layerContainer.selectAll('g[layer=' + layerContainer.attr('id') + ']').items;
			var myDepth = this.getDepth();
			var tContainer;
			
			if (typeof target === 'number') {	//target代表层级index
				var depth = Math.max(eles.length - 1, Math.min(target, 0));
				tContainer = eles[depth].container;
			} else if (typeof target === 'string'){	//target代表instance id
				t = this.getSymbol()._parent.getInst(target);
				if (!t) {
					console.error('ASFunction.symbolInstance :: swapDepths : get instance[' + target + '] failed!');
					return;
				} 
				var depth = t.getDepth();
				tContainer = t.container;
			}
			if(depth >= myDepth){
				this.getSymbol()._parent.insertElementByDepth(tContainer, myDepth, layerContainer);
				this.getSymbol()._parent.insertElementByDepth(this, depth + 1, layerContainer);
			}else{
				this.getSymbol()._parent.insertElementByDepth(this, depth, layerContainer);
				this.getSymbol()._parent.insertElementByDepth(tContainer, myDepth + 1, layerContainer);
			}
		},
		_getTransformProps: function () {
			
			if(!this.config.matrix){
				this.config.matrix = new Snap.Matrix(1,0,0,1,0,0);
			}
			if (!this.config.matrix.split) {
				var m = this.config.matrix;
				this.config.matrix = new Snap.Matrix(
					m.a, m.b, m.c, m.d, m.e, m.f
				);
			}
			var props = this.config.matrix.split();
			for (var i in props) {
				props[i] = Math.round(props[i] * 100) / 100;
			}
			return props;
		},
		_setTransformProp: function (prop, value) {
			//将此元素设置为不受时间轴影响
			this.canChangeState = false;
			var props = this._getTransformProps(),
				cx = this.config.transformX,
				cy = this.config.transformY,
				m = this.config.matrix;
				
			switch (prop) {
				case '_x':
					var d = value - props.dx;
					this.config.transformX += d;
					m.e += d;
					break;
				case '_y':
					var d = value - props.dy;
					this.config.transformY += d;
					m.f += d;
					break;
				case '_scaleX':
					if(props.scalex) d = (value / props.scalex);
					else d = 0;
					m.scale(d, 1, cx, cy);
					break;
				case '_scaleY':
					var d;
					if(props.scaley) d = (value / props.scaley);
					else d = 0;
					m.scale(1, d, cx, cy);
					break;
				case '_rotate':
					m.rotate(value, cx, cy);
					break;
				default:
					console.error('SymbolInstance._setTransformProp :: Property - ' + prop + ' not be supported.');
					break;
			}
			this._transform(this.config.matrix);
		},
		__getterAndSetter__: {
			/***
			 * 自身是否响应鼠标事件
			 */
			// 'mouseEnabled' : {
			// 	'set' : function(val){
			// 		if(typeof val !== 'boolean') return;
			// 		this.container.attr({
			// 			'pointer-events' : (val ? 'auto' : 'none')
			// 		});
			// 	},
			// 	'get' : function(){
			// 		return (this.container.attr('pointer-events') !== 'none');
			// 	}
			// },
			/***
			 * 子元素是否响应鼠标事件
			 */
			// 'mouseChildren' : {
			// 	'set' : function(val){
			// 		if(typeof val !== 'boolean') return;
			// 		var setEles = function(g){
			// 			var cs = g.select('g.element');
			// 			$.each(cs.items, function(i, c){
			// 				if(c.attr('class') === 'element'){
			// 					c.attr({
			// 						'pointer-events' : (val ? 'auto' : 'none')
			// 					});
			// 				}
			// 			});
			// 		};
			// 		setEles(this.container);
			// 	}
			// },
			/***
			 * 是否显示
			 */
			'_parent' : {
				get : function(){
					return this.context;
				}
			},
			'_visible': {
				'get': function () {
					var attr = this.container.attr('visibility');
					return (attr !== 'hidden');
					// return (this.container.attr('display') !== 'none');
				},
				'set': function (val) {
					// this.container.attr({
					// 	'display' : (val ? 'auto' : 'none')
					// });
					this.container.attr({
						'visibility' : (val ? 'visible' : 'hidden')
					});
					var paths = this.container.selectAll('path');
					for(var i = 0, len = paths.length; i < len; i ++){
						paths[i].attr('pointer-events', (val ? 'auto' : 'none'));
					}
				}
			},
			'_width' : {
				'get' : function(){
					return this.container.getBBox().width;
					//return this.config.width;
				},
				'set' : function(val){
					this._xscale = val / this.config.width;
				}
			},
			'_height' : {
				'get' : function(){
					return this.container.getBBox().height;
					//return this.config.height
				},
				'set' : function(val){
					//console.log(val / this.config.height);
					this._yscale = val / this.config.height;
				}
			},
			/***
			 * x坐标
			 */
			'_x': {
				'get': function () {
					return this._getTransformProps().dx;
				},
				'set': function (val) {
					this._setTransformProp('_x', val);
				}
			},
			/***
			 * y坐标
			 */
			'_y': {
				'get': function () {
					return this._getTransformProps().dy;	
				},
				'set': function (val) {
					this._setTransformProp('_y', val);	
				}
			},
			/***
			 * x轴缩放比例
			 */
			'_xscale': {
				'get': function () {
					return this._getTransformProps().scalex;	
				},
				'set': function (val) {
					this._setTransformProp('_scaleX', val);
				}
			},
			/***
			 * y轴缩放比例
			 */
			'_yscale': {
				'get': function () {
					return this._getTransformProps().scaley;
				},
				'set': function (val) {
					this._setTransformProp('_scaleY', val);
				}
			},
			/***
			 * 旋转角度
			 */
			'_rotate': {
				'get': function () {
					return this._getTransformProps().rotate;
				},
				'set': function (val) {
					this._setTransformProp('_rotate', val);
				}
			}
		}
	},
	textInstance : {
		__getterAndSetter__ : {
			text : {
				get : function(){
					return this.txt.attr('text');
				},
				set : function(text){
					this.txt.attr({
						'text' : text
					});
				}
			}
		}
	}
};

var Sound = function (srcName) {
	this.inst = null;
	if (srcName) {
		this.attachSound(srcName, true);
	}
};

Sound.prototype = {
	attachSound: function (symbolName, autoPlay) {
		this.inst = AudioController.create(symbolName);
		if (autoPlay) {
			this.start();
		}
	},
	start: function () {
		this.inst.play();
	},
	stop: function () {
		this.inst.stop();
	},
	loadSound: function () {
		//todo...
	}
};

var trace = console.log;