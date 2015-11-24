xjsfl.init(this);

load('../../f2s_jsfl/output/Flash2Svg.jsfl');
load('../../f2s_jsfl/output/JSONDictionPack.jsfl');
load('../../f2s_jsfl/output/Element.jsfl');
load('../../f2s_jsfl/output/Shape.jsfl');
load('../../f2s_jsfl/output/TextField.jsfl');
load('../../f2s_jsfl/output/SymbolItem.jsfl');
load('../../f2s_jsfl/output/PNGSpriteSheetItem.jsfl');
load('../../f2s_jsfl/output/SymbolInstance.jsfl');
load('../../f2s_jsfl/output/Timeline.jsfl');

trace('//////////////////////////////// begin ////////////////////////////////////////////');

var F2S_PATH = 'file:///Users/yaoxiaoyi/Documents/f2s_svn/project';
var F2S_DATA = F2S_PATH + '/data/';
var F2S_DEST = F2S_PATH + '/src';
var PROJECT = '{{projectName}}';

new Flash2Svg({
	srcFile : F2S_DATA + PROJECT + '.fla',							//数据文件
	tempURI : F2S_DEST + '/' + PROJECT + '/index.html',				//index.html模板文件
	htmlPath : F2S_DEST + '/' + PROJECT + '/index.html',			//index.html输出路径
	configPath : F2S_DEST + '/' + PROJECT + '/libs/config.json',	//配置文件输出路径
	soundPath : F2S_DEST + '/' + PROJECT,							//音频输出路径
	imagePath : F2S_DEST + '/' + PROJECT,							//图片输出路径
	PNGSpriteSheetItems : [{{PNGSpriteSheetItems}}],				//需要转换成PNGSpriteSheet元件的元件名
	PNGSpriteSheetForDependent : {{PNGSpriteSheetForDependent}}		//设置了转换PNGSpriteSheet，是否也禁止转换包含的Item
});