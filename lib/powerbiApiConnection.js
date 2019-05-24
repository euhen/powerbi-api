// PowerBi API Library
// PowerBi API connection class
//
// Copyright (C) 2019 Yevhen Stohniienko <yeuhen.stohniyenko@ukr.net>
//
// This Source Code Form is subject to the terms of the Mozilla
// Public License v. 2.0. If a copy of the MPL was not distributed
// with this file, You can obtain one at http://mozilla.org/MPL/2.0/.

const request = require('request'),
  format = String.Format = require("clr-format"),
  exec = require('child_process').execFile,
  pc = require('pcify'),
  formurlencoded = require('form-urlencoded').default;

function getTokenFirst(clientID, authorityUri, callback) {
  //console.log("getTokenFirst: arguments: ");
  //console.dir(arguments, {depth:null});
  //console.log("getTokenFirst: start");
  const child = exec("./PowerBIAzureADGetToken.exe", [clientID, authorityUri], (error, stdout, stderr) => {
    if (error) {
      throw error;
    }
    //console.log(stdout);
    //console.log(error)
    //console.log(stdout.toString());
    console.log("token is: ", stdout.toString().replace(/\n$/, ""));
    callback(stdout.toString().replace(/\n$/, ""));
  });
}

function getTokenByPass({login, password, clientId}, callback, errCb) {
  //console.log("getTokenByPass: arguments: ");
  //console.dir(arguments, {depth:null});
  const powerBILoginUrl = "https://login.windows.net/common/oauth2/token";

  const requestBodyObj = {
    client_id : clientId,
    resource : "https://analysis.windows.net/powerbi/api",
    username : login,
    password : password,
    grant_type : "password"
  };
  //console.log(requestBodyObj);
  const requestBody = formurlencoded(requestBodyObj);
  //console.log(requestBody);
  const buf1 = Buffer.from(requestBody, 'utf8');
  //console.log(buf1.toString());

  request({
    method: "POST",
    uri: powerBILoginUrl,
    body: buf1,
    forever: true, //KeepAlive
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      "Accept": "application/json",
      "Accept-Charset": "utf-8"
    }
  },
  (error, response, body) => {
    if (error) {
      return console.error("request failed:", error);
    }
    //console.log("Request successful!  Server responded with: ");
    //console.dir(response.statusCode, {depth:null});
    //console.dir(body, {depth:null});
    const bodyObj = (body=="") ? {} : JSON.parse(body);
    //console.dir(bodyObj, {depth:null});
    if (bodyObj.error) {
      return errCb(bodyObj);
    }
    if (bodyObj.access_token)
      callback(bodyObj.access_token);
    else
      callback(false);
  });

}

// This API method is not working in my case
function getWorkspaceIdByName(token, workspaceName, callback, errCb) {
  //const powerBIWorkspaceApiUrl = String.Format("https://api.powerbi.com/v1.0/myorg/groups?$filter=$filter=name%20eq%20'{0}'", encodeURIComponent(workspaceName));
  const powerBIWorkspaceApiUrl = "https://api.powerbi.com/v1.0/myorg/groups";
  //console.log(powerBIWorkspaceApiUrl);

  request({
    method: "GET",
    uri: powerBIWorkspaceApiUrl,
    forever: true, //KeepAlive
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Accept": "application/json",
      "Accept-Charset": "utf-8",
      //Add token to the request header
      "Authorization": String.Format("Bearer {0}", token)
    }
  },
  (error, response, body) => {
    if (error) {
      return console.error("request failed:", error);
    }
    //console.log("getWorkspaceIdByName: Request successful! Server responded with: ");
    //console.dir(response, {depth:1});
    //console.dir(response.statusCode);
    //console.dir(body, {depth:null});
    const bodyObj = (body=="") ? {} : JSON.parse(body);
    //console.dir(bodyObj, {depth:null});
    if (bodyObj.error) {
      //return errCb(bodyObj.error);
    }
    if ((response.statusCode == 200) && bodyObj && bodyObj.value && bodyObj.value[0])
      callback(bodyObj.value[0].id)
    else callback(false);
  });
}

