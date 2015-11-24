var cont, iframe, initW, initH, ratio, resizeFactor, offsetLeft, offsetTop, _done=0, _errors=0;

window.init = function (empiriaAPI) {
	console.log('init');
    // expose to global for main.js
    window.eApi = empiriaAPI;

    var empiriaObject = {};

    // var ia = new InteractiveActivity(empiriaAPI);
    // get global eMain from main.js
    var ia = window.eMain;
	
    cont = $('#container');
	cont.css('margin', '0 auto');

	initW = parseInt($(cont).outerWidth());
    initH = parseInt($(cont).outerHeight());

    iframe = _.find($('iframe', parent.document), function (item) {
		$('body').css('overflow', 'hidden');
		item.scrolling = 'no';
		// item.style.marginTop = (534 - initH) / 2 + 'px';
        return item.src.indexOf('PROJECT_NAME_PLACEHOLDER') !== -1;
    });

    ratio = initH / initW;


    resizeFactor = 1;

    $(window).on('resize', function () {
        onResize();
    });

    $(window).on('unload', function () {
        $(window).off('resize');
    });

    onResize();

    empiriaObject.setStateOnExternal = function (status) {
        ia.loadState(status);
    };

    empiriaObject.getStateFromExternal = function () {
		if(typeof ia.saveState === 'function')
        	return ia.saveState();
		return {};
    };

    empiriaObject.reset = function () {
        ia.reset && ia.reset();
    };
	
	empiriaObject.showCorrectAnswers = function(){
		ia.showCorrectAnswers && ia.showCorrectAnswers();
	};
	
	empiriaObject.hideCorrectAnswers = function(){
		ia.hideCorrectAnswers && ia.hideCorrectAnswers();
	};

    empiriaObject.lock = function () {
		ia.lock && ia.lock();
    };

    empiriaObject.unlock = function () {
		ia.unlock && ia.unlock();
    };

    return empiriaObject;
};

function onResize() {
    var contWidth = $(cont).width();
    var contHeight = contWidth * ratio;
	var frameConWidth = $(iframe).parent().width();
    $(cont).css({'height': contHeight + 4 + 'px'});
    $(iframe).css({
		'width' : contWidth + 4 + 'px',
		'height': contHeight + 4 + 'px',
		'margin' : (534 - initH) / 2 + 'px 0 0 ' + (frameConWidth - contWidth - 4) / 2 + 'px'
	});
    resizeFactor = contWidth / initW;
    offsetLeft = $(cont).offset().left + $(iframe).offset().left;
    offsetTop = $(cont).offset().top + $(iframe).offset().top;
}
