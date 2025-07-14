import { Engine, Transport, TransportMessage } from "@dcl/ecs/dist-cjs";

export function createInternalEngine() {
  const engine = Engine()
  const internalMessages: Uint8Array[] = []
  
  const transport: Transport = {
    send: async function (message: Uint8Array | Uint8Array[]): Promise<void> {
      for (const data of [message].flat()) {
        if (data.byteLength) {
          internalMessages.push(data)
        }
      }
    },
    filter: function (message: Omit<TransportMessage, "messageBuffer">): boolean {
      return true
    },
  }

  engine.addTransport(transport)

  async function update(dt: number) {
    await engine.update(dt)
    const messages = [...internalMessages]
    internalMessages.length = 0
    return messages
  }
  
  return { engine, update }
}