function createWorkspace(token, workspaceName, callback, errCb) {
  //POST https://api.powerbi.com/v1.0/myorg/groups

  const powerBIApiCreateWorkspaceUrl = "https://api.powerbi.com/v1.0/myorg/groups";
  const requestBody = JSON.stringify( {"name": "Test_1"} );
  //console.log(requestBody);
  //const buf1 = Buffer.from('{"name":"sample group3"}', 'utf8');
  const buf1 = Buffer.from(requestBody, 'utf8');
  //console.log(buf1.toString());

  request({
    method: "POST",
    uri: powerBIApiCreateWorkspaceUrl,
    body: buf1,
    //json: true,
    forever: true, //KeepAlive
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Accept": "application/json",
      "Accept-Charset": "utf-8",
      //Add token to the request header
      "Authorization": String.Format("Bearer {0}", token)
    }
  },
  (error, response, body) => {
    if (error) {
      return console.error("request failed:", error);
    }
    //console.log("createWorkspace: Request successful!  Server responded with: ");
    //console.dir(response.statusCode);
    //console.dir(body, {depth:null});
    const bodyObj = (body=="") ? {} : JSON.parse(body);
    //console.dir(bodyObj, {depth:null});
    if (bodyObj.error) {
      //return errCb(bodyObj.error);
    }
    if ((response.statusCode == 200) && bodyObj && bodyObj.value && bodyObj.value[0])
      callback(bodyObj.value[0].id)
    else callback(false);
  });
}

function createDataset(token, workspaceId, datasetName, tablesList, callback, errCb) {
  //POST https://api.powerbi.com/v1.0/myorg/groups/{groupId}/datasets
  //POST https://api.powerbi.com/v1.0/myorg/datasets

  var powerBIApiDatasetUrl;
  if (workspaceId) {
    powerBIApiDatasetUrl = String.Format(
      "https://api.powerbi.com/v1.0/myorg/groups/{0}/datasets", encodeURIComponent(workspaceId)) ;}
  else {
    powerBIApiDatasetUrl = "https://api.powerbi.com/v1.0/myorg/datasets"; }

  const tables = (tablesList instanceof Array) ? tablesList : [tablesList];
  //console.log("createDataset: tables: ");
  //console.log(tables);
  const requestBody = JSON.stringify( {
    "name": datasetName,
    "defaultMode": "Push",
    //"defaultMode": "pushStreaming",
    //"defaultMode": "Streaming",
    "tables": tables
  } );

  request({
    method: "POST",
    uri: powerBIApiDatasetUrl,
    body: requestBody,
    //json: true,
    forever: true, //KeepAlive
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Accept": "application/json",
      "Accept-Charset": "utf-8",
      //Add token to the request header
      "Authorization": String.Format("Bearer {0}", token)
    }
  },
  (error, response, body) => {
    if (error) {
      return console.error("request failed:", error);
    }
    //console.log("createDataset: Request successful!  Server responded with: ");
    //console.dir(response.statusCode);
    //console.dir(body, {depth:null});
    const bodyObj = JSON.parse(body);
    //console.dir(bodyObj, {depth:null});
    if (bodyObj.error) {
      return errCb(bodyObj.error);
    }
    const datasetId = bodyObj? bodyObj.id: false;
    callback(datasetId)
  });
}

