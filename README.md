# vc-cwt-verifier

- [Getting started](#getting-started)
- [Usage](#usage)
- [Licensing](#licensing)

# Getting started

## Install dependencies

Add the module as a dependency to your application or library.

```
yarn add @mattrglobal/vc-cwt-verifier
```

or

```
npm install @mattrglobal/vc-cwt-verifier
```

# Usage

### Verify a credential

```typescript
import { verify } from "@mattrglobal/vc-cwt-verifier";
import * as hex from "@stablelib/hex";

const payload: Uint8Array = hex.decode(
  "d2844aa204456b65792d310126a0590137a50178376469643a7765623a6d61747472676c6f62616c2e6769746875622e696f3a6e7a63703a71766e6e6b38396b696a726f65696e6478613375051a6178cc15041a74477215627663a46840636f6e7465787482782668747470733a2f2f7777772e77332e6f72672f323031382f63726564656e7469616c732f7631782768747470733a2f2f6865616c74682e676f76742e6e7a2f63726564656e7469616c732f63706e7a6776657273696f6e65312e302e306474797065827456657269666961626c6543726564656e7469616c6f5075626c6963436f766964506173737163726564656e7469616c5375626a656374a369676976656e4e616d65644a61636b6a66616d696c794e616d656753706172726f7763646f626a313936302d30342d313607d84050e6060795d65f4f85a3924bc4380a30c75840ef52b04644273e9757b2418fea39fae5eac99dd354eaf862f8f8f7c842a85550a0ff485c6999fc29527075686eeceaff36775e4ef031ef94dbc13e6e9f6a83ab"
);

const verifyResult = await verify({ payload });

if (verifyResult.isErr()) {
  const { error } = verifyResult;
  // handle error unable to verify
  return;
}
const verifyResponse = verifyResult.value;
if (!verifyResponse.verified) {
  const { reason } = verifyResponse;
  // show or handle verification fail reason
}

const { payload, header } = verifyResponse;
// show or handle verified payload & header
```

### Verify a credential with a list of trusted issuers

```typescript
import { verify } from "@mattrglobal/vc-cwt-verifier";

const verifyResult = await verify({
  trustedIssuers: ["did:web:example.com", "did:web:mattrglobal.github.io:test:example"],
  payload: {},
});

const verifyResponse = verifyResult.value;
if (!verifyResponse.verified) {
  const { reason } = verifyResponse;
  // show or handle verification fail reason
}

const { payload, header } = verifyResponse;
// show or handle verified payload & header
```

### Verify a credential skipping expiry and not before checks

If `assertExpiry` or `assertNotBefore` are omitted they will be checked against the current date and time by default

```typescript
import { verify } from "@mattrglobal/vc-cwt-verifier";

const verifyResult = await verify({
  assertExpiry: false,
  assertNotBefore: false,
  payload: ...
});

const verifyResponse = verifyResult.value;
if (!verifyResponse.verified) {
  const { reason } = verifyResponse;
  // show or handle verification fail reason
}

const { payload, header } = verifyResponse;
// show or handle verified payload & header
```

### Provide custom cache for issuer resolution

By default an in memory cache will be provided. This can be overwritten by passing a different cache instance.

```typescript
import { verify, getDefaultIssuerResolver } from "@mattrglobal/vc-cwt-verifier";


const issuerResolver = getDefaultIssuerResolver({ cache: myCache });


const verifyResult = await verify({
  payload: ...,
  issuerResolver
});

```

## Error handling

Functions that have an error path return a
[Neverthrow Result](https://www.npmjs.com/package/neverthrow#synchronous-api-result) that represents either success or
failure. All functions can throw exceptions for unexpected and unrecoverable errors.

# Licensing

See [here](https://learn.mattr.global/docs/terms/sdk-licence-verifier-single-format-cwt-cose/) for licence information.
