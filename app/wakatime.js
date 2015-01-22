#!/usr/bin/env node

var Promise = require("bluebird");
var request = Promise.promisify(require("request"));
var clc = require('cli-color');
var fs = require('fs');

// Create clc color variables
var yellow = clc.yellow;
var blue = clc.blue;
var cyan = clc.cyan;
var magenta = clc.magenta;

var apiString = '?api_key=';

// Stores API Key in app directory
var setApiKey = function(apiKey){
  fs.writeFile('.wakatimeKey', apiKey, function (err) {
    if (err) throw err;
    console.log('API key saved.');
  });
};

// Throw file error
var fileError = function(){
  console.log(' ');
  console.log(cyan(' No API Key provided'));
  console.log(cyan(" Example: ") + magenta("wakatime -api 'your key here' "));
  console.log(cyan(' Note: ') + magenta("your api key is available @ https://wakatime.com/settings"));
  console.log(' ');
  process.exit(code=0);
};

// Reads API Key from app directory
var readApiKey =  function(){
  var key;
  try {
    key = fs.readFileSync('.wakatimeKey','utf8');
  } catch (e) {
    fileError();
  }
  if(key === ''){
    fileError();
  }
  return fs.readFileSync('.wakatimeKey','utf8');
}

// Date function used to format date on API request
var todaysDate = function(){
  var day = new Date();
  var dd = day.getDate();
  var dd2 = dd-1;
  var dd3 = dd-6;
  var mm = day.getMonth()+1; //January is 0!
  var yyyy = day.getFullYear();

  if(dd<10) {
    dd='0'+dd
  } 
  if(mm<10) {
    mm='0'+mm
  } 

  return {
    day: mm+'/'+dd+'/'+yyyy,
    yesterday: mm+'/'+dd2+'/'+yyyy,
    week: mm+'/'+dd3+'/'+yyyy
  }
};

// Calculates time for each language or project in an object
var calcTime = function(obj){
  for(key in obj){
    var hours = obj[key][0];
    var minutes = obj[key][1];
    if(minutes > 59) {
      var hours = hours + Math.floor(minutes / 60);          
      var minutes = minutes % 60;
    }
    obj[key][0] = hours;
    obj[key][1] = minutes;
  }
  return obj;
}

// Prints provided obj to terminal with magenta or blue color
var printObj = function(obj, color){
  for(key in obj){
    if(color === 'magenta'){
      console.log(magenta(' ' + key + ': ') + obj[key][0] + ' hours ' + obj[key][1] + ' minutes');
    } else if(color === 'blue'){
      console.log(blue(' ' + key + ': ') + obj[key][0] + ' hours ' + obj[key][1] + ' minutes');
    }
  }
};

// Help prints all available options
var help = function(){
  console.log(' ');
  console.log(cyan('Please pass an option:'));
  console.log(yellow('  -? or -help'));
  console.log(yellow('  -u or -user'));
  console.log(yellow('  -t or -today'));
  console.log(yellow('  -y or -yesterday'));
  console.log(yellow('  -w or -week'));
  console.log(' ');
};

// Prints user data to the terminal
var user = function(){
  var apiKey = readApiKey();
  request("https://wakatime.com/api/v1/users/current" + apiString + apiKey, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var body = JSON.parse(body);
      console.log('');
      console.log(cyan('WakaTime Account Details:'));
      console.log(magenta('  Account Created: ') + body.data.created);
      console.log(magenta('  Email: ') + body.data.email);
      if(body.data.full_name > '') {
        console.log(magenta('  Full Name: ') + body.data.full_name);
      }
      console.log('');
    }
  })
};