function getDatasetByName(token, workspaceId, datasetName, callback, errCb) {
  //GET https://api.powerbi.com/v1.0/myorg/groups/{groupId}/datasets
  //GET https://api.powerbi.com/v1.0/myorg/datasets
  //Based on C# example at https://docs.microsoft.com/en-us/power-bi/developer/walkthrough-push-data-get-datasets
  //console.dir("getDatasetByName: datasetName: ");
  //console.dir(datasetName);
  var powerBIDatasetsApiUrl;
  if (workspaceId) {
    powerBIDatasetsApiUrl = String.Format(
      "https://api.PowerBI.com/v1.0/myorg/groups/{0}/datasets", encodeURIComponent(workspaceId)) ;}
  else {
    powerBIDatasetsApiUrl = "https://api.powerbi.com/v1.0/myorg/datasets"; }

  //GET web request to get a dataset.
  request({
    method: "GET",
    uri: powerBIDatasetsApiUrl,
    forever: true, //for request.KeepAlive = true;
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Accept": "application/json",
      "Accept-Charset": "utf-8",
      //Add token to the request header
      "Authorization": String.Format("Bearer {0}", token)
    }
  },
  (error, response, body) => {
    if (error) {
      return console.error("request failed:", error);
    }
    //console.log("getDatasetByName: Request successful!  Server responded with: ");
    //console.dir(response.statusCode);
    //console.dir(body, {depth:null});
    const bodyObj = JSON.parse(body);
    //console.dir(bodyObj, {depth:null});
    if (bodyObj.error) {
      return errCb(bodyObj.error);
    }
    if (bodyObj && bodyObj["value"] && bodyObj["value"][0]) {
      const firstFound = bodyObj.value.filter( (value) => (value.name == datasetName) )[0];
      const datasetId = firstFound? firstFound.id: false;
      //console.dir("getDatasetByName: firstFound: ")
      //console.dir(firstFound, {depth:null})
      callback(datasetId);
    } else {
      const datasetId = false;
      callback(datasetId);
    }
  });
}

function createTable(token, workspaceId, datasetId, tableName, tableColumns, callback, errCb) {
  //PUT https://api.powerbi.com/v1.0/myorg/groups/{groupId}/datasets/{datasetKey}/tables/{tableName}
  //PUT https://api.powerbi.com/v1.0/myorg/datasets/{datasetKey}/tables/{tableName}

  const powerBIApiCreateTableUrl = (workspaceId) ?
    String.Format(
      "https://api.powerbi.com/v1.0/myorg/groups/{0}/datasets/{1}/tables/{2}", encodeURIComponent(workspaceId),
	encodeURIComponent(datasetId), encodeURIComponent(tableName)) :
    String.Format(
      "https://api.powerbi.com/v1.0/myorg/datasets/{0}/tables/{1}", encodeURIComponent(datasetId), encodeURIComponent(tableName));

  //console.dir("createTable: tableColumns: ", {depth:null})
  //console.dir(tableColumns, {depth:null})
  const requestBody = JSON.stringify( {
    "name": tableName,
    "columns": tableColumns
  } );

  request({
    method: "PUT",
    uri: powerBIApiCreateTableUrl,
    body: requestBody,
    //json: true,
    forever: true, //KeepAlive
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Accept": "application/json",
      "Accept-Charset": "utf-8",
      //Add token to the request header
      "Authorization": String.Format("Bearer {0}", token)
    }
  },
  (error, response, body) => {
    if (error) {
      return console.error("request failed:", error);
    }
    //console.log("createTable: Request successful!  Server responded with: ");
    //console.dir(body, {depth:null});
    callback(true);
  });
}

