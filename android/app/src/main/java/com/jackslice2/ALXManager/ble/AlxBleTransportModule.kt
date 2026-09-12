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

        private val SERVICE_UUID = UUID.fromString(
            "12345678-1234-5678-1234-56789abcdef7"
        )

        private val TX_UUID = UUID.fromString(
            "12345678-1234-5678-1234-56789abcdef8"
        )

        private val RX_UUID = UUID.fromString(
            "12345678-1234-5678-1234-56789abcdef9"
        )

        private val RX2_UUID = UUID.fromString(
            "12345678-1234-5678-1234-56789abcdefa"
        )

        private val CCCD_UUID = UUID.fromString(
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

            Log.d(
                TAG,
                "GATT configured"
            )

            Log.d(
                TAG,
                "GATT object : $gatt"
            )

            Log.d(
                TAG,
                "TX         : ${tx?.uuid}"
            )

            Log.d(
                TAG,
                "RX         : ${rx?.uuid}"
            )

            Log.d(
                TAG,
                "RX2        : ${rx2?.uuid}"
            )

            if (tx != null) {

                Log.d(
                    TAG,
                    "TX props   : ${instance?.propertiesToString(tx.properties)}"
                )
            }

            instance?.clearPendingOperations()
        }

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

        @SuppressLint("MissingPermission")
        fun sendBytes(
            data: ByteArray
        ): Boolean {

            return instance?.sendBytesInternal(data) ?: run {

                Log.e(
                    TAG,
                    "sendBytes(): transport instance is null"
                )

                false
            }
        }

        // =====================================================================
        // GATT CALLBACKS
        // =====================================================================

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

        fun onCharacteristicChanged(
            characteristic: BluetoothGattCharacteristic,
            value: ByteArray
        ) {

            instance?.handleCharacteristicChanged(
                characteristic,
                value
            )
        }

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
    // MODULE
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

    private var pendingEnableAllPromise: Promise? = null

    private var pendingRxNotificationPromise: Promise? = null

    private var pendingRx2NotificationPromise: Promise? = null

    private var pendingReadPromise: Promise? = null

    private var pendingReadSource: String? = null

    /*
     * Android GATT allows only one descriptor operation at a time.
     */
    private var descriptorOperationInProgress = false

    private fun clearPendingRead() {

        pendingReadPromise = null
        pendingReadSource = null
    }

    internal fun clearPendingOperations() {

        pendingEnableAllPromise = null
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

            if (!reactContext.hasActiveCatalystInstance()) {
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
                findCharacteristic(uuid)

            if (characteristic == null) {

                promise.reject(
                    "ALX_TX_NOT_FOUND",
                    "TX characteristic not found: $uuid"
                )

                return
            }

            txCharacteristic = characteristic

            Log.d(
                TAG,
                "TX characteristic configured: ${characteristic.uuid}"
            )

            Log.d(
                TAG,
                "TX properties: ${propertiesToString(characteristic.properties)}"
            )

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
                findCharacteristic(uuid)

            if (characteristic == null) {

                promise.reject(
                    "ALX_RX_NOT_FOUND",
                    "RX characteristic not found: $uuid"
                )

                return
            }

            val supportsNotify =
                characteristic.properties and
                    BluetoothGattCharacteristic
                        .PROPERTY_NOTIFY != 0

            if (!supportsNotify) {

                promise.reject(
                    "ALX_NOTIFY_UNSUPPORTED",
                    "RX characteristic does not support notifications"
                )

                return
            }

            rxCharacteristic = characteristic

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

        val gatt = activeGatt

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

        val supportsRead =
            characteristic.properties and
                BluetoothGattCharacteristic
                    .PROPERTY_READ != 0

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

        if (descriptorOperationInProgress) {

            promise.reject(
                "ALX_GATT_BUSY",
                "A descriptor operation is already in progress"
            )

            return
        }

        pendingReadPromise = promise
        pendingReadSource = source

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
    // =========================================================================

    @ReactMethod
    fun enableRxNotifications(
        promise: Promise
    ) {

        val gatt = activeGatt

        if (gatt == null) {

            promise.reject(
                "ALX_GATT_NOT_CONNECTED",
                "BluetoothGatt is not connected"
            )

            return
        }

        val rx = rxCharacteristic

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

        if (
            rx.properties and
                BluetoothGattCharacteristic
                    .PROPERTY_NOTIFY == 0
        ) {

            promise.reject(
                "ALX_NOTIFY_UNSUPPORTED",
                "RX does not support notifications"
            )

            return
        }

        if (descriptorOperationInProgress) {

            promise.reject(
                "ALX_GATT_BUSY",
                "Another descriptor operation is active"
            )

            return
        }

        if (pendingRxNotificationPromise != null) {

            promise.reject(
                "ALX_GATT_BUSY",
                "RX notification operation is already active"
            )

            return
        }

        pendingRxNotificationPromise = promise
        descriptorOperationInProgress = true

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
    // ENABLE ALL NOTIFICATIONS
    // =========================================================================

    @ReactMethod
    fun enableNotifications(
        promise: Promise
    ) {

        val gatt = activeGatt

        if (gatt == null) {

            promise.reject(
                "ALX_GATT_NOT_CONNECTED",
                "BluetoothGatt is not connected"
            )

            return
        }

        val rx = rxCharacteristic

        if (rx == null) {

            promise.reject(
                "ALX_RX_NOT_FOUND",
                "RX characteristic is not configured"
            )

            return
        }

        if (rxNotificationsEnabled) {

            if (
                rx2Characteristic != null &&
                !rx2NotificationsEnabled
            ) {

                pendingEnableAllPromise = promise

                startRx2NotificationConfiguration(
                    gatt
                )

            } else {

                promise.resolve(true)
            }

            return
        }

        if (descriptorOperationInProgress) {

            promise.reject(
                "ALX_GATT_BUSY",
                "Another descriptor operation is active"
            )

            return
        }

        if (pendingEnableAllPromise != null) {

            promise.reject(
                "ALX_GATT_BUSY",
                "Notification operation is already active"
            )

            return
        }

        pendingEnableAllPromise = promise
        descriptorOperationInProgress = true

        if (
            !configureNotification(
                gatt,
                rx,
                true
            )
        ) {

            descriptorOperationInProgress = false
            pendingEnableAllPromise = null

            promise.reject(
                "ALX_RX_NOTIFY_FAILED",
                "Failed to start RX notification configuration"
            )
        }
    }

    // =========================================================================
    // ENABLE RX2 NOTIFICATIONS
    // =========================================================================

    @ReactMethod
    fun enableRx2Notifications(
        promise: Promise
    ) {

        val gatt = activeGatt

        if (gatt == null) {

            promise.reject(
                "ALX_GATT_NOT_CONNECTED",
                "BluetoothGatt is not connected"
            )

            return
        }

        val rx2 = rx2Characteristic

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

        if (
            rx2.properties and
                BluetoothGattCharacteristic
                    .PROPERTY_NOTIFY == 0
        ) {

            promise.reject(
                "ALX_NOTIFY_UNSUPPORTED",
                "RX2 does not support notifications"
            )

            return
        }

        if (descriptorOperationInProgress) {

            promise.reject(
                "ALX_GATT_BUSY",
                "Another descriptor operation is active"
            )

            return
        }

        if (pendingRx2NotificationPromise != null) {

            promise.reject(
                "ALX_GATT_BUSY",
                "RX2 notification operation is already active"
            )

            return
        }

        pendingRx2NotificationPromise = promise
        descriptorOperationInProgress = true

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

        if (gatt !== activeGatt) {
            return false
        }

        val descriptor =
            characteristic.getDescriptor(
                CCCD_UUID
            )
                ?: return false

        val localResult =
            try {

                gatt.setCharacteristicNotification(
                    characteristic,
                    enable
                )

            } catch (_: Exception) {

                false
            }

        if (!localResult) {
            return false
        }

        descriptor.value =
            if (enable) {

                BluetoothGattDescriptor
                    .ENABLE_NOTIFICATION_VALUE

            } else {

                BluetoothGattDescriptor
                    .DISABLE_NOTIFICATION_VALUE
            }

        return try {

            @Suppress("DEPRECATION")
            gatt.writeDescriptor(
                descriptor
            )

        } catch (_: Exception) {

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

        if (gatt !== activeGatt) {
            return
        }

        if (descriptor.uuid != CCCD_UUID) {
            return
        }

        val characteristic =
            descriptor.characteristic

        val success =
            status == BluetoothGatt.GATT_SUCCESS

        when {

            characteristic == rxCharacteristic -> {

                handleRxDescriptorWrite(
                    gatt,
                    success,
                    status
                )
            }

            characteristic == rx2Characteristic -> {

                handleRx2DescriptorWrite(
                    success,
                    status
                )
            }

            else -> {

                descriptorOperationInProgress = false
            }
        }
    }

    // =========================================================================
    // RX CCCD RESULT
    // =========================================================================

    private fun handleRxDescriptorWrite(
        gatt: BluetoothGatt,
        success: Boolean,
        status: Int
    ) {

        descriptorOperationInProgress = false
        rxNotificationsEnabled = success

        emitNotificationEvent(
            source = "RX",
            enabled = success,
            error =
                if (success) {
                    null
                } else {
                    "CCCD write failed: $status"
                }
        )

        pendingRxNotificationPromise?.let { promise ->

            pendingRxNotificationPromise = null

            if (success) {

                promise.resolve(true)

            } else {

                promise.reject(
                    "ALX_RX_NOTIFY_FAILED",
                    "RX CCCD write failed: $status"
                )
            }
        }

        pendingEnableAllPromise?.let { promise ->

            if (!success) {

                pendingEnableAllPromise = null

                promise.reject(
                    "ALX_RX_NOTIFY_FAILED",
                    "RX CCCD write failed: $status"
                )

                return
            }

            startRx2NotificationConfiguration(
                gatt
            )
        }
    }

    // =========================================================================
    // RX2 CCCD RESULT
    // =========================================================================

    private fun handleRx2DescriptorWrite(
        success: Boolean,
        status: Int
    ) {

        descriptorOperationInProgress = false
        rx2NotificationsEnabled = success

        emitNotificationEvent(
            source = "RX2",
            enabled = success,
            error =
                if (success) {
                    null
                } else {
                    "CCCD write failed: $status"
                }
        )

        pendingRx2NotificationPromise?.let { promise ->

            pendingRx2NotificationPromise = null

            if (success) {

                promise.resolve(true)

            } else {

                promise.reject(
                    "ALX_RX2_NOTIFY_FAILED",
                    "RX2 CCCD write failed: $status"
                )
            }
        }

        pendingEnableAllPromise?.let { promise ->

            pendingEnableAllPromise = null

            if (success) {

                promise.resolve(true)

            } else {

                promise.reject(
                    "ALX_RX2_NOTIFY_FAILED",
                    "RX2 CCCD write failed: $status"
                )
            }
        }
    }

    // =========================================================================
    // START RX2
    // =========================================================================

    private fun startRx2NotificationConfiguration(
        gatt: BluetoothGatt
    ) {

        val promise = pendingEnableAllPromise
        val rx2 = rx2Characteristic

        if (
            rx2 == null ||
            rx2NotificationsEnabled
        ) {

            pendingEnableAllPromise = null
            descriptorOperationInProgress = false

            promise?.resolve(true)

            return
        }

        if (descriptorOperationInProgress) {

            pendingEnableAllPromise = null

            promise?.reject(
                "ALX_GATT_BUSY",
                "Another descriptor operation is active"
            )

            return
        }

        descriptorOperationInProgress = true

        if (
            !configureNotification(
                gatt,
                rx2,
                true
            )
        ) {

            descriptorOperationInProgress = false
            pendingEnableAllPromise = null

            promise?.reject(
                "ALX_RX2_NOTIFY_FAILED",
                "Failed to start RX2 notification configuration"
            )
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

        val uuid =
            characteristic.uuid.toString()

        emitEvent(
            EVENT_DATA_RECEIVED,
            Arguments.createMap().apply {

                putString(
                    "source",
                    source
                )

                putString(
                    "uuid",
                    uuid
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

        when (source) {

            "RX",
            "RX2" -> {

                AlxBleProtocolModule.onBleDataReceived(
                    source,
                    value
                )
            }
        }
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

        if (gatt !== activeGatt) {
            return
        }

        val source =
            characteristicSource(
                characteristic
            )

        val success =
            status == BluetoothGatt.GATT_SUCCESS

        val promise =
            pendingReadPromise

        clearPendingRead()

        if (promise == null) {
            return
        }

        if (!success) {

            promise.reject(
                "ALX_${source}_READ_FAILED",
                "Characteristic read failed: $status"
            )

            return
        }

        val hex =
            bytesToHex(value)

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

        if (gatt !== activeGatt) {
            return
        }

        if (characteristic.uuid != TX_UUID) {
            return
        }

        Log.d(
            TAG,
            "TX WRITE CALLBACK"
        )

        Log.d(
            TAG,
            "TX status: $status"
        )

        Log.d(
            TAG,
            "TX status name: ${gattStatusToString(status)}"
        )

        if (status == BluetoothGatt.GATT_SUCCESS) {

            Log.d(
                TAG,
                "TX WRITE SUCCESS"
            )

        } else {

            Log.e(
                TAG,
                "TX WRITE FAILED: $status (${gattStatusToString(status)})"
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
                e.message ?: "Invalid HEX data"
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
                e.message ?: "Invalid HEX data"
            )
        }
    }

    // =========================================================================
    // TX
    // =========================================================================

    @SuppressLint("MissingPermission")
    private fun sendBytesInternal(
        data: ByteArray
    ): Boolean {

        Log.d(
            TAG,
            "=============================================="
        )

        Log.d(
            TAG,
            "TX WRITE REQUEST"
        )

        Log.d(
            TAG,
            "Data: ${bytesToHex(data)}"
        )

        Log.d(
            TAG,
            "Length: ${data.size}"
        )

        val gatt = activeGatt

        if (gatt == null) {

            Log.e(
                TAG,
                "TX REJECTED: activeGatt == null"
            )

            return false
        }

        val tx = txCharacteristic

        if (tx == null) {

            Log.e(
                TAG,
                "TX REJECTED: txCharacteristic == null"
            )

            return false
        }

        if (data.isEmpty()) {

            Log.e(
                TAG,
                "TX REJECTED: empty data"
            )

            return false
        }

        if (gatt !== activeGatt) {

            Log.e(
                TAG,
                "TX REJECTED: GATT object changed"
            )

            return false
        }

        Log.d(
            TAG,
            "GATT      : $gatt"
        )

        Log.d(
            TAG,
            "TX UUID   : ${tx.uuid}"
        )

        Log.d(
            TAG,
            "TX props  : ${propertiesToString(tx.properties)}"
        )

        val supportsWrite =
            tx.properties and
                BluetoothGattCharacteristic
                    .PROPERTY_WRITE != 0

        val supportsWriteWithoutResponse =
            tx.properties and
                BluetoothGattCharacteristic
                    .PROPERTY_WRITE_NO_RESPONSE != 0

        Log.d(
            TAG,
            "WRITE supported: $supportsWrite"
        )

        Log.d(
            TAG,
            "WRITE_NO_RESPONSE supported: $supportsWriteWithoutResponse"
        )

        if (
            !supportsWrite &&
            !supportsWriteWithoutResponse
        ) {

            Log.e(
                TAG,
                "TX REJECTED: characteristic is not writable"
            )

            return false
        }

        /*
         * Windows tester uses:
         *
         * GattWriteOption.WriteWithResponse
         *
         * Therefore WRITE is preferred.
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
            "Write type: ${writeTypeToString(writeType)}"
        )

        /*
         * Android 13 / API 33 introduced the non-deprecated overload:
         *
         * writeCharacteristic(characteristic, value, writeType)
         *
         * Use it when available because it gives us the actual GATT
         * status immediately instead of only a Boolean.
         */
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {

            return try {

                val status =
                    gatt.writeCharacteristic(
                        tx,
                        data,
                        writeType
                    )

                Log.d(
                    TAG,
                    "writeCharacteristic() returned: $status"
                )

                Log.d(
                    TAG,
                    "writeCharacteristic() status: ${gattStatusToString(status)}"
                )

                if (status == BluetoothGatt.GATT_SUCCESS) {

                    Log.d(
                        TAG,
                        "TX WRITE ACCEPTED"
                    )

                    true

                } else {

                    Log.e(
                        TAG,
                        "TX WRITE REJECTED: status=$status (${gattStatusToString(status)})"
                    )

                    false
                }

            } catch (e: Exception) {

                Log.e(
                    TAG,
                    "TX WRITE EXCEPTION",
                    e
                )

                false
            }

        } else {

            /*
             * Older Android fallback.
             */
            tx.writeType = writeType
            tx.value = data

            return try {

                @Suppress("DEPRECATION")
                val started =
                    gatt.writeCharacteristic(
                        tx
                    )

                Log.d(
                    TAG,
                    "Legacy writeCharacteristic() returned: $started"
                )

                if (started) {

                    Log.d(
                        TAG,
                        "TX WRITE ACCEPTED"
                    )

                } else {

                    Log.e(
                        TAG,
                        "TX WRITE REJECTED by Android"
                    )
                }

                started

            } catch (e: Exception) {

                Log.e(
                    TAG,
                    "TX WRITE EXCEPTION",
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
         * This means the Android GATT write was accepted/queued.
         *
         * The actual write completion is reported through
         * onCharacteristicWrite().
         *
         * The protocol response is handled separately through RX
         * notifications.
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

                putBoolean(
                    "notificationsEnabled",
                    rxNotificationsEnabled ||
                        rx2NotificationsEnabled
                )

                putBoolean(
                    "allNotificationsEnabled",
                    rxNotificationsEnabled &&
                        (
                            rx2Characteristic == null ||
                                rx2NotificationsEnabled
                            )
                )

                putString(
                    "tx",
                    txCharacteristic?.uuid?.toString()
                )

                putString(
                    "rx",
                    rxCharacteristic?.uuid?.toString()
                )

                putString(
                    "rx2",
                    rx2Characteristic?.uuid?.toString()
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
                "UNKNOWN"
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

        return data.joinToString("") {

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
                .replace(" ", "")
                .replace("-", "")
                .replace(
                    "0x",
                    "",
                    ignoreCase = true
                )

        if (hex.isEmpty()) {
            return ByteArray(0)
        }

        if (hex.length % 2 != 0) {

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

        clearPendingOperations()
        clearGatt()

        if (instance === this) {
            instance = null
        }

        super.invalidate()
    }
}
