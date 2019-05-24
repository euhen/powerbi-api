// PowerBi API Library
// PowerBi API queue class
//
// Copyright (C) 2019 Yevhen Stohniienko <yeuhen.stohniyenko@ukr.net>
//
// This Source Code Form is subject to the terms of the Mozilla
// Public License v. 2.0. If a copy of the MPL was not distributed
// with this file, You can obtain one at http://mozilla.org/MPL/2.0/.

const CircularBuffer = require("circular-buffer"),
  Long = require("long"),
  isEmpty = require("./utils").isEmpty;


function compareTimestamps(powerbiMsgTimestamp, arr) {
  //var arr = global.powerbiQueue[datasetUrl].tss.toarray();
  var isArrIncludes = false;
  for (var i = 0, len = arr.length; i < len; i++) {
    if (arr[i] instanceof Long) {
      if ( arr[i].equals(powerbiMsgTimestamp) ) {
        isArrIncludes = true;
        break;
      }
    } else if (powerbiMsgTimestamp instanceof Long) {
      if ( powerbiMsgTimestamp.equals(arr[i]) ) {
        isArrIncludes = true;
        break;
      }
    } else {
      if ( (arr[i]==powerbiMsgTimestamp) ||
        (Number(arr[i])==Number(powerbiMsgTimestamp)) ||
        (String(arr[i])==String(powerbiMsgTimestamp)) ) {
        isArrIncludes = true;
        break;
      }
    }
  }
  return {arr_i: arr[i], isArrIncludes: isArrIncludes};
}


class PowerbiApiQueue {
  constructor(defaultTimeout) {
    this.defaultTimeout = defaultTimeout;

    this.powerbiQueue = {};

  }

  processPowerbiQueue(powerbiMsg, powerbiMsgTimestamp, datasetKey, timeout, timestampDuplicateCallback, senderCallback) {
    const isSenderReady = senderCallback ? true : false;
    if (!powerbiMsgTimestamp) return;
    if (!this.powerbiQueue[datasetKey]) this.powerbiQueue[datasetKey] = {};
    if (!this.powerbiQueue[datasetKey].msg) this.powerbiQueue[datasetKey].msg = [];
    if (!this.powerbiQueue[datasetKey].attr) this.powerbiQueue[datasetKey].attr = {};
    if (!this.powerbiQueue[datasetKey].tss) this.powerbiQueue[datasetKey].tss = new CircularBuffer(3000);

    //this.powerbiQueue[datasetKey].msg = []; //for test purpose only

    if (powerbiMsg instanceof Array) {
      //console.log(powerbiMsgTimestamp);
      for (var dataListIndex = 0, dlLen = Math.max(powerbiMsg.length, powerbiMsgTimestamp.length, 1);
        dataListIndex < dlLen; dataListIndex++
      ) {
        var dataListItem = powerbiMsgTimestamp[dataListIndex];
        var arr = this.powerbiQueue[datasetKey].tss.toarray();
        var {arr_i, isArrIncludes} = compareTimestamps(dataListItem, arr);
        if (isArrIncludes) {
          console.log("timestamp duplicate: "+arr_i+" = "+powerbiMsgTimestamp[dataListIndex]);
          //timestampDuplicateCallback();
          powerbiMsg.splice (dataListIndex, 1);
        } else {
          if (Number(powerbiMsgTimestamp[dataListIndex]) == 0) {console.log("zero timestamp list item "+dataListIndex);return;} //throw new Error("zero timestamp list item "+dataListIndex);
          this.powerbiQueue[datasetKey].tss.enq(powerbiMsgTimestamp[dataListIndex]);
        }
      }
      if (isEmpty(powerbiMsg)) return;
      this.powerbiQueue[datasetKey].msg.push(...powerbiMsg);
    } else {
      var arr = this.powerbiQueue[datasetKey].tss.toarray();
      var {arr_i, isArrIncludes} = compareTimestamps(powerbiMsgTimestamp, arr);
      if (isArrIncludes) {
        console.log("timestamp duplicate: "+arr_i+" = "+powerbiMsgTimestamp);
        //timestampDuplicateCallback();
        return;
      } else {
          if (Number(powerbiMsgTimestamp) == 0) {console.log("zero timestamp argument");return;} //throw new Error("zero timestamp argument");
          this.powerbiQueue[datasetKey].tss.enq(powerbiMsgTimestamp);
          this.powerbiQueue[datasetKey].msg.push(powerbiMsg);
        }
    }

    //console.log("processPowerbiQueue: datasetKey: ");
    //console.log(datasetKey);
    //console.log("processPowerbiQueue: this.powerbiQueue[datasetKey]: ");
    //console.log(this.powerbiQueue[datasetKey]);
    //console.log("processPowerbiQueue: powerbiMsg: ");
    //console.log(powerbiMsg);

    if (
      (!this.powerbiQueue[datasetKey].ts ||
      ( (new Date().getTime() - this.powerbiQueue[datasetKey].ts) > timeout )
      ) && isSenderReady
    ) {
      senderCallback(this.powerbiQueue[datasetKey].msg, datasetKey);
      this.powerbiQueue[datasetKey].ts = new Date().getTime();
      this.powerbiQueue[datasetKey].msg = [];
    }
  }
}

exports.PowerbiApiQueue = PowerbiApiQueue;
