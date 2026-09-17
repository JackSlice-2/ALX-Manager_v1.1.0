package com.allexo.alxmobile.ble

import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothGattService
import android.util.Log

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class AlxBleGattModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {

        private const val TAG = "AlxBleGatt"

        private const val EVENT_GATT_READY =
            "AlxBleGattReady"

        // =====================================================================
        // ALX GATT UUIDs
        // =====================================================================

        const val SERVICE_UUID =
            "12345678-1234-5678-1234-56789abcdef7"

        const val TX_UUID =
            "12345678-1234-5678-1234-56789abcdef8"

        const val RX_UUID =
            "12345678-1234-5678-1234-56789abcdef9"

        const val RX2_UUID =
            "12345678-1234-5678-1234-56789abcdefa"

        const val CCCD_UUID =
            "00002902-0000-1000-8000-00805f9b34fb"

        private var instance: AlxBleGattModule? = null

        private var activeGatt: BluetoothGatt? = null

        private var alxService: BluetoothGattService? = null

        private var txCharacteristic:
            BluetoothGattCharacteristic? = null

        private var rxCharacteristic:
            BluetoothGattCharacteristic? = null

        private var rx2Characteristic:
            BluetoothGattCharacteristic? = null

        private var rxNotificationsEnabled = false

        private var rx2NotificationsEnabled = false

        // ---------------------------------------------------------------------
        // Static access
        // ---------------------------------------------------------------------

        fun setGatt(
            gatt: BluetoothGatt
        ) {

            activeGatt = gatt

            Log.d(
                TAG,
                "GATT assigned: ${gatt.device.address}"
            )
        }

        fun clearGatt() {

            activeGatt = null

            alxService = null

            txCharacteristic = null
            rxCharacteristic = null
            rx2Characteristic = null

            rxNotificationsEnabled = false
            rx2NotificationsEnabled = false

            Log.d(
                TAG,
                "GATT state cleared"
            )
        }

        fun onServicesDiscovered(
            gatt: BluetoothGatt
        ) {

            if (
                activeGatt != null &&
                activeGatt !== gatt
            ) {

                Log.w(
                    TAG,
                    "Ignoring services callback from stale GATT: " +
                        gatt.device.address
                )

                return
            }

            activeGatt = gatt

            val module = instance

            if (module == null) {

                Log.e(
                    TAG,
                    "AlxBleGattModule instance is null"
                )

                return
            }

            module.handleServicesDiscovered(
                gatt
            )
        }

        // ---------------------------------------------------------------------
        // Descriptor callback bridge
        //
        // BluetoothConnectionModule owns BluetoothGattCallback.
        // ---------------------------------------------------------------------

        fun onDescriptorWrite(
            gatt: BluetoothGatt,
            descriptor: BluetoothGattDescriptor,
            status: Int
        ) {

            if (
                activeGatt != null &&
                activeGatt !== gatt
            ) {

                Log.w(
                    TAG,
                    "Ignoring descriptor callback from stale GATT"
                )

                return
            }

            val module = instance

            if (module == null) {

                Log.e(
                    TAG,
                    "AlxBleGattModule instance is null"
                )

                return
            }

            module.handleDescriptorWrite(
                gatt,
                descriptor,
                status
            )
        }

        fun getTxCharacteristic():
            BluetoothGattCharacteristic? {

            return txCharacteristic
        }

        fun getRxCharacteristic():
            BluetoothGattCharacteristic? {

            return rxCharacteristic
        }

        fun getRx2Characteristic():
            BluetoothGattCharacteristic? {

            return rx2Characteristic
        }

        fun getGatt():
            BluetoothGatt? {

            return activeGatt
        }

        fun isRxNotificationsEnabled():
            Boolean {

            return rxNotificationsEnabled
        }

        fun isRx2NotificationsEnabled():
            Boolean {

            return rx2NotificationsEnabled
        }
    }

    // =========================================================================
    // MODULE
    // =========================================================================

    override fun getName(): String {

        return "AlxBleGatt"
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

                Log.d(
                    TAG,
                    "Cannot emit $eventName: Catalyst inactive"
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
                "Failed to emit $eventName",
                e
            )
        }
    }

    // =========================================================================
    // GATT READY EVENT
    // =========================================================================

    private fun emitGattReady() {

        val tx = txCharacteristic
        val rx = rxCharacteristic
        val rx2 = rx2Characteristic

        val event =
            Arguments
                .createMap()
                .apply {

                    putString(
                        "service",
                        alxService
                            ?.uuid
                            ?.toString()
                    )

                    putString(
                        "tx",
                        tx
                            ?.uuid
                            ?.toString()
                    )

                    putString(
                        "rx",
                        rx
                            ?.uuid
                            ?.toString()
                    )

                    if (rx2 != null) {

                        putString(
                            "rx2",
                            rx2.uuid.toString()
                        )

                    } else {

                        putNull(
                            "rx2"
                        )
                    }

                    putBoolean(
                        "rx2Available",
                        rx2 != null
                    )

                    putBoolean(
                        "rxNotificationsEnabled",
                        rxNotificationsEnabled
                    )

                    putBoolean(
                        "rx2NotificationsEnabled",
                        rx2NotificationsEnabled
                    )
                }

        emitEvent(
            EVENT_GATT_READY,
            event
        )
    }

    // =========================================================================
    // SERVICE DISCOVERY
    // =========================================================================

    private fun handleServicesDiscovered(
        gatt: BluetoothGatt
    ) {

        if (
            activeGatt != null &&
            activeGatt !== gatt
        ) {

            Log.w(
                TAG,
                "Ignoring services from stale GATT"
            )

            return
        }

        activeGatt = gatt

        Log.d(
            TAG,
            "=================================================="
        )

        Log.d(
            TAG,
            "Processing discovered GATT services"
        )

        Log.d(
            TAG,
            "Device: ${gatt.device.address}"
        )

        Log.d(
            TAG,
            "Services found: ${gatt.services.size}"
        )

        if (gatt.services.isEmpty()) {

            Log.e(
                TAG,
                "No GATT services found"
            )

            return
        }

        // ---------------------------------------------------------------------
        // Log every service and characteristic.
        // ---------------------------------------------------------------------

        for (service in gatt.services) {

            Log.d(
                TAG,
                "SERVICE: ${service.uuid}"
            )

            Log.d(
                TAG,
                "  characteristics: ${service.characteristics.size}"
            )

            for (characteristic in service.characteristics) {

                Log.d(
                    TAG,
                    "  CHARACTERISTIC: ${characteristic.uuid}"
                )

                Log.d(
                    TAG,
                    "    Properties: ${
                        propertiesToString(
                            characteristic.properties
                        )
                    }"
                )

                logDescriptors(
                    characteristic
                )
            }
        }

        // ---------------------------------------------------------------------
        // Find ALX service.
        // ---------------------------------------------------------------------

        val targetService =
            gatt.services.firstOrNull {

                it.uuid
                    .toString()
                    .equals(
                        SERVICE_UUID,
                        ignoreCase = true
                    )
            }

        if (targetService == null) {

            Log.e(
                TAG,
                "=================================================="
            )

            Log.e(
                TAG,
                "ALX SERVICE NOT FOUND"
            )

            Log.e(
                TAG,
                "Expected: $SERVICE_UUID"
            )

            Log.e(
                TAG,
                "Available services:"
            )

            gatt.services.forEach {

                Log.e(
                    TAG,
                    "  ${it.uuid}"
                )
            }

            return
        }

        alxService = targetService

        Log.d(
            TAG,
            "ALX service found: ${targetService.uuid}"
        )

        discoverCharacteristics(
            gatt,
            targetService
        )
    }

    // =========================================================================
    // CHARACTERISTIC DISCOVERY
    // =========================================================================

    private fun discoverCharacteristics(
        gatt: BluetoothGatt,
        service: BluetoothGattService
    ) {

        if (
            activeGatt != null &&
            activeGatt !== gatt
        ) {

            Log.w(
                TAG,
                "Ignoring characteristic discovery from stale GATT"
            )

            return
        }

        Log.d(
            TAG,
            "Discovering ALX characteristics..."
        )

        txCharacteristic = null
        rxCharacteristic = null
        rx2Characteristic = null

        rxNotificationsEnabled = false
        rx2NotificationsEnabled = false

        for (characteristic in service.characteristics) {

            val uuid =
                characteristic.uuid.toString()

            val properties =
                characteristic.properties

            Log.d(
                TAG,
                "CHARACTERISTIC: $uuid"
            )

            Log.d(
                TAG,
                "  Properties: ${
                    propertiesToString(
                        properties
                    )
                }"
            )

            when {

                uuid.equals(
                    TX_UUID,
                    ignoreCase = true
                ) -> {

                    txCharacteristic =
                        characteristic

                    Log.d(
                        TAG,
                        "  -> TX characteristic"
                    )
                }

                uuid.equals(
                    RX_UUID,
                    ignoreCase = true
                ) -> {

                    rxCharacteristic =
                        characteristic

                    Log.d(
                        TAG,
                        "  -> RX characteristic"
                    )
                }

                uuid.equals(
                    RX2_UUID,
                    ignoreCase = true
                ) -> {

                    rx2Characteristic =
                        characteristic

                    Log.d(
                        TAG,
                        "  -> optional RX2 characteristic"
                    )
                }
            }
        }

        // ---------------------------------------------------------------------
        // Required TX.
        // ---------------------------------------------------------------------

        val tx =
            txCharacteristic

        if (tx == null) {

            Log.e(
                TAG,
                "Required TX characteristic not found:"
            )

            Log.e(
                TAG,
                "  $TX_UUID"
            )
        }

        // ---------------------------------------------------------------------
        // Required RX.
        // ---------------------------------------------------------------------

        val rx =
            rxCharacteristic

        if (rx == null) {

            Log.e(
                TAG,
                "Required RX characteristic not found:"
            )

            Log.e(
                TAG,
                "  $RX_UUID"
            )
        }

        if (
            tx == null ||
            rx == null
        ) {

            Log.e(
                TAG,
                "ALX GATT discovery FAILED"
            )

            return
        }

        // ---------------------------------------------------------------------
        // TX properties.
        // ---------------------------------------------------------------------

        val txProperties =
            tx.properties

        val canWrite =
            txProperties and
                BluetoothGattCharacteristic
                    .PROPERTY_WRITE != 0

        val canWriteWithoutResponse =
            txProperties and
                BluetoothGattCharacteristic
                    .PROPERTY_WRITE_NO_RESPONSE != 0

        Log.d(
            TAG,
            "TX write support:"
        )

        Log.d(
            TAG,
            "  WRITE: $canWrite"
        )

        Log.d(
            TAG,
            "  WRITE_NO_RESPONSE: $canWriteWithoutResponse"
        )

        if (
            !canWrite &&
            !canWriteWithoutResponse
        ) {

            Log.e(
                TAG,
                "TX has no supported write property"
            )

            return
        }

        // ---------------------------------------------------------------------
        // RX properties.
        // ---------------------------------------------------------------------

        val rxProperties =
            rx.properties

        val canNotify =
            rxProperties and
                BluetoothGattCharacteristic
                    .PROPERTY_NOTIFY != 0

        val canIndicate =
            rxProperties and
                BluetoothGattCharacteristic
                    .PROPERTY_INDICATE != 0

        Log.d(
            TAG,
            "RX notification support:"
        )

        Log.d(
            TAG,
            "  NOTIFY: $canNotify"
        )

        Log.d(
            TAG,
            "  INDICATE: $canIndicate"
        )

        if (
            !canNotify &&
            !canIndicate
        ) {

            Log.e(
                TAG,
                "RX has neither NOTIFY nor INDICATE"
            )

            return
        }

        // ---------------------------------------------------------------------
        // Optional RX2.
        //
        // C# only enables RX, so RX2 remains disabled.
        // ---------------------------------------------------------------------

        val rx2 =
            rx2Characteristic

        if (rx2 != null) {

            Log.d(
                TAG,
                "Optional RX2 characteristic found:"
            )

            Log.d(
                TAG,
                "  ${rx2.uuid}"
            )

            Log.d(
                TAG,
                "  Properties: ${
                    propertiesToString(
                        rx2.properties
                    )
                }"

            )

        } else {

            Log.d(
                TAG,
                "Optional RX2 characteristic not present"
            )
        }

        // ---------------------------------------------------------------------
        // Configure transport BEFORE CCCD.
        //
        // A notification can arrive immediately after CCCD succeeds.
        // ---------------------------------------------------------------------

        AlxBleTransportModule.setGatt(
            gatt,
            tx,
            rx,
            rx2
        )

        Log.d(
            TAG,
            "GATT characteristics assigned to transport"
        )

        // ---------------------------------------------------------------------
        // Enable RX notifications.
        //
        // C# tester enables RX only.
        // RX2 is optional and is NOT automatically enabled.
        // ---------------------------------------------------------------------

        enableRxNotifications(
            gatt
        )
    }

    // =========================================================================
    // ENABLE RX NOTIFICATIONS
    // =========================================================================

    private fun enableRxNotifications(
        gatt: BluetoothGatt
    ) {

        val rx =
            rxCharacteristic

        if (rx == null) {

            Log.e(
                TAG,
                "Cannot enable RX notifications: RX is null"
            )

            return
        }

        if (activeGatt !== gatt) {

            Log.e(
                TAG,
                "Cannot enable RX notifications: stale GATT"
            )

            return
        }

        val canNotify =
            rx.properties and
                BluetoothGattCharacteristic
                    .PROPERTY_NOTIFY != 0

        val canIndicate =
            rx.properties and
                BluetoothGattCharacteristic
                    .PROPERTY_INDICATE != 0

        Log.d(
            TAG,
            "=================================================="
        )

        Log.d(
            TAG,
            "Enabling RX notifications"
        )

        Log.d(
            TAG,
            "RX: ${rx.uuid}"
        )

        Log.d(
            TAG,
            "RX NOTIFY=$canNotify"
        )

        Log.d(
            TAG,
            "RX INDICATE=$canIndicate"
        )

        // ---------------------------------------------------------------------
        // Local Android notification delivery.
        // ---------------------------------------------------------------------

        val localResult =
            gatt.setCharacteristicNotification(
                rx,
                true
            )

        Log.d(
            TAG,
            "setCharacteristicNotification(RX, true): $localResult"
        )

        if (!localResult) {

            Log.e(
                TAG,
                "Failed to enable local RX notifications"
            )

            return
        }

        // ---------------------------------------------------------------------
        // Find CCCD.
        // ---------------------------------------------------------------------

        val cccd =
            rx.getDescriptor(
                java.util.UUID.fromString(
                    CCCD_UUID
                )
            )

        if (cccd == null) {

            Log.e(
                TAG,
                "RX CCCD not found: $CCCD_UUID"
            )

            Log.e(
                TAG,
                "RX descriptors:"
            )

            logDescriptors(
                rx
            )

            return
        }

        Log.d(
            TAG,
            "RX CCCD found: ${cccd.uuid}"
        )

        // ---------------------------------------------------------------------
        // Choose the correct CCCD value.
        //
        // Prefer NOTIFY because this is what the C# implementation uses.
        // Fall back to INDICATE only if NOTIFY is unavailable.
        // ---------------------------------------------------------------------

        val cccdValue =
            when {

                canNotify ->
                    BluetoothGattDescriptor
                        .ENABLE_NOTIFICATION_VALUE

                canIndicate ->
                    BluetoothGattDescriptor
                        .ENABLE_INDICATION_VALUE

                else ->
                    null
            }

        if (cccdValue == null) {

            Log.e(
                TAG,
                "RX cannot use notification or indication"
            )

            return
        }

        cccd.value =
            cccdValue

        Log.d(
            TAG,
            "CCCD mode: ${
                if (canNotify) {
                    "NOTIFY"
                } else {
                    "INDICATE"
                }
            }"
        )

        @Suppress("DEPRECATION")
        val writeStarted =
            gatt.writeDescriptor(
                cccd
            )

        Log.d(
            TAG,
            "RX CCCD write started: $writeStarted"
        )

        if (!writeStarted) {

            Log.e(
                TAG,
                "Failed to start RX CCCD write"
            )

            Log.e(
                TAG,
                "Possible causes:"
            )

            Log.e(
                TAG,
                "  - GATT operation already in progress"
            )

            Log.e(
                TAG,
                "  - peripheral rejected the operation"
            )

            Log.e(
                TAG,
                "  - link security/encryption requirement"
            )

            return
        }

        Log.d(
            TAG,
            "RX CCCD write started successfully"
        )

        Log.d(
            TAG,
            "Waiting for onDescriptorWrite callback..."
        )
    }

    // =========================================================================
    // DESCRIPTOR WRITE RESULT
    // =========================================================================

    private fun handleDescriptorWrite(
        gatt: BluetoothGatt,
        descriptor: BluetoothGattDescriptor,
        status: Int
    ) {

        // ---------------------------------------------------------------------
        // Make sure this callback belongs to our active GATT.
        // ---------------------------------------------------------------------

        if (activeGatt !== gatt) {

            Log.w(
                TAG,
                "Ignoring descriptor callback from stale GATT"
            )

            return
        }

        // ---------------------------------------------------------------------
        // Only care about CCCD.
        // ---------------------------------------------------------------------

        if (
            !descriptor.uuid
                .toString()
                .equals(
                    CCCD_UUID,
                    ignoreCase = true
                )
        ) {

            Log.d(
                TAG,
                "Ignoring non-CCCD descriptor: ${descriptor.uuid}"
            )

            return
        }

        // ---------------------------------------------------------------------
        // Only care about RX CCCD.
        // ---------------------------------------------------------------------

        if (
            !descriptor.characteristic.uuid
                .toString()
                .equals(
                    RX_UUID,
                    ignoreCase = true
                )
        ) {

            Log.d(
                TAG,
                "Ignoring CCCD for characteristic: " +
                    descriptor.characteristic.uuid
            )

            return
        }

        // ---------------------------------------------------------------------
        // CCCD write failed.
        // ---------------------------------------------------------------------

        if (
            status != BluetoothGatt.GATT_SUCCESS
        ) {

            Log.e(
                TAG,
                "=================================================="
            )

            Log.e(
                TAG,
                "RX CCCD WRITE FAILED"
            )

            Log.e(
                TAG,
                "status=$status"
            )

            Log.e(
                TAG,
                "statusName=${gattStatusToString(status)}"
            )

            Log.e(
                TAG,
                "RX notifications remain disabled"
            )

            Log.e(
                TAG,
                "=================================================="
            )

            return
        }

        // ---------------------------------------------------------------------
        // CCCD write succeeded.
        // ---------------------------------------------------------------------

        rxNotificationsEnabled =
            true

        Log.d(
            TAG,
            "=================================================="
        )

        Log.d(
            TAG,
            "RX NOTIFICATIONS ENABLED"
        )

        Log.d(
            TAG,
            "RX: ${descriptor.characteristic.uuid}"
        )

        Log.d(
            TAG,
            "CCCD: ${descriptor.uuid}"
        )

        Log.d(
            TAG,
            "CCCD status: GATT_SUCCESS"
        )

        Log.d(
            TAG,
            "=================================================="

        )

        // ---------------------------------------------------------------------
        // Notify JS/UI that GATT is fully ready.
        // ---------------------------------------------------------------------

        emitGattReady()

        // ---------------------------------------------------------------------
        // Notify BluetoothConnectionModule.
        //
        // This is important:
        //
        // BluetoothConnectionModule owns the connection Promise.
        // Physical GATT connection is NOT the same thing as a usable
        // ALX connection.
        //
        // The connection becomes fully ready only after:
        //
        //   connect
        //       ↓
        //   service discovery
        //       ↓
        //   ALX characteristics found
        //       ↓
        //   RX CCCD written successfully
        //       ↓
        //   RX notifications enabled
        //
        // BluetoothConnectionModule.onGattReady() resolves the pending
        // connection Promise at this point.
        // ---------------------------------------------------------------------

        Log.d(
            TAG,
            "Notifying BluetoothConnectionModule: GATT ready"
        )

        BluetoothConnectionModule.onGattReady()

        // ---------------------------------------------------------------------
        // Only now start the ALX protocol.
        // ---------------------------------------------------------------------

        Log.d(
            TAG,
            "GATT READY: RX notifications confirmed"
        )

        Log.d(
            TAG,
            "Starting ALX protocol"

        )

        AlxBleProtocolModule.onGattReady()
    }

    // =========================================================================
    // DESCRIPTORS
    // =========================================================================

    private fun logDescriptors(
        characteristic: BluetoothGattCharacteristic
    ) {

        val descriptors =
            characteristic.descriptors

        if (descriptors.isEmpty()) {

            Log.d(
                TAG,
                "    DESCRIPTORS: none"
            )

            return
        }

        for (descriptor in descriptors) {

            Log.d(
                TAG,
                "    DESCRIPTOR: ${descriptor.uuid}"
            )
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

            result.add(
                "READ"
            )
        }

        if (
            properties and
            BluetoothGattCharacteristic
                .PROPERTY_WRITE != 0
        ) {

            result.add(
                "WRITE"
            )
        }

        if (
            properties and
            BluetoothGattCharacteristic
                .PROPERTY_WRITE_NO_RESPONSE != 0
        ) {

            result.add(
                "WRITE_NO_RESPONSE"
            )
        }

        if (
            properties and
            BluetoothGattCharacteristic
                .PROPERTY_NOTIFY != 0
        ) {

            result.add(
                "NOTIFY"
            )
        }

        if (
            properties and
            BluetoothGattCharacteristic
                .PROPERTY_INDICATE != 0
        ) {

            result.add(
                "INDICATE"
            )
        }

        if (
            properties and
            BluetoothGattCharacteristic
                .PROPERTY_SIGNED_WRITE != 0
        ) {

            result.add(
                "SIGNED_WRITE"
            )
        }

        if (
            properties and
            BluetoothGattCharacteristic
                .PROPERTY_EXTENDED_PROPS != 0
        ) {

            result.add(
                "EXTENDED_PROPS"
            )
        }

        return if (result.isEmpty()) {
            "NONE"
        } else {
            result.joinToString("|")
        }
    }

    // =========================================================================
    // GATT STATUS LOGGING
    // =========================================================================

    private fun gattStatusToString(
        status: Int
    ): String {

        return when (status) {

            BluetoothGatt.GATT_SUCCESS ->
                "GATT_SUCCESS"

            0x01 ->
                "GATT_INVALID_HANDLE"

            0x02 ->
                "GATT_READ_NOT_PERMITTED"

            0x03 ->
                "GATT_WRITE_NOT_PERMITTED"

            0x04 ->
                "GATT_INVALID_PDU"

            0x05 ->
                "GATT_INSUFFICIENT_AUTHENTICATION"

            0x06 ->
                "GATT_REQUEST_NOT_SUPPORTED"

            0x07 ->
                "GATT_INVALID_OFFSET"

            0x08 ->
                "GATT_INSUFFICIENT_AUTHORIZATION"

            0x09 ->
                "GATT_PREPARE_Q_FULL"

            0x0A ->
                "GATT_NOT_FOUND"

            0x0B ->
                "GATT_NOT_LONG"

            0x0C ->
                "GATT_INSUFFICIENT_KEY_SIZE"

            0x0D ->
                "GATT_INVALID_ATTRIBUTE_LENGTH"

            0x0E ->
                "GATT_ERR_UNLIKELY"

            0x0F ->
                "GATT_INSUFFICIENT_ENCRYPTION"

            0x10 ->
                "GATT_UNSUPPORTED_GRP_TYPE"

            0x11 ->
                "GATT_UNKNOWN_ERROR"

            else ->
                "UNKNOWN_GATT_STATUS"
        }
    }

    // =========================================================================
    // JS STATE
    // =========================================================================

    @ReactMethod
    fun getGattState(
        promise: Promise
    ) {

        val gatt =
            activeGatt

        val gattReady =
            gatt != null &&
            alxService != null &&
            txCharacteristic != null &&
            rxCharacteristic != null &&
            rxNotificationsEnabled

        val result =
            Arguments
                .createMap()
                .apply {

                    // Physical GATT connection.
                    putBoolean(
                        "connected",
                        gatt != null
                    )

                    // Complete ALX GATT workflow.
                    putBoolean(
                        "gattReady",
                        gattReady
                    )

                    putBoolean(
                        "serviceFound",
                        alxService != null
                    )

                    putBoolean(
                        "txFound",
                        txCharacteristic != null
                    )

                    putBoolean(
                        "rxFound",
                        rxCharacteristic != null
                    )

                    putBoolean(
                        "rx2Found",
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

                    putString(
                        "service",
                        alxService
                            ?.uuid
                            ?.toString()
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

                    if (rx2Characteristic != null) {

                        putString(
                            "rx2",
                            rx2Characteristic
                                ?.uuid
                                ?.toString()
                        )

                    } else {

                        putNull(
                            "rx2"
                        )
                    }
                }

        promise.resolve(
            result
        )
    }

    // =========================================================================
    // RN EVENT LISTENERS
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
            "AlxBleGattModule invalidating"
        )

        clearGatt()

        instance = null

        super.invalidate()
    }

    // =========================================================================
    // INIT
    // =========================================================================

    init {

        instance = this

        Log.d(
            TAG,
            "AlxBleGattModule initialized"
        )
    }
}