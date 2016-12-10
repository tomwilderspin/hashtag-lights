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

//light colours: yellow | red | green | blue
const colours = new Uint32Array([0xf2c637, 0xe20c09, 0x1dd61d, 0x4286f4]);

//flux the speed of lights tick
const speedMachine = (baseTick) => {
  let base = baseTick;
  return (divider) => {
    return Math.ceil(baseTick / divider % baseTick);
  };
};


//update lights with colours and speed
const updateLights = (speed, colours) => {
  return new Promise((resolve) => {
    let pointer = 0;

    const interval = setInterval(() => {
      lightActions.updateLight(pointer, colours[(pointer % colours.length)]);
      pointer = (pointer +1) % lightsCount;
      if (pointer == lightsCount - 1) {
        clearInterval(interval);
        resolve(pointer);
      }
    }, speed);
  });
}

//play reset animation & reset lights when done
const resetLights = (index) => {
    return new Promise((resolve) => {

      let pointer = index;
      const interval = setInterval(() => {

        lightActions.updateLight(pointer, 0x0a12fc);
        pointer--;

        if (pointer < 1) {
          clearInterval(interval);
          resolve(0);
        }
      }, 100);
    });
};

//twitter event handlers
let tweetCount = 1;
const onData = data => {
  tweetCount++;
};

//init light animation
const getSpeed = speedMachine(100);

const initLights = (speedCalc) => {
  return (lightPointer) => {
    const count = tweetCount;
    console.log(count);
    tweetCount = 1;
    return lightPointer > 0 ?
      resetLights(lightPointer).then(initLights(speedCalc)) :
      updateLights(speedCalc(count), colours).then(initLights(speedCalc));
  };
};

initLights(getSpeed)(0);

//start listening to twitter events

const connectToTwitter = (creds) => {
  const twitterClient = new twitter(creds);
  return (props, cb) => {
    return () => {
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
    clearTimeout(timerID);
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
