
var DefsPools = {};
var ElementsPool = {};
var PNGViewerPool = {};
/***
 * element基类，不直接调用
 */
var MyElement = function (config, layerContainer, context) {
	// (!context) && console.log(this, context);
    this.config = $.extend(true, {}, config);
    this.context = context || null;
	this.layerContainer = layerContainer || null;
	this.running = false;
	this.createHandler = [];
	(config && layerContainer) && this.build();
};

MyElement.prototype = {
	run: function () {
		this.container.attr({
			display: 'block'
		});
		this.__registInstGetter__();
		if(this.running) return;
		this.running = true;
	},
    build: function () {
        if (!this.container) {
            this.container = this.layerContainer.g().attr({
				'class': 'element',
				'id': 'ele_' + F2slibs.randomString(8),
				'layer': this.layerContainer.attr('id')
			});

            this._create();
			for (var i = 0, len = this.createHandler.length; i < len; i++) {
				(typeof this.createHandler[i] === 'function') && this.createHandler[i].call(this);
			}
			this.container.attr({
                display: 'none'
            });
        }
    },
	/***
	 * 定义instance的getter函数
	 */
	__registInstGetter__ : function(){
		var instanceId = this.config.instanceId;
		if(!instanceId || instanceId == '') return;
		var self = this;
		this.container.attr({
			'inst' : instanceId
		});
		if(this.context[instanceId] != this){
			this.context[instanceId] = this;
			this.context.instanceElements[instanceId] = this;
		}
		
		if(this.context === this.context.ownner) return;
		
		if(this.context.ownner[instanceId] != this){
			this.context.ownner[instanceId] = this;
		}
	},
    remove: function () {
		//console.log('remove');
        this.container && this.container.attr({
           display: 'none'
        });
		//this.container.remove();
		this.running = false;
    },
    changeState: function (config) {

    },
	doAfterCreated: function (handler) {
		this.createHandler.push(handler);
	}

};
/***
 * shape实例，绘图
 */
var MyShape = function (config, layerContainer, context) {
    this.strokePaths = [];
    this.fillPaths = [];
    MyElement.call(this, config, layerContainer, context);
}
MyShape.prototype = new MyElement();

