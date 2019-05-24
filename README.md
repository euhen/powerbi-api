PowerBi API
===========

Alpha testing version

A module for performing basic operations with the PowerBi API. Allows to send data to dataset by url, as well as by name. If there is no dataset with the specified name, it is created automatically. In this module the frequency constraint of requests to the PowerBi API was taken into account.

## Installation

```shell
  npm install git+https://github.com/euhen/powerbi-api.git --save
```

## Usage

```js
  const {PowerbiApiConnection, PowerbiApi} = require("powerbi-api");
  const defaultWorkspaceName = "defaultWorkspace",
    defaultDatasetName = "defaultDataset",
    defaultTableName = "defaultTable";
  const login = "login@example.net",
    password = "pa$$w0rd",
    clientID = "00000000-0000-0000-0000-000000000000";
  PowerbiApiConnection.getToken({login:login, password:password, clientId:clientID}, (token) => {
    global.powerbiApiInstance = new PowerbiApi({login:login, password:password, clientId:clientID, token:token},
      {defaultWorkspaceName:defaultWorkspaceName, defaultDatasetName:defaultDatasetName, defaultTableName:defaultTableName});
    console.dir(global.powerbiApiInstance, {depth:null});
    sendData();
  })
  function sendData() {
    const data = {
        name:"test",
        date: new Date().toString(),
        value: 10
      },
      timestamp = new Date().getTime();
    const datasetPath = {
        workspaceName: "workspace1",
        datasetName: "dataset1",
        tableName: "table1"
      };
    const timeout = 1 * 1000; // one second
    global.powerbiApiInstance.sendDataToDataset(data, timestamp, datasetPath, timeout)
  }
```

## Contributing

Any ideas, as well as refactoring and tips for improving the code and module design are welcome.

## Todo

* Refactor code
* Use logger instead of console.log
* Make documentation

## Release History

* 0.0.1 Initial release

## License

MPL-2.0 © Yevhen Stohniienko
