var batchActionsHidden = true;
var isScrolling = false;
var pauseIcon = "/static/imgs/pause_icon.png";
var startIcon = "/static/imgs/play_icon.png";
var gSortKey = "name";
var sortReverse = false;
var lastBoxChecked = null;
var gSettingsArray = {};
var gTorrentArray = {};
var gRpcIdArray = [];
var gRpcIdArrayCurrentView = [];
var gFiltersArray = {};
var gClientInfo = {};
var gErrorCode = 0;

/* keep track of if the window is scrolling or not.
  scrolling while refreshRows is executing causes jerkiness */
$(window).scroll(function () {
	isScrolling = true;
	$.doTimeout( 'scroll', 250, function() {
		isScrolling = false;
	});
});

function log(msg) {
	if (gSettingsArray["debug"]) {
		console.log(msg);
	}
}

function Torrent(id) {
	this.rpcId = id;
	this.torrentRowElem		= getDefaultTorrentRow();
	this.nameElem			= this.torrentRowElem.find(".torrent_name");
	this.startStopIconElem	= this.torrentRowElem.find(".play_pause_icon");
	this.deleteIconElem		= this.torrentRowElem.find(".delete_icon");
	this.checkBoxElem		= this.torrentRowElem.find(".row_checkbox");
	this.progressBarElem	= this.torrentRowElem.find(".progressbar_container");
	this.statusElem			= this.torrentRowElem.find(".torrent_status");
	this.messageElem		= this.torrentRowElem.find(".torrent_message");
	this.downSpeedElem		= this.torrentRowElem.find(".torrent_down_speed");
	this.upSpeedElem		= this.torrentRowElem.find(".torrent_up_speed");
	this.ratioElem			= this.torrentRowElem.find(".torrent_ratio");
	this.sizeElem			= this.torrentRowElem.find(".torrent_size");
	
	this.torrentRowElem.attr("id", this.rpcId);
	this.checkBoxElem.attr("value", this.rpcId);

	this.setTorrentName = function() {
		this.nameElem.text(this.name);
	}
	this.setStartStopIcon = function() {
		//img = this.startStopIconElem.html($("<img>").addClass("play_pause_icon"));
		if (this.active == false) {
			// if paused
			this.startStopIconElem.attr("src", startIcon).attr("title", "Start");
		} else {
			this.startStopIconElem.attr("src", pauseIcon).attr("title", "Pause");
		}
	}
	this.setProgressBar = function() {
		this.progressBarElem.progressbar(
			{value : parseFloat(this.percent_complete)}
		);
		
		// get the div created by JQuery UI
		rawProgressBarElement = this.progressBarElem.children().first();
		rawProgressBarElement.removeClass("progressbar-inactive progressbar-complete progressbar-downloading");
		rawProgressBarElement.addClass(getProgressBarClass(this));
		
	}
	this.setStatus = function() {
		var setNotFound = false;
		if (this.hashing == true) {
			status_msg = "Hash checking...";
		} else if (this.hashing_queued == true) {
			status_msg = "Hash checking... (Queued)";
		} else if (this.active == false) {
			// if paused
			status_msg = "Paused."
			if (this.ctime != 0) {
				status_msg = status_msg + " " + this.time_added + " old.";
			} else {
				setNotFound = true;
			}
		} else {
			if (this.percent_complete < 100) {
				// if downloading
				if (this.eta_str == "") {
					this.eta_str = "\u221e seconds" // infinity
				}
				status_msg = "Downloading from " + this.peers_connected + " of " + this.total_peers + " peers available. " + this.eta_str + " remaining.";
			} else {
				// if seeding
				status_msg = "Seeding to " + this.peers_connected + " of " + this.total_peers + " peers available."
				if (this.ctime != 0) {
					status_msg = status_msg + " " + this.time_added + " old.";
				} else {
					setNotFound = true;
				}
			}
		}
		
		this.statusElem.text(status_msg);
		if (setNotFound && gSettingsArray["show_torrent_age"] == true) {
			this.statusElem.append($("<span>").addClass("torrent_error").text(" (Not Found)"));
		}
	}
	this.setMessage = function() {
		this.messageElem.text(this.message);
	}
	this.setDownRate = function() {
		this.downSpeedElem.text("DL: " + this.down_rate_str);
	}
	this.setUpRate = function() {
		this.upSpeedElem.text("UL: " + this.up_rate_str);
	}
	this.setRatio = function() {
		this.ratioElem.text("R: " + this.ratio);
	}
	this.setSize = function() {
		this.sizeElem.text(this.completed_str + " of " + this.total_str + " (" + this.percent_complete + "%)");
	}
	this.setTorrentStatus = function() {
		this.status = getTorrentStatus(this);
	}

	this.update = function(data) {
		// need to add reference to outer scope for "each" function
		_this = this;
		$.each(data, function(key, value) {
			//log("key = " + key);
			_this[key] = value;
		});
		
		this.setTorrentName();
		this.setStartStopIcon();
		this.setProgressBar();
		this.setStatus();
		this.setMessage();
		this.setDownRate();
		this.setUpRate();
		this.setRatio();
		this.setSize();
		this.setTorrentStatus();
	}
	this.hide = function() {
		this.torrentRowElem.hide();
	}
	this.show = function() {
		this.torrentRowElem.show();
	}
	this.getOuterHTML = function() {
		return(this.torrentRow[0].outerHTML);
	}
}