F2slibs.ExtendPrototype(MyShape.prototype, {
    remove: function () {
        this.container && this.container.attr({
            display: 'none'
        });
    },
	setState: function (state) {
		this.changeState(state);
	},
	changeState: function (state) {
		if(this.shapeState == state){
			return;
		}
		this.shapeState = state;
		
		var strokesConf = state.strokes;
        var fillsConf = state.fills;
		var m = state.matrix;
		var f2i = F2slibs.f2i;
		if(!f2sConfig.version){
			if (fillsConf) {
				for (var i = 0, len = fillsConf.length; i < len; i++) {
					var f = fillsConf[i];
					f.stroke = { width: 0, color: '#000000' };
					this._getPath(f.path, f.stroke, f.fill, this.fillPaths[i]);
				}
			}
			if (strokesConf) {
				for (var j = 0, len = strokesConf.length; j < len; j++) {
					var s = strokesConf[j];
					this._getPath(s.path, s.stroke, null, this.strokePaths[j]);
				}
			}
		}else{
			if(fillsConf){
				var fillData = this._createFillPath(fillsConf);
				for (var i = 0, len = fillData.length; i < len; i++) {
					//if(i == 1) break;
					var f = fillData[i];
					f.stroke = { width: 0, color: '#000000' };
					var fillp = this._getPath(f.path, f.stroke, f.fill, this.fillPaths[i]);
					this.fillPaths.push(fillp);
				}
			}
			if(strokesConf){
				var strokeData = this._createStrokePath(strokesConf);
				for (var j = 0, len = strokeData.length; j < len; j++) {
					var s = strokeData[j];
					var strokep = this._getPath(s.path, s.stroke, null, this.strokePaths[j]);
					this.strokePaths.push(strokep);
				}
			}
		}
		this.container.transform('matrix(' + f2i(m.a) + ', ' + f2i(m.b) + ', ' + f2i(m.c) + ', ' + f2i(m.d) + ', ' + f2i(m.e) + ', ' + f2i(m.f) + ')');
	},
    _create: function () {
        if (this._isCreated) return;
        this._isCreated = true;
        var strokesConf = this.config.strokes;
        var fillsConf = this.config.fills;
		var m = this.config.matrix;
		if(!f2sConfig.version){	//如果没有version，配置会输出path str，后续改进为配置只输出原始数据，不会拼合成path str
			if (fillsConf) {
				for (var i = 0, len = fillsConf.length; i < len; i++) {
					//if(i == 1) break;
					var f = fillsConf[i];
					f.stroke = { width: 0, color: '#000000' };
					var fillp = this._getPath(f.path, f.stroke, f.fill);
					this.fillPaths.push(fillp);
				}
			}
			if (strokesConf) {
				for (var j = 0, len = strokesConf.length; j < len; j++) {
					var s = strokesConf[j];
					var strokep = this._getPath(s.path, s.stroke);
					this.strokePaths.push(strokep);
				}
			}
		}else{
			if(fillsConf){
				var fillData = this._createFillPath(fillsConf);
				for (var i = 0, len = fillData.length; i < len; i++) {
					//if(i == 1) break;
					var f = fillData[i];
					f.stroke = { width: 0, color: '#000000' };
					var fillp = this._getPath(f.path, f.stroke, f.fill);
					this.fillPaths.push(fillp);
				}
			}
			if(strokesConf){
				var strokeData = this._createStrokePath(strokesConf);
				for (var j = 0, len = strokeData.length; j < len; j++) {
					var s = strokeData[j];
					var strokep = this._getPath(s.path, s.stroke);
					this.strokePaths.push(strokep);
				}
			}
		}
		//this.container.transform(matrix);
		this.container.transform('matrix(' + m.a + ', ' + m.b + ', ' + m.c + ', ' + m.d + ', ' + m.e + ', ' + m.f + ')');
    },
	_createStrokePath : function(conf){
		var datas = [];
		var data = null;
		for(var i = 0, len = conf.length; i < len; i ++){
			var c = conf[i];
			if(!F2slibs.isArray(c)){
				if(data) datas.push(data);
				data = {};
				data.stroke = c;
				data.path = '';
			}else{
				if(c.length == 2){
					data.path += 'M ' + c[0] + ' L ' + c[1] + ' ';
				}else if(c.length == 4){
					data.path += 'M ' + c[0] + ' C ' + c[1] + ' ' + c[2] + ' ' + c[3] + ' ';
				}
				if(i == len - 1){
					datas.push(data);
				}
			}
		}
		
		return datas;	
	},
	_createFillPath : function(conf){
		var datas = [];
		var data = null;
		var k = 1;
		var first = '';
		var last = '';
		this._correctPathConf(conf);
		for(var i = 0, len = conf.length; i < len; i ++){
			var c = conf[i];
			if(!F2slibs.isArray(c)){
				if(data){
					data.path += 'Z';
					datas.push(data);
				}
				data = {
					fill : c,
					path : ''
				};
			}else{
				k = 0;
				if(F2slibs.isArray(conf[i - 1])){
					k = this._correctPathArr(conf[i-1], c);
				}
				if(k === 0 && F2slibs.isArray(conf[i + 1])){
					k = this._correctPathArr(c, conf[i+1]);
				}
				if(k === 0){
					if(this._ad(c[c.length - 1], last))
						k = -1;
					else
						k = 1;
				}
				
				var l;
				if(k < 0){
					l = this._unsort(c);
				}else{
					l = c;
				}
				
				if(data.path == ''){
					data.path += 'M ' + l[0];
				}else if(!this._ad(last, l[0])){
					data.path += 'Z\nM ' + l[0];
				}
				
				if(l.length == 2){
					data.path += 'L ' + l[1] + '\n';
				}else if(l.length == 4){
					data.path += 'C ' + l[1] + ' ' + l[2] + ' ' + l[3] + '\n';
				}
				
				last = l[l.length - 1];
				
				if(i == len - 1){
					data.path += 'Z';
					datas.push(data);
				}
			}
		}
		return datas;
	},
	_correctPathConf: function(conf){
		var isa = F2slibs.isArray;
		var i = 0;
		while(i < conf.length){
			var c0 = conf[i];
			var c1 = conf[i-1];
			var c2 = conf[i+1];
			
			if(!isa(c0)){
				i ++;
				continue;
			}
			//将多余的线删除
			if(i != 0 && i != conf.length - 1){
				var a1 = [c1[0], c1[c1.length - 1]];
				var a2 = [c2[0], c2[c2.length - 1]];
				var p0 = c0[0];
				var p1 = c0[c0.length - 1];
				if((a1.indexOf(p0) >= 0 && a2.indexOf(p0) >= 0)
				|| (a1.indexOf(p1) >= 0 && a2.indexOf(p1) >= 0)){
					conf.splice(i, 1);
					continue;
				}
			}
			
			i ++;
		}
		return conf;
	},
	_correctPathArr : function(a, b){
		// if(!a || !b) return 1;
		if(this._ad(a[0], b[b.length - 1])){
			return -1;
		}else if(this._ad(a[a.length - 1], b[0])){
			return 1;
		}else{
			return 0;
		}
	},
	_d : function(a, b){
		var aa = a.split(/\s*\,\s*/);
		var ba = b.split(/\s*\,\s*/);
		var dx = aa[0] - ba[0];
		var dy = aa[1] - ba[1];
		var d = Math.sqrt(dx * dx + dy * dy);
		return d;
	},
	_ad : function(a, b){
		var d = this._d(a, b);
		return (d <= 1);
	},
	_unsort : function(a){
		var r = [];
		for(var i = a.length - 1; i >= 0; i --){
			r.push(a[i]);
		}
		return r;
	},
    _getFill: function (fillObj) {
        if (!fillObj) return 'none';
        switch (fillObj.style) {
            case 'solid':
                return Fill.getSolid(fillObj.color);
                break;
            case 'linearGradient':
                return Fill.getLinearGradient(
					fillObj['posArray'],
					fillObj['colorArray'],
					fillObj['matrix']
					);
                break;
            case 'radialGradient':
                return Fill.getRadialGradient(
					fillObj['posArray'],
					fillObj['colorArray'],
					fillObj['focalPoint'],
					fillObj['matrix']
					);
                break;
			case 'bitmap':
				return Fill.getBitmap(
					fillObj['bitmapPath'],
					fillObj['matrix']
					);
				break;
            default:
                return 'none';
        }
    },
    _getPath: function (pathStr, stroke, fill, context) {
		if (!stroke || !stroke.fill || !stroke['stroke-width']) {
			stroke = {
				'stroke-width': 0,
				'stroke': 'none'
			}
        }
        if (stroke['stroke-width'] < 1 && stroke['stroke-width'] > 0) {
            stroke['stroke-width'] = 1;
        }

        var fillObj = this._getFill(fill);
		var strokeFillObj = this._getFill(stroke.fill);
        var swidth = stroke['stroke-width'];
		var s = F2slibs.pathDF2i;
		
        //如果边缘宽度为0，并且无填充，则把path清空
        if (!swidth && (!fillObj || fillObj == 'none')) {
            pathStr = '';
        }

		if(!context) 
			var context = this.container.path();
		
		context.attr({
			'd': s(pathStr),
			'stroke-width' : swidth,
			'stroke-linecap' : stroke['stroke-linecap'],
			'stroke-linejoin' : stroke['stroke-linejoin'],
			'stroke-dasharray' : stroke['stroke-dasharray'],
			'stroke' : strokeFillObj,
			'fill' : fillObj
		});
		
		//解决safari下面 masked元素不显示问题
		(F2slibs.browser().isSafari) && setTimeout(function(){
			var display = context.attr('display');
			if('none' !== display){
				context.attr({
					'display' : (('block' === display) ? 'inline' : 'block')
				})
			}
		}, 0);
		
		return context;
    }
});