function getTableByName(token, workspaceId, datasetId, tableName, callback, errCb) {
  //GET https://api.powerbi.com/v1.0/myorg/groups/{groupId}/datasets/{datasetKey}/tables
  //GET https://api.powerbi.com/v1.0/myorg/datasets/{datasetKey}/tables

  const powerBITablesApiUrl = (workspaceId) ?
    String.Format(
      "https://api.powerbi.com/v1.0/myorg/groups/{0}/datasets/{1}/tables", encodeURIComponent(workspaceId), encodeURIComponent(datasetId)) :
    String.Format(
      "https://api.powerbi.com/v1.0/myorg/datasets/{0}/tables", encodeURIComponent(datasetId));

  request({
    method: "GET",
    preambleCRLF: true,
    postambleCRLF: true,
    uri: powerBITablesApiUrl,
    forever: true, //KeepAlive
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Accept": "application/json",
      "Accept-Charset": "utf-8",
      //Add token to the request header
      "Authorization": String.Format("Bearer {0}", token)
    }
  },
  (error, response, body) => {
    if (error) {
      return console.error("request failed:", error);
    }
    //console.log("getTableByName: Request successful!  Server responded with: ");
    //console.dir(body, {depth:null});
    const bodyObj = JSON.parse(body);
    //console.dir(bodyObj, {depth:null});
    if (bodyObj.error) {
      return errCb(bodyObj.error);
    }
    var isTableExists;
    if ( (bodyObj instanceof Object) && (bodyObj.value instanceof Array) ) {
      isTableExists = bodyObj.value.some( (value) => (value.name == tableName) )
    }else{
      isTableExists = false; }
    callback(isTableExists);
  });
}

function AddRows(data, token, workspaceId, datasetId, tableName, callback, errCb) {
  //POST https://api.powerbi.com/v1.0/myorg/groups/{groupId}/datasets/{datasetKey}/tables/{tableName}/rows
  //POST https://api.powerbi.com/v1.0/myorg/datasets/{datasetKey}/tables/{tableName}/rows
  //Based on C# example at https://docs.microsoft.com/en-us/power-bi/developer/walkthrough-push-data-add-rows
  const powerBIApiAddRowsUrl = (workspaceId) ?
    String.Format(
      "https://api.powerbi.com/v1.0/myorg/groups/{0}/datasets/{1}/tables/{2}/rows", encodeURIComponent(workspaceId),
	encodeURIComponent(datasetId), encodeURIComponent(tableName)) :
    String.Format(
      "https://api.powerbi.com/v1.0/myorg/datasets/{0}/tables/{1}/rows", encodeURIComponent(datasetId), encodeURIComponent(tableName));

  //JSON content for data
  const rowsJson = JSON.stringify( { "rows": data } );

  //POST web request to add rows.
  request({
    //Change request method to "POST"
    method: "POST",
    uri: powerBIApiAddRowsUrl,
    body: rowsJson,
    //json: true,
    forever: true, //for request.KeepAlive = true;
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Accept": "application/json",
      "Accept-Charset": "utf-8",
      //Add token to the request header
      "Authorization": String.Format("Bearer {0}", token)
    }
  },
  (error, response, body) => {
    if (error) {
      return console.error("request failed:", error);
    }
    //console.log("AddRows: Request successful!  Server responded with: ");
    //console.dir(response.statusCode);
    //console.dir(body, {depth:null});
    const bodyObj = (body=="") ? {} : JSON.parse(body);
    //console.dir(bodyObj, {depth:null});
    if (bodyObj.error) {
      return errCb(bodyObj.error);
    }
  });
}

function getDataKeys(data) {
  if (data instanceof Array)
    return Object.keys(data[0]);
  return Object.keys(data);
}

//combined functions

function getOrCreateTableByName(token, workspaceId, datasetId, tableName, tableColumns, callback, errCb) {
  getTableByName(token, workspaceId, datasetId, tableName, (isTableExists) => {
    if (isTableExists) {
      // TODO: check table columns and then, if need:
      //createTable(token, workspaceId, datasetId, tableName, tableColumns, () => {
        //callback(true);
      //});
      callback(true);
    }
    else {
      //we can not create a new table
      callback(false);
    }
  }, errCb);
}

