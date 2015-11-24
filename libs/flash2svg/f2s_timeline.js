var TimelinePool = {};
var FrameRunner = function (fps) {
    FrameRunner.fps = fps || 25;
    this.now = -1;
    this.then = Date.now();
    this.interval = 1000 / FrameRunner.fps;
    this.delta = 0;
    this.frame = 0;
    this.isRunning = false;
    this.runHandlers = {};
	this.enterFrameHandlers = [];
};
//帧频
FrameRunner.fps = 25;

FrameRunner.prototype = {
    init: function () {
        this.now = -1;
        this.then = Date.now();
        this.delta = 0;
        this.frame = 0;
    },
    start: function () {
        this.isRunning = true;
        this._frameHandler();
        this._run();
    },
    stop: function () {
        this.isRunning = false;
        this.init();
    },
    addHandler: function (handlerName, handler) {
        if (!handlerName) {
            console.error('FrameRunner::addHandler - Missing parameters.');
            return;
        }
        this.runHandlers[handlerName] = handler;
    },
    removeHandler: function (handlerName) {
        if (!handlerName) {
            console.error('FrameRunner::addHandler - Missing parameters.');
            return;
        }
        if (handlerName in this.runHandlers) {
            delete this.runHandlers[handlerName];
        }
    },
	/***
	 * onEnterFrameObj = {
	 * 	handler,
	 * 	context
	 * }
	 */
	addOnEnterFrame: function (onEnterFrameObj) {
		this.enterFrameHandlers.push(onEnterFrameObj);
	},
    _run: function () {
        if (!this.isRunning) return;
        var self = this;
        requestAnimationFrame(function () {
            self._run.call(self);
        });
        this.now = Date.now();
        this.delta = this.now - this.then;
        if (this.delta > this.interval) {
            // 这里不能简单then=now，否则还会出现上边简单做法的细微时间差问题。例如fps=10，每帧100ms，而现在每16ms（60fps）执行一次draw。16*7=112>100，需要7次才实际绘制一次。这个情况下，实际10帧需要112*10=1120ms>1000ms才绘制完成。
            this.then = this.now - (this.delta % this.interval);
			this._frameHandler.apply(this, [this.frame]);
			for (var i = 0, len = this.enterFrameHandlers.length; i < len; i++) {
				if (!this.enterFrameHandlers[i].handler || typeof this.enterFrameHandlers[i].handler != 'function')
					continue;
				this.enterFrameHandlers[i].handler.call(this.enterFrameHandlers[i].context);
			}
        }
    },
    _frameHandler: function () {
        for (var i in this.runHandlers) {
            var tl = TimelinePool[i];
            this.runHandlers[i].apply(tl, [this.frame]);
        }
        this.frame++;
    }
};

var Runner = new FrameRunner(25);
Runner.start();