/***
 * Symbol实例，带时间轴的元件实例，包括movie clip\button\graphic
 */
var MySymbolInstance = function (config, layerContainer, context) {
    this.instanceId = (config && config.instanceId) || ('inst_' + F2slibs.randomString(8));
	this.instance = null;
	this.canChangeState = true;//是否跟随时间轴改变状态
	this.hasFilters = [];	//记录包含什么滤镜
    MyElement.call(this, config, layerContainer, context);
};

MySymbolInstance.prototype = new MyElement();
F2slibs.ExtendPrototype(MySymbolInstance.prototype.__proto__, ASFunction.symbolItem, 'getSymbol');
F2slibs.ExtendPrototype(MySymbolInstance.prototype.__proto__, ASFunction.graphics, 'getSymbol');
F2slibs.ExtendPrototype(MySymbolInstance.prototype, ASFunction.mouseEvents);
F2slibs.ExtendPrototype(MySymbolInstance.prototype, ASFunction.symbolInstance);

F2slibs.ExtendPrototype(MySymbolInstance.prototype, {
	run: function () {
		this.container.attr({
			display: 'block'
		});
		this.__registInstGetter__();
		if (this.running) return;
		this.running = true;
		if(!(this.instance instanceof Button)){
			this.instance.gotoAndPlay(1);
		}else{
			this.instance.gotoAndStop(1);
		}
	},
    /***
     * 改变状态，主要为帧动画时调用
     */
    changeState: function (config, tweenTransforms) {
		if (!this.canChangeState) return;
		if (!config || !config.matrix) return;
		var m = config.matrix;
		if (tweenTransforms && tweenTransforms.matrix)
			this._transform(config.matrix, tweenTransforms.matrix);
		else {
			this._transform(config.matrix);
        }

        if (tweenTransforms && tweenTransforms.color) {
            this._colorEffect(tweenTransforms.color);
        } else {
            this._colorEffect(config.color);
        }
    },
	setInstanceId: function (id) {
		this.instanceId = id;
		this.config.instanceId = id;
		this.__registInstGetter__();
	},
	getSymbol: function () {
		return this.instance;
	},

	setRenderFirstFrameHandler: function (handler) {
		var self = this;
		this.doAfterCreated(function () {
			self.getSymbol().setRenderFirstFrameHandler(handler, self);
		});
	},

	_create: function () {
        if (!this._isCreated) {
            var conf = this.config;
            var itemName = conf.libraryItem;
			var instanceType = conf.instanceType;
            var symbolType = conf.symbolType;
            var self = this;

            switch (symbolType) {
                case 'movie clip':
					this.instance = new MovieClip(itemName, this.container, this);
					break;
                case 'graphic':
                    this.instance = new Graphic(itemName, this.container, this);
                    break;
                case 'button':
                    this.instance = new Button(itemName, this.container, this);
                    break;
            }
			
			/**
			 * 调整pngsheet元件的坐标位置
			 */
			if(conf.isPNGSheet){
				var viewerW = this.instance.PNGViewer.attr('width');
				var viewerH = this.instance.PNGViewer.attr('height');
				var w = this.config.width;
				var h = this.config.height;
				var l = this.config.left;
				var t = this.config.top;
				var x = this.config.x;
				var y = this.config.y;
				
				var dx = x - l;
				var dy = y - t;
				
				this.instance.PNGViewer.transform('matrix(1,0,0,1,'+(-(viewerW-w)/2 - dx)+', '+(-(viewerH-h)/2 - dy)+')');
			}
			
			//as鼠标事件绑定
            ASFunction.bindMouseEvents.call(this, this.container);

            this._isCreated = true;
		}
		this._initTransformPoint();
		this.changeState(conf);
    },
	_initTransformPoint: function () {
		if (typeof this.config.transformX != 'number' &&
			typeof this.config.transformY != 'number') return;
		var bbox = this.container.getBBox();
		this.config.transformX = bbox.cx;
		this.config.transformY = bbox.cy;
	},
    _transform: function (matrix, tweenTransformMatrix) {
		if (!matrix) return;
		if(this.transformMatrix == matrix && this.tweenTransformMatrix == tweenTransformMatrix){
			return;
		}
		this.transformMatrix = matrix;
		this.tweenTransformMatrix = tweenTransformMatrix;
		
        var m = matrix;
		var mm = tweenTransformMatrix;
		var str;
		var s = F2slibs.f2i;
		var sx = F2slibs.fix2;
		
		if (tweenTransformMatrix) {
			str = 'matrix(' + sx(mm.a) + ',' + sx(mm.b) + ',' + sx(mm.c) + ',' + sx(mm.d) + ',' + s(mm.e) + ',' + s(mm.f) + ') matrix(' + m.a + ',' + m.b + ',' + m.c + ',' + m.d + ',' + s(m.e) + ',' + s(m.f) + ')';
		} else {
			str = 'matrix(' + sx(m.a) + ',' + sx(m.b) + ',' + sx(m.c) + ',' + sx(m.d) + ',' + s(m.e) + ',' + s(m.f) + ')';
		}
        this.container.attr({ 'transform': str });
		//同步config
		this.config.matrix = this.container.transform().localMatrix;
    },
	//颜色特效设置，只实现了透明度，blue green red的设置未完成
    _colorEffect: function (effectObj) {
		if (!effectObj) return;
		if(this.effectObj == effectObj){
			return;
		}
		this.effectObj = effectObj;
		this.config.color = effectObj;
		
		var aa = effectObj.colorAlphaAmount,
			ap = effectObj.colorAlphaPercent,
			ba = effectObj.colorBlueAmount,
			bp = effectObj.colorBluePercent,
			ga = effectObj.colorGreenAmount,
			gp = effectObj.colorGreenPercent,
			ra = effectObj.colorRedAmount,
			rp = effectObj.colorRedPercent;
			
		if(!F2slibs.browser().isIE){
			var hasColorMatrix = !(aa == 0 && ap == 100 && ba == 0 && bp == 100 && ga == 0 && gp == 100 && ra == 0 && rp == 100);
			if (hasColorMatrix || this.hasFilters.indexOf('color') >= 0) {
				var colorMatrixStr = [
					Number(rp / 100), 0, 0, 0, Number(ra / 255),
					0, Number(gp / 100), 0, 0, Number(ga / 255),
					0, 0, Number(bp / 100), 0, Number(ba / 255),
					0, 0, 0, Number(ap / 100), Number(aa / 255)
				].join(' ');
				this._addFilter('color', colorMatrixStr);
			}
		}else{	//IE不支持feMatrix，所以做降级处理，只处理alpha
			this.container.attr({
				'opacity' : (ap / 100)
			});
		}
    },
    _addFilter: function (type, value) {

		if (this.hasFilters.indexOf(type) < 0)
			this.hasFilters.push(type);

        var types = {
            'color': '<feColorMatrix in="SourceGraphic" type= "matrix" />'
        };
        if (!this._filter) {
            this._filter = window.svg.filter(types[type]).attr({
                filterUnits: "objectBoundingBox"
            });
            this.container.attr({
                'filter': this._filter
            });
        }

        var filters = this._filter;
        switch (type) {
            case 'color':
                var f = filters.select('feColorMatrix');
				//未知原因，导致在QQ浏览器下获取不到feColorMatrix对象，所以要自己遍历获取
				if(!f){
					for(var i in filters.node.childNodes){
						if('feColorMatrix' !== filters.node.childNodes[i].nodeName) continue;
						f = Snap(filters.node.childNodes[i]);
						break;
					}
				}
				//两种方式都拿不到的情况下，新建一个feColorMatrix标签
                if (!f) {
					var oParser = new DOMParser();
					var oDOM = oParser.parseFromString(types[type], 'text/xml');
					filters.node.appendChild(oDOM.documentElement);
                    f = filters.select('feColorMatrix');
                }
				//设置颜色矩阵值
                f.attr({
                    'values': value
                });
                break;

            default:
                break;
        }
        return filters;
    }//,

    // _removeFilter: function (type) {
    //     var filters = this._filter;
    //     if (filters) {
    //         switch (type) {
    //             case 'color':
    //                 var f = filters.select('feColorMatrix');
    //                 if (f) {
    //                     f.remove();
    //                     return true;
    //                 } else {
    //                     return false;
    //                 }
    //                 break;
    //             default:
    //                 break;
    //         }
    //     } else {
    //         return false;
    //     }
    // }
});
/***
 * text实例
 */
