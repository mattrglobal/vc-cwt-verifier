/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */
import { AppRegistry } from "react-native";

import { name as appName } from "./app.json";
import App from "./src";

try {
  console.log("Registering app");
  AppRegistry.registerComponent(appName, () => App);
} catch (e) {
  console.log("There was an error registering the app");
  console.log(e);
}
