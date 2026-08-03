export function copyUint8ArrayToArrayBuffer(
  source: Uint8Array,
): ArrayBuffer {
  const target = new ArrayBuffer(
    source.byteLength,
  )

  const targetView =
    new Uint8Array(target)

  targetView.set(source)

  return target
}