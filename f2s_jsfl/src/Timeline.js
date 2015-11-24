var Timeline = Class.extend({
	_obj: null,
	_asPool : [],
	init : function(timelineObj, itemName, PNGSheetConf){
		this._obj = timelineObj;
		this._itemName = itemName;
		//是否作为PNGSheet导出
		if(PNGSheetConf){
			this._isPNGSheet = true;
			this._PNGSheetConf = PNGSheetConf;
		}
		if(!this._obj){
			trace('Timeline::init - obj is undefined ');
		}
		//Timeline.list.push(this);
	},
	getJSON : function(){

		if(!this._obj){
			return {};
		}

		var layers = this._obj.layers;
		var layersLen = layers.length;
		var layersResult = [];
		var timelineResult = {};
		
		for(var i = 0; i < layersLen; i ++){
			var layerR = this._parseLayer(layers[i]);
			if(!layerR) continue;
			layersResult.push(layerR);
		}
		//PNGSheet导出元件，构造PNGSheet层数据
		if(this._isPNGSheet){
			layersResult.push(this.createPNGSheetLayerData());
		}
		
		var timelineResult = {
			name : this._obj.name,
			libraryItem : this.getTimelineLibraryItemName(),
			frameCount : this._obj.frameCount,
			layers : layersResult
		};

		return timelineResult;
	},
	createPNGSheetLayerData : function(){
		var frameCount = this._obj.frameCount;
		var frames = [];
		var conf = this._PNGSheetConf.frames;
		
		for(var i = 0; i < frameCount; i ++){
			var key = this.getPNGSheetFrameKey(i);
			frames.push({
				'isPNGSheet' : true,
				'isEmpty' : false,
				'isKeyFrame' : true,
				'image' : this._PNGSheetConf.meta.image,
				'position' : conf[key].frame
			});
		}
		
		var pngLayer = {
			'name' : 'PNGSpriteSheetLayer',
			'frameCount' : frameCount,
			'layerType' : 'PNGSpriteSheet',
			'frameQueues' : [
				{
					'type' : 'PNGSpriteSheet',
					'startFrame' : 0,
					'duration' : frameCount,
					'frames' : frames
				}
			]
		};
		
		return pngLayer; 
	},
	getPNGSheetFrameKey : function(index){
		var k = index.toString();
		while(k.length < 4){
			k = '0' + k;
		}
		return (this._itemName + k);
	},
	getTimelineLibraryItemName : function(){
		return (this._obj.libraryItem ? this._obj.libraryItem.name : 'stage');
	},
	_parseLayer : function(layer){
		var frames = layer.frames,
			framesLen = frames.length,
			type;

		//不输出引导层
		if(['guide'].indexOf(layer.layerType) >= 0){
			return undefined;
		}

		if(['guided'].indexOf(layer.layerType) >= 0){
			type = 'normal';
		}else{
			type = layer.layerType;
		}

		var layerResult = {
			name : layer.name,
			layerType : type,
			parentLayer : layer.parentLayer ? layer.parentLayer.name : undefined,
			frameCount : layer.frameCount
		};

		var framesResult = [];
		var i = 0;
		while (i < framesLen) {
			var f = frames[i];
			var startFrame = f.startFrame;
			var dur = f.duration;
			var isKeyFrame = (startFrame == i);
			
			//关键帧
			if (isKeyFrame) {
				framesResult.push(this._parseFrameQueue(startFrame, dur, frames, layer.name));
				i = startFrame + dur;
			}else{
				i ++;
			}
		}

		layerResult.frameQueues = framesResult;
		
		//如果是PNGSheet导出元件，指定原图层为空层
		if(this._isPNGSheet){
			layerResult.isEmpty = true;
		}
		
		return layerResult;
	},
	_parseFrameQueue : function(startFrameIdx, duration, frames, layerName){

		var framesResult = [];
		var endFrameIdx = startFrameIdx + duration - 1;
		var startFrame = frames[startFrameIdx];
		// var startM;

		// if(startFrame.elements.length > 0){
		// 	startM = startFrame.elements[0].matrix;
		// }

		var tweenType = startFrame['tweenType'];
		var tweenObj;

		var nextMatrix;

		if(tweenType != 'none'){
			tweenObj = startFrame.tweenObj;
		}
		for (var i = startFrameIdx; i < startFrameIdx + duration; i++){
			
			//如果是PNGSheet导出元件，只输出关键帧信息
			if(this._isPNGSheet){
				if(i != startFrameIdx) break;
				framesResult.push(this._parseFrame(frames[i], (i==startFrameIdx), null, null, i, layerName));
			}else{
				if(tweenType == 'shape'){
					var shape = null;
					if(i != startFrameIdx && !frames[i].isEmpty){
						shape = tweenObj.getShape(i - startFrameIdx);
					}
					
					framesResult.push(this._parseFrame(frames[i], (i==startFrameIdx), tweenType, shape, i, layerName));
				}else if(tweenType == 'motion'){
					var tweenResult = null;
					if(i != startFrameIdx){
						var m = tweenObj.getGeometricTransform(i - startFrameIdx);
						var rm = {};
						if(!startFrame.isEmpty){
							var rm = {
								a : m.a,
								b : m.b,
								c : m.c,
								d : m.d,
								e : m.tx,
								f : m.ty
							};
						}
	
						tweenResult = {
							'matrix' : rm,
							'filters' : tweenObj.getFilters(i - startFrameIdx),
							'color' : tweenObj.getColorTransform(i - startFrameIdx)
						};
					}
					framesResult.push(this._parseFrame(frames[i], (i==startFrameIdx), tweenType, tweenResult, i, layerName));
				} else {
					//type=='none'的frameQueue 只输出关键帧
					if(i != startFrameIdx) break;
					framesResult.push(this._parseFrame(frames[i], (i==startFrameIdx), tweenType, null, i, layerName));
				}
			}
		}

		var result = {
			type : tweenType,
			startFrame : startFrameIdx,
			frames : frames,
			duration : duration,
			frames : framesResult
		};

		return result;
	},

	_parseFrame : function(frame, isKeyFrame, tweenType, tweenTransforms, frameIndex, layerName){
		var elements = frame.elements;
		var elesResult = [],
			eleLen = elements.length,
			tweenObj = {},
			asId = '';
		
		//如果是PNGSheet导出元件，不输出原element信息
		if(!this._isPNGSheet){
			for(var i = 0; i < eleLen; i ++){
				elesResult.push(this._parseElement(elements[i], tweenType, tweenTransforms));
			}
		}
		//将此帧的as存入asPool
		if (isKeyFrame && frame.actionScript && frame.actionScript != '') {
			Timeline.asPool.push({
				'item': this.getTimelineLibraryItemName(),
				'layer': layerName,
				'frame': frameIndex,
				'code': frame.actionScript
			});
			asId = '#' + String(Timeline.asPool.length - 1);
		}
		
		var frameJSON = {
			'name' : frame.name,
			'isEmpty' : frame.isEmpty,
			'elements' : elesResult,
			'isKeyFrame' : isKeyFrame,
			'tweenTransforms': tweenTransforms
		};
		
		if (asId != '') {
			frameJSON.as = asId;
		}
		
		//帧的音频数据
		if (frame.soundName && frame.soundName != ''){
			frameJSON.soundName = frame.soundName;
			frameJSON.soundLoop = frame.soundLoop;
			frameJSON.soundLoopMode = frame.soundLoopMode;
			frameJSON.soundSync = frame.soundSync;
			//貌似没啥用
			/*frameJSON.soundEnvelope = frame.getSoundEnvelope();
			frameJSON.soundEnvelopeLimits = frame.getSoundEnvelopeLimits();*/
		}

		for(var j in frameJSON){
            if(j !== 'elements' && jsonIsEmpty(frameJSON[j])){
                delete frameJSON[j];
            }
        }

		return frameJSON;
	},
	/***
	 * @changeElement {boolean} 如果true，则不解析element的def和use，只解析matrix，用户帧序列解析中减少消耗
	 */
	_parseElement : function(element, tweenType, tweenTransforms){
		var type = element.elementType;
		var result = {};
		switch (type) {
			case 'shape':
				var shape;
				if(tweenType == 'shape' && tweenTransforms){
					shape = new Shape(tweenTransforms);
				}else{
					shape = new Shape(element);
				}
				result = shape.getJSON();
				break;
			case 'text':
				var text = new TextField(element);
				result = text.getJSON();
				break;
			case 'instance':
				var instance = new SymbolInstance(element);
				result = instance.getJSON();

				break;
			case 'tlfText':
				l.log('Timeline::_parseElement - element type [tlfText] is unfinished.');
				return undefined;
				break;
			case 'shapeObj':
				l.log('Timeline::_parseElement - element type [shapeObj] is unfinished.');
				return undefined;
				break;
		}

		return result;
	}
});

