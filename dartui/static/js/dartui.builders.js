function updateTorrentUploadForm() {
	buildTorrentUploadFileTable();
	return(torrentUploadHTML);
}
function addTorrentUploadTriggers() {
	document.getElementById('files').addEventListener('change', handleFileSelect, false);
	$("#torrent_upload").submit(function(e) {
		e.preventDefault();
		torrentUploadHTML.find("span").eq(-1).text("penis");
		$(this).fileupload({url : "/file_upload_action", paramName : "files"});
		$(this).fileupload("send", {files : gFilesToUpload});
		$(this).bind("fileuploadprogress", function(e, data) {
			console.log(e);
			console.log(data);
		});
		$(this).fileupload("destroy");
	});
	
	$("#torrent_upload input[value='Cancel']").click(function() {
		gFilesToUpload = [];
		updateTorrentUploadForm();
		hideDropDown();
	});
	
	$("#upload #close").unbind();
	$("#upload #close").click(function() {
		/* get the position of the close button within the array of all the close buttons
		and therefore the position of the File object in gFilesToUpload */
		var pos = $("#upload #close").index($(this));
		gFilesToUpload.splice(pos, 1);
		buildTorrentUploadFileTable();
		addTorrentUploadTriggers();
	});
	
}
function buildTorrentUploadFileTable() {
	var table = torrentUploadHTML.find("table");
	var dropzone = torrentUploadHTML.find("#dropzone");
	var newTable = $("<table>");
	
	if (gFilesToUpload.length == 0) {
		dropzone.show();
		table.html("");
	} else {
		for (i=0; i<gFilesToUpload.length; i++) {
			var row = $("<tr>");
			var closeIcon = xIcon.clone().attr("width", "18px").attr("height", "18px");
			row.append($("<td>").text(gFilesToUpload[i].fileName));
			row.append($("<td>").append(closeIcon));
			newTable.append(row);
		}
		table.html(newTable.html());
		dropzone.hide();
	}
	
	torrentUploadHTML.find("span").eq(-1).text("Torrents Selected: " + gFilesToUpload.length);
}

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
	for(i=0; i<files.length; i++) {
		gFilesToUpload.push(files[i]);
	}
	buildTorrentUploadFileTable();
}
function onDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  console.log("onDragOver");
  //console.log(evt);
  evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}
function handleFileDrop(e) {
	e.stopPropagation();
	e.preventDefault();
	console.log("handleFileDrop");
	var files = e.dataTransfer.files;
	for(i=0; i<files.length; i++) {
		gFilesToUpload.push(files[i]);
	}
	
	if (isDropDownActive()) {
		updateTorrentUploadForm();
	} else {
		showDropDown(updateTorrentUploadForm());
		addTorrentUploadTriggers();
	}
}

document.addEventListener('dragover', onDragOver, false);
document.addEventListener('drop', handleFileDrop, false);