var batchActionsHidden = true;
var isScrolling = false;
//var pauseIcon = "/static/imgs/pause_2d2d2d.svg";
//var startIcon = "/static/imgs/start_2d2d2d.svg";
var gSortKey = "name";
var sortReverse = false;
var lastBoxChecked = null;
var gSettingsArray = {};
var gTorrentArray = {};
var gRpcIdArray = [];
var gRpcIdArrayCurrentView = [];
var gFiltersArray = {};
var gClientInfo = {};
var gQueuedFiles = [];
var gErrorCode = 0;

var iconColorIdle = "#2d2d2d";
var iconColorHover = "#f99400";
var iconColorActive = "#34b915";
var iconColorBatch = "#ffffff";

var startIcon = $('<svg version="1.2" baseProfile="tiny" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 20 20" overflow="inherit" xml:space="preserve"><g id="play_1_"><path id="toggle_color" d="M18.606,10.361L1.671,19.898c-0.239,0.199-0.463,0.096-0.463-0.229V0.331c0-0.326,0.222-0.428,0.461-0.229l16.95,9.537C18.858,9.837,18.846,10.163,18.606,10.361z"/></g></svg>');
var pauseIcon = $('<svg version="1.2" baseProfile="tiny" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 20 20" overflow="inherit" xml:space="preserve"><g id="pause_1_"><path id="toggle_color" d="M8.438,19.375C8.438,19.719,8.156,20,7.812,20h-3.75c-0.344,0-0.625-0.281-0.625-0.625V0.625C3.438,0.281,3.719,0,4.062,0h3.75c0.344,0,0.625,0.281,0.625,0.625V19.375z M16.562,0.625C16.562,0.281,16.281,0,15.938,0h-3.75c-0.344,0-0.625,0.281-0.625,0.625v18.75c0,0.344,0.281,0.625,0.625,0.625h3.75c0.344,0,0.625-0.281,0.625-0.625V0.625z"/></g></svg>');
var deleteIcon = $('<svg version="1.2" baseProfile="tiny" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 20 20" overflow="inherit" xml:space="preserve"><g id="remove_x5F_2"><path id="toggle_color" d="M13.544,10l6.272-6.272c0.245-0.247,0.245-0.65,0-0.895L17.17,0.187c-0.245-0.245-0.647-0.245-0.894,0l-6.274,6.274L3.725,0.183c-0.246-0.245-0.648-0.245-0.894,0L0.185,2.831c-0.246,0.243-0.246,0.646,0,0.895l6.277,6.276l-6.274,6.274c-0.244,0.244-0.244,0.647,0,0.894l2.646,2.646c0.246,0.244,0.651,0.244,0.895,0l6.273-6.273l6.271,6.271c0.245,0.244,0.649,0.244,0.895,0l2.647-2.648c0.244-0.243,0.244-0.647,0-0.894L13.544,10z"/></g></svg>');
var rehashIcon = $('<svg version="1.2" baseProfile="tiny" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 20 20" overflow="inherit" xml:space="preserve"><g id="refresh"><path id="toggle_color" d="M17.976,16.072c-3.236,4.262-9.229,5.224-13.642,2.189l-0.049-0.033l-1.274,1.677c-0.139,0.183-0.304,0.151-0.367-0.068l-1.487-5.218c-0.062-0.221,0.073-0.4,0.303-0.398l5.425,0.032c0.229,0.002,0.305,0.151,0.165,0.335l-1.246,1.642c3.305,2.235,7.764,1.508,10.178-1.671c1.491-1.963,1.856-4.426,1.221-6.63h2.574C20.362,10.681,19.808,13.66,17.976,16.072z M2.796,12.102C2.16,9.897,2.526,7.434,4.017,5.471C6.43,2.292,10.89,1.565,14.195,3.8l-1.247,1.642c-0.139,0.183-0.064,0.333,0.165,0.334l5.425,0.033c0.229,0.001,0.366-0.178,0.304-0.398l-1.487-5.217c-0.063-0.221-0.229-0.252-0.366-0.069l-1.275,1.677l-0.049-0.033C11.252-1.266,5.259-0.305,2.023,3.957C0.19,6.369-0.363,9.349,0.224,12.102H2.796L2.796,12.102z"/></g></svg>');
var settingsIcon = $('<svg version="1.2" baseProfile="tiny" id="settings" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="35px" height="35px" viewBox="0 0 35 35" overflow="inherit" xml:space="preserve"><path id="toggle_color" d="M35,17.502C35,27.167,27.164,35,17.5,35S0,27.167,0,17.502C0,7.833,7.836,0,17.5,0S35,7.833,35,17.502z"/><g id="cogwheels"><path id="cogwheels_1_" fill="#FFFFFF" d="M22.117,15.097c0.019-0.22,0.03-0.438,0.034-0.659c0-0.224-0.012-0.445-0.03-0.663l-1.384-0.351c-0.071-0.458-0.19-0.902-0.35-1.328l1.031-0.991c-0.188-0.401-0.408-0.785-0.657-1.145l-1.379,0.388c-0.286-0.356-0.609-0.682-0.964-0.971l0.397-1.376c-0.36-0.25-0.739-0.476-1.141-0.665l-0.999,1.026c-0.421-0.165-0.864-0.286-1.322-0.36l-0.344-1.388c-0.216-0.02-0.437-0.033-0.659-0.031c-0.222-0.002-0.443,0.008-0.662,0.027L13.34,7.996c-0.458,0.07-0.903,0.19-1.327,0.352l-0.992-1.033c-0.401,0.186-0.783,0.406-1.144,0.656l0.39,1.378c-0.359,0.286-0.686,0.61-0.972,0.966L7.919,9.916c-0.251,0.36-0.476,0.741-0.664,1.14l1.025,1c-0.166,0.42-0.286,0.863-0.361,1.323L6.531,13.72c-0.018,0.22-0.03,0.438-0.031,0.661c-0.001,0.223,0.009,0.441,0.026,0.659l1.385,0.353c0.072,0.461,0.191,0.903,0.353,1.325L7.229,17.71c0.188,0.403,0.408,0.784,0.657,1.144l1.377-0.387c0.287,0.357,0.61,0.684,0.967,0.973l-0.399,1.375c0.36,0.252,0.74,0.477,1.139,0.666l1.001-1.025c0.42,0.16,0.863,0.285,1.32,0.357l0.341,1.387c0.22,0.021,0.44,0.035,0.663,0.037c0.224,0,0.442-0.014,0.66-0.031l0.353-1.383c0.459-0.072,0.904-0.189,1.325-0.35l0.991,1.033c0.402-0.188,0.787-0.406,1.146-0.66l-0.388-1.377c0.356-0.285,0.684-0.611,0.973-0.967l1.375,0.398c0.25-0.357,0.477-0.738,0.667-1.138l-1.027-1c0.164-0.421,0.287-0.863,0.36-1.321L22.117,15.097z M14.312,17.571c-1.746-0.009-3.156-1.429-3.149-3.175c0.006-1.746,1.427-3.156,3.173-3.149c1.747,0.006,3.158,1.427,3.151,3.172C17.478,16.166,16.058,17.577,14.312,17.571zM28.473,23.068l-0.999-0.379c-0.094-0.404-0.243-0.783-0.443-1.131l0.479-0.957c-0.243-0.324-0.523-0.613-0.839-0.871l-0.977,0.439c-0.339-0.211-0.71-0.377-1.108-0.482l-0.338-1.016c-0.196-0.027-0.396-0.045-0.602-0.049c-0.203-0.006-0.407,0.008-0.605,0.027l-0.375,1c-0.403,0.092-0.781,0.24-1.127,0.439l-0.96-0.479c-0.321,0.246-0.614,0.523-0.868,0.836l0.438,0.979c-0.217,0.338-0.379,0.711-0.485,1.111l-1.017,0.34c-0.027,0.193-0.047,0.398-0.05,0.602c-0.004,0.207,0.005,0.404,0.025,0.607l1.002,0.375c0.091,0.404,0.24,0.783,0.441,1.127l-0.476,0.959c0.241,0.324,0.525,0.617,0.835,0.871l0.979-0.439c0.337,0.213,0.708,0.377,1.107,0.484l0.336,1.014c0.198,0.029,0.4,0.045,0.604,0.051c0.206,0.004,0.407-0.006,0.604-0.027l0.379-1c0.4-0.092,0.777-0.24,1.127-0.441l0.956,0.479c0.325-0.242,0.619-0.525,0.873-0.838l-0.441-0.977c0.213-0.336,0.379-0.709,0.486-1.111l1.014-0.332c0.03-0.201,0.047-0.402,0.051-0.607C28.503,23.469,28.495,23.266,28.473,23.068z M23.511,25.396c-1.005-0.021-1.805-0.852-1.783-1.857c0.019-1.006,0.85-1.805,1.856-1.785c1.005,0.02,1.803,0.852,1.784,1.857C25.35,24.615,24.518,25.416,23.511,25.396z"/></g></svg>');
var filtersIcon = $('<svg version="1.2" baseProfile="tiny" id="filters" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="35px" height="35px" viewBox="0 0 35 35" overflow="inherit" xml:space="preserve"><path id="toggle_color" d="M35,17.5C35,27.168,27.164,35,17.5,35C7.834,35,0,27.168,0,17.5C0,7.834,7.834,0,17.5,0C27.164,0,35,7.834,35,17.5z"/><path fill="#FFFFFF" d="M15.177,8.577c-0.15-0.15-0.447-0.273-0.66-0.273h-6.88c-0.213,0-0.387,0.174-0.387,0.386v6.882c0,0.212,0.123,0.51,0.273,0.659l10.353,10.355c0.151,0.149,0.397,0.149,0.547,0l7.107-7.11c0.151-0.149,0.151-0.396,0-0.544L15.177,8.577z M12.136,13.189c-0.604,0.604-1.583,0.604-2.188,0c-0.604-0.604-0.604-1.583,0-2.187s1.583-0.604,2.188,0C12.739,11.606,12.739,12.585,12.136,13.189z M29.896,19.751l-6.561,6.561c-0.151,0.15-0.513,0.388-0.622,0.348c-0.108-0.041-0.32-0.197-0.472-0.348l-0.533-0.532c-0.15-0.151-0.15-0.397,0-0.548l5.481-5.48c0.15-0.151,0.391-0.515,0.348-0.622c-0.041-0.111-0.198-0.321-0.348-0.473L17.383,8.85c-0.15-0.15-0.362-0.347-0.406-0.372c-0.042-0.025-0.106-0.074-0.142-0.11s0.109-0.065,0.322-0.065h1.612c0.213,0,0.7,0.061,0.824,0.137c0.122,0.075,0.346,0.26,0.496,0.41l9.807,9.806c0.15,0.151,0.308,0.365,0.349,0.473C30.286,19.238,30.047,19.6,29.896,19.751z"/></svg>');
var uploadIcon = $('<svg version="1.2" baseProfile="tiny" id="upload" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="35px" height="35px" viewBox="0 0 35 35" overflow="inherit" xml:space="preserve"><circle id="toggle_color" cx="17.5" cy="17.5" r="17.5"/><g id="download_x5F_alt_1_"><g><path fill="#FFFFFF" d="M10.618,14.485c-0.138-0.179-0.065-0.336,0.161-0.336h4.096V5.777c0-0.228,0.229-0.428,0.456-0.428h4.396c0.227,0,0.39,0.201,0.39,0.428v8.372h4.176c0.227,0,0.296,0.156,0.158,0.335l-6.663,7.737c-0.139,0.179-0.366,0.179-0.504-0.001L10.618,14.485z"/></g><g><path fill="#FFFFFF" d="M27.528,21.973h-0.402h-1.312H9.153H8.75H7.437C7.197,21.973,7,22.171,7,22.411v2.222v1.277v0.438h0.437h1.751h16.625h1.748H28V25.91v-1.277v-2.222C28,22.171,27.769,21.973,27.528,21.973z M26.249,24.598h-1.748v-0.874h1.748V24.598z"/></g></g></svg>');
var sortIconAsc = $('<svg version="1.2" baseProfile="tiny" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="10px" height="5px" viewBox="0 0 20 10" overflow="inherit" xml:space="preserve"><g id="play_1_"><path id="toggle_color" d="M10.362,0.105L19.9,9.736C20.098,9.873,19.994,10,19.67,10H0.331c-0.325,0-0.428-0.127-0.229-0.262l9.538-9.64C9.838-0.038,10.163-0.03,10.362,0.105z"/></g></svg>');
var sortIconDesc = $('<svg version="1.2" baseProfile="tiny" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="10px" height="5px" viewBox="0 0 20 10" overflow="inherit" xml:space="preserve"><g id="play_1_"><path id="toggle_color" d="M9.638,9.895L0.1,0.264C-0.098,0.127,0.006,0,0.33,0h19.34c0.324,0,0.428,0.127,0.229,0.262l-9.537,9.641C10.162,10.037,9.837,10.03,9.638,9.895z"/></g></svg>');
var xIcon = $('<svg version="1.2" baseProfile="tiny" id="close" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"x="0px" y="0px" width="35px" height="35px" viewBox="0 0 35 35" overflow="inherit" xml:space="preserve"><g id="circle_x5F_remove"><path id="toggle_color" d="M29.875,5.126c-6.834-6.834-17.916-6.834-24.75,0c-6.834,6.834-6.834,17.913,0,24.748c6.835,6.834,17.916,6.835,24.748,0C36.709,23.04,36.709,11.959,29.875,5.126z M22.551,25.58c-0.277,0.278-0.732,0.278-1.01,0l-2.525-2.524l-1.01-1.011L17.5,21.54l-0.505,0.505l-1.01,1.011l-2.526,2.524c-0.278,0.278-0.732,0.278-1.011,0l-3.03-3.03c-0.277-0.277-0.277-0.732,0-1.01l2.525-2.525l1.011-1.01l0.505-0.505l-0.505-0.505l-1.011-1.01l-2.525-2.524c-0.277-0.279-0.277-0.734,0-1.011l3.03-3.03c0.278-0.278,0.732-0.278,1.011,0l2.526,2.524l1.01,1.011L17.5,13.46l0.506-0.505l1.01-1.011l2.525-2.524c0.277-0.278,0.732-0.278,1.01,0l3.031,3.03c0.277,0.277,0.277,0.732,0,1.01l-2.525,2.525l-1.012,1.01L21.541,17.5l0.504,0.505l1.012,1.01l2.525,2.525c0.277,0.278,0.277,0.733,0,1.01L22.551,25.58z"/></g></svg>');

