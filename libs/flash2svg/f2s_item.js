//是否使用未压缩数据
var useOriginalConfig = false;
var f2sConfig;
//解压缩
if(!useOriginalConfig)
	f2sConfig = JSON.unDPack(f2sConfig);
else
	f2sConfig = original_f2sConfig; 

var ItemConfigParser = function () { };
ItemConfigParser.prototype = {
	 _initTimeline: function (timelineConfig) {
        var tl = timelineConfig,
            self = this;
        this.timeline = new Timeline({
            name: tl['name'],
            frameCount: tl['frameCount'],
            libraryItem: tl['libraryItem']
        }, this); //创建timeline实例
        var ls = tl['layers'];
		if(ls && ls.length > 0){
			for (var i = ls.length - 1; i >= 0; i--) {
				self._initLayer.apply(self, [ls[i], self.timeline]);
			}
		}
    },
	/***
	 * 为一个图层中的element标记唯一的id，为了防止跨关键帧重复建立
	 */
	_signElementInLayer: function (layerConfig, layerId) {
		var elesPool = [];
		var queues = layerConfig['frameQueues'];
		for (var i = 0, len = queues.length; i < len; i ++){
			var fq = queues[i];
			fq.frames[0].layerId = layerId;
			var eles = fq.frames[0].elements;
			if(!eles) continue;
			for (var j = 0, jlen = eles.length; j < jlen; j ++){
				var ele = eles[j];
				var isMatch = false;
				for (var k = 0, klen = elesPool.length; k < klen; k++){
					var e = elesPool[k];
					if (Item.compreElement(ele, elesPool[k])) {
						ele.id = e.id;
						isMatch = true;
						elesPool.splice(k, 1);
						break;
					}
				}
				if (!isMatch) {
					ele.id = Item.createElementId(ele);
				}
			}
			
			elesPool = eles.slice();
		}
		return layerConfig;
	},
	_signImageViewerInLayer : function(layerConfig, layerId){
		var queues = layerConfig['frameQueues'];
		for(var i = 0, len = queues.length; i < len; i ++){
			var fq = queues[i];
			var fs = fq.frames;
			fq.frames[0].layerId = layerId;
			for(var j = 0, jlen = fs.length; j < jlen; j ++){
				fs[j].viewerId = layerId;
			}
		}
		return layerConfig;
	},
	/***
	 * 初始化图层数据，生成图层容器
	 */
    _initLayer: function (config, timelineObj) {
        var self = this;
        var layerContainer;
		var layerId = Item.getLayerId(config.name, this.timelineIdSuf);
		var isIE = F2slibs.browser().isIE;
		if(!('isEmpty' in config) || config.isEmpty !== true){
			//处理遮罩层逻辑，生成图层容器g
			if (config.layerType != 'mask') {
				layerContainer = self.container.g();
			} else {
				layerContainer = self.container.mask();
				isIE && layerContainer.attr('display', 'none');
			}
			
			if (config.layerType == 'masked') {
				var parentL = config.parentLayer;
				(!isIE) && layerContainer.attr({ 'mask': 'url(#' + Item.getLayerId(parentL, this.timelineIdSuf) + ')' });
			}
			
			layerContainer.attr({
				'name': 'layer_' + config.name.replace(/\s/g, '_'),
				'id': layerId,
				'class' : 'layer'
			});
			this.getDrawLayerContainer().before(layerContainer);
			this.layerContainers[config.name] = layerContainer;
		}

        var layerObj = new Layer({
            frameCount: config['frameCount'],
            layerType: config['layerType'],
            name: config['name']
        });
		
        timelineObj.addLayer(layerObj);
		
		if(config.layerType !== 'PNGSpriteSheet'){
			config = this._signElementInLayer(config, layerId);
		}else{
			config = this._signImageViewerInLayer(config, layerId);
		}
		
        $.each(config['frameQueues'], function (idx, val) {
            self._initFrameQueue.apply(self, [val, layerObj]);
        });
    },
	/***
	 * 初始化帧序列数据
	 */
    _initFrameQueue: function (config, layerObj) {
        var self = this;

        var frameQueueObj = new FrameQueue({
            duration: config['duration'],
            startFrame: config['startFrame'],
            type: config['type']
        });

        layerObj.addFrameQueue(frameQueueObj);
        $.each(config['frames'], function (idx, val) {
            self._initFrame.apply(self, [val, frameQueueObj, layerObj.name]);
        });
    },
	/***
	 * 初始化帧数据
	 */
    _initFrame: function (config, frameQueueObj, layerName) {
        var self = this;
        var frameObj = new Frame(config);
		
        frameQueueObj.addFrame(frameObj);
		
		if(!config.isPNGSheet && config.elements){
			$.each(config['elements'], function (idx, val) {
				self._initElement.apply(self, [val, frameObj, layerName]);
			});
		}
		/***
		 * PNG序列帧
		 */
		if(config.isPNGSheet){
			self._initPNGSpriteSheetViewer(config, frameObj, layerName);
		}
		
    },
	/***
	 * 初始化PNGSpriteSheet的viewer
	 */
	_initPNGSpriteSheetViewer : function(config, frameObj, layerName){
		var key = config.viewerId;
		var pool = window.PNGViewerPool;
		var layerContainer = this.layerContainers[layerName];
		var pos = config.position;
		
		if(!(key in pool)){
			//获取PNG配置
			var itemPNGConf = f2sPNGSpriteSheet[this.name];
			var meta = itemPNGConf.meta;
			var image = window.svg.image('image/' + meta.image, 0, 0, meta.size.w, meta.size.h);
			var pattern = image.pattern(0, 0, meta.size.w, meta.size.h).attr({
				'patternUnits' : 'userSpaceOnUse'
			});
			
			pool[key] = {
				viewer : layerContainer.rect(0, 0, pos.w, pos.h).attr({
					display : 'none',
					fill : pattern
				}),
				source : pattern
			};
			
			this.PNGViewer = pool[key].viewer;
		}
		frameObj.PNGViewer = pool[key];
	},
	/***
	 * 初始化element数据，并生成element
	 */
    _initElement: function (config, frameObj, layerName) {
        var el = null;
        var self = this;
        if (frameObj.isKeyFrame && !frameObj.isEmpty) {
            var layerContainer = this.layerContainers[layerName];
            var inst = config.instanceId;
			var id = config.id;
			
			
			//id是全局唯一的
			if (!ElementsPool[id]) {
				ElementsPool[id] = MyElement.createElement(config, layerContainer, this);
			}
			el = ElementsPool[id];
			
            if (!inst || inst == '') {
				inst = this._getDefaultInstanceId();
            } 
			this.instanceElements[inst] = el;
        }
        frameObj.addElement(el, config);
    },
	_getDefaultInstanceId: function () {
		return 'instance_default_' + F2slibs.randomString(8);
	}
};

