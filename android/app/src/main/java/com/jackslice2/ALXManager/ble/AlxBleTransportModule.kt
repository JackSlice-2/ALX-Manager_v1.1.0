package com.allexo.alxmobile.ble

import android.annotation.SuppressLint
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
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

        private const val MODULE_NAME =
            "AlxBleTransport"

        private const val EVENT_DATA_RECEIVED =
            "AlxBleDataReceived"

        private const val EVENT_NOTIFICATION_ENABLED =
            "AlxBleNotificationEnabled"

        // ---------------------------------------------------------------------
        // ALX GATT UUIDs
        // ---------------------------------------------------------------------

        private val SERVICE_UUID = UUID.fromString(
            "12345678-1234-5678-1234-56789abcdef7"
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

            instance?.clearPendingOperations()

            Log.d(
                TAG,
                "=================================================="
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

            Log.d(
                TAG,
                "=================================================="
            )
        }

        fun clearGatt() {

            activeGatt = null

            txCharacteristic = null
            rxCharacteristic = null
            rx2Characteristic = null

            rxNotificationsEnabled = false
            rx2NotificationsEnabled = false

            instance?.clearPendingOperations()

            Log.d(
                TAG,
                "GATT transport state cleared"
            )
        }

        // =====================================================================
        // PROTOCOL -> TRANSPORT
        // =====================================================================

        @SuppressLint("MissingPermission")
        fun sendBytes(
            data: ByteArray
        ): Boolean {

            return instance?.sendBytesInternal(
                data
            ) ?: run {

                Log.e(
                    TAG,
                    "Cannot send: transport instance unavailable"
                )

                false
            }
        }

        // =====================================================================
        // DESCRIPTOR CALLBACK
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
            ) ?: Log.e(
                TAG,
                "Cannot handle descriptor write: instance unavailable"
            )
        }

        // =====================================================================
        // CHARACTERISTIC CHANGED
        // =====================================================================

        fun onCharacteristicChanged(
            characteristic: BluetoothGattCharacteristic,
            value: ByteArray
        ) {

            instance?.handleCharacteristicChanged(
                characteristic,
                value
            ) ?: Log.e(
                TAG,
                "Cannot handle characteristic change: instance unavailable"
            )
        }

        // =====================================================================
        // CHARACTERISTIC READ
        // =====================================================================

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
            ) ?: Log.e(
                TAG,
                "Cannot handle characteristic read: instance unavailable"
            )
        }

        @Suppress("DEPRECATION")
        fun onCharacteristicReadLegacy(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            status: Int
        ) {

            val value =
                characteristic.value
                    ?: ByteArray(0)

            instance?.handleCharacteristicRead(
                gatt,
                characteristic,
                value,
                status
            ) ?: Log.e(
                TAG,
                "Cannot handle characteristic read: instance unavailable"
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
            "$MODULE_NAME initialized"
        )
    }

    override fun getName(): String =
        MODULE_NAME

    // =========================================================================
    // PENDING OPERATIONS
    // =========================================================================

    private var pendingEnableAllPromise:
        Promise? = null

    private var pendingRxNotificationPromise:
        Promise? = null

    private var pendingRx2NotificationPromise:
        Promise? = null

    private var pendingReadPromise:
        Promise? = null

    private var pendingReadSource:
        String? = null

    /**
     * Android GATT operations must be serialized.
     */
    private var descriptorOperationInProgress =
        false

    private fun clearPendingRead() {

        pendingReadPromise = null
        pendingReadSource = null
    }

    private fun clearPendingOperations() {

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

            if (
                !reactContext
                    .hasActiveCatalystInstance()
            ) {

                Log.w(
                    TAG,
                    "React context inactive; " +
                        "dropping event=$eventName"
                )

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
                "Failed to emit event: $eventName",
                e
            )
        }
    }

    private fun emitNotificationEvent(
        source: String,
        enabled: Boolean,
        error: String? = null
    ) {

        val event =
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

        emitEvent(
            EVENT_NOTIFICATION_ENABLED,
            event
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

            txCharacteristic =
                characteristic

            Log.d(
                TAG,
                "TX selected: ${characteristic.uuid}"
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

            Log.e(
                TAG,
                "Failed to set TX characteristic",
                e
            )

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

            val properties =
                characteristic.properties

            val supportsNotify =
                properties and
                    BluetoothGattCharacteristic
                        .PROPERTY_NOTIFY != 0

            if (!supportsNotify) {

                promise.reject(
                    "ALX_NOTIFY_UNSUPPORTED",
                    "Characteristic does not support notifications: $uuid"
                )

                return
            }

            rxCharacteristic =
                characteristic

            Log.d(
                TAG,
                "RX selected: ${characteristic.uuid}"
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
                        propertiesToString(properties)
                    )

                    putBoolean(
                        "notificationsEnabled",
                        rxNotificationsEnabled
                    )
                }
            )

        } catch (e: Exception) {

            Log.e(
                TAG,
                "Failed to set RX characteristic",
                e
            )

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
            characteristic = rxCharacteristic,
            source = "RX",
            promise = promise
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
            characteristic = rx2Characteristic,
            source = "RX2",
            promise = promise
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
                "A GATT descriptor operation is already in progress"
            )

            return
        }

        pendingReadPromise =
            promise

        pendingReadSource =
            source

        val started =
            try {

                gatt.readCharacteristic(
                    characteristic
                )

            } catch (e: Exception) {

                Log.e(
                    TAG,
                    "Characteristic read failed to start",
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

            return
        }

        Log.d(
            TAG,
            "Read started: $source ${characteristic.uuid}"
        )
    }

    // =========================================================================
    // ENABLE RX NOTIFICATIONS
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

        if (
            rx.properties and
                BluetoothGattCharacteristic
                    .PROPERTY_NOTIFY == 0
        ) {

            promise.reject(
                "ALX_NOTIFY_UNSUPPORTED",
                "RX characteristic does not support notifications"
            )

            return
        }

        if (descriptorOperationInProgress) {

            promise.reject(
                "ALX_GATT_BUSY",
                "A GATT descriptor operation is already in progress"
            )

            return
        }

        if (pendingRxNotificationPromise != null) {

            promise.reject(
                "ALX_GATT_BUSY",
                "RX notification operation is already in progress"
            )

            return
        }

        pendingRxNotificationPromise =
            promise

        descriptorOperationInProgress =
            true

        val started =
            configureNotification(
                gatt = gatt,
                characteristic = rx,
                enable = true
            )

        if (!started) {

            descriptorOperationInProgress =
                false

            pendingRxNotificationPromise =
                null

            promise.reject(
                "ALX_RX_NOTIFY_FAILED",
                "Failed to start RX notification configuration"
            )

            return
        }

        Log.d(
            TAG,
            "RX notification request queued"
        )
    }

    // =========================================================================
    // ENABLE ALL NOTIFICATIONS
    // =========================================================================

    @ReactMethod
    fun enableNotifications(
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

            val rx2 =
                rx2Characteristic

            if (
                rx2 != null &&
                !rx2NotificationsEnabled
            ) {

                pendingEnableAllPromise =
                    promise

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
                "A GATT descriptor operation is already in progress"
            )

            return
        }

        if (pendingEnableAllPromise != null) {

            promise.reject(
                "ALX_GATT_BUSY",
                "Notification enable operation is already in progress"
            )

            return
        }

        pendingEnableAllPromise =
            promise

        descriptorOperationInProgress =
            true

        val started =
            configureNotification(
                gatt = gatt,
                characteristic = rx,
                enable = true
            )

        if (!started) {

            descriptorOperationInProgress =
                false

            pendingEnableAllPromise =
                null

            promise.reject(
                "ALX_RX_NOTIFY_FAILED",
                "Failed to start RX notification configuration"
            )
        }
    }

    // =========================================================================
    // ENABLE RX2
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

        if (
            rx2.properties and
                BluetoothGattCharacteristic
                    .PROPERTY_NOTIFY == 0
        ) {

            promise.reject(
                "ALX_NOTIFY_UNSUPPORTED",
                "RX2 characteristic does not support notifications"
            )

            return
        }

        if (descriptorOperationInProgress) {

            promise.reject(
                "ALX_GATT_BUSY",
                "A GATT descriptor operation is already in progress"
            )

            return
        }

        if (pendingRx2NotificationPromise != null) {

            promise.reject(
                "ALX_GATT_BUSY",
                "RX2 notification operation is already in progress"
            )

            return
        }

        pendingRx2NotificationPromise =
            promise

        descriptorOperationInProgress =
            true

        val started =
            configureNotification(
                gatt = gatt,
                characteristic = rx2,
                enable = true
            )

        if (!started) {

            descriptorOperationInProgress =
                false

            pendingRx2NotificationPromise =
                null

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

        val source =
            characteristicSource(
                characteristic
            )

        if (gatt !== activeGatt) {

            Log.e(
                TAG,
                "Cannot configure $source: inactive GATT"
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
                "CCCD not found: $source ${characteristic.uuid}"
            )

            return false
        }

        // ---------------------------------------------------------------------
        // Local notification registration.
        // ---------------------------------------------------------------------

        val localResult =
            try {

                gatt.setCharacteristicNotification(
                    characteristic,
                    enable
                )

            } catch (e: Exception) {

                Log.e(
                    TAG,
                    "setCharacteristicNotification failed: $source",
                    e
                )

                false
            }

        if (!localResult) {

            Log.e(
                TAG,
                "Local notification registration failed: $source"
            )

            return false
        }

        // ---------------------------------------------------------------------
        // CCCD.
        //
        // Equivalent to the Windows tester:
        //
        // WriteClientCharacteristicConfigurationDescriptorAsync(
        //     Notify
        // )
        // ---------------------------------------------------------------------

        descriptor.value =
            if (enable) {

                BluetoothGattDescriptor
                    .ENABLE_NOTIFICATION_VALUE

            } else {

                BluetoothGattDescriptor
                    .DISABLE_NOTIFICATION_VALUE
            }

        val started =
            try {

                @Suppress("DEPRECATION")
                gatt.writeDescriptor(
                    descriptor
                )

            } catch (e: Exception) {

                Log.e(
                    TAG,
                    "CCCD write failed to start: $source",
                    e
                )

                false
            }

        if (started) {

            Log.d(
                TAG,
                "CCCD write queued: $source"

            )

        } else {

            Log.e(
                TAG,
                "CCCD write failed to start: $source"
            )
        }

        return started
    }

    // =========================================================================
    // DESCRIPTOR CALLBACK
    // =========================================================================

    private fun handleDescriptorWrite(
        gatt: BluetoothGatt,
        descriptor: BluetoothGattDescriptor,
        status: Int
    ) {

        if (gatt !== activeGatt) {

            Log.w(
                TAG,
                "Ignoring descriptor callback from inactive GATT"
            )

            return
        }

        if (descriptor.uuid != CCCD_UUID) {
            return
        }

        val characteristic =
            descriptor.characteristic

        val source =
            characteristicSource(
                characteristic
            )

        val success =
            status == BluetoothGatt.GATT_SUCCESS

        Log.d(
            TAG,
            "=================================================="
        )

        Log.d(
            TAG,
            "CCCD CALLBACK"
        )

        Log.d(
            TAG,
            "Source: $source"
        )

        Log.d(
            TAG,
            "Characteristic: ${characteristic.uuid}"
        )

        Log.d(
            TAG,
            "Descriptor: ${descriptor.uuid}"
        )

        Log.d(
            TAG,
            "Status: $status"
        )

        Log.d(
            TAG,
            "Success: $success"
        )

        Log.d(
            TAG,
            "=================================================="
        )

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

                Log.w(
                    TAG,
                    "CCCD belongs to unknown characteristic: " +
                        characteristic.uuid
                )

                descriptorOperationInProgress =
                    false
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

        descriptorOperationInProgress =
            false

        rxNotificationsEnabled =
            success

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

            pendingRxNotificationPromise =
                null

            if (success) {

                promise.resolve(true)

            } else {

                promise.reject(
                    "ALX_RX_NOTIFY_FAILED",
                    "RX CCCD write failed: $status"
                )
            }
        }

        /*
         * enableNotifications() requested RX + RX2.
         *
         * RX must finish before RX2 because GATT operations are serialized.
         */
        pendingEnableAllPromise?.let {

            if (!success) {

                val promise =
                    pendingEnableAllPromise

                pendingEnableAllPromise =
                    null

                promise?.reject(
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

        descriptorOperationInProgress =
            false

        rx2NotificationsEnabled =
            success

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

            pendingRx2NotificationPromise =
                null

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

            pendingEnableAllPromise =
                null

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

        val promise =
            pendingEnableAllPromise

        val rx2 =
            rx2Characteristic

        if (
            rx2 == null ||
            rx2NotificationsEnabled
        ) {

            pendingEnableAllPromise =
                null

            promise?.resolve(true)

            return
        }

        if (descriptorOperationInProgress) {

            pendingEnableAllPromise =
                null

            promise?.reject(
                "ALX_GATT_BUSY",
                "Another GATT descriptor operation is active"
            )

            return
        }

        descriptorOperationInProgress =
            true

        val started =
            configureNotification(
                gatt = gatt,
                characteristic = rx2,
                enable = true
            )

        if (!started) {

            descriptorOperationInProgress =
                false

            pendingEnableAllPromise =
                null

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

        val uuid =
            characteristic.uuid.toString()

        val source =
            characteristicSource(
                characteristic
            )

        Log.d(
            TAG,
            "=================================================="
        )

        Log.d(
            TAG,
            "BLE NOTIFICATION RECEIVED"
        )

        Log.d(
            TAG,
            "Source: $source"
        )

        Log.d(
            TAG,
            "UUID: $uuid"
        )

        Log.d(
            TAG,
            "Length: ${value.size}"
        )

        Log.d(
            TAG,
            "HEX: ${bytesToHex(value)}"
        )

        Log.d(
            TAG,
            "=================================================="
        )

        // ---------------------------------------------------------------------
        // Raw transport event.
        // ---------------------------------------------------------------------

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

        // ---------------------------------------------------------------------
        // IMPORTANT:
        //
        // Forward the exact bytes to the ALX protocol layer.
        //
        // This is the missing bridge in the previous version.
        //
        // BLE:
        //
        // Device
        //   ↓
        // BluetoothGatt
        //   ↓
        // Transport
        //   ↓
        // Protocol
        //   ↓
        // AlxBleFrameReceived
        // ---------------------------------------------------------------------

        if (
            source == "RX" ||
            source == "RX2"
        ) {

            AlxBleProtocolModule.onBleDataReceived(
                source,
                value
            )

        } else {

            Log.w(
                TAG,
                "Notification received from unknown characteristic; " +
                    "protocol parser not called"
            )
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

            Log.w(
                TAG,
                "Ignoring characteristic read from inactive GATT"
            )

            return
        }

        val uuid =
            characteristic.uuid.toString()

        val source =
            characteristicSource(
                characteristic
            )

        val success =
            status == BluetoothGatt.GATT_SUCCESS

        val hex =
            bytesToHex(value)

        Log.d(
            TAG,
            "Read result: source=$source " +
                "status=$status " +
                "length=${value.size}"
        )

        if (!success) {

            Log.e(
                TAG,
                "Characteristic read failed: " +
                    "source=$source status=$status"
            )
        }

        val promise =
            pendingReadPromise

        clearPendingRead()

        if (promise == null) {

            Log.w(
                TAG,
                "Read callback received without pending promise"
            )

            return
        }

        if (!success) {

            promise.reject(
                "ALX_${source}_READ_FAILED",
                "Characteristic read failed: $status"
            )

            return
        }

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
                    uuid
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
    // SEND HEX
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
    // TX
    // =========================================================================

    @SuppressLint("MissingPermission")
    private fun sendBytesInternal(
        data: ByteArray
    ): Boolean {

        val gatt =
            activeGatt

        if (gatt == null) {

            Log.e(
                TAG,
                "Cannot send: GATT not connected"
            )

            return false
        }

        val tx =
            txCharacteristic

        if (tx == null) {

            Log.e(
                TAG,
                "Cannot send: TX not configured"
            )

            return false
        }

        if (data.isEmpty()) {

            Log.e(
                TAG,
                "Cannot send empty data"
            )

            return false
        }

        val properties =
            tx.properties

        val supportsWrite =
            properties and
                BluetoothGattCharacteristic
                    .PROPERTY_WRITE != 0

        val supportsWriteWithoutResponse =
            properties and
                BluetoothGattCharacteristic
                    .PROPERTY_WRITE_NO_RESPONSE != 0

        if (
            !supportsWrite &&
            !supportsWriteWithoutResponse
        ) {

            Log.e(
                TAG,
                "TX does not support WRITE or WRITE_NO_RESPONSE"
            )

            return false
        }

        /*
         * Match the Windows tester:
         *
         * GattWriteOption.WriteWithResponse is preferred.
         *
         * Only fall back to WriteWithoutResponse when normal WRITE
         * is unavailable.
         */
        val writeType =
            if (supportsWrite) {

                BluetoothGattCharacteristic
                    .WRITE_TYPE_DEFAULT

            } else {

                BluetoothGattCharacteristic
                    .WRITE_TYPE_NO_RESPONSE
            }

        tx.writeType =
            writeType

        tx.value =
            data

        Log.d(
            TAG,
            "=================================================="
        )

        Log.d(
            TAG,
            "BLE TX"
        )

        Log.d(
            TAG,
            "Characteristic: ${tx.uuid}"
        )

        Log.d(
            TAG,
            "Write type: ${
                if (
                    writeType ==
                    BluetoothGattCharacteristic
                        .WRITE_TYPE_DEFAULT
                ) {
                    "WRITE_WITH_RESPONSE"
                } else {
                    "WRITE_WITHOUT_RESPONSE"
                }
            }"
        )

        Log.d(
            TAG,
            "Length: ${data.size}"
        )

        Log.d(
            TAG,
            "HEX: ${bytesToHex(data)}"
        )

        Log.d(
            TAG,
            "=================================================="
        )

        val started =
            try {

                gatt.writeCharacteristic(
                    tx
                )

            } catch (e: Exception) {

                Log.e(
                    TAG,
                    "Characteristic write failed to start",
                    e
                )

                false
            }

        if (!started) {

            Log.e(
                TAG,
                "Characteristic write failed to start"
            )
        }

        return started
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

        val uuid =
            characteristic.uuid

        return when {

            characteristic == rxCharacteristic ->
                "RX"

            characteristic == rx2Characteristic ->
                "RX2"

            uuid == RX_UUID ->
                "RX"

            uuid == RX2_UUID ->
                "RX2"

            else ->
                "UNKNOWN"
        }
    }

    // =========================================================================
    // PROPERTY LOGGING
    // =========================================================================

    private fun propertiesToString(
        properties: Int
    ): String {

        val result =
            mutableListOf<String>()

        if (
            properties and
                BluetoothGattCharacteristic
                    .PROPERTY_READ != 0
        ) {
            result.add("READ")
        }

        if (
            properties and
                BluetoothGattCharacteristic
                    .PROPERTY_WRITE != 0
        ) {
            result.add("WRITE")
        }

        if (
            properties and
                BluetoothGattCharacteristic
                    .PROPERTY_WRITE_NO_RESPONSE != 0
        ) {
            result.add("WRITE_NO_RESPONSE")
        }

        if (
            properties and
                BluetoothGattCharacteristic
                    .PROPERTY_NOTIFY != 0
        ) {
            result.add("NOTIFY")
        }

        if (
            properties and
                BluetoothGattCharacteristic
                    .PROPERTY_INDICATE != 0
        ) {
            result.add("INDICATE")
        }

        if (
            properties and
                BluetoothGattCharacteristic
                    .PROPERTY_SIGNED_WRITE != 0
        ) {
            result.add("SIGNED_WRITE")
        }

        if (
            properties and
                BluetoothGattCharacteristic
                    .PROPERTY_EXTENDED_PROPS != 0
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
            "$MODULE_NAME invalidating"
        )

        clearPendingOperations()

        clearGatt()

        instance = null

        super.invalidate()
    }
}