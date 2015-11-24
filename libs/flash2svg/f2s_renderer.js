function render(context, afterRender) {
    var tl = context.timeline,
        lays = tl.layers;
		
    var states = tl.getStateByFrame(tl.frame),
		prevStates;
		
	var prev = tl.getPrevFrame();
	
	prevStates = tl.getStateByFrame(prev);
	
    var code = '';
	
    $.each(states, function(i, state){
        //渲染
        renderFrame(state.frame, (prevStates[i] ? prevStates[i].frame : null));
		//播放音频
		(state.sound && state.sound.command) &&
		playSound(state.sound);
		//从config中获取as代码
		code += ASController.getCodeFormConfig(state, context);
    });
	
	(typeof afterRender === 'function') && afterRender.call(context);
		
	code += ASController.getCodeCustom(context.name, tl.frame);
    //run as script
    ASController.runScript(context, code, context.timeline.frame);
}

function renderFrame(frame, prevFrame) {
    if (!frame || frame.isEmpty) {
		clearFrame(prevFrame);
		return;
    }
	
    var elements = frame.elements,
        tweenTransforms = frame.tweenTransforms,
        states = frame.elementStates;
		
	if(prevFrame && prevFrame.elements){
		for(var i = 0, state; state = prevFrame.elements[i]; i++){
			if(elements.indexOf(state) < 0)
				state.remove();
		}
	}
	
	if(elements && elements.length > 0){
		for (var i = 0, ele; ele = elements[i]; i++) {
			ele.run();
			ele.changeState(states[i], tweenTransforms);
		}
	}
	/***
	 * PNG序列帧
	 */
	if(frame.isPNGSheet){
		var pos = frame.position;
		frame.PNGViewer.viewer.attr({
			display : 'block',
			width : pos.w,
			height : pos.h
		});
		frame.PNGViewer.source.attr({
			x : - pos.x,
			y : - pos.y
		});
	}
}

function playSound(sound) {
	//音频控制
	var obj = sound.obj;
	var command = sound.command.slice();
	
	var func = command.shift();
	obj[func].apply(obj, command);
	
}

function clearFrame(frame){
    if(!frame || frame.isEmpty) return;
    var elements = frame.elements;
    for(var i = 0, state; state = elements[i]; i++){
        state.remove();
    }
}