function getOrCreateDatasetByName(token, workspaceId, datasetName, table, callback, errCb) {
  getDatasetByName(token, workspaceId, datasetName, (datasetId) => {
    //console.log("getOrCreateDatasetByName: getDatasetByName: datasetId");
    //console.log(datasetId);
    if (datasetId)
      getOrCreateTableByName(token, workspaceId, datasetId, table.name, table.columns, (isSuccess) => {
        if (isSuccess)
          callback(datasetId)
        else {
          console.error("error: table not exist or other error, table: "+table);
          callback(false); }
      }, errCb)
    else
      createDataset(token, workspaceId, datasetName, table, (datasetId) => {
        if (datasetId)
          callback(datasetId)
        else {
          console.error("error creating dataset "+datasetName+" with table "+table);
          callback(false); }
      }, errCb);
  }, errCb);
}

function getOrCreateWorkspaceIdByName(token, workspaceName, callback, errCb, defaultWorkspaceId) {
  return process.nextTick(() => { callback(false); });
  if ( (!workspaceName) && defaultWorkspaceId ) {
    process.nextTick(() => { callback(defaultWorkspaceId); }); return; }
  if (!workspaceName) {
    callback(); return; }
  getWorkspaceIdByName(this.token, workspaceName, (workspaceId) => {
    if (workspaceId)
      callback(workspaceId);
    else
      createWorkspace(token, workspaceName, (workspaceId) => {
        callback(workspaceId);
      }, errCb);
  }, errCb)
}

function isIso8601(str) {
  return str.match(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  );
}

function genTableFields(tableName, data) {
  if (!((typeof tableName == 'string') && (data instanceof Object)))
    return console.log("genTableFields: error: invalid args");
  //console.log("genTableFields: data: ");
  //console.dir(data, {depth:null});
  var arr = [];
  for (var key in data) {
    //console.log("genTableFields: key: ", key);
    const item = data[key];
    switch (typeof item) {
      case 'string':
        if (isIso8601(item)) {
          arr.push({
            "name": key,
            "dataType": "DateTime"
          });
        }
        else {
          arr.push({
            "name": key,
            "dataType": "string"
          });
        }
        break;
      case 'number':
      case 'object':
        arr.push({
          "name": key,
          "dataType": "double"
        });
        break;
      case 'boolean':
        arr.push({
          "name": key,
          "dataType": "bool"
        });
        break;
      default:
        console.log("genTableFields: error");
    }
  }
  //console.log("genTableFields: arr: ");
  //console.dir(arr, {depth:null});

  return {
    "name": tableName,
    "columns": arr
  }

}

class PowerbiApiConnection {
  constructor({login, password, clientId, token, tokenLifetime}, {defaultWorkspaceName, defaultDatasetName, defaultTableName}={}) {
    this.login = login;
    this.password = password;
    this.clientId = clientId;
    this.defaultWorkspaceName = defaultWorkspaceName;
    this.defaultDatasetName = defaultDatasetName;
    this.defaultTableName = defaultTableName;

    this.token = token ? Promise.resolve(token) : this.constructor.getToken({login, password, clientId});

    this.cache = {};
    this.cache.workspaces = {};
    this.cache.datasets = {};

  }

  _clearToken() {
    this.token = this.constructor.getToken({login:this.login, password:this.password, clientId:this.clientId});
  }