function areEqual(array1, array2) {
	/* compare two arrays */
	if (array1.length == array2.length) {
		for (i=0; i<array1.length; i++) {
			if (array1[i] != array2[i]) {
				log("areEqual: " + array1[i] + " != " + array2[i] + " (index " + i + ")");
				return(false);
			}
		}
		return(true);
	} else {
		return(false);
	}
	
}
function handleTorrentCheckBoxSelection(elem, event) {
	//var torrentRowElement = $(this).parent().parent();
	var checkBoxArray = $(".row_checkbox");
	var torrentRowArray = $(".torrent_row");
	var checkBoxIndex = checkBoxArray.index(elem);
					
	if (elem.is(":checked")) {
		if (event.shiftKey) {
			log("shift key pressed");
			if (lastBoxChecked != null) {
				if (checkBoxIndex > lastBoxChecked) {
					for (i=lastBoxChecked+1; i<=checkBoxIndex; i++) {
						checkBoxArray.eq(i).prop("checked", true);
						torrentRowArray.eq(i).addClass("torrent_row_selected");
					}
				} else {
					for (i=lastBoxChecked-1; i>=checkBoxIndex; i--) {
						checkBoxArray.eq(i).prop("checked", true);
						torrentRowArray.eq(i).addClass("torrent_row_selected");
					}
				}
			}
		} else {
			log("shift key not pressed");
			torrentRowArray.eq(checkBoxIndex).addClass("torrent_row_selected");
		}
		lastBoxChecked = checkBoxIndex;
		toggleBatchActions("show");
	}
	else {
		torrentRowArray.eq(checkBoxIndex).removeClass("torrent_row_selected");
		// hide batch actions if no checkboxes are selected
		if (!$(".row_checkbox").is(":checked")) {
			toggleBatchActions("hide");
			lastBoxChecked = null;
		}
	}
	// update selected torrent data	
	buildFooter();
}

function processTorrentData(data) {
	/* 
		process output from /get_torrents 
	*/
	rebuildTorrentRows = false;
	newRpcIdArray = [];
	gErrorCode = data["error_code"];
	for (i=0; i<data["torrents"].length; i++) {
		torrentInfo = data["torrents"][i];
		rpcId = torrentInfo.rpc_id;
		newRpcIdArray.push(rpcId);
		// check if torrents have been added
		if (typeof(gTorrentArray[rpcId]) == "undefined") {
			log("NEW TORRENT: " + rpcId);
			gTorrentArray[rpcId] = new Torrent(rpcId);
			//rebuildTorrentRows = true;
		}
		gTorrentArray[rpcId].update(torrentInfo);
	}
	// check if torrents have been removed
	$.each(gTorrentArray, function(rpcId, torrent) {
		if (newRpcIdArray.indexOf(rpcId) == -1) {
			log("TORRENT REMOVED: " + rpcId);
			delete(gTorrentArray[rpcId]);
			//rebuildTorrentRows = true;
		}
	});
	gFiltersArray["trackers"] = data["trackers"];
	buildStatusFilters();
	
	gClientInfo = data["client_info"];
	updateHeader();
	
	var newRpcIdArrayFilteredAndSorted = sortTorrents(filterTorrents(newRpcIdArray.slice(0)));
	
	// if any torrents were added or removed, regardless of current view, the filter menu should be updated
	if (!areEqual(newRpcIdArray.slice(0).sort(), gRpcIdArray.slice(0).sort())) {
		log("torrent(s) were either added or removed, rebuilding filter menu...");
		buildFilterMenu();
	}
	// if anything about the current view has changed, torrent rows should be rebuilt
	if (!areEqual(newRpcIdArrayFilteredAndSorted, gRpcIdArrayCurrentView) || areEqual(gRpcIdArray, [])) {
		log("current view has changed, rebuilding torrent rows...");
		buildTorrentRows(newRpcIdArrayFilteredAndSorted);
		// set filter menu position (there's probably a better place to put this)
		$(".filter_menu").css("top", $(".torrent_row").eq(0).offset().top + "px");
	}
	gRpcIdArray = newRpcIdArray;
	gRpcIdArrayCurrentView = newRpcIdArrayFilteredAndSorted;
}

