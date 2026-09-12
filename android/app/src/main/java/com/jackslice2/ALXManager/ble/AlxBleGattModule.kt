package com.allexo.alxmobile.ble

import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothGattService
import android.os.Build
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

        private const val EVENT_GATT_READY = "AlxBleGattReady"

        // ---------------------------------------------------------------------
        // ALX GATT UUIDs
        // ---------------------------------------------------------------------

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

        private val NOTIFY_VALUE =
            BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE

        private var instance: AlxBleGattModule? = null

        private var activeGatt: BluetoothGatt? = null

        private var alxService: BluetoothGattService? = null

        private var txCharacteristic: BluetoothGattCharacteristic? = null
        private var rxCharacteristic: BluetoothGattCharacteristic? = null
        private var rx2Characteristic: BluetoothGattCharacteristic? = null

        private var rxNotificationsEnabled = false
        private var rx2NotificationsEnabled = false

        // ---------------------------------------------------------------------
        // Static access used by BluetoothConnectionModule
        // ---------------------------------------------------------------------

        fun setGatt(gatt: BluetoothGatt) {

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

            AlxBleTransportModule.clearGatt()

            Log.d(
                TAG,
                "GATT state cleared"
            )
        }

        fun onServicesDiscovered(
            gatt: BluetoothGatt
        ) {

            activeGatt = gatt

            instance?.handleServicesDiscovered(gatt)
                ?: Log.e(
                    TAG,
                    "AlxBleGattModule instance is null"
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

        fun isRxNotificationsEnabled(): Boolean {
            return rxNotificationsEnabled
        }

        fun isRx2NotificationsEnabled(): Boolean {
            return rx2NotificationsEnabled
        }
    }

    override fun getName(): String {
        return "AlxBleGatt"
    }

    // -------------------------------------------------------------------------
    // EVENTS
    // -------------------------------------------------------------------------

    private fun emitEvent(
        eventName: String,
        params: WritableMap
    ) {

        try {

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

    private fun emitGattReady() {

        val tx = txCharacteristic
        val rx = rxCharacteristic
        val rx2 = rx2Characteristic

        val event = Arguments.createMap().apply {

            putString(
                "service",
                alxService?.uuid?.toString()
            )

            putString(
                "tx",
                tx?.uuid?.toString()
            )

            putString(
                "rx",
                rx?.uuid?.toString()
            )

            if (rx2 != null) {
                putString(
                    "rx2",
                    rx2.uuid.toString()
                )
            } else {
                putNull("rx2")
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

    // -------------------------------------------------------------------------
    // SERVICE DISCOVERY
    // -------------------------------------------------------------------------

    private fun handleServicesDiscovered(
        gatt: BluetoothGatt
    ) {

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
        // Log every service and characteristic
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
        // Find ALX service
        // ---------------------------------------------------------------------

        val targetService =
            gatt.services.firstOrNull {
                it.uuid.toString().equals(
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

    // -------------------------------------------------------------------------
    // CHARACTERISTIC DISCOVERY
    // -------------------------------------------------------------------------

    private fun discoverCharacteristics(
        gatt: BluetoothGatt,
        service: BluetoothGattService
    ) {

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
                    propertiesToString(properties)
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
        // Required TX
        // ---------------------------------------------------------------------

        if (txCharacteristic == null) {

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
        // Required RX
        // ---------------------------------------------------------------------

        if (rxCharacteristic == null) {

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
            txCharacteristic == null ||
            rxCharacteristic == null
        ) {

            Log.e(
                TAG,
                "ALX GATT discovery FAILED"
            )

            return
        }

        // ---------------------------------------------------------------------
        // Validate TX properties
        //
        // The C# tester defaults to WriteWithResponse and only uses
        // WriteWithoutResponse when appropriate.
        // ---------------------------------------------------------------------

        val txProperties =
            txCharacteristic!!.properties

        val canWrite =
            txProperties and
                BluetoothGattCharacteristic.PROPERTY_WRITE != 0

        val canWriteWithoutResponse =
            txProperties and
                BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE != 0

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

        // ---------------------------------------------------------------------
        // Validate RX notification support
        // ---------------------------------------------------------------------

        val rxProperties =
            rxCharacteristic!!.properties

        val canNotify =
            rxProperties and
                BluetoothGattCharacteristic.PROPERTY_NOTIFY != 0

        val canIndicate =
            rxProperties and
                BluetoothGattCharacteristic.PROPERTY_INDICATE != 0

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

        if (!canNotify && !canIndicate) {

            Log.e(
                TAG,
                "RX has neither NOTIFY nor INDICATE"
            )

            return
        }

        // ---------------------------------------------------------------------
        // Optional RX2
        // ---------------------------------------------------------------------

        if (rx2Characteristic != null) {

            Log.d(
                TAG,
                "Optional RX2 characteristic found:"
            )

            Log.d(
                TAG,
                "  ${rx2Characteristic!!.uuid}"
            )

        } else {

            Log.d(
                TAG,
                "Optional RX2 characteristic not present"
            )
        }

        // ---------------------------------------------------------------------
        // Give resolved GATT state to transport BEFORE enabling notifications.
        //
        // This is important because notification callbacks can arrive
        // immediately after the CCCD write succeeds.
        // ---------------------------------------------------------------------

        AlxBleTransportModule.setGatt(
            gatt,
            txCharacteristic,
            rxCharacteristic,
            rx2Characteristic
        )

        Log.d(
            TAG,
            "GATT characteristics assigned to transport"
        )

        // ---------------------------------------------------------------------
        // Enable RX notifications.
        //
        // This corresponds to the C# tester:
        //
        // WriteClientCharacteristicConfigurationDescriptorAsync(
        //     GattClientCharacteristicConfigurationDescriptorValue.Notify
        // )
        // ---------------------------------------------------------------------

        enableRxNotifications(
            gatt
        )
    }

    // -------------------------------------------------------------------------
    // ENABLE RX NOTIFICATIONS
    // -------------------------------------------------------------------------

    private fun enableRxNotifications(
        gatt: BluetoothGatt
    ) {

        val rx = rxCharacteristic

        if (rx == null) {

            Log.e(
                TAG,
                "Cannot enable RX notifications: RX is null"
            )

            return
        }

        Log.d(
            TAG,
            "Enabling RX notifications..."
        )

        Log.d(
            TAG,
            "RX: ${rx.uuid}"
        )

        // ---------------------------------------------------------------------
        // First enable local notification delivery.
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

            logDescriptors(rx)

            return
        }

        Log.d(
            TAG,
            "RX CCCD found: ${cccd.uuid}"
        )

        // ---------------------------------------------------------------------
        // Write ENABLE_NOTIFICATION_VALUE.
        // ---------------------------------------------------------------------

        cccd.value =
            BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE

        @Suppress("DEPRECATION")
        val writeStarted = gatt.writeDescriptor(cccd)

        Log.d(
            TAG,
            "RX CCCD write started: $writeStarted"
        )

        if (!writeStarted) {

            Log.e(
                TAG,
                "Failed to start RX CCCD write"
            )

            return
        }

        Log.d(
            TAG,
            "Waiting for RX CCCD write callback..."
        )
    }

    // -------------------------------------------------------------------------
    // DESCRIPTOR WRITE RESULT
    //
    // BluetoothConnectionModule forwards descriptor callbacks here through
    // AlxBleTransportModule. This method can also be called directly by
    // transport if desired.
    // -------------------------------------------------------------------------

    fun onDescriptorWrite(
        gatt: BluetoothGatt,
        descriptor: BluetoothGattDescriptor,
        status: Int
    ) {

        if (
            !descriptor.uuid.toString().equals(
                CCCD_UUID,
                ignoreCase = true
            )
        ) {
            return
        }

        if (
            !descriptor.characteristic.uuid.toString().equals(
                RX_UUID,
                ignoreCase = true
            )
        ) {
            return
        }

        if (
            status != BluetoothGatt.GATT_SUCCESS
        ) {

            Log.e(
                TAG,
                "RX CCCD write FAILED: status=$status"
            )

            return
        }

        rxNotificationsEnabled = true

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
            "=================================================="
        )

        emitGattReady()
    }

    // -------------------------------------------------------------------------
    // DESCRIPTORS
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // PROPERTY LOGGING
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // JS STATE
    // -------------------------------------------------------------------------

    @ReactMethod
    fun getGattState(
        promise: Promise
    ) {

        val gatt = activeGatt

        val result =
            Arguments.createMap().apply {

                putBoolean(
                    "connected",
                    gatt != null
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
                    alxService?.uuid?.toString()
                )

                putString(
                    "tx",
                    txCharacteristic?.uuid?.toString()
                )

                putString(
                    "rx",
                    rxCharacteristic?.uuid?.toString()
                )

                if (rx2Characteristic != null) {

                    putString(
                        "rx2",
                        rx2Characteristic?.uuid?.toString()
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

    // -------------------------------------------------------------------------
    // RN EVENT LISTENERS
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------

    override fun invalidate() {

        Log.d(
            TAG,
            "AlxBleGattModule invalidating"
        )

        clearGatt()

        instance = null

        super.invalidate()
    }

    init {

        instance = this

        Log.d(
            TAG,
            "AlxBleGattModule initialized"
        )
    }
}