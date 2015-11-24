var SymbolInstance = Element.extend({
    getLibraryItem : function(){
        return this._obj.libraryItem.name;
    },
    getInstanceId : function(){
        return this._obj.name;
    },
    getSymbolType : function(){
        return this._obj.symbolType;
    },
    getColorEffect : function(){

        //..... 其他效果 unfinished

        return {
            'colorAlphaAmount' : this._obj.colorAlphaAmount,
            'colorAlphaPercent' : this._obj.colorAlphaPercent,
            'colorBlueAmount' : this._obj.colorBlueAmount,
            'colorBluePercent' : this._obj.colorBluePercent,
            'colorGreenAmount' : this._obj.colorGreenAmount,
            'colorGreenPercent' : this._obj.colorGreenPercent,
            'colorRedAmount' : this._obj.colorRedAmount,
            'colorRedPercent' : this._obj.colorRedPercent
        };
	},
    getJSON : function(){
        var result = {
            'name' : this.name,
            'x' : this._obj.x,
            'y' : this._obj.y,
			'width' : this._obj.width,
			'height' : this._obj.height,
			'left' : this._obj.left,
			'top' : this._obj.top,
            'transformX' : this._obj.transformX,
            'transformY' : this._obj.transformY,
            'type' : this.getType(),
			'instanceType' : this._obj.instanceType,
            'symbolType' : this.getSymbolType(),
            'depth' : this.getDepth(),
            'libraryItem' : this.getLibraryItem(),
            'instanceId' : this.getInstanceId(),
            'filters' : this.getFilters(),
            'color' : this.getColorEffect(),
            'matrix' : this.getMatrix()
        };

        for(var i in result){
            if(jsonIsEmpty(result[i])){
                delete result[i];
            }
        }

        return result;
    }
});