////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// Item begin  ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

var Item = function (name, container, ownner) {
    var self = this;

    this.name = name;
    this.container = container;
    this.timeline = null;
    this.layerContainers = {};
    this.layerContainerIds = {};
	this.dynamicLayerContainer = null;
	this.drawLayerContainer = null;
	this.ownner = ownner || this;
	// this.dynamicElements = [];
	this.instanceElements = {};
    this.timelineIdSuf = 'layer_' + F2slibs.randomString(8);
    // this._parent = null;
    this.itemInit();
}

Item.prototype = new ItemConfigParser;

F2slibs.ExtendPrototype(Item.prototype, {
    itemInit: function () {
        //...todo
    },
	/***
	 * 根据depth获取图层中的instance
	 * @return 返回depth位置的element容器，如果返回空，则表示depth超出元素depth范围
	 */
	getElementContainerByDepth: function (depth, layerContainer) {
		var eles = layerContainer.selectAll('g[layer=' + layerContainer.attr('id') + ']').items;
		if(eles.length > 0){
			depth = Math.max(0, Math.min(depth, eles.length));
			return eles[depth] || null;
		}else{
			return null;
		}
	},
	/***
	 * 将element按照depth插入layer
	 */
	insertElementByDepth : function(element, depth, layerContainer){
		var ele;
		
		if(element instanceof MyElement){
			ele = element.container;
		}else{
			ele = element;
		}
		var eContainer = this.getElementContainerByDepth(depth, layerContainer);
		if(eContainer){
			eContainer.before(ele);
		}else{
			layerContainer.append(ele);
		}
	},
	getOwnner: function () {
		return this.ownner;	
	},
	getDynamicLayerContainer: function () {
		if (!this.dynamicLayerContainer) {
			this.dynamicLayerContainer = this.container.g().attr({
				'name': 'dynamic_layer',
				'id' : Item.getLayerId('dynamic_layer', this.timelineIdSuf)
			});
			this.getDrawLayerContainer().before(this.dynamicLayerContainer);
		}
		
		return this.dynamicLayerContainer;
	},
	getDrawLayerContainer: function () {
		if (!this.drawLayerContainer) {
			this.drawLayerContainer = this.container.g().attr({
				'name': 'draw_layer',
				'id' : Item.getLayerId('draw_layer', this.timelineIdSuf)
			});
		}
		return this.drawLayerContainer;
	},
	createPNGSheetTimeline: function(){
		var conf = this.config.timeline;
		var result = {
			name : conf.name,
			libraryItem : conf.libraryItem,
			frameCount : conf.frameCount,
			layers : [{
				name : 'pngsheet_layer',
				layerType : 'normal',
				frameCount : conf.frameCount,
				frameQueues : []
			}]
		};
		
		for(var i = 0, len = conf.frameCount; i < len; i ++){
			var fq = {
				type : 'none',
				startFrame : 0,
				frames : [
					{
						isEmpty : false,
						isKeyFrame : true,
						
					}
				]
			};
			result.layers[0].frameQueues.push(fq);
		}
		
		return result;
	}
});
//加上as函数
F2slibs.ExtendPrototype(Item.prototype, ASFunction.symbolInstance, 'getOwnner');
F2slibs.ExtendPrototype(Item.prototype, ASFunction.mouseEvents, 'getOwnner');
F2slibs.ExtendPrototype(Item.prototype, ASFunction.symbolItem);

