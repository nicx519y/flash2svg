
(function(wnd){
	
	wnd.eMain = wnd.eMain || {};
	var stage = wnd.stage || {};
	
	/******************* pApi begin ******************/

	wnd.eMain.reset = function () {
		stage.reset && stage.reset();
	};

	wnd.eMain.lock = function () {
		stage.lock && stage.lock();
	};

	wnd.eMain.unlock = function () {
		stage.unlock && stage.unlock();
	};

	wnd.eMain.showCorrectAnswers = function () {
		stage.showCorrectAnswers && stage.showCorrectAnswers();
	};

	wnd.eMain.hideCorrectAnswers = function () {
		stage.hideCorrectAnswers && stage.hideCorrectAnswers();
	};

	wnd.eMain.loadState = function (state) {
		stage.loadState && stage.loadState();
	};

	wnd.eMain.saveState = function () {
		if(typeof stage.saveState === 'function'){
			return stage.saveState();
		}else{
			return {};
		}
	};
	
	/******************* pApi end ******************/
	
	$(function(){
		FastClick.attach(document.body);
		var stage = new Stage();
		wnd.stage = stage;
		SysButton.init();
	});
	
})(window);