var MyText = function (config, layerContainer, context) {
	this.txt = null;
    MyElement.call(this, config, layerContainer, context);
};

MyText.styleId = 0;
MyText.prototype = new MyElement;
F2slibs.ExtendPrototype(MyText.prototype, ASFunction.textInstance);
F2slibs.ExtendPrototype(MyText.prototype, {
	setState: function (config) {
		this._transform(config.matrix);
	},
    changeState: function (config) {
        this._transform(config.matrix);
    },
    _transform: function (matrix) {
		if(this.transformMatrix == matrix) return;
		this.transformMatrix = matrix;
        var m = matrix;
		var s = F2slibs.f2i;
		var sx = F2slibs.fix2;
        this.container.attr({
            'transform': 'matrix(' + sx(m.a) + ',' + sx(m.b) + ',' + sx(m.c) + ',' + sx(m.d) + ',' + s(m.e) + ',' + s(m.f) + ')'
        });
    },
    _create: function () {
        if (this._isCreated) return;
        this._isCreated = true;
        var conf = this.config;

        var aligns = {
            'left': 'start',
            'center': 'middle',
            'right': 'end'
        };
        this.container.attr({
            'width': conf.width,
            'height': conf.height,
			'pointer-events': 'none'
        });

		var align = aligns[conf.textStyle.align],
			dx = 0;
		if (align === 'start') {
			dx = 0;
		} else if (align === 'middle') {
			dx = (conf.width) / 2;
		} else if (align === 'end') {
			dx = conf.width;
		}

        this.txt = this.container.text(0, 0, conf.textString).attr({
			'height': conf.height,
            'class': 'f2s_text_' + MyText.styleId,
            'fill': conf.textStyle.color,
            'dy': ((!F2slibs.browser().isIE) ? '.6em' : '.8em'),
			'dx': dx,
            'text-anchor': align
        });
        MyText.styleId++;
    }
});
/***
 * bitmap实例，对应flash的 bitmap instance
 */