Item.getLayerId = function (layerName, suffix) {
	return layerName.replace(/\s/g, '_') + '_' + suffix;
};
Item.createElementId = function (ele) {
	return ele.type + '_' + F2slibs.randomString(8);
};
/***
* 对比两个element是否可复用
*/
Item.compreElement = function (ele1, ele2) {
	var type1 = ele1.type;
	var type2 = ele2.type;
	if (type1 != type2) return false;
	switch (type1){
		case 'shape':
		case 'text':
			return true;
			break;
		case 'instance':
			var instanceType1 = ele1.instanceType;
			var instanceType2 = ele2.instanceType;
			if (instanceType1 != instanceType2) return false;
			if (instanceType1 == 'symbol') {
				var symbolType1 = ele1.symbolType;
				var symbolType2 = ele2.symbolType;
				var litem1 = ele1.libraryItem;
				var litem2 = ele2.libraryItem;
				if (symbolType1 == symbolType2 && litem1 == litem2)
					return true;
			} else if (instanceType1 == 'bitmap') {
				var litem1 = ele1.libraryItem;
				var litem2 = ele2.libraryItem;
				if (litem1 == litem2)
					return true;
			}
			
			return false;
			break;
	}
};

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////// item的衍生类 Graphic MovieClip Button Stage /////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

var Graphic = function(name, container, ownner){
	Item.call(this, name, container, ownner); //属性
};
Graphic.prototype = new Item;
F2slibs.ExtendPrototype(Graphic.prototype, ASFunction.graphics);
F2slibs.ExtendPrototype(Graphic.prototype, {
	initGraphics: function () {
		//绘图对象
		this.graphics = new Graphics(
			this.getDrawLayerContainer()
		);
	},
    itemInit: function () {
        var conf = f2sConfig['library'][this.name];
		if (!conf) {
			conf = {
				itemType : 'graphic'
			};
		}
        this.itemType = conf.itemType;
        conf.timeline && this._initTimeline(conf.timeline);
        this.container.attr({
            name: 'gph_' + this.name
        });
		this.initGraphics();
		//设置父级timeline
		this.timeline.setParent(this.ownner.context.timeline);
    }
});


var MovieClip = function(name, container, ownner) {
    Item.call(this, name, container, ownner); //属性
}
MovieClip.prototype = new Item;
F2slibs.ExtendPrototype(MovieClip.prototype, ASFunction.graphics);
F2slibs.ExtendPrototype(MovieClip.prototype, {
	initGraphics: function () {
		//绘图对象
		this.graphics = new Graphics(
			this.getDrawLayerContainer()
		);
	},
    itemInit: function () {
        var conf = f2sConfig['library'][this.name];
		if (!conf) {
			conf = {
				itemType : 'movie clip'
			};
		}
        this.itemType = conf.itemType;
        conf.timeline && this._initTimeline(conf.timeline);
        this.container.attr({
            name: 'mc_' + this.name
        });
		this.initGraphics();
    }
});

