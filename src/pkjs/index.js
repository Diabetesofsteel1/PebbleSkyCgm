// Import the Clay package
var Clay = require('pebble-clay');
// Load our Clay configuration file
var clayConfig = require('./config');
// Initialize Clay
var clay = new Clay(clayConfig);


//var hasTimeline = 1;
//var topic = "not_set";
var fix = 0;
//var defaultId = 99;
//var logging = 1;

// Error messages
var servererror = "E_E3";// E3 - Server Error
var timeouterror = "E_E2"; // E2 - Time out error
var loginerror =  "E_E1"; // E1 - Login Error
//var invalidurl = "invalid url";
var dataerror = "E_E4";// E4 - Data Error

// main function to retrieve, format, and send cgm data
function fetchCgmData() {
  
    //console.log ("START fetchCgmData");
          
    // declare local variables for message data
   // var response, responsebgs, responsecals, message;
   var opts = [ ].slice.call(arguments).pop( );
   opts = JSON.parse(localStorage.getItem('cgmPebble_duo'));
   switch (opts.mode) {
          case "Nightscout":
            console.log("Nightscout data to be loaded");
            //subscribeBy(opts.endpoint);
            nightscout(opts); 
            opts.endpoint1 = opts.endpoint1.replace("/pebble?units=mmol", "");
            opts.endpoint1 = opts.endpoint1.replace("/pebble/", "");
            opts.endpoint1 = opts.endpoint1.replace("/pebble", "");
            opts.endpoint2 = opts.endpoint2.replace("/pebble?units=mmol", "");
            opts.endpoint2 = opts.endpoint2.replace("/pebble/", "");
            opts.endpoint2 = opts.endpoint2.replace("/pebble", "");
            //nightscout2(opts); 
       
             break;

        case "US_Share":
        case "Non_US_Share":
            console.log("Share data to be loaded");
            //subscribeBy(opts.accountName);
            share(opts);
            break;
            
         default:
         Pebble.sendAppMessage({
                "icon": " ",
                "bg": " ",
                "tcgm": 0,
                "tapp": 0,
                "dlta": "NOEP",
                //"icon2": " ",
                //"bg2": " ",
                //"tcgm2": 0,
                //"tapp2": 0,
                //"dlta2": "NOEP",
                });
         break;
    }
    console.log("fetchCgmData 5");
} // end fetchCgmData


