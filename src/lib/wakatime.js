var fs = require('fs');

function convertThis() {

  var Promise = require("bluebird");
  var request = Promise.promisify(require("request"));
  var moment = require("moment");
  var clc = require('cli-color');
  var fs = require('fs');

  // Create clc color variables
  var yellow = clc.yellow;
  var blue = clc.blue;
  var cyan = clc.cyan;
  var magenta = clc.magenta;

  var apiString = '?api_key=';
  var homedir = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;
  var wakafile = homedir + '/.wakafile';

  // Stores API Key in app directory'
  var setApiKey = function(apiKey){
    fs.writeFile(wakafile, apiKey, function (err) {
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
      key = fs.readFileSync(wakafile,'utf8');
    } catch (e) {
      fileError();
    }
    if(key === ''){
      fileError();
    }
    return fs.readFileSync(wakafile,'utf8');
  }

  // Date function used to format date on API request
  var todaysDate = function(){

    return {
      day: moment().format('L'),
      yesterday: moment().subtract(1, 'days').format('L'),
      week: moment().subtract(6, 'days').format('L')
    }

  };

  var formatTime = function(seconds) {
    hour = ~~(seconds / 3600);
    minute = ~~((seconds - (hour * 3600)) / 60);
    second = seconds % 60;
    return hour + ' hours ' + minute + ' minutes ' + second + ' seconds '
  }


  // Prints provided obj to terminal with magenta or blue color
  var printSection = function(obj, color){
    // sort it first
    sortable = [];
    for (key in obj) {
      sortable.push([key, obj[key]])
    }
    sorted = sortable.sort(function(a, b) { return b[1] - a[1]});

    for (var i=0; i<sorted.length; i++){
      if(color === 'magenta'){
        console.log(magenta(' ' + sorted[i][0] + ': ') + formatTime(sorted[i][1]));
      } else if(color === 'blue'){
        console.log(blue(' ' + sorted[i][0] + ': ') + formatTime(sorted[i][1]));
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
    request("https://wakatime.com/api/v1/summary/daily?start="+day+"&end="+day2+"&api_key="+apiKey, function (error, response, body) {
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
            if (!(val.name in languages)) {
              languages[val.name] = val.total_seconds;
            } else {
              languages[val.name] = languages[val.name] + val.total_seconds;
            }
          })
        })

        // Iterates through returned object and finds all unique project names
        // Adds all corresponding time to each project
        body.data.forEach(function(val){
          val.projects.forEach(function(val){
            var time = [val.hours, val.minutes];
            if (!(val.name in projects)) {
              projects[val.name] = val.total_seconds;
            } else {
              projects[val.name] = projects[val.name] + val.total_seconds;
            }
          })
        })

        // Week Data logged to terminal here
        console.log(' '); // Empty Line for formatting
        console.log(' ' +cyan('Week: ') + gtHours + ' hours ' + gtMinutes + ' minutes (Total)'); // Prints calculated total hours/minutes
        console.log(' '); // Empty Line for formatting
        printSection(languages, 'magenta'); // Prints each item in the obj
        console.log(' '); // Empty Line for formatting
        printSection(projects, 'blue'); // Prints each item in the obj
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
  
}
exports.convert = convertThis;