var Button = function(name, container, ownner) {
    Item.call(this, name, container, ownner); //属性
}
Button.prototype = new Item();
$.extend(Button.prototype, {
    itemInit: function () {
        var conf = f2sConfig['library'][this.name];
        this.itemType = conf.itemType;
        this._initTimeline(conf.timeline);
		// this.__initInstGetters__();
        this.timeline.gotoAndStop(1);
        this._bindEvents();
    },
    _bindEvents: function () {
        var self = this;
        this.container.mouseup(function () {
            self.timeline.gotoAndStop(1); //弹起状态
        }).mouseout(function () {
            self.timeline.gotoAndStop(1);
        }).mouseover(function () {
            self.timeline.gotoAndStop(2); //mouseover的状态
        }).mousedown(function () {
            self.timeline.gotoAndStop(3); //按下状态
        }).click(function () {
            self.timeline.gotoAndStop(4); //hit
            setTimeout(function () {
                self.timeline.gotoAndStop(2);
            }, 50);
        });
    }
});

/***
 * 场景类，作为Item的衍生类
 * 整个f2s应用的入口
 */
var Stage = function () {
	window.SvgStage = this;
    this.name = 'stage';
    Item.call(this);
};
Stage.prototype = new Item();
// F2slibs.ExtendPrototype(Stage.prototype.__proto__, Item.prototype);
F2slibs.ExtendPrototype(Stage.prototype, ASFunction.graphics);
F2slibs.ExtendPrototype(Stage.prototype, MouseEvent.prototype);
F2slibs.ExtendPrototype(Stage.prototype, {
    itemInit: function () {
        var stageConfig = f2sConfig['stage'];
        var context = $('#svg-container');
        window.svg = this.container = Snap(stageConfig['width'], stageConfig['height']); //创建svg
        $(window.svg.node).appendTo(context);

        this.container = window.svg;
        this.container.attr({
            id: stageConfig['id']
        }).rect(0, 0, stageConfig['width'], stageConfig['height']).attr({
            fill: stageConfig['backgroundColor']
        });

        this.height = stageConfig['height'];
        this.width = stageConfig['width'];
        this.asVersion = stageConfig['asVersion'];
        this.backgroundColor = stageConfig['backgroundColor'];
        this.frameRate = stageConfig['frameRate'];
        this.id = stageConfig['id'];
		
		this.initSourceItems();
        this._initTimeline(stageConfig.timeline);
		this.initGraphics();
		
		//初始化鼠标事件
		MouseEvent.call(this);
		ASFunction.bindMouseEvents.call(this, this.container);
		
		this.timeline.play();
    },
	/***
	 * 定义instance的getter函数
	 */
	// __initInstGetter__ : function(instanceId){
	// 	var self = this;
	// 	try{
	// 		Object.defineProperty(this, instanceId, {
	// 			get : function(){
	// 				return self.instanceElements[instanceId];
	// 			}
	// 		});
	// 	}catch(e){
	// 		console.warn('Item.__initInstGetter__:: can not define instance getter [' + instanceId + '] for ', this);
	// 	}
	// },
	initGraphics: function () {
		//绘图对象
		this.graphics = new Graphics(
			this.getDrawLayerContainer()
		);
	},
	/**
	 * 初始化跟资源相关的元件，包括bitmap\sound
	 */
	initSourceItems: function () {
		var libs = f2sConfig['library'];
		var soundConfig = {};
		for (var i in libs){
			var itemConf = libs[i];
			if (itemConf.itemType == 'sound') {
				soundConfig[i] = itemConf['srcFile'];
			} else if (itemConf.itemType == 'bitmap'){
				this.initBitmap(itemConf);
			}
		}
		AudioController.init(soundConfig);
	},
	/***
	 * 初始化位图
	 */
	initBitmap: function (bitmapItemConf) {
		var src = bitmapItemConf['srcFile'];
		var width = bitmapItemConf['hPixels'];
		var height = bitmapItemConf['vPixels'];
		var image = window.svg.image('image/' + src, 0, 0, width, height);
		var pattern = image.pattern(0, 0, width, height).attr({
			'id': 'bitmap_' + bitmapItemConf['name'].replace(/\.(png|jpg)$/, ''),
			'patternUnits' : 'userSpaceOnUse'
		});
		return pattern;	
	},
});