(function (t) {
	window.frameStateInMouseEvent = [];
    var e = {
        init: function () {
			var self = this;
            var t = Snap.selectAll(".f2s_btn");
            if (!t || t.items.length <= 0) return;
			for (var s = 0, a = t.items.length; a > s; s++){
				if(F2slibs.isPC()){
					t.items[s].mousedown(function(){
						self._downHandler.call(this);
					}).mouseup(function(){
						self._upHandler.call(this);
					});
				}else{
					t.items[s].touchstart(function(){
						self._downHandler.call(this);
					}).touchend(function(){
						self._upHandler.call(this);
					});
				}
			}
        },
		_downHandler : function(evt){
			this.select(".active_state").attr({
				display: "block"
			}),
			this.select(".default_state").attr({
				display: "none"
			});
			
			var s = this.attr("id").replace("btn_", "");
			"function" == typeof window.stage[s] && window.stage[s]();
			/***
			* 用于解决移动端音频不能自动播放问题
			* 解决方法：在鼠标点击过程中主动被调用play接口时，下一帧要是包含音频数据，则播放
			*/
			// if(this.attr('id') === 'btn_play'){
			// 	e.afterPlay();
			// }
		},
		_upHandler : function(evt){
			this.select(".active_state").attr({
				display: "none"
			});
			this.select(".default_state").attr({
				display: "block"
			});
		},
		afterPlay : function(){
			if(F2slibs.isPC()) return;
			var s = '';
			var repeat = 1;
			for(var i = 0, len = window.frameStateInMouseEvent.length; i < len; i ++){
				var sound = window.frameStateInMouseEvent[i].sound;
				if(sound){
					s = sound.src;
					repeat = sound.obj._repeat;
					break;
				}
			}
			
			if(s !== ''){
				if(!AudioController.sysAudio){
					AudioController.sysAudio = new Audio();
					AudioController.sysAudio.autoPlay = false;
				}
				
				var count = 0,
					a = AudioController.sysAudio;
				a.src = 'sound/' + s + AudioController.getSupportType();
				
				if(repeat > 0){
					count = repeat;
					a.addEventListener('ended', function(){
						if(count > 0){
							a.play();
							count --;
						}else{
							a.pause();
							a.removeEventListener('ended', arguments.callee);
						}
					});
				}else if(repeat == 0){
					a.loop = true;
				}
				a.play();
			}
			window.frameStateInMouseEvent = [];
		}
    };
    t.SysButton = e;
	
})(window);