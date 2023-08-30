export enum MessageType {
  Auth = 1,
  Init = 2,
  Crdt = 3
}

const decoder = new TextDecoder()

export function decodeMessage(data: Uint8Array): [MessageType, Uint8Array] {
  const msgType = data.at(0) as number
  return [msgType, data.subarray(1)]
}

export function encodeMessage(msgType: MessageType, message: Uint8Array): Uint8Array {
  const packet = new Uint8Array(message.byteLength + 1)
  packet.set([msgType])
  packet.set(message, 1)
  return packet
}

export function encodeInitMessage(
  crdtState: Uint8Array,
  start: number,
  size: number,
  localEntitiesReserved: number
): Uint8Array {
  const buff = new Uint8Array(13 + crdtState.length)
  const view = new DataView(buff.buffer)
  let offset = 0
  view.setUint8(offset, MessageType.Init)
  offset += 1
  view.setUint32(offset, start)
  offset += 4
  view.setUint32(offset, size)
  offset += 4
  view.setUint32(offset, localEntitiesReserved)
  offset += 4
  buff.set(crdtState, offset)
  return buff
}

export function decodeJSON(data: Uint8Array) {
  return JSON.parse(decoder.decode(data))
}
