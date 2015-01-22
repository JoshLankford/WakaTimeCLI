##WakaTimeCLI
WalkaTimeCLI allows you to see your WakaTime.com reports from your command line.

###Installation

```shell
$ npm install -g WakaTimeCLI
```
###Configuration

Log into your WakaTime.com account and find your API Key in the settings (https://wakatime.com/settings).

Add your API Key
```shell
$ wakatime -api yourApiKeyHere
```


###Usage

Display WakaTime data from today:
```shell
$ wakatime -t or wakatime -today
```

Display WakaTime data from yesterday:
```shell
$ wakatime -y or $ wakatime -yesterday
```

Display WakaTime data from the last 7 days:
```shell
$ wakatime -w or $ wakatime -week
```

###Info

Written using the WakaTime API (https://wakatime.com/api).
