# vc-cwt-verifier

## Detox Tests

### Setup

Follow the detox@18.10.0 development environment setup guides

NOTE: We have configured `Pixel_3_API_29` as the android emulator of choice in our
[detox configuration](./.detoxrc.json). Either install this specific simulator or change it to the default specified in
the android setup guide.

- [Android](https://github.com/wix/Detox/blob/18.10.0/docs/Introduction.AndroidDevEnv.md)
- [iOS](https://github.com/wix/Detox/blob/18.10.0/docs/Introduction.iOSDevEnv.md)

Install dependencies

```
yarn install
```

If you run into issues running the tests, ensure xcode & cocoapods is up to date

```
sudo gem update cocoapods
sudo gem update xcodeproj
```

### Running

Clean the detox framework cache

```
yarn detox:setup
```

For ios builds install cocoapods

```
cd ios && pod install && cd ..
```

Detox provides wrapping commands for creating builds. We can create a build in either ios or android

```
yarn detox:build:{ios:android}
```

Run the tests against your selected build:

```
yarn detox:test:{ios:android}
```

### Other useful command

Install specific java version

```bash
sdk list java
sdk install java 8.0.292.j9-adpt
```

Install android tools

```bash
echo "y" | $ANDROID_HOME/tools/bin/sdkmanager --install "system-images;android-29;google_apis;x86" --channel=3
echo "no" | $ANDROID_HOME/tools/bin/avdmanager create avd --force --name Nexus_5X_API_29 --device "Nexus 5X" -k 'system-images;android-29;google_apis;x86'
```

Install specific NDK version

```bash
$ANDROID_HOME/tools/bin/sdkmanager --install "ndk;21.4.7075529"
```

Android env config

```bash
export ANDROID_NDK_HOME=/Users/user/Library/Android/sdk/ndk-bundle
export ANDROID_SDK_ROOT=/Users/user/Library/Android/sdk
export ANDROID_HOME=/Users/user/Library/Android/sdk
```

Launch android emulator

```bash
$ANDROID_HOME/emulator/emulator -list-avds
$ANDROID_HOME/emulator/emulator -avd Nexus_5X_API_29
```

Run a specific test file

```bash
yarn detox:test:android -f ./__tests__/verify.e2e.ts --all
```
