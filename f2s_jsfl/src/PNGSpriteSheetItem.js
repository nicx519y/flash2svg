/***
 * 被设定为作为png序列导出的元件
 */
var PNGSpriteSheetItem = SymbolItem.extend({
	getJSON : function(){
		var result = {
			'name': this._obj.name,
			'itemType': this._obj.itemType,
			'isPNGSpriteSheet': true
		};
		
		if (['graphic', 'movie clip', 'button'].indexOf(this._obj.itemType) >= 0) {
			result.timeline = this.getTimelineJSON();
		}else{
			return null;
		}
		
		SymbolItem.srcPool.PNGSpriteSheet.push(this._obj);
		
		for (var i in result) {
            if (jsonIsEmpty(result[i])) {
                delete result[i];
            }
        }
		
		return result;
	}
});