Timeline.list = {};
Timeline.listJSON = {};
Timeline.init = function(){
	trace('timeline init');
	var mainTl = Timeline.createNewTimelineObject('stage');
	Timeline.list['stage'] = mainTl;

	var symbolItems = globalItems;
	symbolItems.reach(function(element, index, elements){
		var itemName = element.name;
		var itemType = element.itemType;

		//改名，防止非法名解析问题
		//element.name = itemType.charAt(0) + itemName;
		//element.name = itemType.charAt(0) + itemName;
		itemName = element.name;

		if(['graphic', 'movie clip', 'button'].indexOf(itemType) < 0){
			return;
		}
		var timeline = element.timeline;

		var result = Timeline.createNewTimelineObject(itemName);

		Timeline.list[itemName.replace(/.+\//g, '')] = result;

	});

	for(var i in Timeline.list){
		var tl = Timeline.list[i];
		var json = tl.getJSON();
		Timeline.listJSON[i] = json;
	}
};


Timeline.getItem = function(itemName){
	return itemList[itemName.replace(/.+\//g, '')];
};


Timeline.getTimeline = function(libName){
	var timeline;
	if(libName == 'stage'){
		timeline = fl.getDocumentDOM().getTimeline();
	}else{
		var itemObj = Timeline.getItem(libName);
		if(itemObj){
			timeline = itemObj.timeline;
		}
	}
	return timeline;
};

Timeline.createNewTimelineObject = function(libName){
	var timeline,
		timelineObj;

	timeline = Timeline.getTimeline(libName);
	
	var PNGSheetConf = null;
	if(globalPNGSpriteItemNames.indexOf(libName) >= 0){
		PNGSheetConf = globalPNGSpriteSheetData[libName];
	}
	
	if(timeline){
		timelineObj = new Timeline(timeline, libName, PNGSheetConf);
	}

	return timelineObj;
};

Timeline.getTimelineJSON = function(libName){
	return Timeline.listJSON[libName.replace(/.+\//g, '')];
};

Timeline.asPool = [];