var MyBitmap = function (config, layerContainer, context) {
	MyElement.call(this, config, layerContainer, context);
};

MyBitmap.prototype = new MyElement();
F2slibs.ExtendPrototype(MyBitmap.prototype, {
	setState: function (config) {
		this._transform(config.matrix);
	},
    changeState: function (config) {
        this._transform(config.matrix);
    },
    _transform: function (matrix) {
		if(this.transformMatrx == matrix) return;
		this.transformMatrix = matrix;
        var m = matrix;
		var s = F2slibs.f2i;
		var sx = F2slibs.fix2;
        this.container.attr({
            'transform': 'matrix(' + sx(m.a) + ',' + sx(m.b) + ',' + sx(m.c) + ',' + sx(m.d) + ',' + s(m.e) + ',' + s(m.f) + ')'
        });
    },
    _create: function () {
        if (this._isCreated) return;
        this._isCreated = true;
        var conf = this.config;
		var libraryItem = this.config.libraryItem;
		var libId = 'bitmap_' + libraryItem.replace(/\.(png|jpg)$/, '');
		var libObj = window.svg.select('#' + libId);
		var attr = libObj.attr();
		var rect = this.container.rect(0, 0, attr.width, attr.height).attr({
			fill: libObj
		});
    }
});
/***
 * config = {
 * 	transformX, transformY, type, instanceType, libraryItem,
 *  itemType, depth, 
 * 	color, matrix
 * }
 */

