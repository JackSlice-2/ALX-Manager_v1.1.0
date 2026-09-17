package com.allexo.alxmobile.ble

import android.annotation.SuppressLint
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.os.Build
import android.util.Log

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

import java.util.UUID

class AlxBleTransportModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {

        private const val TAG = "AlxBleTransport"
        private const val MODULE_NAME = "AlxBleTransport"

        private const val EVENT_DATA_RECEIVED =
            "AlxBleDataReceived"

        private const val EVENT_NOTIFICATION_ENABLED =
            "AlxBleNotificationEnabled"

        // =====================================================================
        // ALX GATT UUIDs
        // =====================================================================

        private val SERVICE_UUID =
            UUID.fromString(
                "12345678-1234-5678-1234-56789abcdef7"
            )

        private val TX_UUID =
            UUID.fromString(
                "12345678-1234-5678-1234-56789abcdef8"
            )

        private val RX_UUID =
            UUID.fromString(
                "12345678-1234-5678-1234-56789abcdef9"
            )

        private val RX2_UUID =
            UUID.fromString(
                "12345678-1234-5678-1234-56789abcdefa"
            )

        private val CCCD_UUID =
            UUID.fromString(
                "00002902-0000-1000-8000-00805f9b34fb"
            )

        private var instance: AlxBleTransportModule? = null

        private var activeGatt: BluetoothGatt? = null

        private var txCharacteristic:
            BluetoothGattCharacteristic? = null

        private var rxCharacteristic:
            BluetoothGattCharacteristic? = null

        private var rx2Characteristic:
            BluetoothGattCharacteristic? = null

        private var rxNotificationsEnabled = false

        private var rx2NotificationsEnabled = false

        // =====================================================================
        // GATT CONFIGURATION
        // =====================================================================

        @JvmStatic
        fun setGatt(
            gatt: BluetoothGatt,
            tx: BluetoothGattCharacteristic?,
            rx: BluetoothGattCharacteristic?,
            rx2: BluetoothGattCharacteristic?
        ) {

            activeGatt = gatt

            txCharacteristic = tx
            rxCharacteristic = rx
            rx2Characteristic = rx2

            rxNotificationsEnabled = false
            rx2NotificationsEnabled = false

            instance?.clearPendingOperations()

            Log.d(
                TAG,
                "=============================================="
            )

            Log.d(
                TAG,
                "GATT TRANSPORT CONFIGURED"
            )

            Log.d(
                TAG,
                "Device: ${gatt.device.address}"
            )

            Log.d(
                TAG,
                "Service: $SERVICE_UUID"
            )

            Log.d(
                TAG,
                "TX: ${tx?.uuid}"
            )

            Log.d(
                TAG,
                "RX: ${rx?.uuid}"
            )

            Log.d(
                TAG,
                "RX2: ${rx2?.uuid}"
            )

            if (tx != null) {

                Log.d(
                    TAG,
                    "TX properties: ${
                        instance?.propertiesToString(
                            tx.properties
                        )
                    }"
                )
            }

