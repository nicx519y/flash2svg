var TextField = Element.extend({
	getTextString: function () {
		return this._obj.getTextString();
	},
	getTextType: function () {
		return this._obj.textType;
	},
	getWidth: function () {
		return this._obj.width;
	},
	getHeight: function () {
		return this._obj.height;
	},
	getScrollable: function () {
		return this._obj.scrollable;
	},
	getBorder: function () {
		return this._obj.border;
	},
	getMaxCharacters: function () {
		return this._obj.maxCharacters;
	},
	getHref: function () {
		return this._obj.getTextAttr('url');
	},
	getTarget: function () {
		return this._obj.getTextAttr('target');
	},
	getAlign: function () {
		return this._obj.getTextAttr('alignment');
	},
	getTextStyle: function () {
		return {
			"color": this._obj.getTextAttr('fillColor'),
			"fontFamily": this._obj.getTextAttr('face'),
			"fontSize": this._obj.getTextAttr('size'),
			"italic": this._obj.getTextAttr('italic'),
			"marginLeft": this._obj.getTextAttr('leftMatrix'),
			"marginRight": this._obj.getTextAttr('rightMatrix'),
			"align": this.getAlign()
		}
	},
	getJSON: function () {
		var m = this._obj.matrix;
		var r = {
			a: m.a, b: m.b, c: m.c, d: m.d, e: m.tx, f: m.ty
		};
		var result = {
			"x": this._obj.x,
			"y": this._obj.y,
			"type": this.getType(),
			"instanceId": this._obj.name,
			"getFilters": this.getFilters(),
			"textString": this.getTextString(),
			"textType": this.getTextType(),
			"width": this.getWidth(),
			"height": this.getHeight(),
			"scrollable": this.getScrollable(),    //是否可以滚动
			"border": this.getBorder(), //是否显示边框
			"maxCharacters": this.getMaxCharacters(), //最大字符数
			"href": this.getHref(),
			"target": this.getTarget(),
			"textStyle": this.getTextStyle(),
			"matrix": r
		};
		for (var i in result) {
            if (jsonIsEmpty(result[i])) {
                delete result[i];
            }
        }
		return result;
	}
});
