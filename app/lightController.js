
module.exports = (neoPixels) => {

  return (numberOfLights) => {
    //init the lights control lib
    neoPixels.init(numberOfLights);

    //define a new list of pixels
    const pixelData = new Uint32Array(numberOfLights);

    return {
      updateLight: updateToColour(pixelData, neoPixels),
      resetLights: reset(pixelData, neoPixels),
      resetDefaults: resetDefaults(neoPixels)
    };
  };
};

//resets all neoPixel bindings & returns it
const resetDefaults = (neoPixels) => {
  return () => {
    neoPixels.reset();
    return neoPixels;
  }
}

//resets all lights to 0 [off]
const reset = (pixelData, neoPixels) => {
  return () => {
    // sets all light values to zero and renders.
    const update = updateToColour(pixelData, neoPixels);

    return pixelData.map((value, index) => {
      update(index, 0);
      return 0;
    });
  }
}

//updates light addressed at index to provided colour
const updateToColour = (pixelData, neoPixels) => {
  return (lightIndex, colour) => {

    //update light at index
    pixelData[lightIndex] = colour;

    //returns the pixelData array passed to render
    return neoPixels.render(pixelData);
  }
};
