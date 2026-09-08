import JSDOMEnvironment from "jest-environment-jsdom";

export default class FixJSDOMEnvironment extends JSDOMEnvironment {
  constructor(...args: ConstructorParameters<typeof JSDOMEnvironment>) {
    super(...args);

    // Use Node's web APIs so MSW can intercept fetch without duplicate polyfills.
    Object.assign(this.global, {
      structuredClone,
      fetch,
      Headers,
      FormData,
      Request,
      Response,
      Blob,
      File,
      TextEncoder,
      TextDecoder,
      ReadableStream,
      TransformStream,
      WritableStream,
      BroadcastChannel,
    });
  }
}
