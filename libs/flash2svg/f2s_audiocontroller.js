var AudioController = {
	supportType : '',
	audioSrcList : {},
	audioList : {},
	sysAudio : null,

	init: function (srcList) {
		AudioController.audioSrcList = srcList;
	},
	
	getAudio: function (layerId) {
		var audio = AudioController.audioList[layerId] || (new AudioPlayer(layerId));
		AudioController.audioList[layerId] = audio;
		
		return audio;
	},
	/***
	 * 获得支持的音频格式
	 */
	getSupportType: function(){
		
		if('' != AudioController.supportType){
			return AudioController.supportType;
		}
		
		var testAudio = new Audio();
		var sup = testAudio.canPlayType('audio/mpeg');
		if(['maybe', 'probably'].indexOf(sup) >= 0){
			AudioController.supportType = '.mp3';
			return '.mp3';
		}else{
			AudioController.supportType = '.wav';
			return '.wav';
		}
	},
	
	getSrc: function(srcName){
		var src = 'sound/' + AudioController.audioSrcList[srcName];
		var sup = AudioController.getSupportType();
		src = src.replace(/(\.mp3|\.wav)$/, sup);
		return src;
	}
}

var AudioPlayer = function () {
	this._repeat = 1;		//总共播放重复数
	this._nowRepeat = 0;	//目前重复次数
	this._timer = 0;
	this._dur = 0;
	this._playing = false;
	this._startTimeStamp = 0;	//开始播放的时间戳
	this.init();
};

AudioPlayer.prototype = {
	init: function () {
		// this.obj = this.createAudio();
	},
	createAudio : function(src){
		var self = this;
		var a = new Audio();
		a.preload = 'metadata';
		a.autoPlay = false;
		src && (a.src = src);
		a.loop = (this._repeat > 1 || this._repeat == 0); 
		a.addEventListener('ended', function (evt) {
			self._ended.call(self, evt);
		});
		a.addEventListener('play', function(evt){
			self._played.call(self, evt);
		});
		a.addEventListener('timeupdate', function(evt){
			self._timeupdate.call(self, evt);
		});
		return a;
	},
	/***
	 * 设置重复播放的次数
	 * repeatNum 0 表示无限重复，1 重复1次...
	 */
	setRepeat: function (repeatNum) {
		this._repeat = repeatNum;
	},
	/***
	 * 播放音频
	 * start 开始播放的时间
	 * seek 指定播放时间
	 */
	play: function (src, start, seek) {
		if(this._playing || (this.obj && this.obj.src == src)) return;
		this._playing = true;
		
		if(this.obj) this.obj.pause();
		
		var args = arguments;
		var self = this;
		if(typeof args[0] === 'string'){
			var src = args[0];
			var start = args[1] || 0;
			var seek = args[2] || 0;
		}else if(typeof args[0] === 'number'){
			if(!this.src || this.src === '') return;
			var start = args[0] || 0;
			var seek = args[1] || 0;
		}else{
			if(!this.src || this.src === '') return;
		}
		var realSrc = AudioController.getSrc(src);
		/***
		 * 未知原因，有时候IE下无法直接播放原来的audio对象
		 */
		this._nowRepeat = 0;
		var a = this.createAudio(realSrc);
		this.obj = a;
		this.obj.play();
	},
	replay: function (src, seek) {
		this.stop();
		if(typeof src === 'string'){
			this.play(src, 0, seek);
		}else{
			this.play(0, seek);
		}
	},
	pause: function () {
		this._playing = false;
		this.obj && this.obj.pause();
	},
	stop: function () {
		this._playing = false;
		this._nowRepeat = 0;
		this.obj && this.obj.pause();
	},
	/***
	 * 监听播放结束事件，判断重复播放次数
	 */
	_ended: function (evt) {
		var t = (evt.path ? evt.path[0] : evt.target);
		//var isIE = F2slibs.browser().isIE;
		this._nowRepeat++;
		if(this._repeat != 0 && this._nowRepeat >= this._repeat){
			console.log('end');
			t.removeEventListener('ended', arguments.callee);
			this._playing = false;
			this._newRepeat = 0;
			t.pause();
		}
	},
	/***
	 * 监听开始播放事件，记录开始时间戳
	 */
	_played : function(evt){
		this._startTimeStamp = evt.timeStamp;
	},
	/***
	 * 监听播放时间更新事件，如果设置了播放长度
	 */
	_timeupdate : function(evt){
		var t = (evt.path ? evt.path[0] : evt.target);
		//设置了播放长度的话，做一个时间差判断
		if(this._dur > 0 && (evt.timeStamp - this._startTimeStamp >= this._dur * 1000))
			t.pause();
	}
};