function buildHeader(clientInfo, hideIcons) {
	var headerDiv = $("<div>");
	
	var logo = $("<div>").addClass("logo").append($("<img>").attr("src", "/static/imgs/logo.png"));
	headerDiv.append(logo);
	
	headerDiv.append($("<div>").addClass("client_info"));
	
	if (hideIcons == true) { 
		$(".header").html(headerDiv.html());
		return
	}
	
	var icons = $("<div>").addClass("icons");
	icons.append($("<img>")
				.addClass("header_icon filters_icon")
				.attr("src", "/static/imgs/filters_icon_idle.png")
				.attr("title", "Filters"));
	icons.append($("<img>")
				.addClass("header_icon settings_icon")
				.attr("src", "/static/imgs/settings_icon_idle.png")
				.attr("title", "Settings"));
	headerDiv.append(icons);
	
	
	$(".header").html(headerDiv.html());
	updateHeader(clientInfo);
	
	$(".header_icon").hover(
		function() {
			var imgSrc = $(this).attr("src");
			$(this).attr("src", imgSrc.replace("idle", "hover"));
		},
		function() {
			var imgSrc = $(this).attr("src");
			if ($(this).hasClass("filters_icon") && $(".filter_menu").css("right") == "0px") {
				// if filter menu is visible, keep hover icon
				return
			}
			$(this).attr("src", imgSrc.replace("hover", "idle"));
		}
	);
	
	$(".filters_icon").click(function () {
		toggleFilterMenu();
	});
	$(".settings_icon").click(function () {
		showDropDown(buildSettings(gSettingsArray, true));
		addSettingsTriggers();
	});
}

function updateHeader(clientInfo) {
	if (clientInfo == undefined || clientInfo["disk_free_str"] == undefined) { return }
	
	var html = "<div><b>Free: </b>" + clientInfo["disk_free_str"] + " <b>Total: </b>" + clientInfo["disk_total_str"] + " (" + clientInfo["disk_free_percentage"] + "% free)" + "</div>";
	html += "<div><b>Down: </b>" + clientInfo["down_rate"] + " <b>Up: </b> " + clientInfo["up_rate"] + "</div>";
	
	$(".client_info").html(html);
}

function toggleFilterMenu() {
	var filterMenuElem = $(".filter_menu");
	var filterIconElem = $(".filters_icon");
	if (filterMenuElem.css("right") == "0px") {
		// if showing
		// left+right padding is 20px
		var i = filterMenuElem.width() + 20;
		var elemPositionHidden = "-" + i + "px";
		if ($(".filter_checkbox").filter(":checked").length == 0){
			filterIconElem.attr("src", "/static/imgs/filters_icon_idle.png");
		}
		filterMenuElem.animate({right : elemPositionHidden}, {duration : 100});
		
	} else {
		// if hidden
		if ($(".filter_checkbox").filter(":checked").length == 0){
			filterIconElem.attr("src", "/static/imgs/filters_icon_hover.png");
		}
		filterMenuElem.animate({right : "0"}, {duration : 100});
	}
	
}

function buildFooter() {
	var footerDiv = $("<div>");
	var numTorrentsTotal = gRpcIdArray.length;
	var numTorrentsCurrentView = gRpcIdArrayCurrentView.length;
	var numTorrentsSelected = $(".torrent_row_selected").length;
	
	var numTorrentsText = numTorrentsCurrentView + " of " + numTorrentsTotal + " torrents showing";
	if (numTorrentsSelected > 0) {
		numTorrentsText += " (" + numTorrentsSelected + " selected)";
	}
	
	footerDiv.append($("<p>").text(numTorrentsText));
	footerDiv.append($("<p>").text("rTorrent v" + gClientInfo["client_version"] + 
									" - libTorrent v" + gClientInfo["library_version"] + 
									" - DarTui v" + gClientInfo["dartui_version"]));
	$(".footer").html(footerDiv.html());
}

function buildStatusFilters() {
	gFiltersArray["status"] = {};
	gFiltersArray["status"]["seeding"] = [];
	gFiltersArray["status"]["paused"] = [];
	gFiltersArray["status"]["downloading"] = [];
	gFiltersArray["status"]["hashing"] = [];
	
	$.each(gTorrentArray, function(rpcId, torrent) {
		gFiltersArray["status"][torrent.status].push(rpcId);
	});
}

function addBottomRowClasses() {
	$(".torrent_row").last().addClass("torrent_row_bottom");
	$(".dropdown_container").last().addClass("dropdown_container_bottom");
}

