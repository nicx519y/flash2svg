var Element = Class.extend({
	init : function(obj, name){
		this._obj = obj;
	},
	getMatrix : function(){
		var m = this._obj.matrix;
		return {
			a : m.a,
			b : m.b,
			c : m.c,
			d : m.d,
			e : m.tx,
			f : m.ty
		};
	},
	getType : function(){
		return this._obj.elementType;
	},
	getDepth : function(){
		return this._obj.depth;
	},
	getFilters : function(){
		return [];
	},
	getJSON : function(){
		//todo ...
	}
});