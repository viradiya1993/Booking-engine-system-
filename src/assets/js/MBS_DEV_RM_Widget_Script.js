function init() {
	if(window.ratematchJSON) {
		invokeWidget();
	} 
	attachEventOnUpdateBtn();
}

function invokeWidget() {
	if(document.getElementById('ttw-root') != null) {
		document.getElementById('ttw-root').outerHTML = "";
	}
	setTimeout(function () {
	window.TTW.init({
	// config option overrides
	widgetId: 'ec7f833e-7793-4d6a-a609-8a5122d44674',
	hotelId: 'mar354',
	hotelName: 'Marina Bay Sands',
	llcc: 'en-us',
	bookingEngine: 'mbs.be',
	env : 'DEV'
	});
	}, 5000);
}

function attachEventOnUpdateBtn() {
	document.querySelector('body').addEventListener('mousedown', function(ev) {
		if(ev.target.innerText.indexOf("VIEW AVAILABLE ROOMS") > -1 || ev.target.innerText.indexOf("DONE") > -1 || ev.target.className.indexOf("dropdown-item") > -1){
		invokeWidget();
		}
	});
}

(function (d, s, id) {
	if (typeof jQuery != 'undefined') $ = jQuery.noConflict();

	var js, fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) {
		return;
	}
	js = d.createElement(s);
	js.id = id;
	js.setAttribute('defer', '');
	js.src = "https://s3.amazonaws.com/mbs.widget.com/1.2.1/ttw.min.js";
	fjs.parentNode.insertBefore(js, fjs);

	var fileref = d.createElement("link");
	fileref.setAttribute("rel", "stylesheet");
	fileref.setAttribute("type", "text/css");
	fileref.setAttribute("href", "https://s3.amazonaws.com/mbs.widget.com/1.2.1/ttw.min.css");
	d.getElementsByTagName("head")[0].appendChild(fileref);
	window.init();
}(document, 'script', 'ttw-js'));