function getDefaultTorrentRow() {
	torrentRowDiv = $("<div>").addClass("torrent_row");
	
	// add checkbox_container and checkbox
	torrentRowDiv.append(
		$("<div>")
		.addClass("checkbox_container")
		.append($("<input>").addClass("row_checkbox")
		.attr("type", "checkbox")
		.attr("name", "row_checkbox"))
		//.attr("value", t.rpc_id))
	);
	
	playPauseDiv = $("<img>").addClass("play_pause_icon");
	actionContainerDiv = $("<div>").addClass("action_container");
	actionContainerDiv.append($("<div>").append(playPauseDiv));
	actionContainerDiv.append($("<div>").append($("<img>")
										.addClass("delete_icon")
										.attr("src", "/static/imgs/delete_icon.png")
										.attr("title", "Delete")));
	torrentRowDiv.append(actionContainerDiv);
	
	// add torrent name/eta
	torrentNameEtaContainer = $("<div>").addClass("torrent_name_eta_container");
	torrentNameEtaContainer.append($("<div>").addClass("torrent_name"));
	torrentNameEtaContainer.append($("<span>").addClass("torrent_status"));
	torrentNameEtaContainer.append($("<span>").addClass("torrent_message"));
	torrentRowDiv.append(torrentNameEtaContainer);
	
	// add speed/size
	speedSizeContainer = $("<div>").addClass("speed_size_container");
	currentSpeedContainer = $("<div>").addClass("current_speed");
	currentSpeedContainer.append($("<span>").addClass("torrent_down_speed"));
	currentSpeedContainer.append($("<span>").addClass("torrent_up_speed"));
	currentSpeedContainer.append($("<span>").addClass("torrent_ratio"));
	speedSizeContainer.append(currentSpeedContainer);
	speedSizeContainer.append($("<div>").addClass("torrent_size"));
	torrentRowDiv.append(speedSizeContainer);
	
	// add progressbar/trigger area/dropdown
	progressBarContainer = $("<div>").addClass("progressbar_container");
	//progressBarContainer = buildProgressBar(progressBarContainer, t);
	torrentRowDiv.append(progressBarContainer);
	torrentRowDiv.append($("<div>").addClass("dropdown_trigger_area"));
		
	//return(torrentRowDiv.wrap("<div>").parent());
	return(torrentRowDiv);
}

function buildSettings(currentSettings, showCurrentConnectionInfo) {
	var sections = ["RTorrent", "DarTui"];
	var fields = {
		"RTorrent" : {
			"Host" : { type : "text", name : "host", info : "Default: localhost" },
			"Port" : { type : "text", name : "port", info : "Default: 80" },
			"Username" : { type : "text", name : "username", info : "optional" },
			"Password" : { type : "password", name : "password", info : "optional" },
			//"\u00a0" : { type : "button", value : "Test Connection", class : "test_conn_button" },
		},
		"DarTui" : {
			"Show Torrent Age" : { type : "checkbox", name : "show_torrent_age", value : "checked" },
			"Debug Mode" : { type : "checkbox", name : "debug", value : "checked" },
			"Disk Usage Path" : { type : "text", name : "du_path", info : "Default: /"}
		}
	};
	
	var settingsDiv = $("<div>").addClass("settings");
	var form = $("<form>").attr("id", "settings").attr("method", "POST").attr("action", "/set_settings");
	
	$.each(fields, function(section, sectionData) {
		form.append($("<div>").addClass("welcome_title").text(section + " Settings"));
		
		if (section == "DarTui") {
			var options = {
				"5 seconds" : 5,
				"10 seconds" : 10,
				"20 seconds" : 20,
				"30 seconds" : 30,
				"1 minute" : 60,
				"2 minutes" : 120,
				"5 minutes" : 300,
				
			}
			var select = $("<select>").attr("name", "refresh_rate");
			$.each(options, function(title, value) {
				var option = $("<option>").attr("value", value).text(title);
				if (currentSettings["refresh_rate"] == value) {
					option.prop("selected", true);
				}
				select.append(option);
			});
			form.append($("<label>").text("Refresh Rate"));
			form.append(select);
			form.append($("<br>"));
		}
		
		$.each(sectionData, function(key, opts) {
			var label = $("<label>");
			label.text(key);
			if (opts.info != null) {
				label.append($("<span>").addClass("default_value").text(" (" + opts.info + ")"));
			}
		
			var input = $("<input>").attr(opts);
			if (opts.type == "checkbox"){
				input.prop("checked", currentSettings[opts.name]);
			} else if (opts.type == "text" || opts.type == "password") {
				if ((section == "RTorrent" && showCurrentConnectionInfo) || (section != "RTorrent")) {
					input.attr("value", currentSettings[opts.name]);
				}
			}

			form.append(label);
			form.append(input);
			form.append($("<br>"));
		});
		
		if (section == "RTorrent") {
			form.append($("<input>").attr({ type : "button", value : "Test Connection", class : "test_conn_button" }));
			form.append($("<span>").attr({id : "conn_test_results"}));
		}
	});

	//form.append($("<label>").text("\u00a0"));
	form.append($("<input>").attr({type : "submit", value : "Submit"}));
	settingsDiv.append(form);
		
	return(settingsDiv);
}

