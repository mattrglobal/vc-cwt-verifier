/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

import * as base64 from "@stablelib/base64";
import { ok, Result } from "neverthrow";
import * as React from "react";
import { useState } from "react";
import { Button, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";

import {
  verify,
  VerifyOptions,
  JsonWebKeyPublic,
  IssuerResolverError,
  ResolveOptions,
} from "@mattrglobal/vc-cwt-verifier";

import { MyButton } from "./MyButton";

type ActiveScreen = "home";

export const App: React.FC = () => {
  const [result, setResult] = useState("");
  const [errReason, setErrReason] = useState("");
  const [input, setInput] = useState("");
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("home");

  const homeScreen = (): React.ReactElement => {
    return (
      <React.Fragment>
        <MyButton
          title="Verify"
          testID={"btnVerify"}
          onPress={async (): Promise<void> => {
            const validBase64PayloadWithBase32DecodedPayload =
              "0oRKogRFa2V5LTEBJqBZAQClAWtkaWQ6d2ViOnh4eAUaYXshNQQaYYRbtWJ2Y6RoQGNvbnRleHSCeCZodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MXgkaHR0cHM6Ly9leGFtcGxlLmNvbS9jcmVkZW50aWFscy9wYXNzZ3ZlcnNpb25lMS4wLjBkdHlwZYJ0VmVyaWZpYWJsZUNyZWRlbnRpYWxqUHVibGljUGFzc3FjcmVkZW50aWFsU3ViamVjdKNpZ2l2ZW5OYW1lZEphY2tqZmFtaWx5TmFtZWdTcGFycm93Y2RvYmoxOTc5LTA0LTE0B1AL5CgYIwJPMrkEDhcmjk6fWED0TYBtzx+wokSCLjLUBIeMv2ZsfXnh+gQtN14F9t064nOMk42RNqdpwXYKNOgMtxa48jAQqg4YCgJ8W6MZMoSv";
            const validPublicKeyJwk: JsonWebKeyPublic = {
              kty: "EC",
              crv: "P-256",
              x: "7GQfPAfuiFV0f1k6EoLk0Cb0iU4EsUFb3WbS1-hwPPc",
              y: "gHqAr08-S8kqf5vFGd19ob25WmDB6lxgje7G1oZKabs",
            };

            const result = await verify({
              payload: base64.decode(validBase64PayloadWithBase32DecodedPayload),
              issuerResolver: {
                resolve: (options: ResolveOptions): Promise<Result<JsonWebKeyPublic, IssuerResolverError>> =>
                  Promise.resolve(ok(validPublicKeyJwk)),
              },
            } as VerifyOptions);
            console.debug(JSON.stringify(result));
            setResult(`Verify result: ${JSON.stringify(result)}`);
          }}
        />
      </React.Fragment>
    );
  };
  const getActiveScreen = (activeScreen: ActiveScreen): React.ReactElement => {
    switch (activeScreen) {
      case "home":
        return homeScreen();
    }
  };
  return (
    <SafeAreaView>
      <Button title="Home screen" testID={"btnHomeScreen"} onPress={() => setActiveScreen("home")} />
      <Text>Result:</Text>
      <View style={{ height: 50 }}>
        <ScrollView>
          <Text testID={"txtResult"}>{result}</Text>
        </ScrollView>
      </View>
      <Text>Error:</Text>
      <Text testID={"txtErrReason"}>{errReason}</Text>
      <Text>Input:</Text>
      <TextInput
        testID={"txtInput"}
        onChangeText={setInput}
        placeholder={"input"}
        value={input}
        /**
         * iOS uses "smart punctuation" to convert double quotes `"` to the equivalent unicode char `“`
         * thus breaking the Detox tests (unable to parse the JSON).
         *
         * The following prop `keyboardType="ascii-capable"` is added to the input element to prevent it from happening.
         */
        keyboardType="ascii-capable"
      />
      {getActiveScreen(activeScreen)}
    </SafeAreaView>
  );
};