var Timeline = function (config, context) {
    this.name = config.name;
    this.frameCount = config.frameCount || 0;
    this.libraryItem = config.libraryItem;
    this.context = context;
    this.frame = 0;
	this.currentframe = 0; 	//当前指针
    this.prevFrame = 0;		//前一个指针
    this.layers = [];
    this._id = this.name.replace(/\s/g, '_') + '_';
    this._innerFrame = -1;
    this._isRunning = false;
    this._idxByName = {};
    this._frames = [];
	this._parentTL = null;		//父级timeline
	this._parentInnerFrame = 0;	//插入父级timeline的帧
    this.defaultStopFrame = -1;

	this.customEnterFrameObj = {
		handler: null,
		context: null
	};
	Runner.addOnEnterFrame(this.customEnterFrameObj);

    this.timelinePoolId = (this.name + '_' + F2slibs.randomString(10));
    TimelinePool[this.timelinePoolId] = this;

};
Timeline.prototype = {
    //获取一个图层一帧的状态
    getLayerStateByFrame: function (frameIdx, layerIdx) {
        var data = null;
        var l = this.layers[layerIdx],
            fqs = l.frameQueues,
            as = null,
			soundObj = null,
            resultFrame;

        for (var i = 0, len = fqs.length; i < len; i++) {
            var fq = fqs[i];
			//所要的帧不在这个framequeue范围之内
            if (frameIdx > fq.startFrame + fq.duration - 1)
                continue;

            var type = fq.type;
			var d = frameIdx - fq.startFrame;
			var ff = fq.frames[0];	//framequeue关键帧
			var f = fq.frames[d];	//当前帧
			
			//处理音频事件
			if (ff.sound && ff.sound != null) {
				soundObj = {
					obj: ff.sound,
					src: ff.soundName
				};
				var sync = ff.soundSync;
				switch (sync) {
					/***
					 * start和event在此不再做区分
					 */
					case 'start':
						(frameIdx == fq.startFrame) && (soundObj.command = ['replay', ff.soundName]);
					case 'stream':
						(frameIdx == fq.startFrame) && (soundObj.command = ['play', ff.soundName]);
						//(frameIdx == fq.startFrame + fq.duration - 1) && (soundObj.command = ['stop']);
						break;
					case 'event':
						(frameIdx == fq.startFrame) && (soundObj.command = ['play', ff.soundName]);
						break;
					case 'stop':
						(frameIdx == fq.startFrame) && (soundObj.command = ['stop']);
						break;
					// case 'stream':
					// 	/***
					// 	* 处理流式音频，即将音频按照时间拆分成若干分，绑定到每一帧，当运行到这一帧的时候，播放这段音频
					// 	*/
					// 	var step = 1 / FrameRunner.fps; //每帧播放的时长
					// 	var start = (frameIdx - fq.startFrame) * step;	//每帧开始播放的时间
					// 	soundObj.command = ['play', ff.soundName, start, step];
					// 	break;
				}
			}
			
			
			//帧状态
            if (type == 'none') {
                resultFrame = fq.frames[0];
                //脚本
                (frameIdx == fq.startFrame) && (as = resultFrame.as);
                break;
            } else if(f && type !== 'PNGSpriteSheet'){
                f.elements && (f.elements = fq.frames[0].elements);
                resultFrame = f;
                //脚本
                (frameIdx == fq.startFrame) && (as = resultFrame.as);
                break;
            }else if(type === 'PNGSpriteSheet'){
				resultFrame = f;
			}
        }
        return {
            frame: resultFrame,
            as: as,
			sound: soundObj
        };
    },
    /***
	 * 获取一个时间帧的状态
	 * 每当运行至一个时间帧的时候，会从这个函数获取这个时间帧的所有element状态
	 * 这个函数会分析包含element本身的状态，以及各种tween对element的影响
	 * render主要靠调用这个函数去渲染每一帧
	 */
    getStateByFrame: function (frameIdx) {
        var data = [];
        var ls = this.layers,
            self = this;

        $.each(ls, function (idx, lay) {
            var d = self.getLayerStateByFrame.apply(self, [frameIdx, idx]);
            data.push(d);
        });
		
		
        return data;
    },
    addLayer: function (layerObj) {
        this.layers.push(layerObj);
    },
    play: function () {
        if (this._isRunning) return;
        this._inRunner();
		/***
		 * 用于解决移动端音频不能自动播放问题
		 * 解决方法：在鼠标点击过程中主动被调用play接口时，下一帧要是包含音频数据，则播放
		 */
		//console.log(window.isClicking);
		//if(window.isClicking){
		window.frameStateInMouseEvent = this.getStateByFrame(this.getNextFrame()); 
		//}
    },
    gotoAndPlay: function (frame) {
        this.goto(frame);
        this.play();
    },
    gotoAndStop: function (frame) {
        this.stop();
        this.goto(frame);
    },
    stop: function () {
        if (!this._isRunning) return;
        this._outRunner();
    },
    goto: function (frame) {
        var frameIdx = 0;
        if (typeof frame === 'number') {
			frame--;
			frame = Math.min(this.frameCount - 1, frame);
			frame = Math.max(0, frame);
            frameIdx = frame;
        } else if (typeof frame === 'string') {
            frameIdx = this.getFrameIdxByName(frame);
			//帧名不存在
			if (frameIdx < 0) return;
        }

        this.frame = frameIdx;

        this._renderFrame();

    },
	getNextFrame: function () {
        var f = this.frame;
        if (f < this.frameCount - 1)
            return (f + 1);
        return 0;
    },
    getPrevFrame: function () {
        return this.prevFrame;
    },
	/***
	 * 从时间轴移出一个元素，从此该元素不在受此时间轴影响
	 */
	removeElement: function (element) {
		var lays = this.layers;
		for (var i = 0, ilen = lays.length; i < ilen; i++) {
			var fqs = lays[i].frameQueues;
			for (var j = 0, jlen = fqs.length; j < jlen; j++) {
				var fs = fqs[j].frames;
				for (var k = 0, klen = fs.length; k < klen; k++) {
					var f = fs[k];
					if (f.removeElement(element)) {
						return true;
					}
				}
			}
		}

		return false;
	},
	/***
	 * 设置一个随帧执行函数
	 * 不受本时间轴运行影响
	 */
	setEnterFrame: function (handler, context) {
		this.customEnterFrameObj.handler = handler;
		this.customEnterFrameObj.context = context;
	},
	/***
	 * 根据帧名获取帧索引，如果获取不到，返回-1
	 */
	getFrameIdxByName: function (frameName) {
		var lays = this.layers;
		for (var i = 0, len = lays.length; i < len; i++) {
			var lay = lays[i];
			var frames = lay.frames;
			for (var j = 0, jlen = frames.length; j < jlen; j++) {
				if (frames.name === frameName)
					return j;
			}
		}
		return -1;
	},
	/***
	 * 添加子timeline，子timeline会跟随父级timeline的帧移动
	 */
	// addChildTimeline: function (tl) {
	// 	if(!tl || !(tl instanceof Timeline)) return false;
	// 	this.childrenTL[tl.timelinePoolId] = this.currentframe;
	// },
	/**
	 * 设置父级timeline，如果设置了父级，则该timeline指针完全随着父亲级移动
	 */
	setParent : function(tl){
		this._parentTL = tl;
		this._parentInnerFrame = tl.currentframe;
	},
	_getOriginalPrevFrame: function () {
		var f = this.frame;
		if (f == 0) {
			return this.frameCount - 1;
		}
		return (this.frame - 1);
	},
    _renderFrame: function () {
		var self = this;
		//记录当前指针
		this.currentframe = this.frame;
        render(this.context);
        this.prevFrame = this.frame;
    },
    _runFrameHandler: function (frame) {
        if (frame !== undefined && this._innerFrame < 0){
            this._innerFrame = frame;
		}
        this._renderFrame(this.frame);
		
		if(!this._parentTL){
        	this.frame = this.getNextFrame();
		}else{
			//如果设置了父级timeline，则随父级timeline运动
			this.frame = Math.max(Math.min(this._parentTL.currentframe - this._parentInnerFrame, this.frameCount - 1), 0);
		}
        if (this.frame == this.defaultStopFrame) {
            this.stop();
        }
    },
    _inRunner: function () {
        this._isRunning = true;
        var self = this;
		// self._runFrameHandler();
        Runner.addHandler(this.timelinePoolId, function (frame) {
            self._runFrameHandler.apply(self, [frame]);
        });
    },
    _outRunner: function () {
        this._isRunning = false;
        this._innerFrame = -1;
        Runner.removeHandler(this.timelinePoolId);
    }
};

