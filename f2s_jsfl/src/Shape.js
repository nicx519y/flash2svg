var Shape = Element.extend({
	_pathObj: null,
	_fillObj: null,
	_cpoints: [],
    getJSON: function () {
		// Timer.start('processShape');
		var m = this._obj.matrix;
        var result = {
            'type': this.getType(),
            'depth': this.getDepth(),
            // 'fills': this._getFills(),
            // 'strokes': this._getStrokes(),
			'fills' : this._getFillsData(),     // 只输出源路径数据，不拼合成path string
			'strokes' : this._getStrokesData(),
			'matrix' : {
				a : m.a,
				b : m.b,
				c : m.c,
				d : m.d,
				e : m.tx,
				f : m.ty
			}
        };

        for (var i in result) {
            if (jsonIsEmpty(result[i])) {
                delete result[i];
            }
		}
		
		// Timer.stop();
        return result;
    },
	
	_getFillsData: function(){
		var data = [];
		
		var contours = this._obj.contours;
		var fill = null;
		for(var i = 0, len = contours.length; i < len; i ++){
			var contour = contours[i];
			if (contour.fill.style == 'noFill') continue;
			
			if(!this._contrastFill(fill, contour.fill)){
				fill = contour.fill;
				data.push(this._getFillsObj(contour.fill));
			}
			
			var halfEdge = contour.getHalfEdge(0);
			var id = -1;
			var segIds = [];
			while(id != halfEdge.id){
				if(id == -1){
					id = halfEdge.id;
				}
				
				var edge = halfEdge.getEdge();
				var d = this._getEdgeData(edge, segIds);
				if(d){
					data.push(d);
				}
				halfEdge = halfEdge.getNext();
			}
		}
		
		return data;
	},
	
	_getStrokesData : function(){
		var edges = this._obj.edges;
		var segIds = [];
		var data = [];
		var lastStroke = null;
		for(var i = 0, len = edges.length; i < len; i ++){
			var edge = edges[i];
			var stroke = edge.stroke;
			if(stroke.style == 'noStroke') continue;
			if(!this._contrastStroke(lastStroke, stroke)){
				lastStroke = stroke;
				data.push(this._getStrokeStyle(stroke));
			}
			
			var d = this._getEdgeData(edge, segIds);
			if(d){
				data.push(d);
			}
		}
		
		return data;
	},
	
	_getEdgeData : function(edge, segIds){
		var p = this._pointsToString;
		if(edge.isLine){
			return ([p(edge.getControl(0)), p(edge.getControl(2))]);
		}else{
			var segId = edge.cubicSegmentIndex;
			if(segIds.indexOf(segId) < 0){
				segIds.splice(0, 0, segId);
				var ps = this._obj.getCubicSegmentPoints(segId);
				return ([
					p(ps[0]), p(ps[1]), p(ps[2]), p(ps[3])
				]);
			}else{
				return null;
			}
		}
	},
	
	_getStrokeStyle : function(stroke){
		var st = stroke;
		var style = st.style;
		var linecap = (st.capType === 'none') ? 'butt' : st.capType;
		var linejoin = st.joinType;
		
		var s = {
			'stroke-linecap' : linecap,
			'stroke-linejoin' : linejoin,
			'stroke-width': st.thickness,
			'style' : st.style
		};
		
		switch(style){
			case 'dashed':
				s['stroke-dasharray'] = st.dash1 + ', ' + st.dash2; 
				break;
			case 'dotted':
				s['stroke-dasharray'] = '1 , ' + Number(st.dotSpace + st.thickness);
				break;
			default:
			// case 'solid':
			// case 'ragged':
			// case 'stipple':
			// case 'hatched':
			// 	break;
				break;
		}
		s.color = st.color;
		s.fill = st.shapeFill;
		
		if(s.fill){
			var m = s.fill.matrix; 
			s.fill.matrix = {
				a : m.a,
				b : m.b,
				c : m.c,
				d : m.d,
				e : m.tx,
				f : m.ty
			};
		}
		
		return s;	
	},
	
	_unSort: function (arr) {
		var tem = [];
		for (var i = arr.length - 1; i >= 0; i--) {
			tem.push(arr[i]);
		}
		return tem;
	},
	
	_getStrokes: function () {
		var edges = this._obj.edges;
		var path = '';
		var stroke = {};
		var strokeObj = {};
		var halfEdgeIds = [];
		var segIds = [];
		var ppsx, ppsy;
		var ppex, ppey;

		for (var i = 0, len = edges.length; i < len; i++) {
			var edge = edges[i],
				canDo = true;
			if (i == 0) stroke = edge.stroke;

			if (edge.isLine) {
				var v0 = edge.getControl(0);
				var v1 = edge.getControl(2);

				if (path == '' || v0.x != ppex || v0.y != ppey) {
					path += 'M' + v0.x + ' ' + v0.y + ' ';
					ppsx = v0.x;
					ppsy = v0.y;
				}
				path += 'L ' + v1.x + ' ' + v1.y + ' ';

				if (v1.x == ppsx && v1.y == ppsy) {
					path += 'Z';
					ppsx = undefined;
					ppsy = undefined;
				}

				ppex = v1.x;
				ppey = v1.y;
			} else {
				if (segIds.indexOf(edge.cubicSegmentIndex) < 0) {
					var p0, p1, p2, p3;
					var segId = edge.cubicSegmentIndex;
					segIds.push(segId);
					var ps = this._obj.getCubicSegmentPoints(segId);
					p0 = ps[0];
					p1 = ps[1];
					p2 = ps[2];
					p3 = ps[3];

					if (path == '' || p0.x != ppex || p0.y != ppey) {
						path += 'M' + p0.x + ' ' + p0.y + ' ';
						ppsx = p0.x;
						ppsy = p0.y;
					}
					path += 'C ' + p1.x + ' ' + p1.y + ' ' + p2.x + ' ' + p2.y + ' ' + p3.x + ' ' + p3.y + ' ';
					if (p3.x == ppsx && p3.y == ppsy) {
						path += 'Z';
						ppsx = undefined;
						ppsy = undefined;
					}
					ppex = p3.x;
					ppey = p3.y;
				}
			}

			var thisStroke = edge.stroke;
			var strokeKey = thisStroke.color + '_' + thisStroke.thickness;

			if (!strokeObj[strokeKey]) {
				strokeObj[strokeKey] = [];
			}

			if (i < len - 1) {
				var nextEdge = edges[i + 1];
				var tStroke = nextEdge.stroke;
				if (stroke.width != tStroke.width || tStroke.thickness != stroke.thickness) {
					strokeObj[strokeKey].push({
						path: path,
						stroke: stroke
					});
					path = '';
					stroke = tStroke;
				}
			} else {
				strokeObj[strokeKey].push({
					path: path,
					stroke: stroke
				});
			}
		}

		var result = [];
		for (var i in strokeObj) {
			var sarr = strokeObj[i];
			if (!sarr || !sarr.length) continue;
			var st = sarr[0].stroke;
			var style = st.style;
			var linecap = (st.capType === 'none') ? 'butt' : st.capType;
			var linejoin = st.joinType;
			
			var s = {
				'stroke-linecap' : linecap,
				'stroke-linejoin' : linejoin,
				'stroke-width': st.thickness,
				'style' : st.style
			};
			
			switch(style){
				case 'dashed':
					s['stroke-dasharray'] = st.dash1 + ', ' + st.dash2; 
					break;
				case 'dotted':
					s['stroke-dasharray'] = '1 , ' + Number(st.dotSpace + st.thickness);
					break;
				default:
				// case 'solid':
				// case 'ragged':
				// case 'stipple':
				// case 'hatched':
				// 	break;
					break;
			}
			s.color = st.color;
			s.fill = st.shapeFill;
			
			if(s.fill){
				var m = s.fill.matrix; 
				s.fill.matrix = {
					a : m.a,
					b : m.b,
					c : m.c,
					d : m.d,
					e : m.tx,
					f : m.ty
				};
			}
			
			var p = '';
			for (var j = 0, len = sarr.length; j < len; j++) {
				p += sarr[j].path;
			}
			result.push({
				path: p,
				stroke: s
			});
		}

		return result;
	},
	
	/***
	 * 判断一个contour里面是否有曲线
	 */
	_hasSegm: function (contour) {
		var halfEdge0 = contour.getHalfEdge(0);
		var mEdge;
		var hasSegm = false;
		var id0 = halfEdge0.id;
		while (true){
			mEdge = halfEdge0.getEdge();
			if (!mEdge.isLine) {
				hasSegm = true;
				break;
			} else {
				halfEdge0 = halfEdge0.getNext();
				if(halfEdge0.id == id0){
					break;
				}
			}
		}
		return hasSegm;
	},
	_pointsToString : function(point){
		return String(point.x + ', ' + point.y);
	},
	/***
	 * 获取所有点
	 */
	_getPoints: function (contour) {
		var halfEdge = contour.getHalfEdge(0);
		var id = halfEdge.id;
		var mEdge;
		var ids = [];
		var points = [];
		
		while(true){
			mEdge = halfEdge.getEdge();
			if (!mEdge.isLine && ids.indexOf(mEdge.cubicSegmentIndex) < 0) {
				ids.push(mEdge.cubicSegmentIndex);
				var ps = this._obj.getCubicSegmentPoints(mEdge.cubicSegmentIndex);
				points.push([
					this._pointsToString(ps[0]),
					this._pointsToString(ps[1]), 
					this._pointsToString(ps[2]),
					this._pointsToString(ps[3])
				]);
			} else if(mEdge.isLine) {
				points.push(this._pointsToString(halfEdge.getVertex()));
			}
			halfEdge = halfEdge.getNext();
			if (halfEdge.id == id)
				break;
		}
		return points;
	},
	_d: function (p1, p2) {
		var x1 = p1[0],
			y1 = p1[1],
			x2 = p2[0],
			y2 = p2[1];
		
		return Math.abs(Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)));
	},
	/***
	 * 获取和p1距离较近的点
	 */
	_getDSortPoint: function (p1, p2, p3) {
		var r = /(\-?[0-9\.]+)\,\s*(\-?[\-0-9\.]+)/;
		var p1p = p1.match(r).slice(1);
		var p2p = p2.match(r).slice(1);
		var p3p = p3.match(r).slice(1);
		
		var d1 = this._d(p1p, p2p);
		var d2 = this._d(p1p, p3p);
		
		if (d1 >= d2)
			return p3;
		else
			return p2;
	},
	/***
	 * 将曲线的方向确定
	 */
	_processSegmOrientation: function (points, contour) {
		var ps = points;
		if (ps.length <= 0 || !this._hasSegm(contour)) return 0;
		var ori = 1;
		var p0;
		var p1;
		var idx = 0;
		//获取第一个曲线索引
		for (var i = 0, len = ps.length; i < len; i ++){
			if (typeof ps[i] != 'string') {
				idx = i;
				break;
			}
		}
		if(idx == 0){
			p0 = ps[idx];
			p1 = ps[idx + 1];
		} else {
			p0 = ps[idx - 1];
			p1 = ps[idx];
		}
		
		if (typeof p0 == 'string' && typeof p1 == 'object') {
			var np0 = p1[0];
			var np1 = p1[3];
			var ep = p0;
			var d1 = this._getDSortPoint(ep, np0, np1);
			if (d1 == np0) {
				ori = 1;
			} else {
				ori = -1;
			}
		} else if (typeof p0 == 'object' && typeof p1 == 'string'){
			var np0 = p0[0];
			var np1 = p0[3];
			var ep = p1;
			var d1 = this._getDSortPoint(ep, np0, np1);
			if (d1 == np1){
				ori = 1;
			} else {
				ori = -1;
			}
		} else if (typeof p0 == 'object' && typeof p1 == 'object') {
			if (p0[0] == p1[3])
				ori = -1;
			else if (p0[3] == p1[0])
				ori = 1;
		}
		
		return ori;
	},
	_getFills: function () {
		
		var contours = this._obj.contours;
		var path = '';
		var fillObj = [];
		
		for(var i = 0, len = contours.length; i < len; i ++) {
			var contour = contours[i];
			if (contour.fill.style == 'noFill') continue;
			
			var points = this._getPoints(contour);
			// l.log(JSON.encode(points));
			
			//曲线的方向，如果和haflEdge同向，=1，如果反向=-1，如果没有曲线=0
			var ori = this._processSegmOrientation(points, contour);
			var path = '';
			
			for (var j = 0, jlen = points.length; j < jlen; j ++){
				var p = points[j];
				if (typeof p == 'string') {
					if (j == 0) {
						path += 'M ' + p + ' ';
					} else {
						path += 'L ' + p + ' ';
					}
				} else {
					var p0, p1, p2, p3;
					
					if(ori == -1){
						p0 = p[3];
						p1 = p[2];
						p2 = p[1];
						p3 = p[0];
					} else {
						p0 = p[0];
						p1 = p[1];
						p2 = p[2];
						p3 = p[3];
					}
					
					if (j == 0){
						path += 'M ' + p0 + ' '; 
					} else {
						path += 'L ' + p0 + ' ';
					}
					path += 'C ' + p1 + ' ' + p2 + ' ' + p3 + ' ';
				}
			}
			
			path += 'Z ';
			
			//将 point + 'L' + point 这样的多余path清除
			path = path.replace(/([\-\+\d\.]+\,\s*[\-\+\d\.]+)\s*L\s*([\-\+\d\.]+\,\s*[\-\+\d\.]+)/g, function (mat, p1, p2) {
				if(p1 == p2) {
					return p1;
				} else {
					return mat;
				}
			});
			
			// l.log(path);
			
			//相同填充的路径合并
			var f = this._getFillsObj(contour.fill),
				hasSame = false;

			for (var t = 0, tlen = fillObj.length; t < tlen; t++) {
				var val = fillObj[t];
				if (this._compirFill(f, val.fill)) {
					val.path += path;
					hasSame = true;
					break;
				}
			}

			if (!hasSame) {
				fillObj.push({
					path: path,
					fill: f,
					interior: contour.interior
				});
			}

			path = '';

		}
		/*fillObj.push({
			path : path,
			fill : this._getFillsObj(contours[0])
		});*/
		return fillObj;
	},
	//比较两个fill对象是否相等
	_compirFill: function (fill1, fill2) {
		var fillStyle;
		if (fill1.style != fill2.style) return false;
		fillStyle = fill1.style;
		switch (fillStyle) {
			case 'solid':
				if (fill1.color == fill2.color)
					return true;
				else
					return false;
				break;
			case 'noFill':
				return true;
				break;
			case 'linearGradient':
			case 'radialGradient':
				var pos1 = fill1.posArray;
				var pos2 = fill2.posArray;
				var col1 = fill1.colorArray;
				var col2 = fill2.colorArray;
				if (pos1.length != pos2.length || col1.length != col2.length) return false;
				for (var i = 0, len = pos1.length; i < len; i++) {
					if (pos1[i] != pos2[i] || col1[i] != col2[i]) return false;
				}
				if (fillStyle == 'radialGradient' && fill1.focalPoint != fill2.focalPoint) return false;
				var m1 = fill1.matrix;
				var m2 = fill2.matrix;
				for (var i in m1) {
					if (m1[i] != m2[i]) return false;
				}
				break;
			case 'bitmap':
				if (fill1.bitmapIsClipped != fill2.bitmapIsClipped) return false;
				if (fill1.bitmapPath != fill2.bitmapPath) return false;
				break;

		}

		return true;
	},

	_getFillsObj: function (fill) {
		var fill = fill,
			result = {};
		switch (fill.style) {
			case 'bitmap':
				result.style = fill.style;
				result.bitmapPath = fill.bitmapPath;
				result.bitmapIsClipped = fill.bitmapIsClipped;
				result.matrix = {
					a: fill.matrix.a,
					b: fill.matrix.b,
					c: fill.matrix.c,
					d: fill.matrix.d,
					e: fill.matrix.tx,
					f: fill.matrix.ty
				};
				break;
			case 'solid':
				result.style = fill.style;
				result.color = fill.color;
				break;
			case 'linearGradient':
				result.style = fill.style;
				result.posArray = fill.posArray;
				result.colorArray = fill.colorArray;
				result.matrix = {
					a: fill.matrix.a,
					b: fill.matrix.b,
					c: fill.matrix.c,
					d: fill.matrix.d,
					e: fill.matrix.tx,
					f: fill.matrix.ty
				};

				break;
			case 'radialGradient':
				result.style = fill.style;
				result.posArray = fill.posArray;
				result.colorArray = fill.colorArray;
				result.matrix = {
					a: fill.matrix.a,
					b: fill.matrix.b,
					c: fill.matrix.c,
					d: fill.matrix.d,
					e: fill.matrix.tx,
					f: fill.matrix.ty
				};
				result.focalPoint = fill.focalPoint;

				break;
			case 'noFill':
				result.style = fill.style;

				break;
		}
		return result;
	},
	_contrastObj : function(a, b){
		if('object' !== typeof a || 'object' !== typeof b)
			return (a === b);
		for(var i in a){
			if(a[i] !== b[i]){
				return false;
			}
		}
		return true;
	},
	_contrastStroke: function(a, b){
		if(!a || !b) return false;
		if(a.style != b.style) return false;
		for(var i in a){
			if(i != 'shapeFill' && a[i] != b[i])
				return false;
		}
		if(!this._contrastFill(a.shapeFill, b.shapeFill))
			return false;
		return true;
	},
	_contrastFill: function(a, b){
		if(!a || !b) return false;
		if(a.style !== b.style) return false;
		if(a.style == 'noFill') return true;
		switch(a.style){
			case 'solid':
				return (a.color === b.color);
				break;
			case 'linearGradient':
			case 'radialGradient':
				if(a.posArray.toString() != b.posArray.toString() ||
				a.colorArray.toString() != b.colorArray.toString())
					return false;
				
				var am = a.matrix;
				var bm = b.matrix;
				for(var i in am){
					if(am[i] != bm[i]) return false;
				}
				
				if(a.style == 'radialGradient' && a.focalPoint != b.focalPoint)
					return false;
				
				break;
			case 'bitmap':
				if(a.bitmapPath != b.bitmapPath || a.bitmapIsClipped != b.bitmapIsClipped)
					return false;
				break;
		}
		return true;
	}
});
