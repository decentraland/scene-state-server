export const LoadableApis = {
  EnvironmentAPI: {},
  EngineApi: {
    crdtGetState: () => ({ hasEntities: false, data: [] }),
    crdtSendToRenderer: () => ({ data: [] }),
    crdtSendNetwork: () => ({ data: [] }),
    sendBatch: () => ({ events: [] })
  }
}