            if (rx != null) {

                Log.d(
                    TAG,
                    "RX properties: ${
                        instance?.propertiesToString(
                            rx.properties
                        )
                    }"
                )
            }

            if (rx2 != null) {

                Log.d(
                    TAG,
                    "RX2 properties: ${
                        instance?.propertiesToString(
                            rx2.properties
                        )
                    }"
                )
            }

            Log.d(
                TAG,
                "=============================================="
            )
        }

        @JvmStatic
        fun clearGatt() {

            Log.d(
                TAG,
                "Clearing GATT transport"
            )

            activeGatt = null

            txCharacteristic = null
            rxCharacteristic = null
            rx2Characteristic = null

            rxNotificationsEnabled = false
            rx2NotificationsEnabled = false

            instance?.clearPendingOperations()
        }

        // =====================================================================
        // PROTOCOL -> TRANSPORT
        // =====================================================================

        @JvmStatic
        @SuppressLint("MissingPermission")
        fun sendBytes(
            data: ByteArray
        ): Boolean {

            return instance?.sendBytesInternal(
                data
            ) ?: run {

                Log.e(
                    TAG,
                    "sendBytes(): transport instance is null"
                )

                false
            }
        }

        // =====================================================================
        // GATT CALLBACK BRIDGES
        // =====================================================================

        @JvmStatic
        fun onDescriptorWrite(
            gatt: BluetoothGatt,
            descriptor: BluetoothGattDescriptor,
            status: Int
        ) {

            instance?.handleDescriptorWrite(
                gatt,
                descriptor,
                status
            )
        }

        @JvmStatic
        fun onCharacteristicChanged(
            characteristic: BluetoothGattCharacteristic,
            value: ByteArray
        ) {

            instance?.handleCharacteristicChanged(
                characteristic,
                value
            )
        }

        @JvmStatic
        fun onCharacteristicRead(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            value: ByteArray,
            status: Int
        ) {

            instance?.handleCharacteristicRead(
                gatt,
                characteristic,
                value,
                status
            )
        }

        @Suppress("DEPRECATION")
        @JvmStatic
        fun onCharacteristicReadLegacy(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            status: Int
        ) {

            instance?.handleCharacteristicRead(
                gatt,
                characteristic,
                characteristic.value ?: ByteArray(0),
                status
            )
        }

        @JvmStatic
        fun onCharacteristicWrite(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            status: Int
        ) {

            instance?.handleCharacteristicWrite(
                gatt,
                characteristic,
                status
            )
        }
    }

    // =========================================================================
    // INIT
    // =========================================================================

    init {

        instance = this

        Log.d(
            TAG,
            "AlxBleTransport initialized"
        )
    }

    override fun getName(): String =
        MODULE_NAME

    // =========================================================================
    // PENDING OPERATIONS
    // =========================================================================

    private var pendingRxNotificationPromise:
        Promise? = null

    private var pendingRx2NotificationPromise:
        Promise? = null

    private var pendingReadPromise:
        Promise? = null

    private var pendingReadSource:
        String? = null

    /*
     * Android GATT allows only one descriptor operation at a time.
     */
    private var descriptorOperationInProgress = false

    private fun clearPendingRead() {

        pendingReadPromise = null
        pendingReadSource = null
    }

    internal fun clearPendingOperations() {

        pendingRxNotificationPromise = null
        pendingRx2NotificationPromise = null

        clearPendingRead()

        descriptorOperationInProgress = false
    }

    // =========================================================================
    // EVENTS
    // =========================================================================

    private fun emitEvent(
        eventName: String,
        params: WritableMap
    ) {

        try {

            if (
                !reactContext.hasActiveCatalystInstance()
            ) {
                return
            }

            reactContext
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
                "Event emission failed: $eventName",
                e
            )
        }
    }

    private fun emitNotificationEvent(
        source: String,
        enabled: Boolean,
        error: String? = null
    ) {

        emitEvent(
            EVENT_NOTIFICATION_ENABLED,
            Arguments.createMap().apply {

                putString(
                    "source",
                    source
                )

                putBoolean(
                    "enabled",
                    enabled
                )

                if (error != null) {

                    putString(
                        "error",
                        error
                    )
                }
            }
        )
    }

    // =========================================================================
    // TX CHARACTERISTIC
    // =========================================================================

    @ReactMethod
    fun setTxCharacteristic(
        uuid: String,
        promise: Promise
    ) {

        try {

            val characteristic =
                findCharacteristic(
                    uuid
                )

            if (characteristic == null) {

                promise.reject(
                    "ALX_TX_NOT_FOUND",
                    "TX characteristic not found: $uuid"
                )

                return
            }

            if (
                characteristic.uuid != TX_UUID
            ) {

                promise.reject(
                    "ALX_INVALID_TX",
                    "Characteristic is not the ALX TX characteristic: $uuid"
                )

                return
            }

            txCharacteristic =
                characteristic

            promise.resolve(
                Arguments.createMap().apply {

                    putBoolean(
                        "success",
                        true
                    )

                    putString(
                        "uuid",
                        characteristic.uuid.toString()
                    )

                    putString(
                        "properties",
                        propertiesToString(
                            characteristic.properties
                        )
                    )
                }
            )

        } catch (e: Exception) {

            promise.reject(
                "ALX_TX_ERROR",
                e.message
                    ?: "Failed to set TX characteristic",
                e
            )
        }
    }

    // =========================================================================
    // RX CHARACTERISTIC
    // =========================================================================

    @ReactMethod
    fun setRxCharacteristic(
        uuid: String,
        promise: Promise
    ) {

        try {

            val characteristic =
                findCharacteristic(
                    uuid
                )

            if (characteristic == null) {

                promise.reject(
                    "ALX_RX_NOT_FOUND",
                    "RX characteristic not found: $uuid"
                )

                return
            }

            if (
                characteristic.uuid != RX_UUID
            ) {

                promise.reject(
                    "ALX_INVALID_RX",
                    "Characteristic is not the ALX RX characteristic: $uuid"
                )

                return
            }

            val supportsNotify =
                characteristic.properties and
                    BluetoothGattCharacteristic.PROPERTY_NOTIFY != 0

            val supportsIndicate =
                characteristic.properties and
                    BluetoothGattCharacteristic.PROPERTY_INDICATE != 0

            if (
                !supportsNotify &&
                !supportsIndicate
            ) {

                promise.reject(
                    "ALX_NOTIFY_UNSUPPORTED",
                    "RX characteristic supports neither notifications nor indications"
                )

                return
            }

            rxCharacteristic =
                characteristic

            promise.resolve(
                Arguments.createMap().apply {

                    putBoolean(
                        "success",
                        true
                    )

                    putString(
                        "uuid",
                        characteristic.uuid.toString()
                    )

                    putString(
                        "properties",
                        propertiesToString(
                            characteristic.properties
                        )
                    )

                    putBoolean(
                        "notificationsEnabled",
                        rxNotificationsEnabled
                    )
                }
            )

        } catch (e: Exception) {

            promise.reject(
                "ALX_RX_ERROR",
                e.message
                    ?: "Failed to set RX characteristic",
                e
            )
        }
    }

    // =========================================================================
    // READ RX
    // =========================================================================

    @ReactMethod
    fun readRx(
        promise: Promise
    ) {

        readCharacteristic(
            rxCharacteristic,
            "RX",
            promise
        )
    }

    // =========================================================================
    // READ RX2
    // =========================================================================

    @ReactMethod
    fun readRx2(
        promise: Promise
    ) {

        readCharacteristic(
            rx2Characteristic,
            "RX2",
            promise
        )
    }

    // =========================================================================
    // READ CHARACTERISTIC
    // =========================================================================

    @SuppressLint("MissingPermission")
    private fun readCharacteristic(
        characteristic: BluetoothGattCharacteristic?,
        source: String,
        promise: Promise
    ) {

        val gatt =
            activeGatt

        if (gatt == null) {

            promise.reject(
                "ALX_GATT_NOT_CONNECTED",
                "BluetoothGatt is not connected"
            )

            return
        }

        if (characteristic == null) {

            promise.reject(
                "ALX_${source}_NOT_FOUND",
                "$source characteristic is not configured"
            )

            return
        }

        if (
            !isKnownCharacteristic(
                characteristic
            )
        ) {

            promise.reject(
                "ALX_INVALID_CHARACTERISTIC",
                "$source characteristic does not belong to the active ALX GATT"
            )

            return
        }

        val supportsRead =
            characteristic.properties and
                BluetoothGattCharacteristic.PROPERTY_READ != 0

        if (!supportsRead) {

            promise.reject(
                "ALX_${source}_READ_UNSUPPORTED",
                "$source characteristic does not support READ"
            )

            return
        }

        if (pendingReadPromise != null) {

            promise.reject(
                "ALX_GATT_BUSY",
                "A characteristic read is already in progress"
            )

            return
        }

        pendingReadPromise =
            promise

        pendingReadSource =
            source

        Log.d(
            TAG,
            "$source READ requested"
        )

        val started =
            try {

                gatt.readCharacteristic(
                    characteristic
                )

            } catch (e: Exception) {

                Log.e(
                    TAG,
                    "$source read threw exception",
                    e
                )

                false
            }

        if (!started) {

            clearPendingRead()

            promise.reject(
                "ALX_${source}_READ_FAILED",
                "BluetoothGatt.readCharacteristic() failed to start"
            )
        }
    }

    // =========================================================================
    // ENABLE RX NOTIFICATIONS
    //
    // Normal C#-matching connection setup is performed by AlxBleGattModule.
    //
    // This remains available for explicit JS use.
    // =========================================================================

    @ReactMethod
    fun enableRxNotifications(
        promise: Promise
    ) {

        val gatt =
            activeGatt

        if (gatt == null) {

            promise.reject(
                "ALX_GATT_NOT_CONNECTED",
                "BluetoothGatt is not connected"
            )

            return
        }

        val rx =
            rxCharacteristic

        if (rx == null) {

            promise.reject(
                "ALX_RX_NOT_FOUND",
                "RX characteristic is not configured"
            )

            return
        }

        if (rxNotificationsEnabled) {

            promise.resolve(true)

            return
        }

        if (descriptorOperationInProgress) {

            promise.reject(
                "ALX_GATT_BUSY",
                "Another descriptor operation is active"
            )

            return
        }

        pendingRxNotificationPromise =
            promise

        descriptorOperationInProgress =
            true

        if (
            !configureNotification(
                gatt,
                rx,
                true
            )
        ) {

            descriptorOperationInProgress = false
            pendingRxNotificationPromise = null

            promise.reject(
                "ALX_RX_NOTIFY_FAILED",
                "Failed to start RX notification configuration"
            )
        }
    }

    // =========================================================================
    // ENABLE NOTIFICATIONS
    //
    // C# enables RX (...f9), not RX2 (...fa).
    // =========================================================================

    @ReactMethod
    fun enableNotifications(
        promise: Promise
    ) {

        enableRxNotifications(
            promise
        )
    }

    // =========================================================================
    // ENABLE RX2 NOTIFICATIONS
    //
    // Explicit only. Not part of the normal C# workflow.
    // =========================================================================

    @ReactMethod
    fun enableRx2Notifications(
        promise: Promise
    ) {

        val gatt =
            activeGatt

        if (gatt == null) {

            promise.reject(
                "ALX_GATT_NOT_CONNECTED",
                "BluetoothGatt is not connected"
            )

            return
        }

        val rx2 =
            rx2Characteristic

        if (rx2 == null) {

            promise.reject(
                "ALX_RX2_NOT_FOUND",
                "RX2 characteristic is not available"
            )

            return
        }

        if (rx2NotificationsEnabled) {

            promise.resolve(true)

            return
        }

        if (descriptorOperationInProgress) {

            promise.reject(
                "ALX_GATT_BUSY",
                "Another descriptor operation is active"
            )

            return
        }

        pendingRx2NotificationPromise =
            promise

        descriptorOperationInProgress =
            true

        if (
            !configureNotification(
                gatt,
                rx2,
                true
            )
        ) {

            descriptorOperationInProgress = false
            pendingRx2NotificationPromise = null

            promise.reject(
                "ALX_RX2_NOTIFY_FAILED",
                "Failed to start RX2 notification configuration"
            )
        }
    }

    // =========================================================================
    // CONFIGURE CCCD
    // =========================================================================

    @SuppressLint("MissingPermission")
    private fun configureNotification(
        gatt: BluetoothGatt,
        characteristic: BluetoothGattCharacteristic,
        enable: Boolean
    ): Boolean {

        if (
            gatt !== activeGatt
        ) {

            Log.e(
                TAG,
                "CCCD rejected: stale GATT"
            )

            return false
        }

        if (
            !isKnownCharacteristic(
                characteristic
            )
        ) {

            Log.e(
                TAG,
                "CCCD rejected: characteristic is not part of active ALX GATT"
            )

            return false
        }

        val descriptor =
            characteristic.getDescriptor(
                CCCD_UUID
            )

        if (descriptor == null) {

            Log.e(
                TAG,
                "CCCD not found for ${characteristic.uuid}"
            )

            return false
        }

        val supportsNotify =
            characteristic.properties and
                BluetoothGattCharacteristic.PROPERTY_NOTIFY != 0

        val supportsIndicate =
            characteristic.properties and
                BluetoothGattCharacteristic.PROPERTY_INDICATE != 0

        if (
            enable &&
            !supportsNotify &&
            !supportsIndicate
        ) {

            Log.e(
                TAG,
                "Characteristic ${characteristic.uuid} supports neither NOTIFY nor INDICATE"
            )

            return false
        }

        val localResult =
            try {

                gatt.setCharacteristicNotification(
                    characteristic,
                    enable
                )

            } catch (e: Exception) {

                Log.e(
                    TAG,
                    "setCharacteristicNotification() exception",
                    e
                )

                false
            }

        if (!localResult) {

            Log.e(
                TAG,
                "setCharacteristicNotification() returned false"
            )

            return false
        }

        descriptor.value =
            when {

                !enable ->
                    BluetoothGattDescriptor
                        .DISABLE_NOTIFICATION_VALUE

                supportsNotify ->
                    BluetoothGattDescriptor
                        .ENABLE_NOTIFICATION_VALUE

                else ->
                    BluetoothGattDescriptor
                        .ENABLE_INDICATION_VALUE
            }

        Log.d(
            TAG,
            "CCCD ${characteristic.uuid}: ${
                bytesToHex(
                    descriptor.value
                )
            }"
        )

        return try {

            @Suppress("DEPRECATION")
            gatt.writeDescriptor(
                descriptor
            )

        } catch (e: Exception) {

            Log.e(
                TAG,
                "writeDescriptor() exception",
                e
            )

            false
        }
    }

    // =========================================================================
    // CCCD CALLBACK
    // =========================================================================

    private fun handleDescriptorWrite(
        gatt: BluetoothGatt,
        descriptor: BluetoothGattDescriptor,
        status: Int
    ) {

        if (
            gatt !== activeGatt
        ) {

            Log.w(
                TAG,
                "Ignoring CCCD callback from stale GATT"
            )

            return
        }

        if (
            descriptor.uuid != CCCD_UUID
        ) {

            return
        }

        val characteristic =
            descriptor.characteristic

        val success =
            status == BluetoothGatt.GATT_SUCCESS

        Log.d(
            TAG,
            "CCCD callback: ${characteristic.uuid} " +
                "status=$status " +
                "${gattStatusToString(status)}"
        )

        when {

            characteristic.uuid == RX_UUID -> {

                descriptorOperationInProgress = false
                rxNotificationsEnabled = success

                emitNotificationEvent(
                    source = "RX",
                    enabled = success,
                    error =
                        if (success) {
                            null
                        } else {
                            "CCCD write failed: $status (${gattStatusToString(status)})"
                        }
                )

                val promise =
                    pendingRxNotificationPromise

                pendingRxNotificationPromise = null

                if (promise != null) {

                    if (success) {

                        promise.resolve(true)

                    } else {

                        promise.reject(
                            "ALX_RX_NOTIFY_FAILED",
                            "RX CCCD write failed: $status (${gattStatusToString(status)})"
                        )
                    }
                }
            }

            characteristic.uuid == RX2_UUID -> {

                descriptorOperationInProgress = false
                rx2NotificationsEnabled = success

                emitNotificationEvent(
                    source = "RX2",
                    enabled = success,
                    error =
                        if (success) {
                            null
                        } else {
                            "CCCD write failed: $status (${gattStatusToString(status)})"
                        }
                )

                val promise =
                    pendingRx2NotificationPromise

                pendingRx2NotificationPromise = null

                if (promise != null) {

                    if (success) {

                        promise.resolve(true)

                    } else {

                        promise.reject(
                            "ALX_RX2_NOTIFY_FAILED",
                            "RX2 CCCD write failed: $status (${gattStatusToString(status)})"
                        )
                    }
                }
            }

            else -> {

                Log.w(
                    TAG,
                    "Unknown ALX CCCD characteristic: ${characteristic.uuid}"
                )
            }
        }
    }

    // =========================================================================
    // RECEIVE NOTIFICATION
    // =========================================================================

    private fun handleCharacteristicChanged(
        characteristic: BluetoothGattCharacteristic,
        value: ByteArray
    ) {

        val source =
            characteristicSource(
                characteristic
            )

        if (
            source != "RX" &&
            source != "RX2"
        ) {

            Log.w(
                TAG,
                "Ignoring notification from unknown characteristic: ${characteristic.uuid}"
            )

            return
        }

        /*
         * A notification arriving from RX means the peripheral is actually
         * sending protocol data. Mark RX notification state accordingly.
         */
        if (
            source == "RX"
        ) {

            rxNotificationsEnabled = true
        }

        if (
            source == "RX2"
        ) {

            rx2NotificationsEnabled = true
        }

        Log.d(
            TAG,
            "BLE NOTIFICATION source=$source " +
                "uuid=${characteristic.uuid} " +
                "length=${value.size}"
        )

        Log.d(
            TAG,
            "Data: ${bytesToHex(value)}"
        )

        emitEvent(
            EVENT_DATA_RECEIVED,
            Arguments.createMap().apply {

                putString(
                    "source",
                    source
                )

                putString(
                    "uuid",
                    characteristic.uuid.toString()
                )

                putInt(
                    "length",
                    value.size
                )

                putString(
                    "hex",
                    bytesToHex(value)
                )

                putString(
                    "transport",
                    "notification"
                )
            }
        )

        /*
         * The transport never interprets ALX protocol framing.
         *
         * It forwards raw bytes to AlxBleProtocolModule, which handles:
         *
         *   SOF
         *   direction
         *   command
         *   fragment
         *   payload length
         *   payload
         *   CRC
         */
        AlxBleProtocolModule.onBleDataReceived(
            source,
            value
        )
    }

    // =========================================================================
    // RECEIVE READ
    // =========================================================================

    private fun handleCharacteristicRead(
        gatt: BluetoothGatt,
        characteristic: BluetoothGattCharacteristic,
        value: ByteArray,
        status: Int
    ) {

        if (
            gatt !== activeGatt
        ) {

            Log.w(
                TAG,
                "Ignoring read callback from stale GATT"
            )

            return
        }

        val source =
            characteristicSource(
                characteristic
            )

        val promise =
            pendingReadPromise

        clearPendingRead()

        if (promise == null) {
            return
        }

        if (
            status != BluetoothGatt.GATT_SUCCESS
        ) {

            promise.reject(
                "ALX_${source}_READ_FAILED",
                "Characteristic read failed: " +
                    "$status (${gattStatusToString(status)})"
            )

            return
        }

        val hex =
            bytesToHex(value)

        Log.d(
            TAG,
            "$source READ RESPONSE: $hex"
        )

        emitEvent(
            EVENT_DATA_RECEIVED,
            Arguments.createMap().apply {

                putString(
                    "source",
                    source
                )

                putString(
                    "uuid",
                    characteristic.uuid.toString()
                )

                putInt(
                    "length",
                    value.size
                )

                putString(
                    "hex",
                    hex
                )

                putString(
                    "transport",
                    "read"
                )
            }
        )

        promise.resolve(
            Arguments.createMap().apply {

                putBoolean(
                    "success",
                    true
                )

                putString(
                    "source",
                    source
                )

                putString(
                    "uuid",
                    characteristic.uuid.toString()
                )

                putInt(
                    "length",
                    value.size
                )

                putString(
                    "hex",
                    hex
                )
            }
        )
    }

    // =========================================================================
    // TX WRITE CALLBACK
    // =========================================================================

    private fun handleCharacteristicWrite(
        gatt: BluetoothGatt,
        characteristic: BluetoothGattCharacteristic,
        status: Int
    ) {

        if (
            gatt !== activeGatt
        ) {

            Log.w(
                TAG,
                "Ignoring TX callback from stale GATT"
            )

            return
        }

        if (
            characteristic.uuid != TX_UUID
        ) {

            return
        }

        Log.d(
            TAG,
            "TX WRITE CALLBACK " +
                "status=$status " +
                "${gattStatusToString(status)}"
        )

        if (
            status != BluetoothGatt.GATT_SUCCESS
        ) {

            Log.e(
                TAG,
                "TX WRITE FAILED: " +
                    "$status (${gattStatusToString(status)})"
            )
        }
    }

    // =========================================================================
    // SEND
    // =========================================================================

    @ReactMethod
    fun send(
        data: String,
        promise: Promise
    ) {

        try {

            sendBytes(
                hexToBytes(data),
                promise
            )

        } catch (e: Exception) {

            promise.reject(
                "ALX_INVALID_DATA",
                e.message
                    ?: "Invalid HEX data"
            )
        }
    }

    @ReactMethod
    fun sendHex(
        hex: String,
        promise: Promise
    ) {

        try {

            sendBytes(
                hexToBytes(hex),
                promise
            )

        } catch (e: Exception) {

            promise.reject(
                "ALX_INVALID_DATA",
                e.message
                    ?: "Invalid HEX data"
            )
        }
    }

    // =========================================================================
    // TX WRITE
    // =========================================================================

    @SuppressLint("MissingPermission")
    private fun sendBytesInternal(
        data: ByteArray
    ): Boolean {

        Log.d(
            TAG,
            "TX WRITE REQUEST: ${bytesToHex(data)}"
        )

        val gatt =
            activeGatt

        if (gatt == null) {

            Log.e(
                TAG,
                "TX rejected: no active GATT"
            )

            return false
        }

        val tx =
            txCharacteristic

        if (tx == null) {

            Log.e(
                TAG,
                "TX rejected: TX characteristic not configured"
            )

            return false
        }

        if (data.isEmpty()) {

            Log.e(
                TAG,
                "TX rejected: empty data"
            )

            return false
        }

        if (
            !isKnownCharacteristic(
                tx
            )
        ) {

            Log.e(
                TAG,
                "TX rejected: characteristic does not belong to active ALX GATT"
            )

            return false
        }

        val supportsWrite =
            tx.properties and
                BluetoothGattCharacteristic.PROPERTY_WRITE != 0

        val supportsWriteWithoutResponse =
            tx.properties and
                BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE != 0

        if (
            !supportsWrite &&
            !supportsWriteWithoutResponse
        ) {

            Log.e(
                TAG,
                "TX rejected: characteristic is not writable"
            )

            return false
        }

        /*
         * Match the C# tester:
         *
         *     GattWriteOption.WriteWithResponse
         *
         * whenever the characteristic supports WRITE.
         */
        val writeType =
            if (supportsWrite) {

                BluetoothGattCharacteristic
                    .WRITE_TYPE_DEFAULT

            } else {

                BluetoothGattCharacteristic
                    .WRITE_TYPE_NO_RESPONSE
            }

        Log.d(
            TAG,
            "TX write type: ${
                writeTypeToString(
                    writeType
                )
            }"
        )

        if (
            Build.VERSION.SDK_INT >=
            Build.VERSION_CODES.TIRAMISU
        ) {

            return try {

                val status =
                    gatt.writeCharacteristic(
                        tx,
                        data,
                        writeType
                    )

                Log.d(
                    TAG,
                    "TX writeCharacteristic status=$status " +
                        "${gattStatusToString(status)}"
                )

                status ==
                    BluetoothGatt.GATT_SUCCESS

            } catch (e: Exception) {

                Log.e(
                    TAG,
                    "TX write exception",
                    e
                )

                false
            }

        } else {

            @Suppress("DEPRECATION")
            tx.writeType =
                writeType

            @Suppress("DEPRECATION")
            tx.value =
                data

            return try {

                @Suppress("DEPRECATION")
                gatt.writeCharacteristic(
                    tx
                )

            } catch (e: Exception) {

                Log.e(
                    TAG,
                    "TX legacy write exception",
                    e
                )

                false
            }
        }
    }

    private fun sendBytes(
        data: ByteArray,
        promise: Promise
    ) {

        if (data.isEmpty()) {

            promise.reject(
                "ALX_EMPTY_DATA",
                "Cannot send empty data"
            )

            return
        }

        val started =
            sendBytesInternal(
                data
            )

        if (!started) {

            promise.reject(
                "ALX_TX_WRITE_FAILED",
                "BluetoothGatt.writeCharacteristic() failed to start"
            )

            return
        }

        /*
         * This only means Android accepted the GATT operation.
         *
         * It does NOT mean the ALX peripheral accepted the command.
         *
         * The actual ALX response comes through RX notification.
         */
        promise.resolve(true)
    }

    // =========================================================================
    // STATE
    // =========================================================================

    @ReactMethod
    fun getTransportState(
        promise: Promise
    ) {

        val ready =
            activeGatt != null &&
                txCharacteristic != null &&
                rxCharacteristic != null &&
                rxNotificationsEnabled

        promise.resolve(
            Arguments.createMap().apply {

                putString(
                    "module",
                    MODULE_NAME
                )

                putBoolean(
                    "connected",
                    activeGatt != null
                )

                putBoolean(
                    "ready",
                    ready
                )

                putBoolean(
                    "txConfigured",
                    txCharacteristic != null
                )

                putBoolean(
                    "rxConfigured",
                    rxCharacteristic != null
                )

                putBoolean(
                    "rx2Configured",
                    rx2Characteristic != null
                )

                putBoolean(
                    "rxNotificationsEnabled",
                    rxNotificationsEnabled
                )

                putBoolean(
                    "rx2NotificationsEnabled",
                    rx2NotificationsEnabled
                )

                /*
                 * Normal ALX workflow:
                 *
                 *   TX configured
                 *   RX configured
                 *   RX notifications enabled
                 */
                putBoolean(
                    "alxReady",
                    ready
                )

                putString(
                    "tx",
                    txCharacteristic
                        ?.uuid
                        ?.toString()
                )

                putString(
                    "rx",
                    rxCharacteristic
                        ?.uuid
                        ?.toString()
                )

                putString(
                    "rx2",
                    rx2Characteristic
                        ?.uuid
                        ?.toString()
                )
            }
        )
    }

    // =========================================================================
    // CHARACTERISTIC LOOKUP
    // =========================================================================

    private fun findCharacteristic(
        uuidString: String
    ): BluetoothGattCharacteristic? {

        val target =
            try {

                UUID.fromString(
                    uuidString
                )

            } catch (_: Exception) {

                return null
            }

        val service =
            activeGatt?.getService(
                SERVICE_UUID
            )
                ?: return null

        return service.getCharacteristic(
            target
        )
    }

    // =========================================================================
    // CHARACTERISTIC VALIDATION
    // =========================================================================

    private fun isKnownCharacteristic(
        characteristic: BluetoothGattCharacteristic
    ): Boolean {

        if (
            characteristic.uuid != TX_UUID &&
            characteristic.uuid != RX_UUID &&
            characteristic.uuid != RX2_UUID
        ) {

            return false
        }

        return when (characteristic.uuid) {

            TX_UUID ->
                characteristic == txCharacteristic

            RX_UUID ->
                characteristic == rxCharacteristic

            RX2_UUID ->
                characteristic == rx2Characteristic

            else ->
                false
        }
    }

    // =========================================================================
    // CHARACTERISTIC SOURCE
    // =========================================================================

    private fun characteristicSource(
        characteristic: BluetoothGattCharacteristic
    ): String {

        return when {

            characteristic == rxCharacteristic ->
                "RX"

            characteristic == rx2Characteristic ->
                "RX2"

            characteristic.uuid == RX_UUID ->
                "RX"

            characteristic.uuid == RX2_UUID ->
                "RX2"

            characteristic.uuid == TX_UUID ->
                "TX"

            else ->
                "UNKNOWN"
        }
    }

    // =========================================================================
    // PROPERTY STRING
    // =========================================================================

    private fun propertiesToString(
        properties: Int
    ): String {

        val result =
            mutableListOf<String>()

        if (
            properties and
            BluetoothGattCharacteristic.PROPERTY_READ != 0
        ) {
            result.add("READ")
        }

        if (
            properties and
            BluetoothGattCharacteristic.PROPERTY_WRITE != 0
        ) {
            result.add("WRITE")
        }

        if (
            properties and
            BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE != 0
        ) {
            result.add("WRITE_NO_RESPONSE")
        }

        if (
            properties and
            BluetoothGattCharacteristic.PROPERTY_NOTIFY != 0
        ) {
            result.add("NOTIFY")
        }

        if (
            properties and
            BluetoothGattCharacteristic.PROPERTY_INDICATE != 0
        ) {
            result.add("INDICATE")
        }

        if (
            properties and
            BluetoothGattCharacteristic.PROPERTY_SIGNED_WRITE != 0
        ) {
            result.add("SIGNED_WRITE")
        }

        if (
            properties and
            BluetoothGattCharacteristic.PROPERTY_EXTENDED_PROPS != 0
        ) {
            result.add("EXTENDED_PROPS")
        }

        return if (result.isEmpty()) {
            "NONE"
        } else {
            result.joinToString("|")
        }
    }

    // =========================================================================
    // GATT STATUS
    // =========================================================================

    private fun gattStatusToString(
        status: Int
    ): String {

        return when (status) {

            BluetoothGatt.GATT_SUCCESS ->
                "GATT_SUCCESS"

            1 ->
                "GATT_INVALID_HANDLE"

            2 ->
                "GATT_READ_NOT_PERMITTED"

            3 ->
                "GATT_WRITE_NOT_PERMITTED"

            4 ->
                "GATT_INVALID_PDU"

            5 ->
                "GATT_INSUFFICIENT_AUTHENTICATION"

            6 ->
                "GATT_REQUEST_NOT_SUPPORTED"

            7 ->
                "GATT_INVALID_OFFSET"

            8 ->
                "GATT_INSUFFICIENT_AUTHORIZATION"

            9 ->
                "GATT_PREPARE_Q_FULL"

            10 ->
                "GATT_NOT_FOUND"

            11 ->
                "GATT_NOT_LONG"

            12 ->
                "GATT_INSUFFICIENT_KEY_SIZE"

            13 ->
                "GATT_INVALID_ATTRIBUTE_LENGTH"

            14 ->
                "GATT_ERR_UNLIKELY"

            15 ->
                "GATT_INSUFFICIENT_ENCRYPTION"

            16 ->
                "GATT_UNSUPPORT_GRP_TYPE"

            17 ->
                "GATT_UNKNOWN_ERROR"

            else ->
                "UNKNOWN_GATT_STATUS"
        }
    }

    // =========================================================================
    // WRITE TYPE
    // =========================================================================

    private fun writeTypeToString(
        writeType: Int
    ): String {

        return when (writeType) {

            BluetoothGattCharacteristic
                .WRITE_TYPE_DEFAULT ->
                "WRITE_WITH_RESPONSE"

            BluetoothGattCharacteristic
                .WRITE_TYPE_NO_RESPONSE ->
                "WRITE_NO_RESPONSE"

            BluetoothGattCharacteristic
                .WRITE_TYPE_SIGNED ->
                "WRITE_SIGNED"

            else ->
                "UNKNOWN($writeType)"
        }
    }

    // =========================================================================
    // HEX
    // =========================================================================

    private fun bytesToHex(
        data: ByteArray
    ): String {

        return data.joinToString(" ") {

            "%02X".format(
                it.toInt() and 0xFF
            )
        }
    }

    private fun hexToBytes(
        input: String
    ): ByteArray {

        val hex =
            input
                .replace(
                    " ",
                    ""
                )
                .replace(
                    "-",
                    ""
                )
                .replace(
                    "0x",
                    "",
                    ignoreCase = true
                )

        if (hex.isEmpty()) {
            return ByteArray(0)
        }

        if (
            hex.length % 2 != 0
        ) {

            throw IllegalArgumentException(
                "HEX string must contain an even number of characters"
            )
        }

        return ByteArray(
            hex.length / 2
        ) { index ->

            hex.substring(
                index * 2,
                index * 2 + 2
            )
                .toInt(16)
                .toByte()
        }
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
    // CLEANUP
    // =========================================================================

    override fun invalidate() {

        Log.d(
            TAG,
            "AlxBleTransport invalidating"
        )

        clearPendingOperations()
        clearGatt()

        if (
            instance === this
        ) {

            instance = null
        }

        super.invalidate()
    }
}