/***
 * 字典压缩
 */
JSON.DPack = function(json){
	
	var result = {};
	
	var decode = (typeof JSON.decode === 'function') ? (JSON.decode) : (JSON.parse);
	var encode = (typeof JSON.encode === 'function') ? (JSON.encode) : (JSON.stringify);
	
	var process = function(str){
		var keys = [];
		var temRepeat = [];
		var values = [];
		var kr = [];
		var patt = /\"([^\"]+)\"/g;
		var ret;
		
		while((ret = patt.exec(str)) !== null){
			var r = ret[1],
				i = 0;
			if((i = keys.indexOf(r)) < 0){
				keys.push(r);
				temRepeat.push(1);
			}else{
				temRepeat[i] ++;
			}
		}
		for(var j = 0, len = keys.length; j < len; j ++){
			kr.push({
				key : keys[j],
				repeat : temRepeat[j]
			});
		}
		
		var sortH = function(a, b){
			var al = a.key.length,
				bl = b.key.length,
				ar = a.repeat,
				br = b.repeat;
			if(br != ar){
				return br - ar;
			}else{
				return al - bl;
			}
		};
		//将所有的key值，根据repeat排降序，再根据length进行升序
		kr.sort(sortH);
		
		var dic = createDictionary(kr);
		
		var con = str.replace(patt, function(mat, p){
			var values = dic.values;
			var keys = dic.keys;
			var i;
			if((i = values.indexOf(p)) >= 0){
				return '"'+keys[i]+'"';
			}else{
				return '"'+p+'"';
			}
		});
		
		result = {
			dictionary : dic.kvs,
			content : decode(con)
		};
		
		return result;
	};
	
	var isArray = function(v){
		return toString.apply(v) === '[object Array]';
	};
	
	var createDictionary = function(kr){
		var keys = [];
		var values = [];
		var kvs = {};
		var k = 'A';
		for(var i = 0, len = kr.length; i < len; i ++){
			values.push(kr[i].key);
			keys.push(k);
			
			kvs[k] = kr[i].key;
			
			k = getNextChar(k);
		}
		return {
			keys : keys,
			values : values,
			kvs : kvs
		};
	};
	
	var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ'; 
	
	var nextChar = function(s){
		var i = chars.indexOf(s);
		if(i < chars.length - 1){
			return chars.charAt(i + 1);
		}else{
			return false;
		}
	};
	
	var inIndex = function(indexs){
		var max = chars.length - 1;
		for(var i = 0, len = indexs.length; i < len; i ++){
			var idx = indexs[i];
			if(idx <= max) continue;
			if(i == len - 1){
				indexs = [];
				for(var j = 0; j <= len; j ++){
					indexs.push(0);
				}
				break;
			}else{
				indexs[i] = 0;
				indexs[i + 1] ++;
				return inIndex(indexs);
			}
		}
		return indexs;
	};
	
	var getNextChar = function(s){
		var strArr = s.split('');
		var max = chars.length - 1;
		
		var indexArr = [];
		for(var i = strArr.length - 1; i >= 0; i --){
			indexArr.push(chars.indexOf(strArr[i]));
		}
		indexArr[0] ++;
		indexArr = inIndex(indexArr);
		
		
		strArr = [];
		for(var j = indexArr.length - 1; j >= 0; j --){
			strArr.push(chars.charAt(indexArr[j]));
		}
		return strArr.join('');
	};
	
	
	if(typeof json === 'object'){
		return process(encode(json));
	}else if(typeof json === 'string'){
		return process(json);
	}
};

JSON.unDPack = function(json){
	var dic = json.dictionary;
	var con = json.content;
	var decode = (typeof JSON.decode === 'function') ? (JSON.decode) : (JSON.parse);
	var encode = (typeof JSON.encode === 'function') ? (JSON.encode) : (JSON.stringify);
	
	var contentStr = encode(con);
	
	var result = contentStr.replace(/\"([^\s\"]+)\"/g, function(mat, p){
		return '"'+((p in dic)?dic[p]:p)+'"';
	});
	
	return decode(result);
	
};