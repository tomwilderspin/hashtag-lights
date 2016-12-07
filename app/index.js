//dependencies
const twitter = require('twitter');
const lights = require('rpi-ws281x-native');
const dotenv = require('dotenv');

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
let pixelData = new Uint32Array(lightsCount);

lights.init(lightsCount);

let offset = 0;

const updateLights = () => {

  if (offset != lightsCount - 1) {
    let pixColour = offset % 2 ?
          0x027c0a : 0xff0000; // green | red

    pixelData[offset] = pixColour;
    offset = (offset + 1) % lightsCount;
    lights.render(pixelData);
  } else {
    //reset the lights to background
    resetLights(offset);
  }
};

const resetLights = (start) => {
  let pixelNum = start;
  const interval = setInterval(() => {
    pixelData[pixelNum] = 0x0a12fc;
    pixelNum--;
    lights.render(pixelData);
    if (pixelNum == 0 ) {
      offset = 0;
      pixelData = pixelData.map(colour => 0);
      lights.render(pixelData);
      clearInterval(interval);
    }
  }, 100);
};

//twitter event handlers
const onData = data => {
  updateLights();
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

//process handlers
//trap the SIGINT and reset before exit
process.on('SIGINT', function () {
  lights.reset();
  process.nextTick(function () { process.exit(0); });
});