function addSettingsTriggers() {
	$(".test_conn_button").click(function() {
		var data = {
			"host"	: "localhost",
			"port"	: "80",
		};
		var inputFields = $("#settings input");
		$.each(inputFields, function(index, field) {
			var field = inputFields.eq(index);
			if (field.val() != "") {
				data[field.attr("name")] = field.val();
			}
		});
		var retData = simpleAjaxCall("POST", "/test_connection", data);
		$("#conn_test_results").removeClass("result_successful result_failed");
		if (retData["success"] == true) {
			$("#conn_test_results").addClass("result_successful").text("Connection Successful");
		} else {
			$("#conn_test_results").addClass("result_failed").text("Connection Failed (Error: " + retData["err_msg"] + ")");
		}
	});
}

function buildFilterMenuHeader(title, filterType) {
	var filterHeaderDiv = $("<div>").addClass("filter_menu_header");
	filterHeaderDiv.append($("<span>").addClass("filter_menu_header_name").text(title));
	filterHeaderDiv.append($("<span>").addClass("filter_menu_header_clear").data("filter-type", filterType).text("clear"));
	return(filterHeaderDiv);
}

function buildFilterMenu() {
	$(".filter_checkbox").unbind();
	var filters = {
		"Trackers"	: [gFiltersArray["trackers"], "trackers"],
		"Status"	: [gFiltersArray["status"], "status"],
	}
	var filterMenuDiv = $("<div>").addClass("filter_menu");	
	var activeFilterIds = [];
	$('.filter_checkbox').filter(":checked").each(function() {
		activeFilterIds.push($(this).data("filter-id"));
	});
	
	$.each(filters, function(filterName, filterData) {
		filterMenuDiv.append(buildFilterMenuHeader(filterName, filterData[1]));
		var filterArrayKeys = [];
		$.each(filterData[0], function(key, value) {
			filterArrayKeys.push(key);
		});
		filterArrayKeys.sort(sortString);
		
		for (i=0; i<filterArrayKeys.length; i++) {
			var key = filterArrayKeys[i];
			var filterDiv = $("<div>").addClass("filter_row");
			var inputElem = $("<input>")
							.attr("type", "checkbox")
							.attr("id", key)
							.addClass("filter_checkbox")
							.data("filter-type", filterData[1])
							.data("filter-id", key);
			
			filterDiv.append(inputElem);
			filterDiv.append($("<label>").attr("for", key).addClass("filter_label").text(key));
			// handle active filters
			if (activeFilterIds.indexOf(key) != -1) {
				log("checking key: " + key);
				inputElem.attr("checked", true);
				inputElem.next().addClass("filter_label_selected");
			}
			
			filterMenuDiv.append(filterDiv);
		}
	});
	
	$(".filter_menu").html(filterMenuDiv.children());
	
	$('.filter_menu_header_clear').click(function () {
		var filterType = $(this).data("filter-type");
		$('.filter_checkbox')
		.filter(function() { return $(this).data("filter-type") == filterType})
		.prop("checked", false);
		
		$('.filter_label_selected')
		.filter(function() { return $(this).prev().data("filter-type") == filterType})
		.removeClass("filter_label_selected");
		
		gRpcIdArrayCurrentView = sortTorrents(filterTorrents(gRpcIdArray));
		buildTorrentRows(gRpcIdArrayCurrentView);
	})
	
	$('.filter_checkbox').click(function () {
		if ($(this).is(":checked")) {
			$(this).next().addClass("filter_label_selected");
			$(".filters_icon").attr("src", "/static/imgs/filters_icon_active.png");
		} else {
			$(this).next().removeClass("filter_label_selected");
			if ($(".filter_checkbox").filter(":checked").length == 0) {
				$(".filters_icon").attr("src", "/static/imgs/filters_icon_hover.png");
			}
		}
		gRpcIdArrayCurrentView = sortTorrents(filterTorrents(gRpcIdArray));
		buildTorrentRows(gRpcIdArrayCurrentView);
	});
}

