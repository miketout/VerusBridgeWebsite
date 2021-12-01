import { convertVerusAddressToEthAddress } from "./convert";

// Flags for CTransferDesination type
const  DEST_PKH = 2
const  DEST_ID = 4
const  DEST_ETH = 9
const  FLAG_DEST_GATEWAY = 128

const  VALID = 1
const  CONVERT = 2
const  PRECONVERT = 4
const  CROSS_SYSTEM = 0x40                // if this is set there is a systemID serialized and deserialized as well for destination
const  IMPORT_TO_SOURCE = 0x200           // set when the source currency not destination is the import currency
const  RESERVE_TO_RESERVE = 0x400         // for arbitrage or transient conversion 2 stage solving (2nd from new fractional to reserves)

let poolavailable = false;

export const getConfigOptions = ({address, destination, amount, token}) => {
  let destinationtype = {};
  let flagvalue = VALID + CROSS_SYSTEM;
  let secondreserveid = "0x0000000000000000000000000000000000000000"
  let destinationcurrency = {};

  let destinationaddress = {};
  //set destination to correct type
  if (isiAddress(address)) {
    destinationtype = DEST_ID; //ID TYPE 
    destinationaddress = convertVerusAddressToEthAddress(address)
  } else if (isRAddress(address)) {
    destinationtype = DEST_PKH; //R TYPE
    destinationaddress = convertVerusAddressToEthAddress(address)
  }else if (isETHAddress(address)) {
    destinationtype = DEST_ETH; //ETH TYPE
    destinationaddress = address
  }
 
  if(destinationtype == DEST_ID || destinationtype == DEST_PKH ) { //if I or R address chosen then do one way specific stuff          
      if(poolavailable == "0") { // pool not available
        if(destination != 'vrsctest'){
          alert("Cannot convert yet Bridge.veth not launched"); //add in FLAGS logic for destination    
          return null;
        }
        flagvalue = VALID + CROSS_SYSTEM;
        destinationcurrency = "ETH";
      } else {
        if (destination == 'vrsctest') {              
          destinationcurrency = "bridge";  //bridge open all sends go to bridge.veth
          flagvalue = VALID + CROSS_SYSTEM; 
        } else if(destination == 'bridgeUSDC') {
          if(token != 'USDC' && token != "bridge") {
            destinationcurrency = "bridge";  //bridge open convert from token  to USDC 
            secondreserveid = currencyglobal.USDC;
            flagvalue = VALID + CONVERT + CROSS_SYSTEM + RESERVE_TO_RESERVE ;   //add convert flag on
          } else if( token == "bridge") {
            destinationcurrency = "USDC";
            flagvalue = VALID + CONVERT + CROSS_SYSTEM +  IMPORT_TO_SOURCE;
          } else {
            alert("Cannot convert USDC to USDC. Send Direct to VRSCTEST"); //add in FLAGS logic for destination
            return null;
          }
        } else if (destination == 'bridgeVRSCTEST') {
          if(token != 'VRSCTEST' && token != "bridge"){
            destinationcurrency = "bridge";  //bridge open convert from token to VRSCTEST
            secondreserveid = currencyglobal.VRSCTEST;
            flagvalue = VALID + CONVERT + CROSS_SYSTEM + RESERVE_TO_RESERVE ;   //add convert flag on
          } else if( token == "bridge") {
            destinationcurrency = "VRSCTEST";
            flagvalue = VALID + CONVERT + CROSS_SYSTEM +  IMPORT_TO_SOURCE;
          } else {
            alert("Cannot convert VRSCTEST to VRSCTEST. Send Direct to VRSCTEST"); //add in FLAGS logic for destination
            return null;
          }
        } else if(destination == 'bridgeETH') {
          if(token != 'ETH' && token != "bridge") {
            destinationcurrency = "bridge";  //bridge open convert from token to ETH
            secondreserveid = currencyglobal.ETH;
            flagvalue = VALID + CONVERT + CROSS_SYSTEM + RESERVE_TO_RESERVE ;   //add convert flag on
          } else if( token == "bridge") {
            destinationcurrency = "ETH";
            flagvalue = VALID + CONVERT + CROSS_SYSTEM +  IMPORT_TO_SOURCE;
          } else {
            alert("Cannot convert ETH to ETH. Send Direct to VRSCTEST"); //add in FLAGS logic for destination
            return null;
          }
        } else if(destination == 'bridge') {  
          
          destinationcurrency = "bridge";  //bridge open all sends go to bridge.veth
          if(token != 'bridge') {
            flagvalue = VALID + CONVERT + CROSS_SYSTEM ;   //add convert flag on
          } else {
            alert("Cannot convert bridge to bridge. Send Direct to VRSCTEST"); //add in FLAGS logic for destination
            return null;
          }
        } else {
          alert("Cannot bounce back, direct send only with i or R address"); //add in FLAGS logic for destination
          return null;
        }
      }
  } else if (
    destinationtype == DEST_ETH 
    && poolavailable != "0"  
    && token != 'bridge' 
    && (destination != 'vrsctest') 
    && (destination != 'bridge') 
  ) {  // if ethereuem address and pool is available 

    if(destination == "swaptoVRSCTEST" && (token != 'VRSCTEST') 
        || destination == "swaptoUSDC" && (token != 'USDC')  
        || destination == "swaptoETH" && (token != 'ETH')
        || destination == "swaptoBRIDGE"
      ) {
      destinationcurrency = "bridge";
      destinationtype += FLAG_DEST_GATEWAY; //add 128 = FLAG_DEST_GATEWAY
      //destination is concatenated with the gateway back address (bridge.veth) + uint160() + 0.003 ETH in fees uint64LE
      destinationaddress += "67460C2f56774eD27EeB8685f29f6CEC0B090B00" + "0000000000000000000000000000000000000000" + "e093040000000000"

      if(destination == "swaptoVRSCTEST"){
        secondreserveid = currencyglobal.VRSCTEST;
        flagvalue = VALID + CONVERT + CROSS_SYSTEM + RESERVE_TO_RESERVE;
      }
      if(destination == "swaptoUSDC"){
        secondreserveid = currencyglobal.USDC;
        flagvalue = VALID + CONVERT + CROSS_SYSTEM +  RESERVE_TO_RESERVE;
      }
      if(destination == "swaptoBRIDGE"){
        flagvalue = VALID + CONVERT + CROSS_SYSTEM ;
      }
      if(destination == "swaptoETH"){
        secondreserveid = currencyglobal.ETH;
        flagvalue = VALID + CONVERT + CROSS_SYSTEM +  RESERVE_TO_RESERVE ;
      }
    } else{
      alert("Cannot swap tokens to and from the same coin.  Or cannot go one way to an ETH address"); //add in FLAGS logic for destination
      return null;
    }
  } else if (
    destinationtype == DEST_ETH 
    && poolavailable != "0"  
    && token == 'bridge' 
    && (destination != 'vrsctest') 
    && (destination != 'bridge') 
  ) {  // if ethereuem address and pool is available 

      if((destination == "swaptoBRIDGE")){

        alert("Cannot swap bridge to bridge."); //add in FLAGS logic for destination
        return null;

      }

      destinationtype += FLAG_DEST_GATEWAY; 
      //destination is concatenated with the gateway back address (bridge.veth) + uint160() + 0.003 ETH in fees uint64LE
      destinationaddress += "67460C2f56774eD27EeB8685f29f6CEC0B090B00" + "0000000000000000000000000000000000000000" + "e093040000000000"

      if(destination == "swaptoVRSCTEST"){
        destinationcurrency = "VRSCTEST";
        flagvalue = VALID + CONVERT + CROSS_SYSTEM + IMPORT_TO_SOURCE;
      }
      if(destination == "swaptoUSDC"){
        destinationcurrency = "USDC";
        flagvalue = VALID + CONVERT + CROSS_SYSTEM +  IMPORT_TO_SOURCE;
      }
      if(destination == "swaptoETH"){
        destinationcurrency = "ETH";
        flagvalue = VALID + CONVERT + CROSS_SYSTEM +  IMPORT_TO_SOURCE;
      }

  } else if (
    destinationtype == DEST_ETH  
    && (destination == 'vrsctest') 
    || (destination == 'bridge') 
    || (destination == 'bridgeUSDC') 
    || (destination == 'bridgeVRSCTEST') 
    || (destination == 'bridgeETH')
  ) {
    alert("Cannot go one way to an ETH address"); //add in FLAGS logic for destination
    return null;
  }else{
    alert("Bridge.veth not launched yet, send only direct to i or R until launch complete"); //add in FLAGS logic for destination
    return null;
  }

  let feecurrency = {};
  let fees = {};
  if(poolavailable != "0" ){
    feecurrency = currencyglobal.ETH;
    fees = 30000; //0.0003 ETH FEE
  }else{
    feecurrency = currencyglobal.VRSCTEST; //pre bridge launch fees must be set as vrsctest
    fees = 20000000  // 0.02 VRSCTEST
  }

  return {flagvalue, feecurrency, fees, destinationtype, destinationaddress, destinationcurrency, secondreserveid}
}