//**********************NIGHTSCOUT**********************//
function nightscout(opts){
  
    var response2, responsebgs2, responsecals2, message2;
  
   opts.endpoint2 = opts.endpoint2 + "/pebble";

var req2 = new XMLHttpRequest();

 if (!opts.endpoint2) {
        // endpoint doesn't exist, return no endpoint to watch
  // " " (space) shows these are init values, not bad or null values
        message2 = {
          icon2: " ",
          bg2: " ",
          tcgm2: 0,
          //tapp: 0,
          dlta2: "NOEP",
          ubat2: " ",
          name2: " ",
          //vals: " ",
          clrw2: " ",
          rwuf2: " ",
          noiz2: 0,  

        };
        console.log("NO ENDPOINT JS message", JSON.stringify(message2));
        MessageQueue.sendAppMessage(message2);
        return;
    } // if (!opts.endpoint2)
 
// set timeout function
  var myCGMTimeout2 = setTimeout (function () {
      req2.abort();
      //req2.abort();

      message = {
        dlta: "OFF"
      };          
      console.log("TIMEOUT, DATA OFFLINE JS message", JSON.stringify(message2));
      MessageQueue.sendAppMessage(message2);
    }, 59000 ); // timeout in ms; set at 59 seconds; can not go beyond 59 seconds JUNE 23 ^
  

//SECOND USER
       req2.onload = function(e) {

        if (req2.readyState == 4) {

            if(req2.status == 200) {
                // clear the XML timeout
                clearTimeout(myCGMTimeout2);
                // Load response   
                console.log(req2.responseText);
                response2 = JSON.parse(req2.responseText);
                responsebgs2 = response2.bgs;
                responsecals2 = response2.cals;
                
                // check response data
                if (responsebgs2 && responsebgs2.length > 0) {

                    // response data is good; send log with response 
                     console.log('got response', JSON.stringify(response2));

                    // initialize message data
                  
                    // get direction arrow and BG
                    var currentDirection2 = responsebgs2[0].direction,
                    currentIcon2 = "10",
                    currentBG2 = responsebgs2[0].sgv,
                    //currentBG = "107",
                    currentConvBG2 = currentBG2,
                    rawCalcOffset2 = 5,
                    specialValue2 = false,
                    calibrationValue2 = false,

                  
                    // get CGM time delta and format
                    readingTime2 = new Date(responsebgs2[0].datetime).getTime(),
                    //readingTime = null,
                    formatReadTime2 = Math.floor( (readingTime2 / 1000) ),

                    // get app time and format
                   // appTime2 = new Date().getTime(),
                    //appTime = null,
                   // formatAppTime2 = Math.floor( (appTime2 / 1000) ),   
                    
                    // get BG delta and format
                    currentBGDelta2 = responsebgs2[0].bgdelta,
                    //currentBGDelta = -8,
                    formatBGDelta2 = " ",

                    // get battery level
                    currentBattery2 = responsebgs2[0].battery,
                    //currentBattery = "100",
 
                   // get NameofT1DPerson and IOB
                    NameofT1DPerson2 = opts.t1name2,
                    currentIOB2 = responsebgs2[0].iob,
 
                    // sensor fields
                    currentCalcRaw2 = 0,
                    //currentCalcRaw = 100000,
                    formatCalcRaw2 = " ",
                    currentRawFilt2 = responsebgs2[0].filtered,
                    formatRawFilt2 = " ",
                    currentRawUnfilt2 = responsebgs2[0].unfiltered,
                    formatRawUnfilt2 = " ",
                    currentNoise2 = responsebgs2[0].noise,
                    currentIntercept2 = "undefined",
                    currentSlope2 = "undefined",
                    currentScale2 = "undefined",
                    currentRatio2 = 0;
                    // get name of T1D; if iob (case insensitive), use IOB
                    if ( (NameofT1DPerson2.toUpperCase() === "IOB") && 
                    ((typeof currentIOB2 != "undefined") && (currentIOB2 !== null)) ) {
                      NameofT1DPerson2 = currentIOB2 + "u" ;
                    }
                    else {
                      NameofT1DPerson2 = opts.t1name2;
                    }
                    
                    if (responsecals2 && responsecals2.length > 0) {
                      currentIntercept2 = responsecals2[0].intercept;
                      currentSlope2 = responsecals2[0].slope;
                      currentScale2 = responsecals2[0].scale;
                    }
                    //currentDirection = "NONE";
 
                    // set some specific flags needed for later
                   if (opts.radio == "mgdl_form") { 
                      if ( (currentBG2 < 40) || (currentBG2 > 400) ) { specialValue2 = true; }
                      if (currentBG2 == 5) { calibrationValue2 = true; }
                    }
                    else {
                      if ( (currentBG2 < 2.3) || (currentBG2 > 22.2) ) { specialValue2 = true; }
                      if (currentBG2 == 0.3) { calibrationValue2 = true; }
                      currentConvBG2 = (Math.round(currentBG2 * 18.018).toFixed(0));                                                                   
                    }
                   
                    // convert arrow to a number string; sending number string to save memory
                    // putting NOT COMPUTABLE first because that's most common and can get out fastest
                    switch (currentDirection2) {
                      case "NOT_COMPUTABLE": currentIcon2 = "8"; break;  
                      case "NOT COMPUTABLE": currentIcon2 = "8"; break;
                      case "NONE": currentIcon2 = "0"; break;
                      case "DoubleUp": currentIcon2 = "1"; break;
                      case "SingleUp": currentIcon2 = "2"; break;
                      case "FortyFiveUp": currentIcon2 = "3"; break;
                      case "Flat": currentIcon2 = "4"; break;
                      case "FortyFiveDown": currentIcon2 = "5"; break;
                      case "SingleDown": currentIcon2 = "6"; break;
                      case "DoubleDown": currentIcon2 = "7"; break;
                      case "RATE OUT OF RANGE": currentIcon2 = "9"; break;
                      default: currentIcon2 = "10";
                    }
     
                    // if no battery being sent yet, then send nothing to watch
                    // console.log("Battery Value: " + currentBattery);
                    if ( (typeof currentBattery2 == "undefined") || (currentBattery2 === null) ) {
                      currentBattery2 = " ";  
                    }
                    // assign bg delta string
                    formatBGDelta2 = ((currentBGDelta2 > 0 ? '+' : '') + currentBGDelta2);

                    //console.log("Current Unfiltered: " + currentRawUnfilt);                  
                    //console.log("Current Intercept: " + currentIntercept);
                    //console.log("Special Value Flag: " + specialValue);
                    //console.log("Current BG: " + currentBG);
                   
                    // assign calculated raw value if we can
                    if ( (typeof currentIntercept2 != "undefined") && (currentIntercept2 !== null) ){
                        if (specialValue2) {
                          // don't use ratio adjustment
                          currentCalcRaw2 = ((currentScale2 * (currentRawUnfilt2 - currentIntercept2) / currentSlope2)*1 - rawCalcOffset2*1);
                          //console.log("Special Value Calculated Raw: " + currentCalcRaw);
                        } 
                        else {
                          currentRatio2 = (currentScale2 * (currentRawFilt2 - currentIntercept2) / currentSlope2 / (currentConvBG2*1 + rawCalcOffset2*1));
                          currentCalcRaw2 = ((currentScale2 * (currentRawUnfilt2 - currentIntercept2) / currentSlope2 / currentRatio2)*1 - rawCalcOffset2*1);
                          //console.log("Current Converted BG: " + currentConvBG);
                          //console.log("Current Ratio: " + currentRatio);
                          //console.log("Normal BG Calculated Raw: " + currentCalcRaw);
                        }          
                    } // if currentIntercept                  
                    // assign raw sensor values if they exist
                    
                   
                    if ( (typeof currentRawUnfilt2 != "undefined") && (currentRawUnfilt2 !== null) ) {
                      
                      // zero out any invalid values; defined anything not between 0 and 900
                      if ( (currentRawFilt2 < 0) || (currentRawFilt2 > 900000) || 
                            (isNaN(currentRawFilt2)) ) { currentRawFilt2 = "ERR"; }
                      if ( (currentRawUnfilt2 < 0) || (currentRawUnfilt2 > 900000) || 
                            (isNaN(currentRawUnfilt2)) ) { currentRawUnfilt2 = "ERR"; }
                      
                      // set 0, LO and HI in calculated raw
                      if ( (currentCalcRaw2 >= 0) && (currentCalcRaw2 < 30) ) { formatCalcRaw2 = "LO"; }
                      if ( (currentCalcRaw2 > 500) && (currentCalcRaw2 <= 900) ) { formatCalcRaw2 = "HI"; }
                      if ( (currentCalcRaw2 < 0 ) || (currentCalcRaw2 > 900) ) { formatCalcRaw2 = "ERR"; }
                      
                      // if slope is 0 or if currentCalcRaw is NaN, 
                      // calculated raw is invalid and need a calibration
                      if ( (currentSlope2 === 0) || (isNaN(currentCalcRaw2)) ) { formatCalcRaw2 = "CAL"; }
                       
                      // check for compression warning
                      if ( ((currentCalcRaw2 < (currentRawFilt2/1000)) && (!calibrationValue2)) && (currentRawFilt2 !== 0) ){
                        var compressionSlope2 = 0;
                        compressionSlope2 = (((currentRawFilt2/1000) - currentCalcRaw2)/(currentRawFilt2/1000));
                        //console.log("compression slope: " + compressionSlope);
                        if (compressionSlope2 > 0.7) {
                          // set COMPRESSION? message
                          formatBGDelta2 = "PRSS";
                        } // if compressionSlope
                      } // if check for compression condition
                     
                      if (opts.radio == "mgdl_form") { 
                        formatRawFilt2 = ((Math.round(currentRawFilt2 / 1000)).toFixed(0));
                        formatRawUnfilt2 = ((Math.round(currentRawUnfilt2 / 1000)).toFixed(0));
                        if ( (formatCalcRaw2 != "LO") && (formatCalcRaw2 != "HI") && 
                             (formatCalcRaw2 != "ERR") && (formatCalcRaw2 != "CAL") ) 
                            { formatCalcRaw2 = ((Math.round(currentCalcRaw2)).toFixed(0)); }
                        //console.log("Format Unfiltered: " + formatRawUnfilt);
                      } 
                      else {
                        formatRawFilt2 = ((Math.round(((currentRawFilt2/1000)*0.0555) * 10) / 10).toFixed(1));
                        formatRawUnfilt2 = ((Math.round(((currentRawUnfilt2/1000)*0.0555) * 10) / 10).toFixed(1));
                        if ( (formatCalcRaw2 != "LO") && (formatCalcRaw2 != "HI") &&
                             (formatCalcRaw2 != "ERR") && (formatCalcRaw2 != "CAL") ) 
                        { formatCalcRaw2 = ((Math.round(currentCalcRaw2)*0.0555).toFixed(1)); }
                        //console.log("Format Unfiltered: " + formatRawUnfilt);
                      }
                      
                    } // if currentRawUnfilt 
                    //console.log("Calculated Raw To Be Sent: " + formatCalcRaw);
                  
                    // assign blank noise if it doesn't exist
                    if ( (typeof currentNoise2 == "undefined") || (currentNoise2 === null) ) {
                      currentNoise2 = 0;  
                    }
                 /*    message = {
                      newicon: currentIcon2,
                      bg2:   currentBG2,
                      tcgm2: formatReadTime2,
                      dlta2: formatBGDelta2,
                      ubat2: currentBattery2,
                      name2: NameofT1DPerson2,
                      clrw2: formatCalcRaw2,
                      rwuf2: formatRawUnfilt2,
                      noiz2: currentNoise2,
                    };*/
                     
                    // send message data to log and to watch
                   // console.log("JS send message2: " + JSON.stringify(message));
                   // MessageQueue.sendAppMessage(message);
                // response data is not good; format error message and send to watch
                // have to send space in BG field for logo to show up on screen    
               // } else {
                  
                    // " " (space) shows these are init values (even though it's an error), not bad or null values
                 //   message2 = {
                   //  dlta2: "OFF"
                    //};
                  
                    //console.log("DATA OFFLINE JS message", JSON.stringify(message2));
                    //MessageQueue.sendAppMessage(message);
                }
               } else {
              console.log("XMLHttpRequest error, not 200: " + req2.statusText);
            } // end req.status == 200
        } // end req.readyState == 4 
         
    opts.endpoint1 = opts.endpoint1 + "/pebble"; 
   //console.log ("START fetchCgmData");
    // declare local variables for message data
    var response, responsebgs, responsecals, message;

  //get options from configuration window
 // check if endpoint exists
  
    if (!opts.endpoint1) {
        // endpoint doesn't exist, return no endpoint to watch
  // " " (space) shows these are init values, not bad or null values
        message = {
          icon: " ",
          bg: " ",
          tcgm: 0,
          tapp: 0,
          dlta: "NOEP",
          ubat: " ",
          name: " ",
          vals: " ",
          clrw: " ",
          rwuf: " ",
          noiz: 0,  

        };
        console.log("NO ENDPOINT JS message", JSON.stringify(message));
        MessageQueue.sendAppMessage(message);
        return;
    } // if (!opts.endpoint)
  
    // show current options
    //console.log("fetchCgmData IN OPTIONS = " + JSON.stringify(opts));
  
    // call XML
    var req = new XMLHttpRequest();

    //req.open('GET', opts.endpoint, true);
    //req.setRequestHeader('Cache-Control', 'no-cache');
    
  // set timeout function JUNE 23 V
    var myCGMTimeout = setTimeout (function () {
      req.abort();
      //req2.abort();

      message = {
        dlta: "OFF"
      };          
      console.log("TIMEOUT, DATA OFFLINE JS message", JSON.stringify(message));
      MessageQueue.sendAppMessage(message);
    }, 59000 ); // timeout in ms; set at 59 seconds; can not go beyond 59 seconds JUNE 23 ^
  
  
    // get cgm data
    req.onload = function(e,o) {

        if (req.readyState == 4) {

            if(req.status == 200) {
                // clear the XML timeout
                clearTimeout(myCGMTimeout);
                // Load response   
                console.log(req.responseText);
                response = JSON.parse(req.responseText);
                responsebgs = response.bgs;
                responsecals = response.cals;
                
                // check response data
                if (responsebgs && responsebgs.length > 0) {

                    // response data is good; send log with response 
                    // console.log('got response', JSON.stringify(response));

                    // initialize message data
                  
                    // get direction arrow and BG
                    var currentDirection = responsebgs[0].direction,
                    values = " ",
                    currentIcon = "10",
                    currentBG = responsebgs[0].sgv,
                    //currentBG = "107",
                    currentConvBG = currentBG,
                    rawCalcOffset = 5,
                    specialValue = false,
                    calibrationValue = false,

                    // get timezone offset
                   // timezoneDate = new Date(),
                   // timezoneOffset = timezoneDate.getTimezoneOffset(),
                        
                    // get CGM time delta and format
                    readingTime = new Date(responsebgs[0].datetime).getTime(),
                    //readingTime = null,
                    formatReadTime = Math.floor( (readingTime / 1000) ),

                    // get app time and format
                    appTime = new Date().getTime(),
                    //appTime = null,
                    formatAppTime = Math.floor( (appTime / 1000) ),   
                    
                    // get BG delta and format
                    currentBGDelta = responsebgs[0].bgdelta,
                    //currentBGDelta = -8,
                    formatBGDelta = " ",

                    // get battery level
                    currentBattery = responsebgs[0].battery,
                    //currentBattery = "100",
 
                   // get NameofT1DPerson and IOB
                    NameofT1DPerson = opts.t1name1,
                    currentIOB = responsebgs[0].iob,
 
                    // sensor fields
                    currentCalcRaw = 0,
                    //currentCalcRaw = 100000,
                    formatCalcRaw = " ",
                    currentRawFilt = responsebgs[0].filtered,
                    formatRawFilt = " ",
                    currentRawUnfilt = responsebgs[0].unfiltered,
                    formatRawUnfilt = " ",
                    currentNoise = responsebgs[0].noise,
                    currentIntercept = "undefined",
                    currentSlope = "undefined",
                    currentScale = "undefined",
                    currentRatio = 0;
                    // get name of T1D; if iob (case insensitive), use IOB
                    if ( (NameofT1DPerson.toUpperCase() === "IOB") && 
                    ((typeof currentIOB != "undefined") && (currentIOB !== null)) ) {
                      NameofT1DPerson = currentIOB + "u" ;
                    }
                    else {
                      NameofT1DPerson = opts.t1name1;
                    }
                    if (responsecals && responsecals.length > 0) {
                      currentIntercept = responsecals[0].intercept;
                      currentSlope = responsecals[0].slope;
                      currentScale = responsecals[0].scale;
                    }
                    //currentDirection = "NONE";

                    // set some specific flags needed for later
                    if (opts.radio == "mgdl_form") { 
                      if ( (currentBG < 40) || (currentBG > 400) ) { specialValue = true; }
                      if (currentBG == 5) { calibrationValue = true; }
                    }
                    else {
                      if ( (currentBG < 2.3) || (currentBG > 22.2) ) { specialValue = true; }
                      if (currentBG == 0.3) { calibrationValue = true; }
                      currentConvBG = (Math.round(currentBG * 18.018).toFixed(0));                                                                   
                    }
                    // convert arrow to a number string; sending number string to save memory
                    // putting NOT COMPUTABLE first because that's most common and can get out fastest
                    switch (currentDirection) {
                      case "NOT_COMPUTABLE": currentIcon = "8"; break;  
                      case "NOT COMPUTABLE": currentIcon = "8"; break;
                      case "NONE": currentIcon = "0"; break;
                      case "DoubleUp": currentIcon = "1"; break;
                      case "SingleUp": currentIcon = "2"; break;
                      case "FortyFiveUp": currentIcon = "3"; break;
                      case "Flat": currentIcon = "4"; break;
                      case "FortyFiveDown": currentIcon = "5"; break;
                      case "SingleDown": currentIcon = "6"; break;
                      case "DoubleDown": currentIcon = "7"; break;
                      case "RATE OUT OF RANGE": currentIcon = "9"; break;
                      default: currentIcon = "10";
                    }
     
                    // if no battery being sent yet, then send nothing to watch
                    // console.log("Battery Value: " + currentBattery);
                    if ( (typeof currentBattery == "undefined") || (currentBattery === null) ) {
                      currentBattery = " ";  
                    }
                    // assign bg delta string
                    formatBGDelta = ((currentBGDelta > 0 ? '+' : '') + currentBGDelta);

                    //console.log("Current Unfiltered: " + currentRawUnfilt);                  
                    //console.log("Current Intercept: " + currentIntercept);
                    //console.log("Special Value Flag: " + specialValue);
                    //console.log("Current BG: " + currentBG);
                  
                    // assign calculated raw value if we can
                    if ( (typeof currentIntercept != "undefined") && (currentIntercept !== null) ){
                        if (specialValue) {
                          // don't use ratio adjustment
                          currentCalcRaw = ((currentScale * (currentRawUnfilt - currentIntercept) / currentSlope)*1 - rawCalcOffset*1);
                          //console.log("Special Value Calculated Raw: " + currentCalcRaw);
                        } 
                        else {
                          currentRatio = (currentScale * (currentRawFilt - currentIntercept) / currentSlope / (currentConvBG*1 + rawCalcOffset*1));
                          currentCalcRaw = ((currentScale * (currentRawUnfilt - currentIntercept) / currentSlope / currentRatio)*1 - rawCalcOffset*1);
                          //console.log("Current Converted BG: " + currentConvBG);
                          //console.log("Current Ratio: " + currentRatio);
                          //console.log("Normal BG Calculated Raw: " + currentCalcRaw);
                        }          
                    } // if currentIntercept                  
                    // assign raw sensor values if they exist
                    if ( (typeof currentRawUnfilt != "undefined") && (currentRawUnfilt !== null) ) {
                      
                      // zero out any invalid values; defined anything not between 0 and 900
                      if ( (currentRawFilt < 0) || (currentRawFilt > 900000) || 
                            (isNaN(currentRawFilt)) ) { currentRawFilt = "ERR"; }
                      if ( (currentRawUnfilt < 0) || (currentRawUnfilt > 900000) || 
                            (isNaN(currentRawUnfilt)) ) { currentRawUnfilt = "ERR"; }
                      
                      // set 0, LO and HI in calculated raw
                      if ( (currentCalcRaw >= 0) && (currentCalcRaw < 30) ) { formatCalcRaw = "LO"; }
                      if ( (currentCalcRaw > 500) && (currentCalcRaw <= 900) ) { formatCalcRaw = "HI"; }
                      if ( (currentCalcRaw < 0 ) || (currentCalcRaw > 900) ) { formatCalcRaw = "ERR"; }
                      
                      // if slope is 0 or if currentCalcRaw is NaN, 
                      // calculated raw is invalid and need a calibration
                      if ( (currentSlope === 0) || (isNaN(currentCalcRaw)) ) { formatCalcRaw = "CAL"; }
                      
                      // check for compression warning
                      if ( ((currentCalcRaw < (currentRawFilt/1000)) && (!calibrationValue)) && (currentRawFilt !== 0) ){
                        var compressionSlope = 0;
                        compressionSlope = (((currentRawFilt/1000) - currentCalcRaw)/(currentRawFilt/1000));
                        //console.log("compression slope: " + compressionSlope);
                        if (compressionSlope > 0.7) {
                          // set COMPRESSION? message
                          formatBGDelta = "PRSS";
                        } // if compressionSlope
                      } // if check for compression condition
                      
                      if (opts.radio == "mgdl_form") { 
                        formatRawFilt = ((Math.round(currentRawFilt / 1000)).toFixed(0));
                        formatRawUnfilt = ((Math.round(currentRawUnfilt / 1000)).toFixed(0));
                        if ( (formatCalcRaw != "LO") && (formatCalcRaw != "HI") && 
                             (formatCalcRaw != "ERR") && (formatCalcRaw != "CAL") ) 
                            { formatCalcRaw = ((Math.round(currentCalcRaw)).toFixed(0)); }
                        //console.log("Format Unfiltered: " + formatRawUnfilt);
                      } 
                      else {
                        formatRawFilt = ((Math.round(((currentRawFilt/1000)*0.0555) * 10) / 10).toFixed(1));
                        formatRawUnfilt = ((Math.round(((currentRawUnfilt/1000)*0.0555) * 10) / 10).toFixed(1));
                        if ( (formatCalcRaw != "LO") && (formatCalcRaw != "HI") &&
                             (formatCalcRaw != "ERR") && (formatCalcRaw != "CAL") ) 
                        { formatCalcRaw = ((Math.round(currentCalcRaw)*0.0555).toFixed(1)); }
                        //console.log("Format Unfiltered: " + formatRawUnfilt);
                      }
                    } // if currentRawUnfilt 
                    //console.log("Calculated Raw To Be Sent: " + formatCalcRaw);
                  
                    // assign blank noise if it doesn't exist
                    if ( (typeof currentNoise == "undefined") || (currentNoise === null) ) {
                      currentNoise = 0;  
                    }
                   if (opts.radio == "mgdl_form") {
                      values = "0";  //mgdl selected
                    } else {
                      values = "1"; //mmol selected
                    }
                    values += "," + opts.lowbg;  //Low BG Level
                    values += "," + opts.highbg; //High BG Level                      
                    values += "," + opts.lowsnooze;  //LowSnooze minutes 
                    values += "," + opts.highsnooze; //HighSnooze minutes
                    values += "," + opts.lowvibe;  //Low Vibration 
                    values += "," + opts.highvibe; //High Vibration
                    values += "," + opts.vibepattern; //Vibration Pattern
                    if (opts.timeformat == "12"){
                      values += ",0";  //Time Format 12 Hour  
                    } else {
                      values += ",1";  //Time Format 24 Hour  
                    }
                    // Vibrate on raw value in special value; Yes = 1; No = 0;
                    if ( (currentCalcRaw !== 0) && (opts.rawvibrate == "1") ) {
                      values += ",1";  // Vibrate on raw value when in special values  
                    } else {
                      values += ",0";  // Do not vibrate on raw value when in special values                        
                    }
                  
                  //  var mode_switch = getModeAsInteger(opts); 
                     // load message data  
                    message2 = {
                      newicon: currentIcon2,
                      bg2:   currentBG2,
                      tcgm2: formatReadTime2,
                      dlta2: formatBGDelta2,
                      ubat2: currentBattery2,
                      name2: NameofT1DPerson2,
                      clrw2: formatCalcRaw2,
                      rwuf2: formatRawUnfilt2,
                      noiz2: currentNoise2,
                    };
                  
                  message = {
                      icon: currentIcon,
                      bg: currentBG,
                      tcgm: formatReadTime,
                      tapp: formatAppTime,
                      dlta: formatBGDelta,
                      ubat: currentBattery,
                      name: NameofT1DPerson,
                      vals: values,
                      clrw: formatCalcRaw,
                      rwuf: formatRawUnfilt,
                      noiz: currentNoise,
                      
                      //mode_switch: 3,
                    
                    };
                    
                    // send message data to log and to watch
                    console.log("JS send message1: " + JSON.stringify(message));
                    MessageQueue.sendAppMessage(message);
                    console.log("JS send message2: " + JSON.stringify(message2));
                    MessageQueue.sendAppMessage(message2);
                // response data is not good; format error message and send to watch
                // have to send space in BG field for logo to show up on screen    
                //} else {
                  
                    // " " (space) shows these are init values (even though it's an error), not bad or null values
                  //  message = {
                    //  dlta: "OFF"
                    //};
                  
                    //console.log("DATA OFFLINE JS message", JSON.stringify(message));
                   // MessageQueue.sendAppMessage(message);
                }
               } else {
              console.log("XMLHttpRequest error, not 200: " + req.statusText);
            } // end req.status == 200
        } // end req.readyState == 4
    }; // req.onload

    req.onerror = function (e) {
      console.log("XMLHttpRequest error: " + req.statusText);
    }; // end req.onerror
 
    // set rest of req
    req.open('GET', opts.endpoint1, true);  
    req.setRequestHeader('Cache-Control', 'no-cache');  
    
    // get cgm data
  
    req.send(null); 
    }; // req.onload
                    
           
   
  req2.onerror = function (o,message) {
      console.log("XMLHttpRequest error: " + req2.statusText);
    }; // end req2.onerror
 
    // set rest of req
      req2.open('GET', opts.endpoint2, true);  

      req2.setRequestHeader('Cache-Control', 'no-cache');  
  
    req2.send(null); 

//}//END CGM TIMEOUT


}