  sendDataToDataset(data, newWorkspaceName, newDatasetName, newTableName) {
    const workspaceName = newWorkspaceName || this.defaultWorkspaceName;
    const datasetName = newDatasetName || this.defaultDatasetName;
    const tableName = newTableName || this.defaultTableName;
    const token = this.token;
    var self = this;

    //console.log("PowerbiApiConnection: sendDataToDataset: args: ");
    //console.log(Object.keys(data[0]||data));
    //console.log(data);
    //console.log(newWorkspaceName);
    //console.log(workspaceName);
    //console.log(newDatasetName);
    //console.log(datasetName);
    //console.log(newTableName);
    //console.log(tableName);

    if (!this.cache.workspaces[workspaceName]) {
      this.cache.workspaces[workspaceName] = {};
      this.cache.workspaces[workspaceName].id =
        new Promise( (resolve, reject) => {
          token.then( (token) => {
            getOrCreateWorkspaceIdByName(token, workspaceName, (workspaceId) => {
              resolve(workspaceId);
            }, (error) => {
              reject(error);
            }, this.defaultWorkspaceId)
          })
        })
      ;
    }

    this.cache.workspaces[workspaceName].id.then( (workspaceId) => {
      //console.log("workspaceId: ");
      //console.log(workspaceId);
      const tableFields = genTableFields(tableName, (data[0]||data));
      //console.log("tableFields: ");
      //console.dir(tableFields, {depth:null});

      if (!this.cache.datasets[workspaceName]) this.cache.datasets[workspaceName] = {};
      if (!this.cache.datasets[workspaceName][datasetName]) {
        this.cache.datasets[workspaceName][datasetName] = {};
        this.cache.datasets[workspaceName][datasetName].id =
          new Promise( (resolve, reject) => {
            token.then( (token) => {
              getOrCreateDatasetByName(token, workspaceId, datasetName, tableFields, (datasetId) => {
                resolve(datasetId);
              }, (error) => {
                reject(error);
              })
            })
          })
        ;
      }

      this.cache.datasets[workspaceName][datasetName].id.then( (datasetId) => {
        //console.log("datasetId: ");
        //console.log(datasetId);
        if (datasetId)
          token.then( (token) => {
            //console.log("sendDataToDataset: AddRows args: ");
            //console.log([data, token, workspaceId, datasetId, tableName]);
            if (token)
              AddRows(data, token, workspaceId, datasetId, tableName, null, (error) => {
                failureCallback(error);
              })
            else
              console.log("PowerbiApiConnection:sendDataToDataset:getOrCreateDatasetByName: error");
          })
        else
          console.log("PowerbiApiConnection:sendDataToDataset:getOrCreateDatasetByName: error");
      }, (error) => {
        failureCallback(error);
      });
    }, (error) => {
      failureCallback(error);
    });

    function failureCallback(error) {
      //console.log("PowerbiApiConnection:sendDataToDataset:failureCallback: ");
      //console.log(error);
      if (error.code == "TokenExpired") {
        self._clearToken();
      } else {
        console.log("PowerbiApiConnection:sendDataToDataset:failure: ");
        console.log(error);
      }
    }

  }

  setDefaultWorkspace(defaultWorkspaceName, callback) {
    throw new Error("not implemented");
  }

  setDefaultDataset(defaultDatasetName, callback) {
    throw new Error("not implemented");
  }

  setDefaultTableName(defaultTableName, callback) {
    this.defaultTableName = defaultTableName;
    if (callback) callback();
  }

  static getToken({login, password, clientId}, callback) {
    //console.log("static getToken: arguments: ");
    //console.dir(arguments, {depth:null});
    const subdomian = login.replace(/^.*@(.*)\.onmicrosoft\.com$/mi, "$1");
    const authorityUri = `https://login.windows.net/${subdomian}.onmicrosoft.com`;
    return pc.promise(callback, (resolve, reject) => {
      if (clientId && !(login && password))
        getTokenFirst(clientId, authorityUri, (token) => {return resolve(token)});
      else if (clientId && login && password)
        getTokenByPass({login:login, password:password, clientId:clientId}, (token) => {return resolve(token)}, (err) => {
          if (err && err.error && (err.error == "invalid_grant") ) {
            getTokenFirst(clientId, authorityUri, (token) => {return resolve(token)});
          }
          else {
            return reject(err);
          }
        });
      else
        console.log("bad credentials: ");
        console.log(login);
        console.log(password);
        console.log(clientId);
    });

  }

  static sendDataToDatasetUrl(powerbiMsg, datasetUrl) {
    //return;

    request.post(
      datasetUrl,
      { json: powerbiMsg },
      (error, response, body) => {
        if (body) {
          console.log('Power BI response body:');
          console.log(body);
        }
        if (error) {
          console.log('Power BI error:');
          console.log(error);
        }
      }
    );

  }

}

exports.PowerbiApiConnection = PowerbiApiConnection;
