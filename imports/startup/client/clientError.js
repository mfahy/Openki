const reportToServer = function(error) {
	var report =
		{ name: error.name
		, message: error.message
		, location: window.location.href
		, tsClient: new Date()
		};
	Meteor.call('clientError', report, function(err, result) {
		if (err) console.log(err);
	});
}

window.addEventListener("error", function(event) {
	reportToServer(event.error);
});

var buffer = [];
var discriminatoryReporting = function(arguments) {
	var msg = arguments[0];

	// "Exception from Tracker recompute function:"
	if (msg.indexOf("Exception from Tracker") === 0) {
		// Boring, followed by "Error: ..."
		return;
	}

	// "Error: No such function: ..."
	if (msg.indexOf("Error:") === 0) {
		buffer.push(msg);
		return;
	}

	// "Blaze.View.prototy..."
	if (msg.indexOf("Blaze.") === 0) {
		// There's a template name in there right?
		var templateNames = /Template\.[^_]\w+/g;
		buffer.push(msg.match(templateNames).join(','));
		reportToServer(
			{ name: 'TemplateError'
			, message: buffer.join('; ')
			}
		);
		return;
	}
};

// wrap the Meteor debug function
const meteorDebug = Meteor._debug;
Meteor._debug = function(/* arguments */) {
	meteorDebug.apply(this, arguments);
	discriminatoryReporting(arguments);
}
