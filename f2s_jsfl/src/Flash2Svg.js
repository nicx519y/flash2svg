//xjsfl.init(this);

// load('JSONDictionPack.jsfl');
// load('Element.jsfl');
// load('Shape.jsfl');
// load('TextField.jsfl');

// load('SymbolItem.jsfl');
// load('SymbolInstance.jsfl');
// load('Timeline.jsfl');
// load('SVGExport.jsfl');

var l = new Logger('{message}', 'logs/log.json');
var globalItems;
var globalPNGSpriteItems = [];
var globalPNGSpriteSheetData = {};
var globalPNGSpriteItemNames = [];
var itemList = {};
//var Exporter;

var jsonIsEmpty = function (obj) {
    if (typeof obj == 'string' && obj == '') return true;
    if (typeof obj == 'object') {
        for (var i in obj) {
            return false;
        }
        return true;
    }
    return false;
};

var Flash2Svg = Class.extend({
	config: null,
    doc: null,
    timelineJSON: null,
    init: function (config) {
		var self = this;
		this.config = config;
        this.doc = fl.openDocument(config.srcFile);
        globalItems = $$('*');
		
		var pngitems = self.config.PNGSpriteSheetItems;
		var denpents = [];
		
		for(var i = 0; i < pngitems.length; i ++){
			denpents = denpents.concat(self.symbolDependent(pngitems[i]));
		}
		
		globalPNGSpriteItemNames = this.config.PNGSpriteSheetForDependent ? denpents : pngItems;
		
		trace(globalPNGSpriteItemNames);
		
        fl.trace('init');
		//Exporter  = new SVGExport(destfile, this.doc.width, this.doc.height);
        try {
            globalItems.reach(function (ele, index) {
                var itemType = ele.itemType,
					eleName;
					
				//资源类型元件不改名
				if (['sound', 'bitmap', 'component', 'video'].indexOf(itemType) < 0
					&& globalPNGSpriteItemNames.indexOf(ele.name) < 0) {
					if (!(ele.name.match(/^[A-Za-z][a-zA-Z0-9\.\_]+$/))) {
						var suf = itemType.charAt(0) + Math.round(Math.random() * 100);
						eleName = String(suf + 'fl' + index);
						ele.name = eleName;
					} else {
						eleName = ele.name;
					}
				} else {
					eleName = ele.name;
				}
                itemList[eleName] = ele;
				
				if(globalPNGSpriteItemNames.indexOf(ele.name) >= 0){
					globalPNGSpriteItems.push(ele);
				}
				
				// for(var i = 0, len = globalPNGSpriteItemNames.length; i < len; i ++){
					// var name = globalPNGSpriteItemNames[i];
					// var patten = new RegExp(name.replace(/[^\w\*]/g, function(mat){
					// 	return '\\' + mat;
					// }));
					// patten = patten.replace(/\*/g, '.*');
					// if(patten.test(ele.name)){
					// 	globalPNGSpriteItems.push(ele);
					// }
				// }
            });
        } catch (e) { }
		
		
		//尝试删除位图目录
		FLfile.remove(this.config.imagePath + '/image');
		
		//导出PNGSpriteSheet
		trace('export PNGSpriteSheet to [' + this.config.imagePath + ']');
		globalPNGSpriteSheetData = this.exportPNGSpriteSheet(this.config.imagePath);
		Timeline.init();
		var jsonStr = JSON.encode(this.timelineJSON);
		//导出项目文件
        this.exportSVGProject();

    },
	/***
	 * 将PNGSprite Item所包含的元件遍历出来
	 */
	symbolDependent : function(itemName){
		if(!itemName || itemName == '') return [];
		var dependent = [];
		var patten = new RegExp(itemName.replace(/[^\w\*]/g, function(mat){ return '\\'+mat; }).replace(/\*/g, '.*'));
		
		globalItems.reach(function(item, index){
		
			if(!patten.test(item.name)) return;
			if(!item.timeline) return;
			var lays = item.timeline.layers;
			var dep = [item.name];
			
			for(var i = 0; i < lays.length; i++){
				var lay = lays[i];
				var frames = lay.frames;
				var flen = frames.length;
				for(var j = 0; j < flen; j ++){
					var frame = frames[j];
					var eles = frame.elements;
					var elen = eles.length;
					for(var k = 0; k < elen; k ++){
						var ele = eles[k];
						if(ele.elementType != 'instance' || ele.instanceType != 'symbol') continue;
						dep.push(ele.libraryItem.name);
						dep = dep.concat(arguments.callee(ele.libraryItem.name));
					}
				}
			}
			
			dep = Utils.toUniqueArray(dep);
			dependent = dependent.concat(dep);
		});
		
		dependent = Utils.toUniqueArray(dependent);
		
		return dependent;
	},
	
	/***
	 * 导出音频文件
	 */
	exportSoundFile: function (projectPath) {
		var pool = SymbolItem.srcPool.sound;
		var soundFolder = projectPath + '/sound';
		//尝试删除音频目录
		FLfile.remove(soundFolder);

		for each(var sud in pool) {
			//音频元件名称
			var name = sud.name;
			var t = sud.originalCompressionType;
			var result = false;
			var file = soundFolder + '/' + name;
			
			if (!(/\.(wav|mp3)$/.test(file))) {
				if (t == 'RAW') {
					file += '.wav';
				} else {
					file += '.mp3';
				}
			}
			
			result = sud.exportToFile(file);
			
			if (result) {
				trace('Export sound [' + name + '] success!');
			} else {
				trace('Export sound [' + name + '] failed!');
			}
		}
	},
	/***
	* 导出位图文件
	*/
	exportBitmapFile: function(projectPath) {
		var pool = SymbolItem.srcPool.bitmap;
		var imageFolder = projectPath + '/image';
	
		for each(var bmp in pool) {
			//音频元件名称
			var name = bmp.name;
			var t = bmp.originalCompressionType;
			var result = false;
	
			var file = imageFolder + '/' + name;
			if (!(/\.(jpg|png)$/.test(file))) {
				if (t == 'photo') {
					file += '.jpg';
				} else {
					file += '.png';
				}
			}
	
			result = bmp.exportToFile(file);
	
			if (result) {
				trace('Export bitmap [' + name + '] success!');
			} else {
				trace('Export bitmap [' + name + '] failed!');
			}
		}
	},
	/***
	 * 导出PNG序列元件
	 */
	exportPNGSpriteSheet : function(projectPath){
		var pool = globalPNGSpriteItems;
		
		var imageFolder = projectPath + '/image';
		var exporter = new SpriteSheetExporter;
		//var datas = 'var f2sPNGSpriteSheet = {};\n';
		var datas = {};
		
		FLfile.createFolder(projectPath + '/image');
		
		for each(var item in pool){
			var filename = imageFolder + '/pngsheet_' + item.name.replace(/\s/g, '___').replace(/\//g, '---');
			exporter.beginExport();			//初始化exporter
			exporter.addSymbol(item);		//添加转换元件
			exporter.layoutFormat = 'JSON';	//数据格式为JSON
			exporter.allowTrimming = false;	//剪裁白边
			exporter.shapePadding = 2;		//间隔像素
			exporter.canBorderPad = true;	//支持边框填充
			exporter.canTrim = true;		//支持形状剪裁
			
			var data = exporter.exportSpriteSheet(filename, {
				format : 'png',
				bitDepth : 32,
				backgroundColor : '#00000000'
			}, false);
			datas[item.name] = JSON.decode(data);
			
			trace('Export PNGSpriteSheet ['+item.name+'] success!');
		}
		
		return datas;
	},
	createAsCode: function(asArr) {
		var asStr = '';
		for (var i = 0, len = asArr.length; i < len; i++) {
			var asjson = asArr[i];
			asStr += '<script id="AsCode_No' + i + '" type="text/template" item="' + asjson['item'].replace(/\//g, '____') + '" layer="' + asjson['layer'] + '" frame="' + asjson['frame'] + '" >\n';
			asStr += asjson['code'] + '\n';
			asStr += '</script>\n';
		}
		return asStr;
	},
	exportSVGProject: function() {
		
		Timer.start('export SVG project');
		
		var libs = {};
		var self = this;
		var symbolItems = globalItems;
		var pngItems = this.config.PNGSpriteSheetItems;
		
		var pool = globalPNGSpriteItemNames;
		
		symbolItems.reach(function (element, index, elements) {
			var itemName = element.name;
			
			if(pool.indexOf(itemName) < 0){
				var item = new SymbolItem(element);
			}else{
				var item = new PNGSpriteSheetItem(element);
			}
			libs[itemName] = item.getJSON();
		});
	
		var resultData = {
			'version' : '2.0',
			'stage': {
				id: this.doc.name,
				width: this.doc.width,
				height: this.doc.height,
				backgroundColor: this.doc.backgroundColor,
				frameRate: this.doc.frameRate,
				asVersion: this.doc.asVersion,
				timeline: Timeline.getTimelineJSON('stage')
			},
			'library': libs
		};
				
		//config内容
		var projectName = this.config.srcFile.replace(/^.+\/|\.fla$/g, '');
		var tplPath = this.config.tempURI;
		var htmlPath = this.config.htmlPath;
		var configPath = this.config.configPath;
		var soundPath = this.config.soundPath;
		var imagePath = this.config.imagePath;
	
		var configStr = JSON.encode(resultData);
		var configHpackStr = JSON.encode(JSON.DPack(configStr));
		var asStr = this.createAsCode(Timeline.asPool);
	
		trace('read template [' + tplPath + ']');
		var tempStr = FLfile.read(tplPath);
		//as内容
		tempStr = tempStr.replace(
			/<!--\s?as-code-begin\s?-->(\n|.)*<!--\s?as-code-end\s?-->/, 
			'<!-- as-code-begin -->\n' + asStr + '\n<!-- as-code-end -->'
		);
		//导出音频文件
		trace('export sound to [' + soundPath + ']');
		this.exportSoundFile(soundPath);
		
		//导出位图文件
		trace('export image to [' + imagePath + ']');
		this.exportBitmapFile(imagePath);
		
		//写文件		
		trace('write to html [' + htmlPath + ']');
		var result = FLfile.write(htmlPath, tempStr);
		var PNGSheetStr = 'var f2sPNGSpriteSheet=' + JSON.encode(globalPNGSpriteSheetData);
		
		result &&
		(result = FLfile.write(configPath, 'var f2sConfig=' + configHpackStr + '\n' + PNGSheetStr));
		(result = FLfile.write(configPath+'.ori.json', 'var f2sConfig=' + configStr + ';\n' + PNGSheetStr));
	
		if (result) {
			trace('Export config success!');
		} else {
			trace('Export config failed!');
		}
		
		
		Timer.stop();
	}
});

//new Flash2Svg(F2S_CONFIG);
