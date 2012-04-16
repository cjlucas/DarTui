function updateTorrentUploadForm() {
	buildTorrentUploadFileTable();
	addRecentDestinations();
	return(torrentUploadHTML);
}
function resetTorrentUploadForm() {
	gQueuedFiles = [];
	hideDropDown();
	updateTorrentUploadForm();
}
function addTorrentUploadTriggers() {
	document.getElementById('files').addEventListener('change', handleFileSelect, false);
	$("#torrent_upload").unbind();
	$("#torrent_upload").submit(function(e) {
		e.preventDefault();
		// filter to get only valid files
		var validQueuedFiles = gQueuedFiles.filter(function(file) { return(file.valid) });
		var validFiles = validQueuedFiles.map(function(queuedFile) { return(queuedFile.file) }); // get file objects for all valid files 
		$(this).unbind();
		
		$(this).fileupload({url : "/file_upload_action", paramName : "files"});
		$(this).fileupload("send", {files : validFiles});
		
		$(this).bind("fileuploadprogress", function(e, data) {
			setTorrentUploadStatus("Uploading... " + parseInt((data.loaded / data.total) * 100) + "% complete.");
		});
		
		$(this).bind("fileuploaddone", function(e, data) {
			log("fileuploaddone");
			var rdata = jQuery.parseJSON(data.result);
			if (rdata.success == true) {
				resetTorrentUploadForm();
				refreshRows();
			} else {
				setTorrentUploadStatus("Error: " + rdata.err_msg, true);
			}
		});
		
		$(this).bind("fileuploadalways", function(e, data) {
			log("fileuploadalways");
			$(this).fileupload("destroy");
		});
		
	});
	
	$("#torrent_upload input[value='Cancel']").unbind();
	$("#torrent_upload input[value='Cancel']").click(function() {
		resetTorrentUploadForm();
	});
	
	$("#upload #close").unbind();
	$("#upload #close").click(function() {
		/* get the position of the close button within the array of all the close buttons
		and therefore the position of the File object in gQueuedFiles */
		var pos = $("#upload #close").index($(this));
		gQueuedFiles.splice(pos, 1);
		buildTorrentUploadFileTable();
		addTorrentUploadTriggers();
	});
	
}
function buildTorrentUploadFileTable() {
	var table = torrentUploadHTML.find("table");
	var dropzone = torrentUploadHTML.find("#dropzone");
	var newTable = $("<table>");
	
	if (gQueuedFiles.length == 0) {
		dropzone.show();
		table.html("");
	} else {
		for (i=0; i<gQueuedFiles.length; i++) {
			var row = $("<tr>");
			var closeIcon = xIcon.clone().attr("width", "18px").attr("height", "18px");
			var cellHTML = $("<span>").text(gQueuedFiles[i].file.name);
			if (gQueuedFiles[i].valid == false) {
				cellHTML.append($("<b>").addClass("result_failed").text(" (Error: " + gQueuedFiles[i].reason + ")"));
			}
			row.append($("<td>").html(cellHTML));
			row.append($("<td>").append(closeIcon));
			newTable.append(row);
		}
		table.html(newTable.html());
		dropzone.hide();
	}
	
	setTorrentUploadStatus("Torrents Selected: " + gQueuedFiles.length);
}
function addRecentDestinations() {
	var optgroupElem = torrentUploadHTML.find("optgroup").html("");
	var dests = gClientInfo["recent_torrent_dests"];
	var recentsInputElem = torrentUploadHTML.find("input#recents[type='radio']")
	var recentsSelectElem = torrentUploadHTML.find("select")
	
	
	if (dests.length > 0) {
		recentsInputElem.prop("disabled", false);
		recentsSelectElem.prop("disabled", false);
		for (i=0; i<dests.length; i++) {
			optgroupElem.append($("<option>").attr("value", dests[i]).text(dests[i]));
		}
	} else {
		// don't give user anything to click
		recentsInputElem.prop("disabled", true);
		recentsSelectElem.prop("disabled", true);
		optgroupElem.append($("<option>").text("No recent destinations found"));	
	}
}
function setDefaultTorrentDestination() {
	torrentUploadHTML.find("input[id='text'][type='text']").attr("value", gSettingsArray["dest_path"]);
}
function setTorrentUploadStatus(text) {
	var error = (error != undefined) ? error : false;
	$("#upload_status").text(text);
	if (error) {
		$("#upload_status").addClass("result_failed");
	} else {
		$("#upload_status").removeClass("result_failed");
	}
}
function validateFile(file) {
	console.log("validateFile start");
	var validExts = [
		"torrent",
		"torrent.gz",
		"torrent.gzip",
		"zip",
	];
	var fileName = file.name.toLowerCase();
	var fileSize = file.size;
	var maxFileSize = 4194304; // 4 MB
	var valid;
	var reason;
	var reasons = {
		BAD_FILE_TYPE : "Only torrent / zip / gzip files allowed",
		FILE_TOO_LARGE : "File too large",
	}
	
	/* set it as invalid initially with a the reason as BAD_FILE_TYPE
	then set valid as true if a valid ext is found */
	valid = false;
	reason = reasons.BAD_FILE_TYPE;
	for (i=0; i<validExts.length; i++) {
		if (fileName.endsWith(validExts[i])) {
			valid = true;
			reason = "";
			break;
		}
	}
	
	// max size check
	if (fileSize > maxFileSize) {
		valid = false;
		reason = reasons.FILE_TOO_LARGE;
	}
	
	var retMap = {
		"file" : file,
		"valid" : valid,
		"reason" : reason,
	}
	return(retMap);
}

function queueFiles(files) {
	/* 
	I have no idea why this for loop doesn't work, so im using a while loop instead.
	but im going to leave this here as a reminder for why javascript sucks so hard
	for(i=0; i<files.length; i++) {
		gQueuedFiles.push(validateFile(files[i]));
	}*/
	var i = 0;
	while (files[i] != undefined) {
		gQueuedFiles.push(validateFile(files[i]));
		i++;
	}
}
function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
	queueFiles(files);
	buildTorrentUploadFileTable();
}
function onDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

function handleFileDrop(e) {
	e.stopPropagation();
	e.preventDefault();
	var files = e.dataTransfer.files;
	queueFiles(files);
	
	if (isDropDownActive()) {
		updateTorrentUploadForm();
	} else {
		showDropDown(updateTorrentUploadForm());
		setDefaultTorrentDestination();
	}
	addTorrentUploadTriggers();
}

document.addEventListener('dragover', onDragOver, false);
document.addEventListener('drop', handleFileDrop, false);