// Parse data for Today or Yesterday option & prints to terminal
var details = function(day, dayText){
  var apiKey = readApiKey();
  request("https://wakatime.com/api/v1/summary/daily?start="+day+"&end="+day+"&api_key="+apiKey, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var body = JSON.parse(body);

      console.log(' '); // Empty Line for formatting
      console.log(' ' +cyan(dayText + ': ') + body.data[0].grand_total.text + ' (Total)'); // Prints provided total hours/minutes
      console.log(' '); // Empty Line for formatting

      body.data[0].languages.forEach(function(val){
        console.log(magenta(' ' + val.name + ': ') + val.text); // Prints calculated total hours/minutes
      })

      console.log(' '); // Empty Line for formatting

      body.data[0].projects.forEach(function(val){
        console.log(blue(' '+ val.name + ': ') + val.text); // Prints calculated total hours/minutes
      })

      console.log(' '); // Empty Line for formatting

    } else {
      console.log(error);
    }
  })
};


// Parse data for last seven days of work and print to console
var week = function(day, dayText, day2){
  var apiKey = readApiKey();
  request("https://wakatime.com/api/v1/summary/daily?start="+day+"&end="+day2+"&api_key=99a5fbb5-6028-4419-b18a-673cd8917f41", function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var body = JSON.parse(body);
      var gtHours = 0;
      var gtMinutes = 0;
      var languages = {};
      var projects = {};

      // Iterates through returned object and adds alll hours
      body.data.forEach(function(val){
        gtHours = gtHours + val.grand_total.hours;
        gtMinutes = gtMinutes + val.grand_total.minutes;
      })

      // Converts minutes to hours and adds to total
      if(gtMinutes > 59) {
        var gtHours = gtHours + Math.floor(gtMinutes / 60);          
        var gtMinutes = gtMinutes % 60;
      }

      // Iterates through returned object and finds all unique language names
      // Adds all corresponding time to each language
      body.data.forEach(function(val){
        val.languages.forEach(function(val){
          var time = [val.hours, val.minutes];
          if (!(val.name in languages)) {
            languages[val.name] = time;
          } else {
            languages[val.name][0] = languages[val.name][0] + val.hours;
            languages[val.name][1] = languages[val.name][1] + val.minutes;
          }
        })
      })

      // Iterates through returned object and finds all unique project names
      // Adds all corresponding time to each project
      body.data.forEach(function(val){
        val.projects.forEach(function(val){
          var time = [val.hours, val.minutes];
          if (!(val.name in projects)) {
            projects[val.name] = time;
          } else {
            projects[val.name][0] = projects[val.name][0] + val.hours;
            projects[val.name][1] = projects[val.name][1] + val.minutes;
          }
        })
      })

      // Week Data logged to terminal here
      console.log(' '); // Empty Line for formatting
      console.log(' ' +cyan('Week: ') + gtHours + ' hours ' + gtMinutes + ' minutes (Total)'); // Prints calculated total hours/minutes
      console.log(' '); // Empty Line for formatting
      calcTime(languages); // Calcuates hours/minutes for each language
      printObj(languages, 'magenta'); // Prints each item in the obj
      console.log(' '); // Empty Line for formatting
      calcTime(projects); // Calcuates hours/minutes for each project
      printObj(projects, 'blue'); // Prints each item in the obj
      console.log(' '); // Empty Line for formatting

    } else {
      console.log(error);
    }
  })
};

// Slice arguments to remove defaults
var args = process.argv.slice(2);

// If no arguments are passed call help function
if(args.length === 0){
  help();
}

// Find arguments and call corresponding functionality
args.forEach(function(val) {
  if(val === '-t' || val === '-today') {
    var day = todaysDate();
    details(day.day, "Today");
  } else if(val === '-y' || val === '-yesterday') {
    var day = todaysDate();
    details(day.yesterday, "Yesterday");
  } else if(val === '-w' || val === '-week') {
    var day = todaysDate();
    week(day.week, "Week", day.day);
  } else if(val === '-u' || val === '-user') {
    user();
  } else if(val === '-help') {
    help();
  } else if(val === '-api') {
    if(args[1] === undefined){
      setApiKey('');
    } else {
      setApiKey(args[1]); // Save ApiKey to file
      args.splice(1); // Splice array so loop is not run again
    }
  } else {
    console.log('No arguments given');
  }
});