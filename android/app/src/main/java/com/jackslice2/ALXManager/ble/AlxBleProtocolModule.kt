package com.allexo.alxmobile.ble

import android.util.Log

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class AlxBleProtocolModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {

        private const val TAG = "AlxBleProtocol"

        private const val MODULE_NAME = "AlxBleProtocol"

        private const val EVENT_FRAME_RECEIVED =
            "AlxBleFrameReceived"

        // =====================================================================
        // ALX PROTOCOL
        // =====================================================================

        private const val SOF = 0xA5

        private const val DIR_MASTER = 0x00
        private const val DIR_SLAVE = 0x01

        // Commands from the known-good Windows implementation.
        private const val CMD_STATUS = 0x01
        private const val CMD_CONN = 0x02
        private const val CMD_PRG_RTC_R = 0x03
        private const val CMD_PRG_CONN_R = 0x11
        private const val CMD_PRG_MQTT_R = 0x13
        private const val CMD_PRG_RS485_R = 0x15
        private const val CMD_PRG_AI_R = 0x17
        private const val CMD_PRG_OTA_R = 0x19
        private const val CMD_MSR_BASE_R = 0x21
        private const val CMD_LIM_IOS_R = 0x26
        private const val CMD_LIM_DRV_R = 0x27
        private const val CMD_PRG_STS_REPORT_R = 0x29
        private const val CMD_AP_WAKEUP_R = 0x35
        private const val CMD_RESET = 0x37
        private const val CMD_IOS_R = 0x38

        private var instance: AlxBleProtocolModule? = null

        /**
         * Allows the transport module to forward received BLE bytes
         * directly into the protocol layer.
         */
        @JvmStatic
        fun onBleDataReceived(
            source: String,
            data: ByteArray
        ) {
            instance?.handleReceivedBytes(
                source,
                data
            )
        }
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    init {
        instance = this

        Log.d(
            TAG,
            "AlxBleProtocol initialized"
        )
    }

    override fun getName(): String {
        return MODULE_NAME
    }

    // =========================================================================
    // PUBLIC COMMANDS
    // =========================================================================

    /**
     * Windows:
     *
     * A5 00 01 00 00 00 00
     */
    @ReactMethod
    fun sendStatus(
        promise: Promise
    ) {
        sendCommand(
            CMD_STATUS,
            promise
        )
    }

    /**
     * Windows:
     *
     * A5 00 02 00 00 00 00
     */
    @ReactMethod
    fun sendConnectionCommand(
        promise: Promise
    ) {
        sendCommand(
            CMD_CONN,
            promise
        )
    }

    @ReactMethod
    fun sendPrgRtcRead(
        promise: Promise
    ) {
        sendCommand(
            CMD_PRG_RTC_R,
            promise
        )
    }

    @ReactMethod
    fun sendPrgConnRead(
        promise: Promise
    ) {
        sendCommand(
            CMD_PRG_CONN_R,
            promise
        )
    }

    @ReactMethod
    fun sendPrgMqttRead(
        promise: Promise
    ) {
        sendCommand(
            CMD_PRG_MQTT_R,
            promise
        )
    }

    @ReactMethod
    fun sendPrgRs485Read(
        promise: Promise
    ) {
        sendCommand(
            CMD_PRG_RS485_R,
            promise
        )
    }

    @ReactMethod
    fun sendPrgAiRead(
        promise: Promise
    ) {
        sendCommand(
            CMD_PRG_AI_R,
            promise
        )
    }

    @ReactMethod
    fun sendPrgOtaRead(
        promise: Promise
    ) {
        sendCommand(
            CMD_PRG_OTA_R,
            promise
        )
    }

    @ReactMethod
    fun sendMeasurementBaseRead(
        promise: Promise
    ) {
        sendCommand(
            CMD_MSR_BASE_R,
            promise
        )
    }

    @ReactMethod
    fun sendLimitIosRead(
        promise: Promise
    ) {
        sendCommand(
            CMD_LIM_IOS_R,
            promise
        )
    }

    @ReactMethod
    fun sendLimitDrvRead(
        promise: Promise
    ) {
        sendCommand(
            CMD_LIM_DRV_R,
            promise
        )
    }

    @ReactMethod
    fun sendPrgStatusReportRead(
        promise: Promise
    ) {
        sendCommand(
            CMD_PRG_STS_REPORT_R,
            promise
        )
    }

    @ReactMethod
    fun sendApWakeup(
        promise: Promise
    ) {
        sendCommand(
            CMD_AP_WAKEUP_R,
            promise
        )
    }

    @ReactMethod
    fun sendReset(
        promise: Promise
    ) {
        sendCommand(
            CMD_RESET,
            promise
        )
    }

    @ReactMethod
    fun sendIosRead(
        promise: Promise
    ) {
        sendCommand(
            CMD_IOS_R,
            promise
        )
    }

    // =========================================================================
    // GENERIC COMMAND
    // =========================================================================

    /**
     * Send an ALX command with no payload.
     *
     * Wire format:
     *
     * A5 DIR CMD CRC_LO CRC_HI
     *
     * For the Windows tester's commands the base body is:
     *
     * A5 DIR CMD 00 00 00 00
     *
     * therefore the actual command frame is 9 bytes.
     */
    @ReactMethod
    fun sendCommand(
        command: Int,
        promise: Promise
    ) {
        try {

            requireByte(
                command,
                "command"
            )

            val frame =
                buildCommandFrame(
                    direction = DIR_MASTER,
                    command = command
                )

            logFrame(
                "TX ${commandName(command)}",
                frame
            )

            sendFrame(
                frame,
                promise
            )

        } catch (e: Exception) {

            Log.e(
                TAG,
                "Failed to send command 0x" +
                    command
                        .toString(16)
                        .uppercase(),
                e
            )

            promise.reject(
                "ALX_PROTOCOL_ERROR",
                e.message
                    ?: "Failed to send ALX command",
                e
            )
        }
    }

    /**
     * Send a command with an arbitrary payload.
     *
     * This is retained for future protocol commands.
     */
    @ReactMethod
    fun sendCommandWithPayload(
        command: Int,
        payloadHex: String,
        promise: Promise
    ) {
        try {

            requireByte(
                command,
                "command"
            )

            val payload =
                hexToBytes(
                    payloadHex
                )

            val frame =
                buildFrame(
                    direction = DIR_MASTER,
                    command = command,
                    payload = payload
                )

            logFrame(
                "TX ${commandName(command)}",
                frame
            )

            sendFrame(
                frame,
                promise
            )

        } catch (e: Exception) {

            Log.e(
                TAG,
                "Failed to send command with payload",
                e
            )

            promise.reject(
                "ALX_PROTOCOL_ERROR",
                e.message
                    ?: "Failed to send ALX command",
                e
            )
        }
    }

    /**
     * Send a complete raw ALX frame.
     */
    @ReactMethod
    fun sendRawFrame(
        frameHex: String,
        promise: Promise
    ) {
        try {

            val frame =
                hexToBytes(
                    frameHex
                )

            if (frame.isEmpty()) {
                throw IllegalArgumentException(
                    "Frame cannot be empty"
                )
            }

            if (
                (frame[0].toInt() and 0xFF) != SOF
            ) {
                throw IllegalArgumentException(
                    "Invalid ALX frame: first byte must be 0xA5"
                )
            }

            logFrame(
                "TX RAW",
                frame
            )

            sendFrame(
                frame,
                promise
            )

        } catch (e: Exception) {

            Log.e(
                TAG,
                "Failed to send raw frame",
                e
            )

            promise.reject(
                "ALX_RAW_FRAME_ERROR",
                e.message
                    ?: "Failed to send raw ALX frame",
                e
            )
        }
    }

    // =========================================================================
    // TRANSPORT
    // =========================================================================

    private fun sendFrame(
        frame: ByteArray,
        promise: Promise
    ) {

        if (frame.isEmpty()) {

            promise.reject(
                "ALX_PROTOCOL_EMPTY_FRAME",
                "Cannot send an empty ALX frame"
            )

            return
        }

        val started =
            AlxBleTransportModule.sendBytes(
                frame
            )

        if (!started) {

            Log.e(
                TAG,
                "BLE transport rejected protocol frame: " +
                    bytesToHex(frame)
            )

            promise.reject(
                "ALX_PROTOCOL_SEND_FAILED",
                "BLE transport could not start the GATT write"
            )

            return
        }

        Log.d(
            TAG,
            "BLE write accepted: " +
                "${frame.size} bytes"
        )

        /*
         * Same semantic as the current transport:
         *
         * true means Android accepted the GATT write.
         *
         * It does NOT mean that the ALX device replied.
         */
        promise.resolve(true)
    }

    // =========================================================================
    // FRAME CONSTRUCTION
    // =========================================================================

    /**
     * Build the exact Windows command body.
     *
     * Windows defines:
     *
     * cmd_sts  = A5 00 01 00 00 00 00
     * cmd_conn = A5 00 02 00 00 00 00
     *
     * Therefore a no-payload command is NOT:
     *
     * A5 DIR CMD CRC
     *
     * It is:
     *
     * A5 DIR CMD 00 00 00 00 CRC
     *
     * The four zero bytes are part of the command body.
     */
    private fun buildCommandFrame(
        direction: Int,
        command: Int
    ): ByteArray {

        requireByte(
            direction,
            "direction"
        )

        requireByte(
            command,
            "command"
        )

        val body =
            byteArrayOf(
                SOF.toByte(),
                direction.toByte(),
                command.toByte(),
                0x00,
                0x00,
                0x00,
                0x00
            )

        return appendCrc(
            body
        )
    }

    /**
     * Generic frame builder.
     *
     * This is kept for commands that genuinely use a variable payload.
     */
    private fun buildFrame(
        direction: Int,
        command: Int,
        payload: ByteArray
    ): ByteArray {

        requireByte(
            direction,
            "direction"
        )

        requireByte(
            command,
            "command"
        )

        val body =
            ByteArray(
                3 + payload.size
            )

        body[0] =
            SOF.toByte()

        body[1] =
            direction.toByte()

        body[2] =
            command.toByte()

        payload.copyInto(
            destination = body,
            destinationOffset = 3
        )

        return appendCrc(
            body
        )
    }

    /**
     * Exact TX behavior of the C# implementation.
     *
     * C#:
     *
     * byte[] intBytes = BitConverter.GetBytes(crc);
     *
     * if (BitConverter.IsLittleEndian)
     *     Array.Reverse(intBytes);
     *
     * result = intBytes;
     *
     * newArray[data_length]     = result[1];
     * newArray[data_length + 1] = result[0];
     *
     * Since result becomes:
     *
     * [CRC_HIGH, CRC_LOW]
     *
     * the transmitted order is:
     *
     * [CRC_LOW, CRC_HIGH]
     */
    private fun appendCrc(
        body: ByteArray
    ): ByteArray {

        val crc =
            calculateCrc(
                body
            )

        val crcHigh =
            (crc shr 8) and 0xFF

        val crcLow =
            crc and 0xFF

        val frame =
            ByteArray(
                body.size + 2
            )

        body.copyInto(
            frame,
            0
        )

        // IMPORTANT:
        // Windows sends LOW byte first.
        frame[body.size] =
            crcLow.toByte()

        frame[body.size + 1] =
            crcHigh.toByte()

        Log.d(
            TAG,
            "CRC: body=${bytesToHex(body)} " +
                "crc=0x" +
                crc
                    .toString(16)
                    .uppercase()
                    .padStart(4, '0') +
                " wire=${
                    bytesToHex(
                        byteArrayOf(
                            crcLow.toByte(),
                            crcHigh.toByte()
                        )
                    )
                }"
        )

        return frame
    }

    // =========================================================================
    // CRC16
    // =========================================================================

    /**
     * EXACT algorithm used by the C# tester.
     *
     * Despite the C# class being called Crc16Kermit,
     * this is:
     *
     * initial = 0xFFFF
     * polynomial = 0xA001
     *
     * and is calculated LSB-first.
     *
     * This method returns the numeric CRC value.
     *
     * It does NOT reverse the bytes.
     */
    private fun calculateCrc(
        data: ByteArray
    ): Int {

        var crc =
            0xFFFF

        for (value in data) {

            crc =
                crc xor (
                    value.toInt() and 0xFF
                )

            repeat(8) {

                crc =
                    if (
                        (crc and 0x0001) != 0
                    ) {

                        (crc shr 1) xor 0xA001

                    } else {

                        crc shr 1
                    }

                crc =
                    crc and 0xFFFF
            }
        }

        return crc and 0xFFFF
    }

    // =========================================================================
    // RX
    // =========================================================================

    /**
     * Called by AlxBleTransportModule whenever a BLE notification arrives.
     */
    fun handleReceivedBytes(
        source: String,
        data: ByteArray
    ) {

        if (data.isEmpty()) {
            return
        }

        logFrame(
            "RX $source",
            data
        )

        val parsed =
            parseFrame(
                source,
                data
            )

        if (parsed != null) {

            sendEvent(
                EVENT_FRAME_RECEIVED,
                parsed
            )
        }
    }

    /**
     * Parse one complete ALX frame.
     *
     * Windows validates CRC like this:
     *
     * verifica = _data[..^2]
     * crc = Calculate(verifica, false)
     *
     * if (_data[_data.Length - 2] != crc[1])
     *     error
     *
     * if (_data[_data.Length - 1] != crc[0])
     *     error
     *
     * Therefore:
     *
     * received[-2] = CRC LOW
     * received[-1] = CRC HIGH
     */
    private fun parseFrame(
        source: String,
        data: ByteArray
    ): WritableMap? {

        /*
         * Minimum meaningful ALX frame:
         *
         * SOF
         * DIR
         * CMD
         * CRC_LOW
         * CRC_HIGH
         *
         * = 5 bytes
         */
        if (data.size < 5) {

            Log.w(
                TAG,
                "RX frame too short: ${data.size} bytes"
            )

            return null
        }

        val sof =
            data[0].toInt() and 0xFF

        if (sof != SOF) {

            Log.w(
                TAG,
                "RX invalid SOF: 0x" +
                    sof
                        .toString(16)
                        .uppercase()
            )

            return null
        }

        val direction =
            data[1].toInt() and 0xFF

        val command =
            data[2].toInt() and 0xFF

        /*
         * Everything between command and CRC is payload.
         */
        val payloadLength =
            data.size - 5

        val payload =
            if (payloadLength > 0) {

                data.copyOfRange(
                    3,
                    data.size - 2
                )

            } else {

                byteArrayOf()
            }

        /*
         * Exact Windows wire order:
         *
         * [... CRC_LOW CRC_HIGH]
         */
        val receivedCrcLow =
            data[data.size - 2]
                .toInt() and 0xFF

        val receivedCrcHigh =
            data[data.size - 1]
                .toInt() and 0xFF

        val receivedCrc =
            (
                (receivedCrcHigh shl 8)
                    or receivedCrcLow
            ) and 0xFFFF

        val frameWithoutCrc =
            data.copyOfRange(
                0,
                data.size - 2
            )

        val calculatedCrc =
            calculateCrc(
                frameWithoutCrc
            )

        val calculatedCrcLow =
            calculatedCrc and 0xFF

        val calculatedCrcHigh =
            (calculatedCrc shr 8) and 0xFF

        /*
         * EXACT C# comparison:
         *
         * data[-2] == crc[1]
         * data[-1] == crc[0]
         *
         * where C# crc[] is the reversed-byte result.
         *
         * Therefore wire:
         *
         * LOW HIGH
         */
        val crcValid =
            receivedCrcLow ==
                calculatedCrcLow &&
            receivedCrcHigh ==
                calculatedCrcHigh

        Log.d(
            TAG,
            "RX ${commandName(command)} " +
                "dir=0x" +
                direction
                    .toString(16)
                    .uppercase()
                    .padStart(2, '0') +
                " payload=${payload.size}B " +
                "CRC=" +
                if (crcValid) {
                    "OK"
                } else {
                    "INVALID"
                } +
                " received=0x" +
                receivedCrc
                    .toString(16)
                    .uppercase()
                    .padStart(4, '0') +
                " calculated=0x" +
                calculatedCrc
                    .toString(16)
                    .uppercase()
                    .padStart(4, '0')
        )

        if (!crcValid) {

            Log.w(
                TAG,
                "CRC mismatch: " +
                    "RX=${bytesToHex(data)}"
            )
        }

        return Arguments
            .createMap()
            .apply {

                putString(
                    "source",
                    source
                )

                putInt(
                    "length",
                    data.size
                )

                putInt(
                    "direction",
                    direction
                )

                putInt(
                    "command",
                    command
                )

                putString(
                    "commandName",
                    commandName(command)
                )

                putString(
                    "payload",
                    bytesToHex(payload)
                )

                putString(
                    "hex",
                    bytesToHex(data)
                )

                putInt(
                    "receivedCrc",
                    receivedCrc
                )

                putInt(
                    "calculatedCrc",
                    calculatedCrc
                )

                putInt(
                    "receivedCrcLow",
                    receivedCrcLow
                )

                putInt(
                    "receivedCrcHigh",
                    receivedCrcHigh
                )

                putInt(
                    "calculatedCrcLow",
                    calculatedCrcLow
                )

                putInt(
                    "calculatedCrcHigh",
                    calculatedCrcHigh
                )

                putBoolean(
                    "crcValid",
                    crcValid
                )
            }
    }

    // =========================================================================
    // COMMAND NAMES
    // =========================================================================

    private fun commandName(
        command: Int
    ): String {

        return when (command) {

            CMD_STATUS ->
                "STATUS"

            CMD_CONN ->
                "CONN"

            CMD_PRG_RTC_R ->
                "PRG_RTC_R"

            CMD_PRG_CONN_R ->
                "PRG_CONN_R"

            CMD_PRG_MQTT_R ->
                "PRG_MQTT_R"

            CMD_PRG_RS485_R ->
                "PRG_RS485_R"

            CMD_PRG_AI_R ->
                "PRG_AI_R"

            CMD_PRG_OTA_R ->
                "PRG_OTA_R"

            CMD_MSR_BASE_R ->
                "MSR_BASE_R"

            CMD_LIM_IOS_R ->
                "LIM_IOS_R"

            CMD_LIM_DRV_R ->
                "LIM_DRV_R"

            CMD_PRG_STS_REPORT_R ->
                "PRG_STS_REPORT_R"

            CMD_AP_WAKEUP_R ->
                "AP_WAKEUP_R"

            CMD_RESET ->
                "RESET"

            CMD_IOS_R ->
                "IOS_R"

            else ->
                "UNKNOWN_0x" +
                    command
                        .toString(16)
                        .uppercase()
                        .padStart(2, '0')
        }
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private fun requireByte(
        value: Int,
        name: String
    ) {

        if (value !in 0..0xFF) {

            throw IllegalArgumentException(
                "$name must be between 0x00 and 0xFF"
            )
        }
    }

    private fun hexToBytes(
        value: String
    ): ByteArray {

        val cleaned =
            value
                .replace(
                    "0x",
                    "",
                    ignoreCase = true
                )
                .replace(
                    "[^0-9A-Fa-f]"
                        .toRegex(),
                    ""
                )

        if (cleaned.isEmpty()) {
            return byteArrayOf()
        }

        if (cleaned.length % 2 != 0) {

            throw IllegalArgumentException(
                "Hex string must contain an even number of characters"
            )
        }

        return ByteArray(
            cleaned.length / 2
        ) { index ->

            val high =
                Character.digit(
                    cleaned[index * 2],
                    16
                )

            val low =
                Character.digit(
                    cleaned[index * 2 + 1],
                    16
                )

            if (
                high < 0 ||
                low < 0
            ) {

                throw IllegalArgumentException(
                    "Invalid hexadecimal value"
                )
            }

            (
                (high shl 4) or low
            ).toByte()
        }
    }

    private fun bytesToHex(
        data: ByteArray
    ): String {

        return data.joinToString("") {

            "%02X".format(
                it.toInt() and 0xFF
            )
        }
    }

    private fun logFrame(
        prefix: String,
        data: ByteArray
    ) {

        val formatted =
            data.joinToString(" ") {

                "%02X".format(
                    it.toInt() and 0xFF
                )
            }

        Log.d(
            TAG,
            "$prefix: $formatted"
        )
    }

    private fun sendEvent(
        eventName: String,
        params: WritableMap
    ) {

        if (
            !reactApplicationContext
                .hasActiveCatalystInstance()
        ) {

            Log.w(
                TAG,
                "React context inactive; " +
                    "dropping event=$eventName"
            )

            return
        }

        reactApplicationContext
            .getJSModule(
                DeviceEventManagerModule
                    .RCTDeviceEventEmitter::class.java
            )
            .emit(
                eventName,
                params
            )
    }

    // =========================================================================
    // REACT NATIVE EVENT SUPPORT
    // =========================================================================

    @ReactMethod
    fun addListener(
        eventName: String
    ) {
        // Required by NativeEventEmitter.
    }

    @ReactMethod
    fun removeListeners(
        count: Int
    ) {
        // Required by NativeEventEmitter.
    }

    // =========================================================================
    // DEBUG STATE
    // =========================================================================

    @ReactMethod
    fun getProtocolState(
        promise: Promise
    ) {

        try {

            val state =
                Arguments
                    .createMap()
                    .apply {

                        putString(
                            "module",
                            MODULE_NAME
                        )

                        putInt(
                            "sof",
                            SOF
                        )

                        putInt(
                            "masterDirection",
                            DIR_MASTER
                        )

                        putInt(
                            "slaveDirection",
                            DIR_SLAVE
                        )

                        putInt(
                            "statusCommand",
                            CMD_STATUS
                        )

                        putInt(
                            "connectionCommand",
                            CMD_CONN
                        )

                        putString(
                            "crc",
                            "init=0xFFFF polynomial=0xA001 wire=LOW,HIGH"
                        )
                    }

            promise.resolve(
                state
            )

        } catch (e: Exception) {

            promise.reject(
                "ALX_PROTOCOL_STATE_ERROR",
                e.message,
                e
            )
        }
    }

    // =========================================================================
    // CLEANUP
    // =========================================================================

    override fun invalidate() {

        Log.d(
            TAG,
            "Invalidating AlxBleProtocol"
        )

        if (instance === this) {
            instance = null
        }

        super.invalidate()
    }
}