package com.allexo.alxmobile

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AlxBleProtocolModule(
reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        // ---------------------------------------------------------
        // ALX PROTOCOL
        // ---------------------------------------------------------

        private const val SOF = 0xA5
        private const val DIR_MASTER = 0x00
        private const val FRAG_NONE = 0x00

        // Commands
        private const val CMD_STATUS_GERAL_READ = 0x0001
    }

    override fun getName(): String {
        return "AlxBleProtocol"
    }

    // ---------------------------------------------------------
    // STATUS READ
    // ---------------------------------------------------------
    //
    // Protocol frame:
    //
    //   SOF          1 byte
    //   DIR          1 byte
    //   CMD          2 bytes, little-endian
    //   FRAG         1 byte
    //   PAYLOAD_LEN  2 bytes, little-endian
    //   PAYLOAD      0 bytes
    //   CRC16        2 bytes
    //
    // STATUS READ:
    //
    //   A5 00 01 00 00 00 CRC_LO CRC_HI
    //
    // ---------------------------------------------------------

    @ReactMethod
    fun buildStsCommand(promise: Promise) {
        try {
            val frameWithoutCrc = byteArrayOf(
                SOF.toByte(),
                DIR_MASTER.toByte(),

                // CMD = 0x0001, little-endian
                (CMD_STATUS_GERAL_READ and 0xFF).toByte(),
                ((CMD_STATUS_GERAL_READ shr 8) and 0xFF).toByte(),

                FRAG_NONE.toByte(),

                // PAYLOAD_LEN = 0, little-endian
                0x00,
                0x00
            )

            val crc = crc16Kermit(frameWithoutCrc)

            val frame = frameWithoutCrc + byteArrayOf(
                // CRC transmitted little-endian
                (crc and 0xFF).toByte(),
                ((crc shr 8) and 0xFF).toByte()
            )

            promise.resolve(bytesToHex(frame))
        } catch (e: Exception) {
            promise.reject("STS_BUILD_ERROR", e.message, e)
        }
    }

    // ---------------------------------------------------------
    // CRC-16/KERMIT
    // ---------------------------------------------------------
    //
    // Parameters from the ALX protocol:
    //
    //   Polynomial : 0x1021
    //   RefIn      : true
    //   RefOut     : true
    //   Init       : 0x0000
    //   XorOut     : 0x0000
    //
    // Reflected polynomial:
    //   0x8408
    //
    // ---------------------------------------------------------

    private fun crc16Kermit(data: ByteArray): Int {
        var crc = 0x0000

        for (byte in data) {
            crc = crc xor (byte.toInt() and 0xFF)

            repeat(8) {
                crc = if ((crc and 0x0001) != 0) {
                    (crc shr 1) xor 0x8408
                } else {
                    crc shr 1
                }

                crc = crc and 0xFFFF
            }
        }

        return crc and 0xFFFF
    }

    // ---------------------------------------------------------
    // HEX UTILITY
    // ---------------------------------------------------------

    private fun bytesToHex(bytes: ByteArray): String {
        return bytes.joinToString("") {
            "%02X".format(it.toInt() and 0xFF)
        }
    }

    override fun invalidate() {
        super.invalidate()
    }
}