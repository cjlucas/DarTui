function getLoadingIconAttributes(color) {
	var iconAttr = {
		src : "/static/imgs/loading_" + color + ".gif",
		height : "20px",
		width : "20px",
	};
	return(iconAttr)
}
function testLoadIcon() {
	var elem = $(".play_pause_icon").eq(0);
	var elemOrigSrc = elem.attr("src");
	log(elem);
	
	var req = $.ajax({
		type : "GET",
		url : "/get_torrents",
		async : false,
		dataType : "json",
		beforeSend : function () {
			//elem.attr(getLoadingIconAttributes("2d2d2d"));
		},
		complete : function () {
			console.log("SUCCESS");
			console.log(elem);
			//elem.replaceWith($("<img>").attr("src", "/static/imgs/rehash_icon_hover.png"));
			//console.log(elemOrigSrc);
			//elem.attr("src", "/static/imgs/rehash_icon_hover.png");
			
		},
		error : function (a, b, c) {
			console.log("ERROR");
			console.log(a);
			console.log(b);
			console.log(c);
		}
	});
}