function buildTorrentRows(rpcIdArray) {
	$(".torrent_row").last().removeClass("torrent_row_bottom");
	$(".dropdown_container").last().removeClass("dropdown_container_bottom");	
	$(".torrent_row").removeClass("torrent_row_even torrent_row_odd");

	var newHtml = $("<div>");
	if (rpcIdArray.length == 0 || gErrorCode != 0) {
		var error_msg = "";
		if (rpcIdArray.length == 0) {
			error_msg = "No torrents found";
		}
		if (gErrorCode == 1) {
			error_msg = "Couldn't connect to rTorrent"
		}
		var torrentRow = $("<div>").addClass("torrent_row");
		torrentRow.append($("<p>").addClass("error_message").text(error_msg));
		newHtml.append(torrentRow);
	}
	for (i=0; i<rpcIdArray.length; i++) {
		var torrent = gTorrentArray[rpcIdArray[i]];
		newHtml = newHtml.add(torrent.torrentRowElem);
		//log(newHtml);
	}
	$(".rows_wrapper").html(newHtml);
	
	$(".torrent_row").filter(":even").addClass("torrent_row_even");
	$(".torrent_row").filter(":odd").addClass("torrent_row_odd");
	$(".torrent_row").last().addClass("torrent_row_bottom");
	$(".dropdown_container").last().addClass("dropdown_container_bottom");
	
	// update footer in case number of torrents has changed
	buildFooter()
	
	/* for some reason, when the torrents are rebuilt,
	torrent.progressBarElem becomes unset and goes back to it's default.
	so we're going to call setProgressBar after every sort
	
	edit: same with bind events too apparently...
	*/
	$.each(gTorrentArray, function(rpcId, torrent) {
		torrent.setProgressBar();
		
		torrent.startStopIconElem.click(function() {
			toggleStartStop($(this));
		})
		torrent.deleteIconElem.click(function() {
			deleteTorrent($(this));
		})
		torrent.checkBoxElem.click(function(e) {
			handleTorrentCheckBoxSelection($(this), e);
		});
	});
	
}

function sortString(a, b) {
	a = a.toLowerCase();
	b = b.toLowerCase();
	return a.localeCompare(b);
}

function sortTorrentByName(a_rpcId, b_rpcId) {
	var a = gTorrentArray[a_rpcId]["name"];
	var b = gTorrentArray[b_rpcId]["name"];
	a = a.toLowerCase();
	b = b.toLowerCase();
	return a.localeCompare(b);
}

function sortTorrentByKey(a_rpcId, b_rpcId) {
	var tor_a = gTorrentArray[a_rpcId];
	var tor_b = gTorrentArray[b_rpcId];
	var a = tor_a[gSortKey];
	var b = tor_b[gSortKey];
	//log(typeof(a));
	//log(typeof(b));
	
	// handle floats
	if (gSortKey == "percent_complete" || gSortKey == "ratio") {
		return parseFloat(a) - parseFloat(b);
	}
	
	// handle time remaining (doesn't actually work)
	if (gSortKey == "eta") {
		if (parseFloat(tor_a["percent_complete"]) == 100) {
			return -1;
		}
	}
	
	if (typeof(a) == "string") {
		a = a.toLowerCase();
		b = b.toLowerCase();
		return a.localeCompare(b);
	} else if (typeof(a) == "number") {
		return a - b;
	}
}

function toggleSortOrder(key) {
	if (key != gSortKey) {
		// if clicking a new sort key, reset sortReverse
		sortReverse = false;
	} else {
		if (sortReverse == true) {
			sortReverse = false;
		} else {
			sortReverse = true;
		}
	}
}

function sortTorrents(rpcIdArray) {
	// reset sort order back to alphabetical before sorting to what the user wants
	rpcIdArray.sort(sortTorrentByName);
	// sort based on gSortKey
	rpcIdArray.sort(sortTorrentByKey);
	
	if (sortReverse) {
		rpcIdArray.reverse();
	}
	
	return(rpcIdArray);
}

function filterTorrents(rpcIdArray) {
	var filterTypes = ["trackers", "status"];
	var activeFilters = $('.filter_checkbox').filter(":checked");
	var rpcIdArrayFiltered = rpcIdArray.slice();

	if (activeFilters.length > 0) {
		$.each(filterTypes, function (index, currentFilterType) {
			var activeFiltersCombined = [];
			var newRpcIdArrayFiltered = [];
			var updateFilteredArray = false;
			for (i=0; i<activeFilters.length; i++) {
				var filterElem = activeFilters.eq(i);
				var filterType = filterElem.data("filter-type");
				var filterId = filterElem.data("filter-id");

				if (filterType == currentFilterType) {
					updateFilteredArray = true;
					var filterArray = gFiltersArray[filterType][filterId];
					for (j=0; j<filterArray.length; j++) {
						if (activeFiltersCombined.indexOf(filterArray[j]) == -1) {
							activeFiltersCombined.push(filterArray[j]);
						}				
					}
				}
			}
			newRpcIdArrayFiltered = [];
			if (updateFilteredArray) {
				for (i=0; i<rpcIdArrayFiltered.length; i++) {
					if (activeFiltersCombined.indexOf(rpcIdArrayFiltered[i]) > -1) {
						newRpcIdArrayFiltered.push(rpcIdArrayFiltered[i]);
					}
				}
				rpcIdArrayFiltered = newRpcIdArrayFiltered.slice();
			}
		});
	}
	
	return(rpcIdArrayFiltered);
}

