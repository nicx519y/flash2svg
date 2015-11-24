
var F2slibs = {
	numOptimize : true,	//是否做数值上的优化，坐标值取整
	isArray : function(v){ 
		return toString.apply(v) === '[object Array]'; 
	},
	f2i : function(num){
		var num = Number(num);
		if(!F2slibs.numOptimize) return num;
		return (Math.round(num * 10) / 10);
	},
	fix2 : function(num){
		var num = Number(num);
		if(!F2slibs.numOptimize) return num;
		return (Math.round(num * 100) / 100);
	},
	pathDF2i : function(pathStr){
		return pathStr.replace(/[0-9\.]+/g, function(mat){
			return F2slibs.f2i(mat).toString();
		});
	},
	isPC : function(){  
		var userAgentInfo = navigator.userAgent;  
		var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");  
		var flag = true;  
		for (var v = 0; v < Agents.length; v++) {  
			if (userAgentInfo.indexOf(Agents[v]) > 0) { flag = false; break; }  
		}  
		return flag;  
	},
	browser : function(){
		var isIE = (!!window.ActiveXObject || "ActiveXObject" in window);
		var isChrome = (navigator.userAgent.indexOf("Chrome")>0);
		var isSafari =  (!isChrome && (navigator.userAgent.indexOf("Safari")>0));
		var isFirefox = (navigator.userAgent.indexOf("Firefox") > 0);
		
		return {
			isIE : isIE,
			isChrome : isChrome,
			isSafari : isSafari,
			isFirefox : isFirefox
		}	
	},     
	//十六进制颜色值的正则表达式
	/*RGB颜色转换为16进制*/
	colorHex: function (str) {
		var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6,8})$/;
		var that = str;
		if (/^(rgb|RGB)/.test(that)) {
			var aColor = that.replace(/(?:\(|\)|rgb|RGB)*/g, "").split(",");
			var strHex = "#";
			for (var i = 0; i < aColor.length; i++) {
				var hex = Number(aColor[i]).toString(16);
				if (hex === "0") {
					hex += hex;
				}
				strHex += hex;
			}
			if (strHex.length !== 7) {
				strHex = that;
			}
			return strHex;
		} else if (reg.test(that)) {
			var aNum = that.replace(/#/, "").split("");
			if (aNum.length === 6) {
				return that;
			} else if (aNum.length === 3) {
				var numHex = "#";
				for (var i = 0; i < aNum.length; i += 1) {
					numHex += (aNum[i] + aNum[i]);
				}
				return numHex;
			}
		} else {
			return that;
		}
	},

	/*16进制颜色转为RGB格式*/
	colorRgba: function (str) {
		var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6,8})$/;
		var sColor = str.toLowerCase();
		if (sColor && reg.test(sColor)) {
			if (sColor.length === 4) {
				var sColorNew = "#";
				for (var i = 1; i < 4; i += 1) {
					sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
				}
				sColor = sColorNew;
			}
			//处理六位的颜色值
			var sColorChange = [];
			for (var i = 1; i < 9; i += 2) {
				if (i < 7) {
					sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
				} else {
					if (sColor.length == 9)
						sColorChange.push(Math.round(parseInt("0x" + sColor.slice(i, i + 2)) / 255 * 10) / 10);
					else {
						sColorChange.push(1);
					}
				}
			}
			return "rgba(" + sColorChange.join(",") + ")";
		} else {
			return sColor;
		}
	},
	/***
	 * 数值转换成颜色字符串
	 */
	numberToColorString: function (color, alpha) {
		var color = Math.max(Math.min(0xffffff, color), 0x000000);
		var alpha = Math.max(Math.min(100, alpha), 0);
		var colorStr = Math.round(color).toString(16);
		var alphaStr = Math.round(alpha / 100 * 255).toString(16);

		var sd = 6 - colorStr.length;
		for (var i = 0; i < sd; i++) {
			colorStr = '0' + colorStr;
		}
		var ad = 2 - alphaStr.length;
		for (var j = 0; j < ad; j++) {
			alphaStr = '0' + alphaStr;
		}

		var result = '#' + colorStr + alphaStr;
		return result;
	},
	/***
	 * 生成一个随机字符串
	 */
	StringPool: [],
	randomString: function (len) {
		　　len = len || 32;
		　　var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
		　　var maxPos = $chars.length;
		　　var pwd = '';
		　　for (i = 0; i < len; i++) {
			　　　　pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
		　　}
		if (F2slibs.StringPool.indexOf(pwd) >= 0) {

			return F2slibs.randomString(len);
		} else {
			F2slibs.StringPool.push(pwd);
			return pwd;
		}
	},
	/***
	 * 将一个指定格式对象中的值赋值到prototype上
	 */
	ExtendPrototype: function (proto, obj, context) {
		// var ctx = (typeof context == 'string' && typeof this[context] == 'function') ? this[context].call(this) : (context || this);
		for (var i in obj) {
			if (['__getterAndSetter__'].indexOf(i) < 0) {
				if (typeof obj[i] == 'function') {
					(function (x) {
						proto[x] = function () {
							var ctx = (typeof context == 'string' &&
								typeof this[context] == 'function') ? this[context].call(this) : (context || this);
							// if(x == 'getInst'){
							// 	console.log(ctx, context, this.instance);
							// }
							if(x == 'clear'){
								var a = this.instance;
							}
							return obj[x].apply(ctx, arguments);
						};
					})(i);
				} else {
					proto[i] = obj[i];
				}
			}else{
				var gts = obj[i];
				var prop = {};
				for (j in gts){
					if (!('get' in gts[j]) && !('set' in gts[j]))
						continue;
					prop[j] = {};
					(function (y) {
						if (typeof gts[y].get === 'function') {
							prop[y].get = function () {
								var ctx = (typeof context == 'string' &&
									typeof this[context] == 'function') ? this[context].call(this) : (context || this);
								return gts[y].get.apply(ctx);
							}
						}
						if (typeof gts[y].set === 'function') {
							prop[y].set = function () {
								var ctx = (typeof context == 'string' &&
									typeof this[context] == 'function') ? this[context].call(this) : (context || this);
								gts[y].set.apply(ctx, arguments);
							}
						}
					})(j);
				}
				Object.defineProperties(proto, prop);
			}
		}
	},
	getTagPath : function(tag, path){
		var func = arguments.callee;
		var p = path || [];
		var owner = tag.ownerSVGElement; 
		if(owner && tag !== owner){
			p.push(tag);
			return func(Snap(tag).parent().node, p);
		}else{
			return p;
		}
	}
};