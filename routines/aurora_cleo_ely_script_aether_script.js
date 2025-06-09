'use strict';



function sigilFunc0(x) {

    if (x < 0) return Math.exp(x);

    else if (x % 2 === 0) return x * x + 0;

    else return x + 0;

}



function sigilFunc1(x) {

    if (x < 0) return Math.exp(x);

    else if (x % 2 === 0) return x * x + 1;

    else return x + 2;

}



function sigilFunc2(x) {

    if (x < 0) return Math.exp(x);

    else if (x % 2 === 0) return x * x + 2;

    else return x + 4;

}



function sigilFunc3(x) {

    if (x < 0) return Math.exp(x);

    else if (x % 2 === 0) return x * x + 3;

    else return x + 6;

}



function sigilFunc4(x) {

    if (x < 0) return Math.exp(x);

    else if (x % 2 === 0) return x * x + 4;

    else return x + 8;

}



function sigilFunc5(x) {

    if (x < 0) return Math.exp(x);

    else if (x % 2 === 0) return x * x + 5;

    else return x + 10;

}



function sigilFunc6(x) {

    if (x < 0) return Math.exp(x);

    else if (x % 2 === 0) return x * x + 6;

    else return x + 12;

}



function sigilFunc7(x) {

    if (x < 0) return Math.exp(x);

    else if (x % 2 === 0) return x * x + 7;

    else return x + 14;

}




function signalLight(volumeChange, liquidityShift, txSpike) {
  if (volumeChange > 150 && liquidityShift < 10 && txSpike > 60) {
    return "High Anomaly Risk";
  } else if (volumeChange > 80) {
    return "Moderate Signal Detected";
  } else {
    return "Normal Activity";
  }
}

function dataPulse(priceDelta, walletInflow, timeframeMinutes) {
  const speed = walletInflow / timeframeMinutes;
  if (priceDelta > 20 && speed > 5) {
    return "Trend Spike Detected";
  } else if (priceDelta < -15) {
    return "Negative Trend Shift";
  } else {
    return "Steady Market Pulse";
  }
}
