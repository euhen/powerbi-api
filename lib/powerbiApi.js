// PowerBi API Library
// PowerBi API class
//
// Copyright (C) 2019 Yevhen Stohniienko <yeuhen.stohniyenko@ukr.net>
//
// This Source Code Form is subject to the terms of the Mozilla
// Public License v. 2.0. If a copy of the MPL was not distributed
// with this file, You can obtain one at http://mozilla.org/MPL/2.0/.

const {PowerbiApiConnection} = require("./powerbiApiConnection"),
  {PowerbiApiQueue} = require("./powerbiApiQueue");

function getDatasetKey(datasetPath) {
  if (typeof datasetPath == 'object') {
    return JSON.stringify(datasetPath);
  }
  else {
    return datasetPath;
  }
}

class PowerbiApi {
  constructor({login, password, clientId, token, tokenLifetime}, defaultTimeout, {defaultWorkspaceName, defaultDatasetName, defaultTableName}={}) {
    this.queue = new PowerbiApiQueue(defaultTimeout);
    this.connection = new PowerbiApiConnection({login:login, password:password, clientId:clientId, token:token},
	{defaultWorkspaceName:defaultWorkspaceName, defaultDatasetName:defaultDatasetName, defaultTableName:defaultTableName});

  }

  sendDataToDataset(currentData, currentDataTimestamp, datasetPath, timeout) {
    //console.dir("PowerbiApi: sendDataToDataset: args: ");
    //console.dir([currentDataTimestamp, datasetPath, timeout]);
    const datasetKey = getDatasetKey(datasetPath);
    var timestampDuplicateCallback = null;
    this.queue.processPowerbiQueue(currentData, currentDataTimestamp, datasetKey, timeout, timestampDuplicateCallback, (qData, qDatasetKey) => {
      if (datasetPath instanceof Object) {
        //console.dir("PowerbiApi: sendDataToDataset: queue.processPowerbiQueue: datasetPath: ");
        //console.dir(datasetPath);
        const {workspaceName, datasetName, tableName} = datasetPath;
        this.connection.sendDataToDataset(qData, workspaceName, datasetName, tableName);
      }
      else {
        PowerbiApiConnection.sendDataToDatasetUrl(currentData, datasetPath);
      }
    });
    var self = this;

  }
}

exports.PowerbiApi = PowerbiApi;