// {
// 	"x": 0,
// 	"y": 0,
// 	"transformX": 0,
// 	"transformY": 0,
// 	"type": "instance",
// 	"instanceType": "symbol",
// 	"symbolType": "movie clip",
// 	"libraryItem": "mfl6",
// }
MyElement.componentNames = ['symbol_slider'];
MyElement.createElement = function (config, container, context) {
    var eType = config.type;
    switch (eType) {
        case 'shape':
            return new MyShape(config, container, context);
            break;
        case 'instance':
			if (config.instanceType == 'symbol') {
				if (MyElement.componentNames.indexOf(config.libraryItem) < 0) {
					if(f2sConfig.library[config.libraryItem]){
						var isPNGSheet = !!(f2sConfig.library[config.libraryItem].isPNGSpriteSheet);
						config.isPNGSheet = isPNGSheet;
					}
					return new MySymbolInstance(config, container, context);
				} else {
					switch (config.libraryItem) {
						case 'symbol_slider':
							return new SymbolSlider(config, container, context);
							break;
						default:
							return new MySymbolInstance(config, container, context);
							break;
					}
				}
			} else if (config.instanceType == 'bitmap')
				return new MyBitmap(config, container, context);
            break;
        case 'text':
            return new MyText(config, container, context);
            break;
    }
};

/***
 * 根据itemname实例化
 */
MyElement.createSymbolInstanceByLibName = function (libName, container, context) {
	var libConf = f2sConfig['library'][libName];
	if (!libConf) return null;

	var itemType = libConf.itemType;
	var instanceType = '';
	if (['button', 'movie clip', 'graphic'].indexOf(itemType) >= 0)
		instanceType = 'symbol';
	else
		instanceType = itemType;

	var conf = {
		'type': 'instance',
		'instanceType': instanceType,
		'symbolType': itemType,
		'libraryItem': libName
	};

	return MyElement.createElement(conf, container, context);
};