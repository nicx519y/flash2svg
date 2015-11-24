var Graphics = function (container) {
	this.container = container;
	this.activeFillStyle = null;
	this.activeLineStyle = null;
	this.changed = true;
	this.paths = [];
};

Graphics.prototype = {
	_getPath: function () {
		if (!this.changed)
			return this.paths[this.paths.length - 1];
		
		var fillObj = this._getFillObj();
		var path = this.container.path('');
		if (this.activeLineStyle != null) {
			path.attr(this.activeLineStyle);
		}
		
		path.attr('fill' , fillObj);
		
		this.paths.push(path);
		this.changed = false;
		return path;
	},
	_getFillObj: function () {
		var fill = this.activeFillStyle;
		if (fill == null) return 'none';
		if (fill.type == 'solid') {
			return Fill.getSolid(fill.color);
		} else if (fill.type == 'linearGradient'){
			return Fill.getLinearGradient(
				fill.ratios,
				fill.colors,
				fill.matrix,
				'objectBoundingBox'
			);
		} else if (fill.type == 'radialGradient'){
			return Fill.getRadialGradient(
				fill.ratios,
				fill.colors,
				fill.facalPoint,
				fill.matrix,
				'objectBoundingBox'
			);
		}
		return 'none';
	},
	_mergeColorStr: function (color, alpha) {
		if (typeof color != 'number') color = 0x000000;
		if (typeof alpha != 'number') alpha = 100;
		var c = F2slibs.numberToColorString(color, alpha);
		
		return F2slibs.colorRgba(c);
	},
	_drawPath: function (pathStr) {
		var p = this._getPath();
		var attr = p.attr();
		var d = attr.d || '';
		var str = d.replace();
		str += pathStr;
		p.attr({
			'd' : str
		});
		return p;
	},
	lineStyle: function (thick, color, alpha) {
		if (typeof alpha != 'number')
			alpha = 100;
		if (typeof color != 'number')
			color = 0x000000;
		if (typeof thick != 'number')
			thick = 0;
		
		this.activeLineStyle = {
			'stroke-width': thick,
			'stroke': this._mergeColorStr(color, alpha)
		};
		this.changed = true;
	},
	beginFill: function (color, alpha) {
		if (typeof alpha != 'number')
			alpha = 100;
		if (typeof color != 'number')
			return;
		
		this.activeFillStyle = {
			type: 'solid',
			color: this._mergeColorStr(color, alpha)
		};
		
		this.changed = true;
	},
	/***
		* type : linear or radial
		*/
	beginGradientFill: function (
		type, colors, alphas, ratios, matrix,
		spreadMethod,	//not finished
		interpolationMethod,	//not finished
		focalPointRatio
		) {
		var colorArr = [];
		for (var i = 0, len = colors.length; i < len; i ++){
			var cstr = this._mergeColorStr(colors[i], alphas[i]);
			colorArr.push(cstr);
		} 
		this.activeFillStyle = {
			type: type + 'Gradient',
			ratios : ratios,
			colors: colorArr,
			matrix: matrix,
			facalPoint: focalPointRatio
		};
		this.changed = true;
	},
	/***
		* not finished
		*/
	lineGradientStyle: function (
		type, colors, alphas, ratios, matrix,
		spreadMethod,
		interpolationMethod,
		focalPointRatio
	) {
		
	},
	endFill: function () {
		if (this.activeFillStyle != null) {
			this.activeFillStyle = null;
			this.changed = true;
		}
	},
	moveTo: function (x, y) {
		this._drawPath('M' + x + ' ' + y + ' ');
	},
	lineTo: function (x, y) {
		this._drawPath('L' + x + ' ' + y + ' ');
	},
	/***
	 * 二次贝塞尔曲线
	 */
	curveTo: function (x1, y1, x2, y2) {
		this._drawPath('Q' + x1 + ' ' + y1 + ' ' + x2 + ' ' + y2 + ' ');
	},
	clear: function () {
		var ps = this.paths;
		for (var i = 0, len = ps.length; i < len; i ++){
			ps[i].remove();
		}
		this.paths = [];
		this.paths.length = 0;
		
		this.activeFillStyle = null;
		this.activeLineStyle = null;
		this.changed = true;
	}
};