//Mode
function getModeAsInteger(opts)
{
  console.log("getModeAsInteger");
 var mode_switch = 0; 
 var mode = opts.mode.toLowerCase();
  console.log("getModeAsInteger: mode: " + mode);
 if(mode == "us_share")
 {
  mode_switch = 1;
 }
    else if(mode == "non_us_share")
    {
        mode_switch = 2;
    }
    else
    {
        mode_switch = 3;
    } 
  return mode_switch;
}

//*****************SHARE*****************//
function share(options) {
//if (options.unit == "mgdl" || options.unit == "mg/dL")
  if (options.radio == "mgdl_form")
    {
        //fix = 0;
      values = 0;
        options.conversion = 1;
        options.unit = "mg/dL";
        
    } else {
        fix = 1;
        options.conversion = 0.0555;       
        options.unit = "mmol/L";
    }
    options.vibe = parseInt(options.vibe, 10);
    
    var server = getShareServerName(options);
  
    var defaults = {
        "applicationId": "d89443d2-327c-4a6f-89e5-496bbb0317db",
        "agent": "Dexcom Share/3.0.2.11 CFNetwork/711.2.23 Darwin/14.0.0",
        login: 'https://' + server + '/ShareWebServices/Services/General/LoginPublisherAccountByName',
      //  login: 'https://share1.dexcom.com/ShareWebServices/Services/General/LoginPublisherAccountByName',
        accept: 'application/json',
        'content-type': 'application/json',
        LatestGlucose: "https://" + server + "/ShareWebServices/Services/Publisher/ReadPublisherLatestGlucoseValues"
      //  LatestGlucose: "https://share1.dexcom.com/ShareWebServices/Services/Publisher/ReadPublisherLatestGlucoseValues"
    };
   // console.log("Login: " + defaults.login + " Latest Glucose: " + defaults.LatestGlucose);
    authenticateShare(options, defaults);
}
function getShareServerName(options)
{
  var mode = options.mode.toLowerCase();
  var server = "";
  
  if(mode == "us_share")
    {
      server = "share1.dexcom.com";
    }
  else if(mode == "non_us_share")
    {
      server = "shareous1.dexcom.com";
    }
  else
    {
      console.log("Option not supported");
      server = "";
    }
  console.log("Server to use:" + server);
  return server;
}

