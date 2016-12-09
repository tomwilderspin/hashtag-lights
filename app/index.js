//dependencies
const twitter = require('twitter');
const lights = require('rpi-ws281x-native');
const dotenv = require('dotenv');

const lightController = require('./lightController')(lights);

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

const lightsCount = parseInt(process.env.NUMBER_OF_LIGHTS);

//setup lights

//returns actions for working with the neoPixel lib
const lightActions = lightController(lightsCount);

//update light at index with color
const updateLights = (index) => {

  lightActions.updateLight(
    index,
    index % 2 ? 0x027c0a : 0xff0000 // green | red
  );

  return index;
};

//play reset animation & reset lights when done
const resetLights = (index) => {
    return new Promise((resolve) => {

      let pointer = index;
      const interval = setInterval(() => {

        lightActions.updateLight(pointer, 0x0a12fc);
        pointer--;

        if (pointer < 1) {
          lightActions.resetLights();
          clearInterval(interval);
          resolve(0);
        }
      }, 100);
    });
};

//twitter event handlers
let tweetCount = 0;
let resetFlag = false;
const onData = data => {

  if (tweetCount !== (lightsCount - 1)) {
    //update lights with new tweet
    tweetCount = (updateLights(tweetCount) + 1) % lightsCount;

  } else {
    //run reset process
      if (!resetFlag) {

      resetFlag = true;

      resetLights(tweetCount)
        .then((index) => {
          resetFlag = false;
          tweetCount = index;
        });
    }
  }
};

const onError = error => {
  console.error('stream error', error);
};

const onEnd = response => {
  console.log('twitter end:  '+response);
};

//start listening to twitter events

const connectToTwitter = (creds) => {
  const twitterClient = new twitter(creds);
  return (props, cb) => {
    return () => {
      //kill any open sockets
      twitterClient.stream.destory();

      //create a new connection
      twitterClient.stream('statuses/filter', props, cb);
      return 'connected';
    }
  };
};

//connect
const twitterConnect = connectToTwitter(twitterCreds)(
  {track: hashTag},
  (stream) => {
    let timerID = 0;
    stream.on('data', onData);
    stream.on('data', () => { timerID = refreshAntiStall(timerID) });
  }
);

//twitter stream anti-stall
const refreshAntiStall = (timerID) => {
  if (timerID) {
    clearTimeout(timerId);
  }
  return setTimeout(() => {
    twitterConnect();
  }, 90000);
};

//init twitter connection
twitterConnect();

//process handlers
//trap the SIGINT and reset before exit
process.on('SIGINT', function () {
  lightActions.resetDefaults();
  process.nextTick(function () { process.exit(0); });
});
