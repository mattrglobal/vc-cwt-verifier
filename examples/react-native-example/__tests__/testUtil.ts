/*
 * Copyright 2019 - MATTR Limited
 * All rights reserved
 * Confidential and proprietary
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getElementAttribute = async (element: Detox.IndexableNativeElement): Promise<any> => {
  // detox type definition is not correct, both @types/detox and build-in index.d.ts seems having issue using `getAttributes()`
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const elementAttributes = await element.getAttributes();
  return elementAttributes;
};

export const getElementAttributeText = async (element: Detox.IndexableNativeElement): Promise<string> => {
  return (await getElementAttribute(element)).text;
};