var settingsHTML = $(simpleAjaxCall("GET", "/static/modules/settings.html", "", "html"));
var torrentUploadHTML = $(simpleAjaxCall("GET", "/static/modules/upload.html", "", "html"));

// set default colors
changeIconColor(sortIconAsc, "#ffffff");
changeIconColor(sortIconDesc, "#ffffff");
changeIconColor(xIcon, "#b9b9b9");

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

function changeIconColor(iconElem, color) {
	iconElem.find("#toggle_color").attr("fill", color);
	return(iconElem);
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
	this.startIcon			= changeIconColor(startIcon.clone(), iconColorIdle).attr("id", "start");
	this.pauseIcon			= changeIconColor(pauseIcon.clone(), iconColorIdle).attr("id", "stop");
	
	this.torrentRowElem.attr("id", this.rpcId);
	this.checkBoxElem.attr("value", this.rpcId);

	this.setTorrentName = function() {
		this.nameElem.text(this.name);
	}
	this.setStartStopIcon = function() {
		//img = this.startStopIconElem.html($("<img>").addClass("play_pause_icon"));
		if (this.active == false) {
			// if paused
			this.startStopIconElem.html(this.startIcon);
		} else {
			this.startStopIconElem.html(this.pauseIcon);
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

function buildHeader(hideIcons) {
	var headerDiv = $("<div>");
	
	var logo = $("<div>").addClass("logo").append($("<img>").attr("src", "/static/imgs/logo.svg"));
	headerDiv.append(logo);
	
	headerDiv.append($("<div>").addClass("client_info"));
	
	if (hideIcons == true) { 
		$(".header").html(headerDiv.html());
		return
	}
	
	var icons = $("<div>").addClass("icons");
	icons.append(changeIconColor(uploadIcon, iconColorIdle));
	icons.append(changeIconColor(filtersIcon, iconColorIdle));
	icons.append(changeIconColor(settingsIcon, iconColorIdle));
	headerDiv.append(icons);
	
	
	$(".header").html(headerDiv.html());
	updateHeader();
	
	$(".icons svg").hover(
		function() {
			if ($(this).attr("id") == "filters" && $(".filter_checkbox").filter(":checked").length > 0) { return }
			changeIconColor($(this), iconColorHover);
		},
		function() {
			if ($(this).attr("id") == "filters" && $(".filter_menu").css("right") == "0px") {
				// if filter menu is visible, keep hover icon
				return
			} else if ($(this).attr("id") == "filters" && $(".filter_checkbox").filter(":checked").length > 0) { return }
			changeIconColor($(this), iconColorIdle);
		}
	);
	
	$(".icons svg#filters").click(function () {
		toggleFilterMenu();
	});
	$(".icons svg#settings").click(function () {
		showDropDown(buildSettings(gSettingsArray, true));
		addSettingsTriggers();
	});
	$(".icons svg#upload").click(function() {
		showDropDown(updateTorrentUploadForm());
		addTorrentUploadTriggers();
		setDefaultTorrentDestination();
	});
}

function updateHeader() {
	if (gClientInfo == undefined || gClientInfo["disk_free_str"] == undefined) { return }
	
	var html = "<div><b>Free: </b>" + gClientInfo["disk_free_str"] + " <b>Total: </b>" + gClientInfo["disk_total_str"] + " (" + gClientInfo["disk_free_percentage"] + "% free)" + "</div>";
	html += "<div><b>Down: </b>" + gClientInfo["down_rate"] + " <b>Up: </b> " + gClientInfo["up_rate"] + "</div>";
	
	$(".client_info").html(html);
}

function toggleFilterMenu() {
	var filterMenuElem = $(".filter_menu");
	var filterIconElem = $(".icons svg#filters");
	if (filterMenuElem.css("right") == "0px") {
		// if showing
		var elemPositionHidden = "-" + filterMenuElem.outerWidth() + "px";
		if ($(".filter_checkbox").filter(":checked").length == 0){
			changeIconColor(filterIconElem, iconColorIdle);
		}
		filterMenuElem.animate({right : elemPositionHidden}, {duration : 100});
		
	} else {
		// if hidden
		if ($(".filter_checkbox").filter(":checked").length == 0){
			changeIconColor(filterIconElem, iconColorHover);
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
	gFiltersArray["status"]["active"] = [];
	
	$.each(gTorrentArray, function(rpcId, torrent) {
		// add seeding/paused/downloading/hashing status
		gFiltersArray["status"][torrent.status].push(rpcId);
		
		// add active status
		if (torrent.down_rate > 0 || torrent.up_rate > 0) {
			gFiltersArray["status"]["active"].push(rpcId);
		}
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
	
	actionContainerDiv = $("<div>").addClass("action_container");
	actionContainerDiv.append($("<div>").addClass("play_pause_icon"));
	actionContainerDiv.append($("<div>").addClass("delete_icon").append(changeIconColor(deleteIcon.clone(), iconColorIdle)));
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
	var settingsDiv = settingsHTML.clone();
	
	// handle text fields (only if showCurrentConnectionInfo is true)
	$.each(settingsDiv.find("input[type='text'], input[type='password']"), function(index, field) {
		var field = settingsDiv.find("input[type='text'], input[type='password']").eq(index); // use eq to get the jquery object
		var name = field.attr("name");
		// don't fill in values of certain fields if showCurrentConnectionInfo is false
		if (!showCurrentConnectionInfo && ["host", "port", "username", "password"].indexOf(name) > -1) { return }
		field.attr("value", currentSettings[name])
	});
	
	// handle checkbox fields
	$.each(settingsDiv.find("input[type='checkbox']"), function(index, field) {
		var field = settingsDiv.find("input[type='checkbox']").eq(index); // use eq to get the jquery object
		var name = field.attr("name");
		field.prop("checked", currentSettings[name]);
	});
	
	// handle dropdowns
	$.each(settingsDiv.find("select"), function(index, field) {
		var field = settingsDiv.find("select").eq(index); // use eq to get the jquery object
		var name = field.attr("name"); // name attr is stored in the parent element (<select>)
		field.find("option[value='" + currentSettings[name] + "']").prop("selected", true);
		
	});
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
			var field = inputFields.eq(index); // use eq to get the jquery object
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

function buildBatchActionsMenu() {
	var batchIcons = {
		"start" : startIcon.clone(),
		"stop" : pauseIcon.clone(),
		"delete" : deleteIcon.clone(),
		"rehash" : rehashIcon.clone(),
	}
	
	$.each(batchIcons, function(id, icon) {
		changeIconColor(icon, iconColorBatch)
		icon.attr("id", id);
		$(".batch_actions").append(icon);
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
		
		// check if active filter icon should be removed
		if ($(".filter_checkbox").filter(":checked").length == 0) {
			changeIconColor($(".icons svg#filter"), iconColorHover);
		}
		
		gRpcIdArrayCurrentView = sortTorrents(filterTorrents(gRpcIdArray));
		buildTorrentRows(gRpcIdArrayCurrentView);
	})
	
	$('.filter_checkbox').click(function () {
		if ($(this).is(":checked")) {
			$(this).next().addClass("filter_label_selected");
			changeIconColor($(".icons svg#filters"), iconColorActive);
		} else {
			$(this).next().removeClass("filter_label_selected");
			// check if active filter icon should be removed
			if ($(".filter_checkbox").filter(":checked").length == 0) {
				changeIconColor($(".icons svg#filters"), iconColorHover);
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
		});
		torrent.deleteIconElem.click(function() {
			deleteTorrent($(this));
		});
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
	
	// workaround for age sorting
	if (gSortKey == "ctime") {
		rpcIdArray.reverse();
	}
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
	$(".sort_link").removeClass("sort_link_active");
	
	var activeLink = $(".sort_link#" + gSortKey);
	var iconElem = activeLink.next();
	var icon = (sortReverse) ? sortIconDesc : sortIconAsc;

	activeLink.addClass("sort_link_active");
	iconElem.html(icon);
}

function addSortHeader() {
	sortHeaderDiv = $("<div>").addClass("sort_header");
	sortTitles = ["Name", "Age", "Total Size", "Time Remaining", "Percentage Complete", "Up Speed", "Down Speed", "Ratio"];
	sortKeys = ["name", "ctime", "total_bytes", "eta", "percent_complete", "up_rate", "down_rate", "ratio"];
	
	if (gSettingsArray["show_torrent_age"] == false) {
		// don't show Age key if show_torrent_age is disabled
		sortTitles.splice(1, 1);
		sortKeys.splice(1, 1);
	}
	
	for (i=0; i<sortKeys.length; i++) {
		var key = sortKeys[i];
		var title = sortTitles[i];
		var sortItem = $("<span>").addClass("sort_link").attr("id", key).text(title);
		sortHeaderDiv.append(sortItem);
		sortHeaderDiv.append($("<span>").addClass("sort_icon")); // icon placeholder
	}
	sortHeaderDiv.wrapInner($("<p>").addClass("sort_link_set"));
	$(".sort_header").html(sortHeaderDiv.html());
	handleActiveSortLink();
	
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
	//var dropDownWidth = $(".dropdown").outerWidth();
	var documentWidth = $(document).outerWidth();
	var dropDownWidth = (documentWidth * 0.6) + 100; // width: 60% + 100px of padding
	var leftPos = (documentWidth - dropDownWidth) / 2;
	$(".dropdown").css("left", leftPos + "px");
}
function showDropDown(data) {
	var closeDiv = $("<div>").addClass("dropdown_close_button").append($("<img>").attr("src", "/static/imgs/dropdown_close.png"));
	$(".dropdown").html(data.add(closeDiv));
	centerDropDown();
	$(".dropdown").slideDown("fast");
	$(".shadow").show();
	$(".shadow").animate({opacity : "0.8"}, "fast");
	
	$(".dropdown_close_button, .shadow").click(function () {
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

function isDropDownActive() {
	return($(".dropdown").css("display") == "block");
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
	/*$('.batch_play_icon').click(function () {
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
	});*/
	$('.batch_actions svg').click(function () {
		batchPerformTorrentAction($(this).attr("id"));
	})
	
	$(".batch_actions svg").hover(
		function () {
			changeIconColor($(this), iconColorHover);
		},
		function () {
			changeIconColor($(this), iconColorBatch);
		}
	);
	
	$(window).resize(function () {
		if ($(".dropdown").css("display") == "block") {
			centerDropDown();
		}
	})
	$(document.body).keydown(function (e) {
		log(e);
		// for security
		if (e.metaKey) { return }
		
		if (e.keyCode == 27) { // esc
			deselectAllTorrentRowCheckBoxes();
		} else if (e.keyCode == 65 && e.altKey) { // alt+a
			$('.row_checkbox').prop("checked", true);
			$('.torrent_row').addClass("torrent_row_selected");
			toggleBatchActions("show");
			// update selected torrent data
			buildFooter();
		} else if (e.keyCode == 70) { // f
			toggleFilterMenu();
		}
		
		/* batch action shortcuts */
		if (!batchActionsHidden) {
			if (e.keyCode == 83) { // s
				batchPerformTorrentAction("start");
			} else if (e.keyCode == 80) { // p
				batchPerformTorrentAction("stop");
			} else if (e.keyCode == 68) { // d
				batchPerformTorrentAction("delete");
			} else if (e.keyCode == 82) { // r
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
	var ret_data;
	
	log("formData");
	log(formData);
	
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
	// elem is this div.play_pause_icon
	var rpcId = elem.parent().parent().attr("id");
	// the mode is the id of the svg, which is the first child of elem
	var mode = elem.children().eq(0).attr("id");
	performTorrentAction(elem, mode, rpcId);
	
	// don't need to check ret_code, just refresh row (will probably need to eventually)
	var newTorrentData = simpleAjaxCall("GET", "/get_torrents", "rpc_id=" + rpcId);
	newTorrentData = newTorrentData["torrents"][0]; // get_torrents always returns Array
	gTorrentArray[rpcId].update(newTorrentData);
	log("newTorrentData = " + newTorrentData);
	log(newTorrentData);
}

function deleteTorrent(elem) {
	// elem is this div.play_pause_icon
	var rpcId = elem.parent().parent().attr("id");
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
	var url = "/torrent";

	log(elem);
	log(rpc_id);
	
	args = "mode=" + mode + "&rpc_ids=" + rpc_id;
	log("args = " + args);
	//ret_value = simpleAjaxCall("GET", url, args);
	var reest = $.ajax({
		type : "GET",
		dataType : "json",
		url : url,
		data : args,
		async : false,
		success : function (data) {
			ret_value = data;
		},
	});
	log("ret_value = " + ret_value);
	
	return(ret_value);
}

function simpleAjaxCall(type, url, data, dataType) {
	var _data;
	var dataType = (dataType != undefined) ? dataType : "json"; // default for dataType is json
	var request = $.ajax({
		url : url,
		type : type,
		data : data,
		dataType : dataType,
		async : false,
	});
	
	request.done(function(data) {
		_data = data;
	});
	return(_data);
}

function refreshRows() {
	if (batchActionsHidden && !isScrolling) {
		log("refreshing rows...");
		var data = simpleAjaxCall("GET", "/get_torrents", "");
		processTorrentData(data);
	}
}

String.prototype.endsWith = function(matchStr) {
	if (this.substr(0 - matchStr.length) == matchStr) {
		return(true);
	} else {
		return(false);
	}
}