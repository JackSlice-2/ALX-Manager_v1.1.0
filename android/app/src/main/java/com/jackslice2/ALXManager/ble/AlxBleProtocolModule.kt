package com.allexo.alxmobile.ble

import android.os.Handler
import android.os.Looper
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

        // =====================================================================
        // COMMANDS
        // =====================================================================

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

        private const val MIN_FRAME_LENGTH = 5

        private const val RESPONSE_TIMEOUT_MS = 5000L

        private var instance: AlxBleProtocolModule? = null

        // =====================================================================
        // TRANSPORT -> PROTOCOL
        // =====================================================================

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

        // =====================================================================
        // GATT -> PROTOCOL
        // =====================================================================

        /**
         * Called by BluetoothConnectionModule once:
         *
         * - GATT is connected
         * - ALX service was found
         * - TX was found
         * - RX was found
         *
         * This sends the first real ALX protocol command.
         */
        @JvmStatic
        fun onGattReady() {

            instance?.sendStatusAutomatically()
        }
    }

    // =========================================================================
    // MODULE
    // =========================================================================

    init {

        instance = this

        Log.d(
            TAG,
            "AlxBleProtocol initialized"
        )
    }

    override fun getName(): String =
        MODULE_NAME

    // =========================================================================
    // RESPONSE STATE
    // =========================================================================

    private val handler =
        Handler(
            Looper.getMainLooper()
        )

    private var pendingCommand: Int? = null

    private var pendingCommandPromise: Promise? = null

    private var responseTimeoutRunnable: Runnable? = null

    // =========================================================================
    // RX BUFFER
    // =========================================================================

    private val rxBuffer =
        ArrayList<Byte>()

    // =========================================================================
    // AUTOMATIC STATUS
    // =========================================================================

    /**
     * First protocol command after GATT becomes ready.
     *
     * Exact Windows tester command:
     *
     * A5 00 01 00 00 00 00
     *
     * followed by CRC.
     *
     * We intentionally do NOT require a JS button for this.
     */
    private fun sendStatusAutomatically() {

        /*
         * Prevent duplicate automatic STATUS requests.
         */
        if (pendingCommand != null) {

            Log.d(
                TAG,
                "STATUS not sent: protocol already has pending command"
            )

            return
        }

        val frame =
            buildCommandFrame(
                DIR_MASTER,
                CMD_STATUS
            )

        Log.d(
            TAG,
            "GATT READY -> sending STATUS"
        )

        Log.d(
            TAG,
            "STATUS frame: ${bytesToHex(frame)}"
        )

        val started =
            AlxBleTransportModule.sendBytes(
                frame
            )

        if (!started) {

            Log.e(
                TAG,
                "STATUS send failed: BLE transport rejected write"
            )

            return
        }

        /*
         * There is no JS Promise for this automatic command.
         *
         * We still track the expected response so that when the
         * device replies with:
         *
         *     DIR = 0x01
         *     CMD = 0x01
         *
         * it is recognized as the STATUS response.
         */
        pendingCommand =
            CMD_STATUS

        pendingCommandPromise =
            null

        startResponseTimeout()
    }

    // =========================================================================
    // PUBLIC COMMANDS
    // =========================================================================

    @ReactMethod
    fun sendStatus(
        promise: Promise
    ) {
        sendCommand(
            CMD_STATUS,
            promise
        )
    }

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
                    DIR_MASTER,
                    command
                )

            sendProtocolCommand(
                command,
                frame,
                promise
            )

        } catch (e: Exception) {

            promise.reject(
                "ALX_PROTOCOL_ERROR",
                e.message
                    ?: "Failed to send ALX command",
                e
            )
        }
    }

    // =========================================================================
    // COMMAND WITH PAYLOAD
    // =========================================================================

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
                    DIR_MASTER,
                    command,
                    payload
                )

            sendProtocolCommand(
                command,
                frame,
                promise
            )

        } catch (e: Exception) {

            promise.reject(
                "ALX_PROTOCOL_ERROR",
                e.message
                    ?: "Failed to send ALX command",
                e
            )
        }
    }

    // =========================================================================
    // RAW FRAME
    // =========================================================================

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
                    "Frame must start with 0xA5"
                )
            }

            val started =
                AlxBleTransportModule.sendBytes(
                    frame
                )

            if (!started) {

                promise.reject(
                    "ALX_RAW_FRAME_SEND_FAILED",
                    "BLE transport rejected frame"
                )

                return
            }

            promise.resolve(true)

        } catch (e: Exception) {

            promise.reject(
                "ALX_RAW_FRAME_ERROR",
                e.message
                    ?: "Failed to send raw frame",
                e
            )
        }
    }

    // =========================================================================
    // SEND PROTOCOL COMMAND
    // =========================================================================

    private fun sendProtocolCommand(
        command: Int,
        frame: ByteArray,
        promise: Promise
    ) {

        if (pendingCommandPromise != null) {

            promise.reject(
                "ALX_PROTOCOL_BUSY",
                "Another ALX command is waiting for a response"
            )

            return
        }

        /*
         * Also prevent overlapping automatic/native commands.
         */
        if (pendingCommand != null) {

            promise.reject(
                "ALX_PROTOCOL_BUSY",
                "Another ALX command is already pending"
            )

            return
        }

        val started =
            AlxBleTransportModule.sendBytes(
                frame
            )

        if (!started) {

            promise.reject(
                "ALX_PROTOCOL_SEND_FAILED",
                "BLE transport could not start the GATT write"
            )

            return
        }

        pendingCommand =
            command

        pendingCommandPromise =
            promise

        startResponseTimeout()

        Log.d(
            TAG,
            "Command sent: ${commandName(command)} ${bytesToHex(frame)}"
        )
    }

    // =========================================================================
    // RESPONSE TIMEOUT
    // =========================================================================

    private fun startResponseTimeout() {

        responseTimeoutRunnable?.let {
            handler.removeCallbacks(it)
        }

        val runnable =
            Runnable {

                val command =
                    pendingCommand

                val promise =
                    pendingCommandPromise

                pendingCommand = null
                pendingCommandPromise = null
                responseTimeoutRunnable = null

                Log.d(
                    TAG,
                    "Response timeout: ${
                        if (command != null) {
                            commandName(command)
                        } else {
                            "none"
                        }
                    }"
                )

                if (promise != null) {

                    promise.reject(
                        "ALX_PROTOCOL_TIMEOUT",
                        "Timeout waiting for response" +
                            if (command != null) {
                                ": ${commandName(command)}"
                            } else {
                                ""
                            }
                    )
                }
            }

        responseTimeoutRunnable =
            runnable

        handler.postDelayed(
            runnable,
            RESPONSE_TIMEOUT_MS
        )
    }

    private fun cancelResponseTimeout() {

        responseTimeoutRunnable?.let {

            handler.removeCallbacks(
                it
            )
        }

        responseTimeoutRunnable = null
    }

    // =========================================================================
    // FRAME CONSTRUCTION
    // =========================================================================

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
            body,
            3
        )

        return appendCrc(
            body
        )
    }

    // =========================================================================
    // CRC
    // =========================================================================

    private fun appendCrc(
        body: ByteArray
    ): ByteArray {

        val crc =
            calculateCrc(
                body
            )

        val frame =
            ByteArray(
                body.size + 2
            )

        body.copyInto(
            frame,
            0
        )

        frame[body.size] =
            (crc and 0xFF).toByte()

        frame[body.size + 1] =
            ((crc shr 8) and 0xFF).toByte()

        return frame
    }

    private fun calculateCrc(
        data: ByteArray
    ): Int {

        var crc =
            0xFFFF

        for (byte in data) {

            crc =
                crc xor (
                    byte.toInt() and 0xFF
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
    // BLE RX
    // =========================================================================

    private fun handleReceivedBytes(
        source: String,
        data: ByteArray
    ) {

        if (data.isEmpty()) {
            return
        }

        synchronized(rxBuffer) {

            for (byte in data) {

                rxBuffer.add(
                    byte
                )
            }
        }

        processRxBuffer(
            source
        )
    }

    // =========================================================================
    // RX BUFFER
    // =========================================================================

    private fun processRxBuffer(
        source: String
    ) {

        while (true) {

            val frame =
                synchronized(rxBuffer) {

                    extractNextFrame()
                }
                    ?: return

            handleFrame(
                source,
                frame
            )
        }
    }

    private fun extractNextFrame(): ByteArray? {

        if (rxBuffer.isEmpty()) {
            return null
        }

        var sofIndex =
            -1

        for (i in rxBuffer.indices) {

            if (
                (rxBuffer[i].toInt() and 0xFF) ==
                SOF
            ) {

                sofIndex = i
                break
            }
        }

        if (sofIndex < 0) {

            rxBuffer.clear()

            return null
        }

        if (sofIndex > 0) {

            repeat(sofIndex) {
                rxBuffer.removeAt(0)
            }
        }

        if (
            rxBuffer.size <
            MIN_FRAME_LENGTH
        ) {

            return null
        }

        for (
            length in MIN_FRAME_LENGTH..rxBuffer.size
        ) {

            val candidate =
                ByteArray(length)

            for (i in 0 until length) {

                candidate[i] =
                    rxBuffer[i]
            }

            if (
                isValidFrame(candidate)
            ) {

                repeat(length) {
                    rxBuffer.removeAt(0)
                }

                return candidate
            }
        }

        return null
    }

    // =========================================================================
    // FRAME VALIDATION
    // =========================================================================

    private fun isValidFrame(
        frame: ByteArray
    ): Boolean {

        if (
            frame.size <
            MIN_FRAME_LENGTH
        ) {
            return false
        }

        if (
            (frame[0].toInt() and 0xFF) !=
            SOF
        ) {
            return false
        }

        val calculated =
            calculateCrc(
                frame.copyOfRange(
                    0,
                    frame.size - 2
                )
            )

        val receivedLow =
            frame[
                frame.size - 2
            ].toInt() and 0xFF

        val receivedHigh =
            frame[
                frame.size - 1
            ].toInt() and 0xFF

        return (
            receivedLow ==
                (calculated and 0xFF)
        ) && (
            receivedHigh ==
                ((calculated shr 8) and 0xFF)
        )
    }

    // =========================================================================
    // FRAME HANDLER
    // =========================================================================

    private fun handleFrame(
        source: String,
        frame: ByteArray
    ) {

        if (
            frame.size <
            MIN_FRAME_LENGTH
        ) {
            return
        }

        val direction =
            frame[1].toInt() and 0xFF

        val command =
            frame[2].toInt() and 0xFF

        val payload =
            if (frame.size > 5) {

                frame.copyOfRange(
                    3,
                    frame.size - 2
                )

            } else {

                ByteArray(0)
            }

        val calculatedCrc =
            calculateCrc(
                frame.copyOfRange(
                    0,
                    frame.size - 2
                )
            )

        val receivedCrc =
            (
                (
                    frame[
                        frame.size - 1
                    ].toInt() and 0xFF
                ) shl 8
            ) or
                (
                    frame[
                        frame.size - 2
                    ].toInt() and 0xFF
                )

        val event =
            Arguments
                .createMap()
                .apply {

                    putString(
                        "source",
                        source
                    )

                    putString(
                        "hex",
                        bytesToHex(frame)
                    )

                    putInt(
                        "length",
                        frame.size
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

                    putInt(
                        "payloadLength",
                        payload.size
                    )

                    putInt(
                        "receivedCrc",
                        receivedCrc
                    )

                    putInt(
                        "calculatedCrc",
                        calculatedCrc
                    )

                    putBoolean(
                        "crcValid",
                        true
                    )
                }

        Log.d(
            TAG,
            "RX ${bytesToHex(frame)}"
        )

        sendEvent(
            EVENT_FRAME_RECEIVED,
            event
        )

        val waitingCommand =
            pendingCommand

        val promise =
            pendingCommandPromise

        /*
         * Device response must be:
         *
         * DIR = 0x01
         * CMD = requested command
         */
        if (
            waitingCommand != null &&
            command == waitingCommand &&
            direction == DIR_SLAVE
        ) {

            pendingCommand = null
            pendingCommandPromise = null

            cancelResponseTimeout()

            if (promise != null) {

                promise.resolve(
                    event
                )
            }

            Log.d(
                TAG,
                "Response matched: ${commandName(command)}"
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
                        .padStart(
                            2,
                            '0'
                        )
        }
    }

    // =========================================================================
    // STATE
    // =========================================================================

    @ReactMethod
    fun getProtocolState(
        promise: Promise
    ) {

        promise.resolve(
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

                    putBoolean(
                        "waitingForResponse",
                        pendingCommand != null
                    )

                    putInt(
                        "pendingCommand",
                        pendingCommand ?: -1
                    )

                    putString(
                        "crc",
                        "init=0xFFFF polynomial=0xA001 wire=LOW,HIGH"
                    )

                    putString(
                        "statusFrame",
                        "A5 00 01 00 00 00 00 D3 CA"
                    )

                    putString(
                        "connectionFrame",
                        "A5 00 02 00 00 00 00 97 CA"
                    )
                }
        )
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private fun requireByte(
        value: Int,
        name: String
    ) {

        if (
            value !in 0..0xFF
        ) {

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
            return ByteArray(0)
        }

        if (
            cleaned.length % 2 != 0
        ) {

            throw IllegalArgumentException(
                "Hex string must contain an even number of characters"
            )
        }

        return ByteArray(
            cleaned.length / 2
        ) { index ->

            (
                cleaned
                    .substring(
                        index * 2,
                        index * 2 + 2
                    )
                    .toInt(16)
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

    private fun sendEvent(
        eventName: String,
        params: WritableMap
    ) {

        try {

            if (
                !reactApplicationContext
                    .hasActiveCatalystInstance()
            ) {
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

        } catch (e: Exception) {

            Log.e(
                TAG,
                "Failed to emit $eventName",
                e
            )
        }
    }

    // =========================================================================
    // REACT NATIVE EVENT SUPPORT
    // =========================================================================

    @ReactMethod
    fun addListener(
        eventName: String
    ) {
    }

    @ReactMethod
    fun removeListeners(
        count: Int
    ) {
    }

    // =========================================================================
    // CLEANUP
    // =========================================================================

    override fun invalidate() {

        cancelResponseTimeout()

        pendingCommandPromise = null
        pendingCommand = null

        synchronized(rxBuffer) {
            rxBuffer.clear()
        }

        if (instance === this) {
            instance = null
        }

        super.invalidate()
    }
}