function authenticateShare(options, defaults) {   
 
    var body = {
        "password": options.password,
        "applicationId": options.applicationId || defaults.applicationId,
        "accountName": options.accountName
    };

    var http = new XMLHttpRequest();
    var url = defaults.login;
    http.open("POST", url, true);
    http.setRequestHeader("User-Agent", defaults.agent);
    http.setRequestHeader("Content-type", defaults['content-type']);
    http.setRequestHeader('Accept', defaults.accept);
    
    var data;
    http.onload = function (e) {
        if (http.status == 200) {
            data = getShareGlucoseData(http.responseText.replace(/['"]+/g, ''), defaults, options);
        } else {
                sendAuthError();// =============================GKY THIS SHOULD BE CHANGED TO EXPLAIN WHY THERE IS AN ERRPR WITH LOGIN 
        }
    };
    
       http.ontimeout = function () {
        sendTimeOutError();
    };
    
    http.onerror = function () {
        sendServerError();
    };

    http.send(JSON.stringify(body));

}
function sendAuthError() {
   console.log("===============ERROR: sendAuthError");

    Pebble.sendAppMessage({
                    "bg": "log",  
                    "icon": 0, 
                    "dlta": "loginerr",

                });
}

function sendTimeOutError(options) {
    console.log("===============ERROR: sendTimeOutError: " + JSON.stringify(options));

     Pebble.sendAppMessage({
            "bg": " ",
            "icon": 0,
            "dlta": "NODT",

        });
}

function sendServerError(options) {
      console.log("===============ERROR: sendServerError");

    Pebble.sendAppMessage({
            "bg": " ",
            "icon": 0,
            "dlta": "NODT",
        });
}

function sendUnknownError(msg) {
    console.log("===============ERROR: sendUnknownError: " + msg);

    Pebble.sendAppMessage({
                "dlta": "ERR",
                "bg": " ",
                "icon": 0,
            }); 
}


function getShareGlucoseData(sessionId, defaults, options) {
    var now = new Date();
    var http = new XMLHttpRequest();
    var url = defaults.LatestGlucose + '?sessionID=' + sessionId + '&minutes=' + 1440 + '&maxCount=' + 8;
    http.open("POST", url, true);

    //Send the proper header information along with the request
    http.setRequestHeader("User-Agent", defaults.agent);
    http.setRequestHeader("Content-type", defaults['content-type']);
    http.setRequestHeader('Accept', defaults.accept);
    http.setRequestHeader('Content-Length', 0);
    var icon = null;
    http.onload = function (e) {
             
        if (http.status == 200) {
            var data = JSON.parse(http.responseText);
           // console.log("response: " + http.responseText);
            //handle arrays less than 2 in length
            if (data.length === 0) {                
                sendUnknownError("dataerr");
            } else { 
            
                //TODO: calculate loss
                var regex = /\((.*)\)/;
              var wall = parseInt(data[0].WT.match(regex)[1]);

               // var tcgm = (parseInt(data[0].WT.match(regex)[1])/1000);
              //console.log("Data: " + data);
                var timeAgo = now.getTime() - wall;       
              //  add time       
              var tcgm = (wall/1000);     
              // add name
              var name = options.t1name;
              //add mode 
              var mode_switch = getModeAsInteger(options);;
              var values
              if (options.radio == "mgdl_form") {
                      values = "0";  //mgdl selected
                    } else {
                      values = "1"; //mmol selected
                    }
                    values += "," + options.lowbg;  //Low BG Level
                    values += "," + options.highbg; //High BG Level                      
                    values += "," + options.lowsnooze;  //LowSnooze minutes 
                    values += "," + options.highsnooze; //HighSnooze minutes
                    values += "," + options.lowvibe;  //Low Vibration 
                    values += "," + options.highvibe; //High Vibration
                    values += "," + options.vibepattern; //Vibration Pattern
                    if (options.timeformat == "12"){
                      values += ",0";  //Time Format 12 Hour  
                    } else {
                      values += ",1";  //Time Format 24 Hour  
                    }
                   // Vibrate on raw value in special value; Yes = 1; No = 0;
                    if (options.rawvibrate == "1") {
                      values += ",1";  // Vibrate on raw value when in special values  
                    } else {
                      values += ",0";  // Do not vibrate on raw value when in special values                        
                    }
 
              var bg, dlta, convertedDelta;

                if (data.length == 1) {
                    dlta = "can't calc";
                } else {
                    var timeBetweenReads = parseInt(data[0].WT.match(regex)[1]) - parseInt(data[1].WT.match(regex)[1]);
                    var minutesBetweenReads = (timeBetweenReads / (1000 * 60)).toFixed(1);                                               
                    var deltaZero = data[0].Value * options.conversion;
                    var deltaOne = data[1].Value * options.conversion;
                    convertedDelta = (deltaZero - deltaOne);                   
                    dlta = ((convertedDelta/minutesBetweenReads) * 5).toFixed(fix);
                    console.log("dlta: " + dlta);
                }

              var convertedEgv = null;
                //Manage HIGH & LOW
                if (data[0].Value < 40) {
                    bg = "low";
                    dlta = "check bg";
                    icon = 0;
                    console.log("---------------LOW");
                } else if (data[0].Value > 400) {
                    bg = "hgh";
                    dlta = "check bg";
                    icon = 0;
                    //logging("---------------HIGH");
                } else {
                    convertedEgv = (data[0].Value * options.conversion);
                    bg = (convertedEgv < 39 * options.conversion) ? parseFloat(Math.round(convertedEgv * 100) / 100).toFixed(1).toString() : convertedEgv.toFixed(fix).toString();
                    dlta = (convertedEgv < 39 * options.conversion) ? parseFloat(Math.round(convertedDelta * 100) / 100).toFixed(1) : convertedDelta.toFixed(fix);
                                  
                    
                    var deltaString = (dlta > 0) ? "+" + dlta.toString() : dlta.toString();
              //dlta = deltaString + options.unit; 
                  dlta = deltaString;
                  //added to string
                    icon = ((data[0].Trend > 7) ? 0 : data[0].Trend).toString();

                    options.bg = data[0].Value;
                } 

      
                console.log("dlta: " + dlta);
                console.log("bg: " + bg);
                console.log("icon: " + icon);
                console.log("mode#: " + mode_switch);
                console.log("values: " + values);             
  Pebble.sendAppMessage({
                    "dlta": dlta,
                    "bg": bg, 
                    "icon": icon, 
                    "tcgm": tcgm,
                    "name": name,
                    "mode_switch" : mode_switch,
                    "vals" : values
                
                });
                options.id = wall;
                
               
            }

        } else {
            sendUnknownError("dataerr"); // ANY ERROR if response is not 200
        }
    };
    
    http.onerror = function () { 
        sendServerError();
    };
   http.ontimeout = function () {
        sendTimeOutError();
    };

    http.send();
}


function hashCode(base) {
    var hash = 0, i, chr, len;
    if (base.length === 0) return hash;
    for (i = 0, len = base.length; i < len; i++) {
        chr = base.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function logging(message, message2)
{
  if(logging)
    console.log(message, message2);
}
// message queue-ing to pace calls from C function on watch
var MessageQueue = (function () {
                    
                    var RETRY_MAX = 5;
                    
                    var queue = [];
                    var sending = false;
                    var timer = null;
                    
                    return {
                    reset: reset,
                    sendAppMessage: sendAppMessage,
                    size: size
                    };
                    
                    function reset() {
                    queue = [];
                    sending = false;
                    }
                    
                    function sendAppMessage(message, ack, nack, message2) {
                    
                    if (! isValidMessage(message)) {
                    return false;
                    }
                    if (! isValidMessage(message2)) {
                    return false;
                    }  
                    
                    queue.push({
                               message: message,
                               message2: message2,
                               ack: ack || null,
                               nack: nack || null,
                               attempts: 0
                               });
                    
                    setTimeout(function () {
                               sendNextMessage();
                               }, 2);
                    
                    return true;
                    }
                    
                    function size() {
                    return queue.length;
                    }
                    
                    function isValidMessage(message, message2) {
                    // A message must be an object.
                    if (message !== Object(message)) {
                    return false;
                    }
                    if (message2 !== Object(message2)) {
                    return false;
                    }
                    var keys = Object.keys(message);
                    // A message must have at least one key.
                    if (! keys.length) {
                    return false;
                    }

                    for (var k = 0; k < keys.length; k += 1) {
                    var validKey = /^[0-9a-zA-Z-_]*$/.test(keys[k]);
                    if (! validKey) {
                    return false;
                    }
                    var value = message[keys[k]];
                    if (! validValue(value)) {
                    return false;
                    }
                    }
                    
                    return true;
                    
                    function validValue(value) {
                    switch (typeof value) {
                    case 'string':
                    return true;
                    case 'number':
                    return true;
                    case 'object':
                    if (toString.call(value) === '[object Array]') {
                    return true;
                    }
                    }
                    return false;
                    }
                    }
                    
                    function sendNextMessage() {
                    
                    if (sending) { return; }
                    var message = queue.shift();
                    if (! message) { return; }
                    var message2 = queue.shift();
                    if (! message2) { return; }
                    
                    message.attempts += 1;
                    sending = true;
                    Pebble.sendAppMessage(message.message, ack, nack);
                    Pebble.sendAppMessage(message2.message2, ack, nack);

                    
                    timer = setTimeout(function () {
                                       timeout();
                                       }, 2000);
                    
                    function ack() {
                    clearTimeout(timer);
                    setTimeout(function () {
                               sending = false;
                               sendNextMessage();
                               }, 400);
                    if (message.ack) {
                    message.ack.apply(null, arguments);
                    }
                    if (message2.ack) {
                    message2.ack.apply(null, arguments);
                    }
                    }
                    
                    function nack() {
                    clearTimeout(timer);
                    if (message.attempts < RETRY_MAX) {
                    queue.unshift(message);
                    setTimeout(function () {
                               sending = false;
                               sendNextMessage();
                               }, 400 * message.attempts);
                    }
                      if (message2.attempts < RETRY_MAX) {
                    queue.unshift(message2);
                    setTimeout(function () {
                               sending = false;
                               sendNextMessage();
                               }, 400 * message2.attempts);
                    }
                    else {
                    if (message.nack) {
                    message.nack.apply(null, arguments);
                    }
                      if (message2.nack) {
                    message2.nack.apply(null, arguments);
                    }
                    }
                    }
                    
                    function timeout() {
                    setTimeout(function () {
                               sending = false;
                               sendNextMessage();
                               }, 2000);
                    if (message.ack) {
                    message.ack.apply(null, arguments);
                    }
                      if (message2.ack) {
                    message2.ack.apply(null, arguments);
                    }
                    }
                    
                    }
                    
                    }());     
/*var MessageQueue2 = (function () {
                    
                    var RETRY_MAX = 5;
                    
                    var queue = [];
                    var sending = false;
                    var timer = null;
                    
                    return {
                    reset: reset,
                    sendAppMessage2: sendAppMessage2,
                    size: size
                    };
                    
                    function reset() {
                    queue = [];
                    sending = false;
                    }
                    
                    function sendAppMessage2( ack, nack, message2) {
                    
                    if (! isValidMessage(message2)) {
                    return false;
                    }
                      
                    
                    queue.push({
                               message2: message2,
                               ack: ack || null,
                               nack: nack || null,
                               attempts: 0
                               });
                    
                    setTimeout(function () {
                               sendNextMessage();
                               }, 2);//JUNE 23
                    
                    return true;
                    }
                    
                    function size() {
                    return queue.length;
                    }
                    
                    function isValidMessage(message2) {
                    // A message must be an object.
                    if (message2 !== Object(message2)) {
                    return false;
                    }
                    var keys = Object.keys(message2);
                    // A message must have at least one key.
                    if (! keys.length) {
                    return false;
                    }
                    for (var k = 0; k < keys.length; k += 1) {
                    var validKey = /^[0-9a-zA-Z-_]*$/.test(keys[k]);
                    if (! validKey) {
                    return false;
                    }
                    var value = message2[keys[k]];
                    if (! validValue(value)) {
                    return false;
                    }
                    }
                    
                    return true;
                    
                    function validValue(value) {
                    switch (typeof value) {
                    case 'string':
                    return true;
                    case 'number':
                    return true;
                    case 'object':
                    if (toString.call(value) === '[object Array]') {
                    return true;
                    }
                    }
                    return false;
                    }
                    }
                    
                    function sendNextMessage() {
                    
                    if (sending) { return; }
                    var message2 = queue.shift();
                    if (! message2) { return; }
                    
                    message2.attempts += 1;
                    sending = true;
                    Pebble.sendAppMessage2(message2.message2, ack, nack);
                    
                    timer = setTimeout(function () {
                                       timeout();
                                       }, 2000);
                    
                    function ack() {
                    clearTimeout(timer);
                    setTimeout(function () {
                               sending = false;
                               sendNextMessage();
                               }, 400);
                    if (message2.ack) {
                    message2.ack.apply(null, arguments);
                    }
                    }
                    
                    function nack() {
                    clearTimeout(timer);
                    if (message2.attempts < RETRY_MAX) {
                    queue.unshift(message2);
                    setTimeout(function () {
                               sending = false;
                               sendNextMessage();
                               }, 400 * message2.attempts);
                    }
                    else {
                    if (message2.nack) {
                    message2.nack.apply(null, arguments);
                    }
                    }
                    }
                    
                    function timeout() {
                    setTimeout(function () {
                               sending = false;
                               sendNextMessage();
                               }, 2000);
                    if (message2.ack) {
                    message2.ack.apply(null, arguments);
                    }
                    }
                    
                    }
                    
                    }());  */   

/*function clear_defaults(opts) {
   console.log ("START clear_defaults");

   // clear out the variables of the other setting if you switch
   switch (opts.mode) {
          case "Nightscout":
              opts.accountName = " ";
              opts.password = " ";
          break;

          case "US_Share":
          case "Non_US_Share":
             opts.endpoint = " ";
            break;
            
         default:
           console.log ("clear_defaults - Mode not selected");
            // could clear all opts here.
       break;
  }
}*/

// pebble specific calls with watch
Pebble.addEventListener("ready",
                        function(e) {
                        "use strict";
                        console.log("Pebble JS ready");
                  var opts = [ ].slice.call(arguments).pop( );
                  opts = JSON.parse(localStorage.getItem('cgmPebble_duo'));
             
                 // var current_mode = getModeAsInteger(opts);
                   //       console.log("opts: " + JSON.stringify(opts));
                  // send message data  
                  //var message = { mode_switch: current_mode };
                  
                  // send message data to log and to watch
                  //Pebble.sendAppMessage(message); 
                        });

Pebble.addEventListener("appmessage",
                        function(e) {
                        console.log("JS Recvd Msg From Watch: " + JSON.stringify(e.payload));
                        fetchCgmData();
                        });

//Pebble.addEventListener("showConfiguration", function(e) {
  //                      console.log("Showing Configuration", JSON.stringify(e));
    //                    Pebble.openURL('http://cgminthecloud.github.io/CGMClassicPebble/skyduov1.html');
      //                  });

Pebble.addEventListener("webviewclosed", function(e) {
                        var opts = JSON.parse(decodeURIComponent(e.response));

                          // clear non-selected parameters from the storage item
                        //clear_defaults(opts);
  
                        console.log("CLOSE CONFIG OPTIONS = " + JSON.stringify(opts));
                        
                        // store endpoint in local storage
                        localStorage.setItem('cgmPebble_duo', JSON.stringify(opts));                      
                        });