var Layer = function (config) {
    this.frameCount = config.frameCount;
    this.layerType = config.layerType;
    this.name = config.name;
	this.frames = [];
    this.frameQueues = [];
};

Layer.prototype = {
    addFrameQueue: function (frameQueueObj) {
        this.frameQueues.push(frameQueueObj);
		this.frames.concat(frameQueueObj.frames);
    }
};

var FrameQueue = function (config) {
    this.duration = config.duration;
    this.startFrame = config.startFrame;
    this.type = config.type;
    this.frames = [];
};

FrameQueue.prototype = {
    addFrame: function (frameObj) {
        this.frames.push(frameObj);
    }
};

var Frame = function (config) {
    this.name = config.name || null;
    this.isEmpty = config.isEmpty;
    this.isKeyFrame = config.isKeyFrame;
	
	if(!config.isPNGSheet){
		this.elements = [];
		this.elementStates = [];
		this.as = config.as;
		this.tweenTransforms = config.tweenTransforms || null;
		//建立这一帧的音频对象
		if (config.isKeyFrame && config.soundName && config.soundName != '') {
			var sound = AudioController.getAudio(config.layerId);
			if (config.soundLoopMode == 'loop') {
				sound.setRepeat(0);
			} else if (config.soundLoopMode == 'repeat') {
				sound.setRepeat(config.soundLoop);
			}
			//音频对象引用
			this.sound = sound;
			this.soundName = config.soundName;
			this.soundSync = config.soundSync;
		}
	}else{
		this.isPNGSheet = true;
		this.image = config.image;
		this.position = config.position;
		this.imageViewer = null;
	}
}

Frame.prototype = {
    addElement: function (element, state) {
        this.elements.push(element);
        this.elementStates.push(state);
    },
	removeElement: function (element) {
		var i = -1;
		$.each(this.elements, function (idx, ele) {
			if (ele == element) {
				i = idx;
				return;
			}
		});
		if (i >= 0) {
			this.elements.splice(i, 1);
			this.elementStates.splice(i, 1);
			return true;
		} else {
			return false;
		}
	}
};
