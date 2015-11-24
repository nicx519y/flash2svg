/***
 * 填充对象，目前主要是shape在调用
 */
var Fill = {
	getSolid: function (color) {
		return F2slibs.colorRgba(color);
	},
	getBitmap: function (path, matrix) {
		var path = path,
			m = matrix;
		m = new Snap.Matrix(m.a, m.b, m.c, m.d, m.e, m.f);
		return Fill._getDefBitmapFill(path, m);
	},
	getLinearGradient: function (posArr, colorArr, matrix, gradientUnits) {
		var pa = posArr,
			ca = colorArr,
			m = matrix;
		var str = 'L(-150%, 0, 100%, 0)';
		for (var i = 0, len = ca.length; i < len; i++) {
			str += F2slibs.colorRgba(ca[i]);
			if (i != 0 && i != len - 1) {
				str += ':' + String(Math.round(pa[i] / 255 * 100));
			}
			if (i != len - 1) {
				str += '-';
			}
		}
		if (m) {
			m = new Snap.Matrix(m.a, m.b, m.c, m.d, m.e, m.f);
		} else {
			m = new Snap.Matrix();
		}
		return Fill._getDefGradientFill(str, m, gradientUnits);
	},
	getRadialGradient: function (posArr, colorArr, focalPoint, matrix, gradientUnits) {
		var pa = posArr,
			ca = colorArr,
			m = matrix,
			fx = Number(0 + 0 * focalPoint / 255) + '%';

		var str = 'R(0%, 0%, 170%, ' + fx + ', 0%)';
		for (var i = 0, len = ca.length; i < len; i++) {
			str += F2slibs.colorRgba(ca[i]);
			if (i != 0 && i != len - 1) {
				str += ':' + String(Math.round(pa[i] / 255 * 100));
			}
			if (i != len - 1) {
				str += '-';
			}
		}
		m = new Snap.Matrix(m.a, m.b, m.c, m.d, m.e, m.f);
		return Fill._getDefGradientFill(str, m, gradientUnits);
	},
	_getDefBitmapFill: function (libName, matrix) {
		//DefsPool的存在是为了存一个标识，防止重复生成
		for (var i in DefsPools) {
			var def = DefsPools[i];
            if (def.type == 'bitmap' && def.path == libName && def.matrix == matrix.toTransformString()) {
                return 'url(#' + i + ')';
            }
        }
		var pattern = window.svg.select('#bitmap_' + libName.replace(/\.(png|jpg)$/, '')).clone();
		// if (matrix) {
		// 	pattern.attr({
		// 		'patternTransform': matrix
		// 	});
		// }
		var id = pattern.id;
		DefsPools[id] = {
			type: 'bitmap',
			path: libName,
			matrix: matrix.toTransformString()
		};
		//.....todo bitmapfill的实现并没有完成
		return pattern;
	},
    _getDefGradientFill: function (str, matrix, gradientUnits) {
        var m = matrix;
		var gradientUnits = gradientUnits || 'userSpaceOnUse';
        for (var i in DefsPools) {
			var def = DefsPools[i];
            if (def.type == 'gradient' && def.str == str && def.matrix == matrix.toTransformString()) {
                return 'url(#' + i + ')';
            }
        }
        if (matrix) {
            var result = window.svg.gradient(str).attr({
                'gradientTransform': m,
				'gradientUnits' : gradientUnits
            });
        } else {
            var result = window.svg.gradient(str).attr({
				'gradientUnits' : gradientUnits
			});
        }
        var id = result.id;

        DefsPools[id] = {
			type: 'gradient',
			str: str,
			matrix: m.toTransformString()
		};
        return result;
    }
};