body {
	margin:0;
	padding:0; 
	pointer-events:none; 
	overflow-x:hidden; 
	overflow-y:hidden;
	position: 'relative';
	line-height: 0px;
	font-size: 0px;
}

#container, #svg-container, #svg-btns-container {
	display:inline-block;
	overflow:hidden;
}

text {
	pointer-events: none; /* Cancel the svg’s pointer-events */
	line-height: 18px;
	font-size: 12px;
	font-family: "Arial";
	dominant-baseline: middle;
}
g{
	pointer-events: all;
}
mask path {
	pointer-events: none;
	fill: #ffffff;
}
rect{
	pointer-events: all;
}