var SymbolItem = Class.extend({
    _obj: null,
    init: function (obj) {
        this._obj = obj;
    },
    getTimelineJSON: function () {
        return Timeline.getTimelineJSON(this._obj.name);
    },
    getJSON: function () {
        var result = {
            'name': this._obj.name,
            'itemType': this._obj.itemType
        };

        if (['graphic', 'movie clip', 'button'].indexOf(this._obj.itemType) >= 0) {
            result.timeline = this.getTimelineJSON();
        } else if (this._obj.itemType == 'sound') {
			//推入pool，后期要导出音频文件
			SymbolItem.srcPool.sound.push(this._obj);
			//链接上资源文件名
			var src = this._obj.name;
			if (!(/\.(wav|mp3)$/.test(src))) {
				if (this._obj.originalCompressionType == 'RAW') {
					src += '.wav';
				} else {
					src += '.mp3';
				}
			}
			result.srcFile = src;
        } else if (this._obj.itemType == 'bitmap') {
			SymbolItem.srcPool.bitmap.push(this._obj);
			var src = this._obj.name;
			if (!(/\.(jpg|png)$/.test(src))) {
				if (this._obj.originalCompressionType == 'photo') {
					src += '.jpg';
				} else {
					src += '.png';
				}
			}
			result.srcFile = src;
			result.hPixels = this._obj.hPixels;
			result.vPixels = this._obj.vPixels;
		} else {
			trace('SymbolItem::getJSON - only graphic \ movie clip \ button \ bitmap \ sound be supported。', this._obj.name, this._obj.itemType);
		}

        for (var i in result) {
            if (jsonIsEmpty(result[i])) {
                delete result[i];
            }
        }

        return result;
    }
});

SymbolItem.srcPool = {
	'sound': [],
	'bitmap': [],
	'PNGSpriteSheet' : []
};