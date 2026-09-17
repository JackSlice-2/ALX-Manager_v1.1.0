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
        // PROTOCOL
        // =====================================================================

        private const val SOF = 0xA5

        private const val DIR_MASTER = 0x00
        private const val DIR_SLAVE = 0x01

        private const val FRAG_NONE = 0x00

        /*
         * proto_micro.h
         *
         * typedef struct __attribute__((packed)) {
         *     uint8_t  sof;
         *     uint8_t  dir;
         *     uint16_t cmd;
         *     uint8_t  frag;
         *     uint16_t payload_len;
         * } proto_header_t;
         *
         * Wire format:
         *
         *   [0] SOF
         *   [1] DIR
         *   [2] CMD LOW
         *   [3] CMD HIGH
         *   [4] FRAG
         *   [5] LEN LOW
         *   [6] LEN HIGH
         *   [7...] PAYLOAD
         *   [N] CRC LOW
         *   [N+1] CRC HIGH
         */

        private const val HEADER_LENGTH = 7
        private const val CRC_LENGTH = 2
        private const val MIN_FRAME_LENGTH =
            HEADER_LENGTH + CRC_LENGTH

        private const val RESPONSE_TIMEOUT_MS = 5000L

        // =====================================================================
        // COMMANDS
        // =====================================================================

        private const val CMD_STATUS = 0x0001
        private const val CMD_CONN = 0x0002

        private const val CMD_PRG_RTC_R = 0x0003
        private const val CMD_PRG_RTC_W = 0x0004

        private const val CMD_PRG_RS485_W = 0x0016
        private const val CMD_PRG_RS485_R = 0x0015

        private const val CMD_PRG_MQTT_W = 0x0014
        private const val CMD_PRG_MQTT_R = 0x0013

        private const val CMD_PRG_CELLULAR_W = 0x0012
        private const val CMD_PRG_CELLULAR_R = 0x0011

        private const val CMD_PRG_AI_W = 0x0018
        private const val CMD_PRG_AI_R = 0x0017

        private const val CMD_PRG_OTA_W = 0x0020
        private const val CMD_PRG_OTA_R = 0x0019

        private const val CMD_MSR_BASE_W = 0x0022
        private const val CMD_MSR_BASE_R = 0x0021

        private const val CMD_MSR_ALRM_W = 0x0024
        private const val CMD_MSR_ALRM_R = 0x0023

        private const val CMD_LIM_IOS_W = 0x0025
        private const val CMD_LIM_IOS_R = 0x0026

        private const val CMD_LIM_DRV_W = 0x0028
        private const val CMD_LIM_DRV_R = 0x0027

        private const val CMD_REPORT_STS_W = 0x0030
        private const val CMD_REPORT_STS_R = 0x0029

        private const val CMD_REPORT_STS_LTE_W = 0x0032
        private const val CMD_REPORT_STS_LTE_R = 0x0031

        private const val CMD_FACTORY = 0x0033

        private const val CMD_AP_WAKEUP_W = 0x0034
        private const val CMD_AP_WAKEUP_R = 0x0035

        /*
         * Application-level BLE password command.
         *
         * payload_cmd_prg_ble_pass_t:
         *
         *     char senha_nova[32];
         *     char senha_antiga[32];
         *
         * Total payload = 64 bytes.
         *
         * This is NOT the Bluetooth SMP pairing PIN.
         */
        private const val CMD_AP_PASSWORD_W = 0x0036
        private const val AP_PASSWORD_PAYLOAD_LENGTH = 64

        private const val CMD_RESET = 0x0037
        private const val CMD_IOS_R = 0x0038
        private const val CMD_OTA_NOW = 0x0039
        private const val CMD_RESET_FACTORY = 0x0100

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

        @JvmStatic
        fun onGattReady() {
            instance?.handleGattReady()
        }

        /*
         * Called when the BLE/GATT session is lost.
         *
         * This allows the next connection to perform the automatic STATUS
         * synchronization again.
         */
        @JvmStatic
        fun onGattLost() {
            instance?.handleGattLost()
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

    /*
     * Prevent duplicate automatic STATUS commands for the same GATT session.
     */
    private var gattReadyHandled = false

    // =========================================================================
    // RX BUFFER
    // =========================================================================

    private val rxBuffer =
        ArrayList<Byte>()

    // =========================================================================
    // GATT READY
    // =========================================================================

    private fun handleGattReady() {

        if (gattReadyHandled) {

            Log.d(
                TAG,
                "GATT READY already handled for current session"
            )

            return
        }

        gattReadyHandled = true

        Log.d(
            TAG,
            "GATT READY -> protocol transport ready"
        )

        sendStatusAutomatically()
    }

    // =========================================================================
    // GATT LOST
    // =========================================================================

    private fun handleGattLost() {

        Log.d(
            TAG,
            "GATT LOST -> resetting protocol session"
        )

        cancelResponseTimeout()

        val promise =
            pendingCommandPromise

        val command =
            pendingCommand

        pendingCommand = null
        pendingCommandPromise = null

        gattReadyHandled = false

        synchronized(rxBuffer) {
            rxBuffer.clear()
        }

        if (promise != null) {

            promise.reject(
                "ALX_PROTOCOL_DISCONNECTED",
                "BLE connection lost while waiting for ${
                    command?.let {
                        commandName(it)
                    } ?: "response"
                }"
            )
        }
    }

    // =========================================================================
    // AUTOMATIC STATUS
    // =========================================================================

    private fun sendStatusAutomatically() {

        if (pendingCommand != null) {

            Log.d(
                TAG,
                "STATUS not sent: protocol command already pending"
            )

            return
        }

        val frame =
            buildCommandFrame(
                direction = DIR_MASTER,
                command = CMD_STATUS
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

        pendingCommand = CMD_STATUS

        /*
         * Automatic STATUS has no JS Promise.
         *
         * A matching STATUS response clears the pending command.
         */
        pendingCommandPromise = null

        startResponseTimeout()
    }

    // =========================================================================
    // PUBLIC READ COMMANDS
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
            CMD_PRG_CELLULAR_R,
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
            CMD_REPORT_STS_R,
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
    fun sendIosRead(
        promise: Promise
    ) {
        sendCommand(
            CMD_IOS_R,
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

    // =========================================================================
    // GENERIC COMMAND
    // =========================================================================

    @ReactMethod
    fun sendCommand(
        command: Int,
        promise: Promise
    ) {

        try {

            requireCommand(command)

            val frame =
                buildCommandFrame(
                    direction = DIR_MASTER,
                    command = command
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

            requireCommand(command)

            val payload =
                hexToBytes(payloadHex)

            val frame =
                buildFrame(
                    direction = DIR_MASTER,
                    command = command,
                    payload = payload
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
    // APPLICATION PASSWORD
    // =========================================================================

    /**
     * Sends command 0x0036.
     *
     * Protocol payload:
     *
     *     senha_nova[32]
     *     senha_antiga[32]
     *
     * This is the ALX application password command.
     *
     * It is completely separate from the BLE SMP pairing PIN.
     */
    @ReactMethod
    fun sendApplicationPassword(
        newPassword: String,
        oldPassword: String,
        promise: Promise
    ) {

        try {

            val newBytes =
                passwordTo32Bytes(
                    newPassword
                )

            val oldBytes =
                passwordTo32Bytes(
                    oldPassword
                )

            val payload =
                ByteArray(
                    AP_PASSWORD_PAYLOAD_LENGTH
                )

            newBytes.copyInto(
                payload,
                0
            )

            oldBytes.copyInto(
                payload,
                32
            )

            val frame =
                buildFrame(
                    direction = DIR_MASTER,
                    command = CMD_AP_PASSWORD_W,
                    payload = payload
                )

            Log.d(
                TAG,
                "Sending AP_PASSWORD_W frame"
            )

            /*
             * Never log the actual password bytes.
             */
            Log.d(
                TAG,
                "AP_PASSWORD_W payload length=${payload.size}"
            )

            sendProtocolCommand(
                CMD_AP_PASSWORD_W,
                frame,
                promise
            )

        } catch (e: Exception) {

            promise.reject(
                "ALX_PASSWORD_ERROR",
                e.message
                    ?: "Failed to build application password command",
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

            if (
                frame.size <
                MIN_FRAME_LENGTH
            ) {

                throw IllegalArgumentException(
                    "Frame is too short"
                )
            }

            if (
                (frame[0].toInt() and 0xFF) != SOF
            ) {

                throw IllegalArgumentException(
                    "Frame must start with 0xA5"
                )
            }

            if (!isValidFrame(frame)) {

                throw IllegalArgumentException(
                    "Frame CRC or structure is invalid"
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

        if (pendingCommand != null) {

            promise.reject(
                "ALX_PROTOCOL_BUSY",
                "Another ALX command is already waiting for a response"
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

        pendingCommand = command
        pendingCommandPromise = promise

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

        val expectedCommand =
            pendingCommand

        val runnable =
            Runnable {

                /*
                 * Ignore a timeout runnable that belongs to an older
                 * command/session.
                 */
                if (
                    pendingCommand != expectedCommand
                ) {
                    return@Runnable
                }

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
                        command?.let {
                            commandName(it)
                        } ?: "none"
                    }"
                )

                promise?.reject(
                    "ALX_PROTOCOL_TIMEOUT",
                    "Timeout waiting for response" +
                        if (command != null) {
                            ": ${commandName(command)}"
                        } else {
                            ""
                        }
                )
            }

        responseTimeoutRunnable = runnable

        handler.postDelayed(
            runnable,
            RESPONSE_TIMEOUT_MS
        )
    }

    private fun cancelResponseTimeout() {

        responseTimeoutRunnable?.let {
            handler.removeCallbacks(it)
        }

        responseTimeoutRunnable = null
    }

    // =========================================================================
    // FRAME CONSTRUCTION
    // =========================================================================

    /**
     * Builds:
     *
     * A5
     * DIR
     * CMD LOW
     * CMD HIGH
     * FRAG
     * LEN LOW
     * LEN HIGH
     * PAYLOAD
     * CRC LOW
     * CRC HIGH
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

        requireCommand(command)
        requirePayloadLength(payload.size)

        val body =
            ByteArray(
                HEADER_LENGTH + payload.size
            )

        body[0] =
            SOF.toByte()

        body[1] =
            direction.toByte()

        // uint16 command, little endian
        body[2] =
            (command and 0xFF).toByte()

        body[3] =
            ((command shr 8) and 0xFF).toByte()

        // No fragmentation
        body[4] =
            FRAG_NONE.toByte()

        // uint16 payload length, little endian
        body[5] =
            (payload.size and 0xFF).toByte()

        body[6] =
            ((payload.size shr 8) and 0xFF).toByte()

        payload.copyInto(
            body,
            HEADER_LENGTH
        )

        return appendCrc(body)
    }

    private fun buildCommandFrame(
        direction: Int,
        command: Int
    ): ByteArray {

        return buildFrame(
            direction = direction,
            command = command,
            payload = ByteArray(0)
        )
    }

    // =========================================================================
    // CRC
    // =========================================================================

    /**
     * CRC-16/Modbus.
     *
     * Initial: 0xFFFF
     * Polynomial: 0xA001
     * Wire order: LOW, HIGH
     *
     * STATUS:
     *
     * A5 00 01 00 00 00 00
     *
     * CRC = 0xCAD3
     *
     * Wire:
     *
     * D3 CA
     */
    private fun appendCrc(
        body: ByteArray
    ): ByteArray {

        val crc =
            calculateCrc(body)

        val frame =
            ByteArray(
                body.size + CRC_LENGTH
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

        var crc = 0xFFFF

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

            data.forEach {
                rxBuffer.add(it)
            }
        }

        processRxBuffer(source)
    }

    private fun processRxBuffer(
        source: String
    ) {

        while (true) {

            val frame =
                synchronized(rxBuffer) {
                    extractNextFrame()
                } ?: return

            handleFrame(
                source,
                frame
            )
        }
    }

    // =========================================================================
    // FRAME EXTRACTION
    // =========================================================================

    /**
     * Extracts one complete frame from the RX stream.
     *
     * payload_len determines the exact frame length.
     *
     * We never guess the CRC boundary.
     *
     * Invalid candidates are discarded one SOF at a time and the parser
     * continues looking for the next valid SOF already present in the buffer.
     */
    private fun extractNextFrame(): ByteArray? {

        while (true) {

            if (rxBuffer.isEmpty()) {
                return null
            }

            var sofIndex = -1

            for (i in rxBuffer.indices) {

                if (
                    (rxBuffer[i].toInt() and 0xFF) == SOF
                ) {

                    sofIndex = i
                    break
                }
            }

            /*
             * No SOF anywhere.
             */
            if (sofIndex < 0) {

                rxBuffer.clear()

                return null
            }

            /*
             * Drop garbage before SOF.
             */
            if (sofIndex > 0) {

                repeat(sofIndex) {
                    rxBuffer.removeAt(0)
                }
            }

            /*
             * Need the complete protocol header.
             */
            if (
                rxBuffer.size <
                HEADER_LENGTH
            ) {

                return null
            }

            val direction =
                rxBuffer[1].toInt() and 0xFF

            if (
                direction != DIR_MASTER &&
                direction != DIR_SLAVE
            ) {

                Log.w(
                    TAG,
                    "Invalid frame direction: 0x" +
                        direction
                            .toString(16)
                            .uppercase()
                            .padStart(2, '0')
                )

                rxBuffer.removeAt(0)

                continue
            }

            val payloadLength =
                (
                    rxBuffer[5].toInt() and 0xFF
                ) or (
                    (
                        rxBuffer[6].toInt() and 0xFF
                    ) shl 8
                )

            val totalLength =
                HEADER_LENGTH +
                    payloadLength +
                    CRC_LENGTH

            /*
             * uint16 payload length can never produce a frame smaller
             * than HEADER + CRC, but keep this defensive check.
             */
            if (
                totalLength <
                MIN_FRAME_LENGTH
            ) {

                Log.w(
                    TAG,
                    "Invalid frame length: $totalLength"
                )

                rxBuffer.removeAt(0)

                continue
            }

            /*
             * Header is valid but the complete frame has not arrived.
             */
            if (
                rxBuffer.size <
                totalLength
            ) {

                return null
            }

            val candidate =
                ByteArray(
                    totalLength
                )

            for (i in 0 until totalLength) {

                candidate[i] =
                    rxBuffer[i]
            }

            /*
             * CRC failure.
             *
             * Remove only the current SOF and continue searching.
             *
             * This allows:
             *
             *   [bad frame][valid frame]
             *
             * to recover even when both arrive in the same notification.
             */
            if (!isValidFrame(candidate)) {

                Log.w(
                    TAG,
                    "Invalid ALX frame CRC/structure: " +
                        bytesToHex(candidate)
                )

                rxBuffer.removeAt(0)

                continue
            }

            /*
             * Valid complete frame.
             */
            repeat(totalLength) {
                rxBuffer.removeAt(0)
            }

            return candidate
        }
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
            (frame[0].toInt() and 0xFF) != SOF
        ) {
            return false
        }

        val direction =
            frame[1].toInt() and 0xFF

        if (
            direction != DIR_MASTER &&
            direction != DIR_SLAVE
        ) {
            return false
        }

        val payloadLength =
            (
                frame[5].toInt() and 0xFF
            ) or (
                (
                    frame[6].toInt() and 0xFF
                ) shl 8
            )

        val expectedLength =
            HEADER_LENGTH +
                payloadLength +
                CRC_LENGTH

        if (
            frame.size != expectedLength
        ) {
            return false
        }

        val calculated =
            calculateCrc(
                frame.copyOfRange(
                    0,
                    frame.size - CRC_LENGTH
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

        val received =
            receivedLow or
                (receivedHigh shl 8)

        return calculated == received
    }

    // =========================================================================
    // FRAME HANDLER
    // =========================================================================

    private fun handleFrame(
        source: String,
        frame: ByteArray
    ) {

        if (!isValidFrame(frame)) {

            Log.w(
                TAG,
                "Ignoring invalid frame"
            )

            return
        }

        val direction =
            frame[1].toInt() and 0xFF

        val command =
            (
                frame[2].toInt() and 0xFF
            ) or (
                (
                    frame[3].toInt() and 0xFF
                ) shl 8
            )

        val fragment =
            frame[4].toInt() and 0xFF

        val payloadLength =
            (
                frame[5].toInt() and 0xFF
            ) or (
                (
                    frame[6].toInt() and 0xFF
                ) shl 8
            )

        val payload =
            if (payloadLength > 0) {

                frame.copyOfRange(
                    HEADER_LENGTH,
                    HEADER_LENGTH + payloadLength
                )

            } else {

                ByteArray(0)
            }

        val calculatedCrc =
            calculateCrc(
                frame.copyOfRange(
                    0,
                    frame.size - CRC_LENGTH
                )
            )

        val receivedCrc =
            (
                frame[
                    frame.size - 2
                ].toInt() and 0xFF
            ) or (
                (
                    frame[
                        frame.size - 1
                    ].toInt() and 0xFF
                ) shl 8
            )

        val commandLabel =
            commandName(command)

        Log.d(
            TAG,
            "RX source=$source"
        )

        Log.d(
            TAG,
            "RX ${bytesToHex(frame)}"
        )

        Log.d(
            TAG,
            "RX direction=$direction " +
                "command=$commandLabel " +
                "fragment=$fragment " +
                "payloadLength=$payloadLength"
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

                    putInt(
                        "fragment",
                        fragment
                    )

                    putInt(
                        "payloadLength",
                        payloadLength
                    )

                    putString(
                        "commandName",
                        commandLabel
                    )

                    putString(
                        "payload",
                        bytesToHex(payload)
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

        sendEvent(
            EVENT_FRAME_RECEIVED,
            event
        )

        /*
         * Only SLAVE -> MASTER frames can satisfy a command we sent.
         */
        if (
            direction != DIR_SLAVE
        ) {

            Log.d(
                TAG,
                "RX frame is not a slave response; " +
                    "not matching pending command"
            )

            return
        }

        val waitingCommand =
            pendingCommand

        val promise =
            pendingCommandPromise

        /*
         * Match by command.
         *
         * The authoritative protocol uses the command field to identify
         * the response. Direction has already been verified as SLAVE.
         */
        if (
            waitingCommand != null &&
            command == waitingCommand
        ) {

            pendingCommand = null
            pendingCommandPromise = null

            cancelResponseTimeout()

            promise?.resolve(event)

            Log.d(
                TAG,
                "Response matched: $commandLabel"
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

            CMD_PRG_RTC_W ->
                "PRG_RTC_W"

            CMD_PRG_RS485_W ->
                "PRG_RS485_W"

            CMD_PRG_RS485_R ->
                "PRG_RS485_R"

            CMD_PRG_MQTT_W ->
                "PRG_MQTT_W"

            CMD_PRG_MQTT_R ->
                "PRG_MQTT_R"

            CMD_PRG_CELLULAR_W ->
                "PRG_CELLULAR_W"

            CMD_PRG_CELLULAR_R ->
                "PRG_CELLULAR_R"

            CMD_PRG_AI_W ->
                "PRG_AI_W"

            CMD_PRG_AI_R ->
                "PRG_AI_R"

            CMD_PRG_OTA_W ->
                "PRG_OTA_W"

            CMD_PRG_OTA_R ->
                "PRG_OTA_R"

            CMD_MSR_BASE_W ->
                "MSR_BASE_W"

            CMD_MSR_BASE_R ->
                "MSR_BASE_R"

            CMD_MSR_ALRM_W ->
                "MSR_ALRM_W"

            CMD_MSR_ALRM_R ->
                "MSR_ALRM_R"

            CMD_LIM_IOS_W ->
                "LIM_IOS_W"

            CMD_LIM_IOS_R ->
                "LIM_IOS_R"

            CMD_LIM_DRV_W ->
                "LIM_DRV_W"

            CMD_LIM_DRV_R ->
                "LIM_DRV_R"

            CMD_REPORT_STS_W ->
                "REPORT_STS_W"

            CMD_REPORT_STS_R ->
                "REPORT_STS_R"

            CMD_REPORT_STS_LTE_W ->
                "REPORT_STS_LTE_W"

            CMD_REPORT_STS_LTE_R ->
                "REPORT_STS_LTE_R"

            CMD_FACTORY ->
                "FACTORY"

            CMD_AP_WAKEUP_W ->
                "AP_WAKEUP_W"

            CMD_AP_WAKEUP_R ->
                "AP_WAKEUP_R"

            CMD_AP_PASSWORD_W ->
                "AP_PASSWORD_W"

            CMD_RESET ->
                "RESET"

            CMD_IOS_R ->
                "IOS_R"

            CMD_OTA_NOW ->
                "OTA_NOW"

            CMD_RESET_FACTORY ->
                "RESET_FACTORY"

            else ->
                "UNKNOWN_0x" +
                    command
                        .toString(16)
                        .uppercase()
                        .padStart(
                            4,
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

        try {

            val statusFrame =
                buildCommandFrame(
                    DIR_MASTER,
                    CMD_STATUS
                )

            val connectionFrame =
                buildCommandFrame(
                    DIR_MASTER,
                    CMD_CONN
                )

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
                            "headerLength",
                            HEADER_LENGTH
                        )

                        putInt(
                            "crcLength",
                            CRC_LENGTH
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
                            "gattReadyHandled",
                            gattReadyHandled
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
                            "pendingCommandName",
                            pendingCommand?.let {
                                commandName(it)
                            } ?: ""
                        )

                        putString(
                            "crc",
                            "init=0xFFFF polynomial=0xA001 wire=LOW,HIGH"
                        )

                        putString(
                            "header",
                            "A5 DIR CMD_LE16 FRAG LEN_LE16"
                        )

                        putString(
                            "statusFrame",
                            bytesToHex(statusFrame)
                        )

                        putString(
                            "connectionFrame",
                            bytesToHex(connectionFrame)
                        )
                    }
            )

        } catch (e: Exception) {

            promise.reject(
                "ALX_PROTOCOL_STATE_ERROR",
                e.message
                    ?: "Failed to get protocol state",
                e
            )
        }
    }

    // =========================================================================
    // VALIDATION HELPERS
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

    private fun requireCommand(
        command: Int
    ) {

        if (
            command !in 0..0xFFFF
        ) {

            throw IllegalArgumentException(
                "command must be between 0x0000 and 0xFFFF"
            )
        }
    }

    private fun requirePayloadLength(
        length: Int
    ) {

        if (
            length !in 0..0xFFFF
        ) {

            throw IllegalArgumentException(
                "payload is too large"
            )
        }
    }

    // =========================================================================
    // PASSWORD ENCODING
    // =========================================================================

    /**
     * Converts an application password into exactly 32 bytes.
     *
     * The protocol declares:
     *
     *     char senha[32]
     *
     * UTF-8 is used and the remaining bytes are zero-filled.
     *
     * Passwords longer than 32 UTF-8 bytes are rejected instead of silently
     * truncating them.
     */
    private fun passwordTo32Bytes(
        password: String
    ): ByteArray {

        val encoded =
            password.toByteArray(
                Charsets.UTF_8
            )

        if (
            encoded.size > 32
        ) {

            throw IllegalArgumentException(
                "Password must be at most 32 UTF-8 bytes"
            )
        }

        val result =
            ByteArray(32)

        encoded.copyInto(
            result,
            0
        )

        return result
    }

    // =========================================================================
    // HEX
    // =========================================================================

    /**
     * Accepts hexadecimal input with optional:
     *
     * - whitespace
     * - '-' separators
     * - ':' separators
     * - 0x prefix
     *
     * Any other character is rejected instead of silently discarded.
     */
    private fun hexToBytes(
        value: String
    ): ByteArray {

        var cleaned =
            value.trim()

        if (
            cleaned.startsWith(
                "0x",
                ignoreCase = true
            )
        ) {

            cleaned =
                cleaned.substring(2)
        }

        cleaned =
            cleaned
                .replace(
                    " ",
                    ""
                )
                .replace(
                    "\t",
                    ""
                )
                .replace(
                    "\r",
                    ""
                )
                .replace(
                    "\n",
                    ""
                )
                .replace(
                    "-",
                    ""
                )
                .replace(
                    ":",
                    ""
                )

        if (cleaned.isEmpty()) {
            return ByteArray(0)
        }

        if (
            !cleaned.matches(
                Regex("[0-9A-Fa-f]+")
            )
        ) {

            throw IllegalArgumentException(
                "Invalid hexadecimal string"
            )
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

            cleaned
                .substring(
                    index * 2,
                    index * 2 + 2
                )
                .toInt(16)
                .toByte()
        }
    }

    private fun bytesToHex(
        data: ByteArray
    ): String {

        return data.joinToString(" ") {

            "%02X".format(
                it.toInt() and 0xFF
            )
        }
    }

    // =========================================================================
    // EVENTS
    // =========================================================================

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

        val promise =
            pendingCommandPromise

        pendingCommandPromise = null
        pendingCommand = null

        gattReadyHandled = false

        synchronized(rxBuffer) {
            rxBuffer.clear()
        }

        promise?.reject(
            "ALX_PROTOCOL_INVALIDATED",
            "ALX protocol module was invalidated"
        )

        if (instance === this) {
            instance = null
        }

        super.invalidate()
    }
}