function handleActiveSortLink() {
	var iconClass;
	$(".sort_link").removeClass("sort_link_active");
	$(".ui-icon").removeClass("ui-icon-triangle-1-s ui-icon-triangle-1-n");
		
	if (sortReverse) {
		iconClass = "ui-icon-triangle-1-s";
	} else {
		iconClass = "ui-icon-triangle-1-n";
	}	
	var activeLink = $(".sort_link#" + gSortKey);
	activeLink.addClass("sort_link_active");
	iconElem = activeLink.next();
	iconElem.addClass(iconClass);
}

function addSortHeader() {
	sortHeaderDiv = $("<div>").addClass("sort_header");
	sortTitles = ["Name", "Age", "Total Size", "Time Remaining", "Percentage Complete", "Up Speed", "Down Speed", "Ratio"];
	sortKeys = ["name", "ctime", "total_bytes", "eta", "percent_complete", "up_rate", "down_rate", "ratio"];
	
	if (gSettingsArray["show_torrent_age"] == false) {
		// no need to show Age key
		sortTitles.splice(1, 1);
		sortKeys.splice(1, 1);
	}
	
	for (i=0; i<sortKeys.length; i++) {
		var key = sortKeys[i];
		var title = sortTitles[i];
		var sortItem = $("<span>").addClass("sort_link").attr("id", key).text(title);
		sortHeaderDiv.append(sortItem);
		var icon = $("<span>").addClass("ui-icon");
		sortHeaderDiv.append(icon);
	}
	sortHeaderDiv.wrapInner($("<p>").addClass("sort_link_set"));
	$(".sort_header").html(sortHeaderDiv.html());
	handleActiveSortLink();
	
	// add triggers
	$(".sort_link").click(function () {
		key = $(this).attr("id");
		/* dont set update gSortKey till after you call toggleSortOrder
		because it compares it's input against the old sort key */
		toggleSortOrder(key);
		gSortKey = key;
		handleActiveSortLink()
		gRpcIdArrayCurrentView = sortTorrents(filterTorrents(gRpcIdArray));
		buildTorrentRows(gRpcIdArrayCurrentView);	
	});
}

function getProgressBarClass(t) {
	var progressBarClass;
	var status = getTorrentStatus(t);
	switch (getTorrentStatus(t)) {
		case "paused":
			progressBarClass = "progressbar-inactive";
			break;
		case "hashing":
			progressBarClass = "progressbar-inactive";
			break;
		case "seeding":
			progressBarClass = "progressbar-complete";
			break;
		case "downloading":
			progressBarClass = "progressbar-downloading";
			break;
	}
	return(progressBarClass)
}

function getTorrentStatus(t) {
	var status;
	if (t.active == false) {
		status = "paused";
	} else if (t.percent_complete == 100) {
		status = "seeding";
	} else {
		status = "downloading";
	}

	if (t.hashing == true || t.hashing_queued == true) {
		status = "hashing";
	}
	return(status);
}

function centerDropDown() {
	var dropDownWidth = $(".dropdown").width();
	var wrapperWidth = $(".wrapper").width();
	var leftPos = (wrapperWidth - dropDownWidth) / 2;
	$(".dropdown").css("left", leftPos + "px");
}
function showDropDown(data) {
	var closeDiv = $("<div>").addClass("dropdown_close_button").append($("<img>").attr("src", "/static/imgs/dropdown_close.png"));
	$(".dropdown").html(data.add(closeDiv));
	centerDropDown();
	$(".dropdown").slideDown("fast");
	$(".shadow").show();
	$(".shadow").animate({opacity : "0.8"}, "fast");
	
	$(".dropdown_close_button").click(function () {
		hideDropDown();
	});
	$(".shadow").click(function () {
		hideDropDown();
	});
	
}
function hideDropDown() {
	$(".dropdown").slideUp("fast");
	$(".shadow").animate(
		{opacity : "0.0"}, 
		"fast", 
		undefined, 
		function () {
			$(".shadow").hide();
		}
	);
}

function toggleBatchActions(display) {
	var batchActionsElem = $(".batch_actions");
	
	if (display == "show") {
		batchActionsElem.animate({left : "0"}, {duration : 100});
		batchActionsHidden = false;
	} else if (display == "hide") {
		// padding is 5px
		var elemWidth = batchActionsElem.width() + 5;
		var elemPositionHidden = "-" + elemWidth + "px";
		batchActionsElem.animate({left : elemPositionHidden}, {duration : 100});
		batchActionsHidden = true;
	}
}

