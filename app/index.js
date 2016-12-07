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
const pixelData = new Uint32Array(lightsCount);

let offset = 0;

const updateLights = () => {

  if (offset != lightsCount - 1) {
    let pixColour = offset % 2 ?
          0x027c0a : 0xad0005;

    pixelData[offset] = pixColour;
    offset = (offset + 1) % lightsCount;
    lights.render(pixelData);
  } else {
    //reset the lights to background
    resetLights();
  }
};

const resetLights = () => {
  lights.render(pixelData.map(color => 0xf4d942));
};

lights.init(lightsCount);

resetLights();

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
