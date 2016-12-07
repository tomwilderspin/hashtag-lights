//import { inherits } from 'util';
//import { eventEmitter } from 'events';

import twitter from 'twitter';
import lights from 'rpi-ws281x-native';
import dotenv from 'dotenv';
import color from 'color';

//add .env file to process env
dotenv.config();

//pull in config from process env
const hashTag = process.env.HASHTAG;

const twitterCreds = {
        consumer_key: process.env.TWIT_CONSUMER_KEY,
        consumer_secret: process.env.TWIT_CONSUMER_SEC,
        access_token_key: process.env.TWIT_ACCESS_KEY,
        access_token_secret: process.env.TWIT_ACCESS_SEC
      };

const lightsCount = process.env.NUMBER_OF_LIGHTS;

//setup lights
const colours = {
	white : {h:20, s:80, l:80},
	blue : {h:185, s:100, l:50},
	red : {h:350, s:80, l:50},
	green : {h:160, s:90, l:50},
	yellow : {h:35, s:100, l:60},
};



//twitter event handlers
const onData = data => {
  console.log(data.text);
};

const onError = error => {
  console.error('stream error', error);
};

const onEnd = response => {
  console.log('twitter end:  '+response);
};

//start listening to twitter events
const tweetClient = new twitter(twitterCreds);

tweetClient.stream(
  'statuses/filter',
  {track: hashTag},
  function(stream){
    stream.on('data', onData);
  }
);
