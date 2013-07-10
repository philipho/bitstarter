#!/usr/bin/env node

/* 
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.
*/

var fs = require('fs');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
	var instr = infile.toString();
	if (!fs.existsSync(instr)) {
		console.log("%s doess not exist. Exiting.", instr);
		process.exit(1);
	}
	return instr;
};

var cheerioHtmlFile = function(htmlfile) {
	return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
	return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
	$ = cheerioHtmlFile(htmlfile);
	var checks = loadChecks(checksfile).sort();
	var out = {};
	for (var ii in checks) {
		var present = $(checks[ii]).length > 0;
		out[checks[ii]] = present;
	}
	return out;
};

var clone = function(fn) {
	// Workaround for commander.js issue.
	// http://stackoverflow.com/a/6772648
	return fn.bind({});
};


if (require.main == module) {
	program
		.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
		.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
		.option('-u, --url <url>', 'url of html file')
		.parse(process.argv);

	// If url is not null, download html page to file 'url_html' and
	// set program.file = 'url_html'
	if (program.url != '') {
		// console.log("url to download html: " + program.url);
		rest.get(program.url).on('complete', function(result) {
			if (result instanceof Error) {
				console.log('Error: ' + result.message);
				// this.retry(5000); // try again after 5 sec
			} else {
				fs.writeFileSync('url_html', result);
				program.file = 'url_html';
			}	
		});
	}

	var checkJson = checkHtmlFile(program.file, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
}
else {
	exports.checkHtmlFile = checkHtmlFile;
}