function addTriggers() {
	$('.batch_play_icon').click(function () {
		batchPerformTorrentAction("start");
	});
	
	$('.batch_pause_icon').click(function () {
		batchPerformTorrentAction("stop");
	});
	
	$('.batch_delete_icon').click(function () {
		batchPerformTorrentAction("delete");
	});
	
	$('.batch_rehash_icon').click(function () {
		batchPerformTorrentAction("rehash");
	});
	
	$(".batch_actions img").hover(
		function () {
			var imgSrc = $(this).attr("src");
			$(this).attr("src", imgSrc.replace("white", "hover"));
		},
		function () {
			var imgSrc = $(this).attr("src");
			$(this).attr("src", imgSrc.replace("hover", "white"));
		}
	);
	
	$(window).resize(function () {
		if ($(".dropdown").css("display") == "block") {
			centerDropDown();
		}
	})
	$(document.body).keydown(function (e) {
		log(e);
		/* keyCodes:
		27 = esc
		65 = a
		*/
		if (e.keyCode == 27) {
			deselectAllTorrentRowCheckBoxes();
		} else if (e.keyCode == 65) {
			if (e.altKey) {
				$('.row_checkbox').prop("checked", true);
				$('.torrent_row').addClass("torrent_row_selected");
				toggleBatchActions("show");
				// update selected torrent data
				buildFooter();
			}
		}
		/* batch action shortcuts */
		if (!batchActionsHidden) {
			if (e.keyCode == 83) {
				batchPerformTorrentAction("start");
			} else if (e.keyCode == 80) {
				batchPerformTorrentAction("stop");
			} else if (e.keyCode == 68) {
				batchPerformTorrentAction("delete");
			} else if (e.keyCode == 82) {
				batchPerformTorrentAction("rehash");
			}
		}
	});
}

function deselectAllTorrentRowCheckBoxes() {
	$('.row_checkbox').prop("checked", false);
	$('.torrent_row').removeClass("torrent_row_selected");
	toggleBatchActions("hide");
	// update selected torrent data
	buildFooter();
}

function batchPerformTorrentAction(mode) {
	var formData = $("form").serialize();
	log("formData");
	log(formData);
	var ret_data;

	
	if (mode == "start" || mode == "stop" || mode == "rehash") {
		data = simpleAjaxCall("GET", "/torrent", {mode : mode, rpc_ids : formData});
		log(data);
		for (i=0; i<data.length; i++) {
			var newTorrentData = data[i];
			var rpcId = newTorrentData.rpc_id;
			gTorrentArray[rpcId].update(newTorrentData)
			//$(".torrent_row#" + t.rpc_id).html(buildTorrentRow(t).children().first().html());
		}
	} else if (mode == "delete") {
		if (window.confirm("Are you sure you want to delete all selected torrents?")) {
			data = simpleAjaxCall("GET", "/torrent", {mode : mode, rpc_ids : formData});
			processTorrentData(data);
			//log("hiding row: " + rpcId);
			//gTorrentArray[rpcId].hide();
		}
	}
	deselectAllTorrentRowCheckBoxes();
}

function toggleStartStop(elem) {
	var newImg;
	var imgSrc = elem.attr("src");
	var rpcId = elem.parent().parent().parent().attr("id");
	
	if (imgSrc == pauseIcon) {
		log("icon status: paused");
		mode = "stop";
		newImg = startIcon;
	} else if (imgSrc == startIcon) {
		log("icon status: started");
		mode = "start";
		newImg = pauseIcon;
	}
	
	performTorrentAction(elem, mode, rpcId);
	
	// don't need to check ret_code, just refresh row (will probably need to eventually)
	var newTorrentData = simpleAjaxCall("GET", "/get_torrents", "rpc_id=" + rpcId);
	newTorrentData = newTorrentData["torrents"][0]; // get_torrents always returns Array
	gTorrentArray[rpcId].update(newTorrentData);
	log("newTorrentData = " + newTorrentData);
	log(newTorrentData);
	//torrentRow.html(buildTorrentRow(newTorrentData).children().first().html());
}

function deleteTorrent(elem) {
	var rpcId = elem.parent().parent().parent().attr("id");
	var mode = "delete";
	var data;
	
	if (window.confirm("Are you sure you want to delete this torrent?")) {
		data = performTorrentAction(elem, mode, rpcId);
		processTorrentData(data);
	}
}

function performTorrentAction(elem, mode, rpc_id) {
	var mode;
	var ret_value;
	var args;
	var url = "/torrent"

	log(elem);
	log(rpc_id);
	
	args = "mode=" + mode + "&rpc_ids=" + rpc_id;
	log("args = " + args);
	ret_value = simpleAjaxCall("GET", url, args);
	log("ret_value = " + ret_value);
	
	return(ret_value);
}

function simpleAjaxCall(type, url, data) {
	var gData;
	var request = $.ajax({
		url : url,
		type : type,
		data : data,
		dataType : "json",
		async : false,
	});
	
	request.done(function(ajax_data) {
		log("ajax_data = " + ajax_data);
		gData = ajax_data;
	});
	
	return(gData);
}

function refreshRows() {
	if (batchActionsHidden && !isScrolling) {
		log("refreshing rows...");
		var request = $.ajax({
			url : "get_torrents",
			type : "GET",
			dataType: "json", 
		});
	
		request.done(function(data) {
			processTorrentData(data);
		});	
	}
}
