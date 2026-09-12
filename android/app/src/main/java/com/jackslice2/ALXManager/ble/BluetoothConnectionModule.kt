package com.allexo.alxmobile.ble

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.content.Context
import android.os.Build
import android.util.Log

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class BluetoothConnectionModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {

        private const val TAG = "BluetoothConnection"

        // =====================================================================
        // EVENTS
        // =====================================================================

        private const val EVENT_CONNECTED =
            "BluetoothConnected"

        private const val EVENT_DISCONNECTED =
            "BluetoothDisconnected"

        private const val EVENT_PAIRING_REQUEST =
            "BluetoothPairingRequest"

        private const val EVENT_BOND_STATE =
            "BluetoothBondStateChanged"

        // =====================================================================
        // UUIDS
        // =====================================================================

        private const val ALX_SERVICE_UUID =
            "12345678-1234-5678-1234-56789abcdef7"

        private const val ALX_TX_UUID =
            "12345678-1234-5678-1234-56789abcdef8"

        private const val ALX_RX_UUID =
            "12345678-1234-5678-1234-56789abcdef9"

        private const val ALX_RX2_UUID =
            "12345678-1234-5678-1234-56789abcdefa"

        private const val CCCD_UUID =
            "00002902-0000-1000-8000-00805f9b34fb"

        // =====================================================================
        // ERRORS
        // =====================================================================

        private const val ERROR_BLUETOOTH_DISABLED =
            "BLUETOOTH_DISABLED"

        private const val ERROR_DEVICE_NOT_FOUND =
            "BLUETOOTH_DEVICE_NOT_FOUND"

        private const val ERROR_CONNECTION_FAILED =
            "BLUETOOTH_CONNECTION_FAILED"

        private const val ERROR_CONNECTION_IN_PROGRESS =
            "BLUETOOTH_CONNECTION_IN_PROGRESS"

        // =====================================================================
        // ACTIVE GATT
        // =====================================================================

        private var activeGatt: BluetoothGatt? = null

        private var activeDevice: BluetoothDevice? = null

        fun getGatt(): BluetoothGatt? {
            return activeGatt
        }

        fun getDevice(): BluetoothDevice? {
            return activeDevice
        }

        fun setGatt(gatt: BluetoothGatt?) {

            activeGatt = gatt
            activeDevice = gatt?.device

            Log.d(
                TAG,
                "setGatt(): ${gatt?.device?.address}"
            )
        }

        fun clearGatt() {

            Log.d(
                TAG,
                "clearGatt()"
            )

            activeGatt = null
            activeDevice = null
        }
    }

    // =========================================================================
    // CONNECTION STATE
    // =========================================================================

    private var pendingPromise: Promise? = null

    private var pendingDevice: BluetoothDevice? = null

    private var connectionInProgress = false

    private var servicesDiscovered = false

    private var rxNotificationConfigured = false

    // =========================================================================
    // DISCOVERED ALX CHARACTERISTICS
    // =========================================================================

    private var txCharacteristic: BluetoothGattCharacteristic? = null

    private var rxCharacteristic: BluetoothGattCharacteristic? = null

    private var rx2Characteristic: BluetoothGattCharacteristic? = null

    // =========================================================================
    // RN MODULE
    // =========================================================================

    override fun getName(): String {
        return "BluetoothConnection"
    }

    // =========================================================================
    // EVENTS
    // =========================================================================

    private fun emitEvent(
        eventName: String,
        params: WritableMap? = null
    ) {

        try {

            if (!reactContext.hasActiveCatalystInstance()) {

                Log.w(
                    TAG,
                    "React context inactive; dropping event=$eventName"
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

    private fun emitSimpleEvent(
        eventName: String
    ) {

        emitEvent(
            eventName,
            Arguments.createMap()
        )
    }

    // =========================================================================
    // BLUETOOTH ADAPTER
    // =========================================================================

    private fun getBluetoothAdapter(): BluetoothAdapter? {

        val manager =
            reactContext.getSystemService(
                Context.BLUETOOTH_SERVICE
            ) as? BluetoothManager

        return manager?.adapter
    }

    // =========================================================================
    // CONNECT
    // =========================================================================

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun connectBleDevice(
        address: String,
        password: String?,
        promise: Promise
    ) {

        if (connectionInProgress) {

            promise.reject(
                ERROR_CONNECTION_IN_PROGRESS,
                "A Bluetooth connection is already in progress"
            )

            return
        }

        val adapter =
            getBluetoothAdapter()

        if (adapter == null) {

            promise.reject(
                "BLUETOOTH_UNAVAILABLE",
                "Bluetooth adapter unavailable"
            )

            return
        }

        if (!adapter.isEnabled) {

            promise.reject(
                ERROR_BLUETOOTH_DISABLED,
                "Bluetooth is disabled"
            )

            return
        }

        val device =
            try {

                adapter.getRemoteDevice(
                    address
                )

            } catch (_: IllegalArgumentException) {

                promise.reject(
                    ERROR_DEVICE_NOT_FOUND,
                    "Invalid Bluetooth address: $address"
                )

                return
            }

        pendingPromise = promise
        pendingDevice = device

        connectionInProgress = true
        servicesDiscovered = false
        rxNotificationConfigured = false

        txCharacteristic = null
        rxCharacteristic = null
        rx2Characteristic = null

        Log.d(
            TAG,
            "================================================"
        )

        Log.d(
            TAG,
            "DIRECT BLE GATT CONNECT"
        )

        Log.d(
            TAG,
            "Name        : ${device.name}"
        )

        Log.d(
            TAG,
            "Address     : ${device.address}"
        )

        Log.d(
            TAG,
            "Bond state  : ${bondStateName(device.bondState)}"
        )

        Log.d(
            TAG,
            "Password    : ${
                if (password.isNullOrEmpty()) {
                    "<unused>"
                } else {
                    "<provided>"
                }
            }"
        )

        Log.d(
            TAG,
            "Pairing     : SKIPPED"
        )

        Log.d(
            TAG,
            "Transport   : LE"
        )

        Log.d(
            TAG,
            "Ready       : SERVICE DISCOVERY"
        )

        Log.d(
            TAG,
            "RX CCCD     : MANUAL / EXPLICIT"
        )

        Log.d(
            TAG,
            "================================================"
        )

        connectGatt(device)
    }

    // =========================================================================
    // OPEN GATT
    // =========================================================================

    @SuppressLint("MissingPermission")
    private fun connectGatt(
        device: BluetoothDevice
    ) {

        try {

            // -----------------------------------------------------------------
            // CLOSE PREVIOUS GATT
            // -----------------------------------------------------------------

            activeGatt?.let { oldGatt ->

                Log.d(
                    TAG,
                    "Closing previous GATT"
                )

                try {
                    oldGatt.disconnect()
                } catch (_: Exception) {
                }

                try {
                    oldGatt.close()
                } catch (_: Exception) {
                }
            }

            // -----------------------------------------------------------------
            // CLEAR OTHER BLE MODULES
            // -----------------------------------------------------------------

            AlxBleTransportModule.clearGatt()
            AlxBleGattModule.clearGatt()

            activeGatt = null
            activeDevice = device

            servicesDiscovered = false
            rxNotificationConfigured = false

            txCharacteristic = null
            rxCharacteristic = null
            rx2Characteristic = null

            Log.d(
                TAG,
                "================================================"
            )

            Log.d(
                TAG,
                "OPENING GATT"
            )

            Log.d(
                TAG,
                "Device    : ${device.address}"
            )

            Log.d(
                TAG,
                "Transport : LE"
            )

            Log.d(
                TAG,
                "Pairing   : NOT REQUIRED"
            )

            Log.d(
                TAG,
                "CCCD      : NOT CONFIGURED AUTOMATICALLY"
            )

            Log.d(
                TAG,
                "================================================"
            )

            val gatt =
                if (
                    Build.VERSION.SDK_INT >=
                    Build.VERSION_CODES.M
                ) {

                    device.connectGatt(
                        reactContext,
                        false,
                        gattCallback,
                        BluetoothDevice.TRANSPORT_LE
                    )

                } else {

                    @Suppress("DEPRECATION")
                    device.connectGatt(
                        reactContext,
                        false,
                        gattCallback
                    )
                }

            activeGatt = gatt

            if (gatt == null) {

                failPendingConnection(
                    ERROR_CONNECTION_FAILED,
                    "connectGatt() returned null"
                )

            } else {

                Log.d(
                    TAG,
                    "connectGatt() returned GATT object"
                )
            }

        } catch (e: SecurityException) {

            Log.e(
                TAG,
                "Bluetooth permission denied while opening GATT",
                e
            )

            failPendingConnection(
                ERROR_CONNECTION_FAILED,
                "Bluetooth permission denied"
            )

        } catch (e: Exception) {

            Log.e(
                TAG,
                "Failed to open GATT",
                e
            )

            failPendingConnection(
                ERROR_CONNECTION_FAILED,
                e.message
                    ?: "Failed to open GATT connection"
            )
        }
    }

    // =========================================================================
    // GATT CALLBACK
    // =========================================================================

    private val gattCallback =
        object : BluetoothGattCallback() {

            // =================================================================
            // CONNECTION STATE
            // =================================================================

            @SuppressLint("MissingPermission")
            override fun onConnectionStateChange(
                gatt: BluetoothGatt,
                status: Int,
                newState: Int
            ) {

                Log.d(
                    TAG,
                    "GATT STATE CHANGE: " +
                        "status=$status " +
                        "state=${gattStateName(newState)}"
                )

                when (newState) {

                    // =========================================================
                    // CONNECTED
                    // =========================================================

                    BluetoothProfile.STATE_CONNECTED -> {

                        Log.d(
                            TAG,
                            "================================================"
                        )

                        Log.d(
                            TAG,
                            "GATT CONNECTED"
                        )

                        Log.d(
                            TAG,
                            "Device: ${gatt.device.address}"
                        )

                        Log.d(
                            TAG,
                            "Pairing: NOT USED"
                        )

                        Log.d(
                            TAG,
                            "Starting service discovery..."
                        )

                        Log.d(
                            TAG,
                            "================================================"
                        )

                        // -----------------------------------------------------
                        // Store the exact GATT instance.
                        //
                        // Do NOT configure AlxBleGattModule yet.
                        //
                        // TX/RX/RX2 are only known after service discovery.
                        // -----------------------------------------------------

                        activeGatt = gatt
                        activeDevice = gatt.device

                        servicesDiscovered = false
                        rxNotificationConfigured = false

                        txCharacteristic = null
                        rxCharacteristic = null
                        rx2Characteristic = null

                        emitSimpleEvent(
                            EVENT_CONNECTED
                        )

                        try {

                            val started =
                                gatt.discoverServices()

                            Log.d(
                                TAG,
                                "discoverServices() -> $started"
                            )

                            if (!started) {

                                failPendingConnection(
                                    ERROR_CONNECTION_FAILED,
                                    "Failed to start service discovery"
                                )
                            }

                        } catch (e: Exception) {

                            Log.e(
                                TAG,
                                "Service discovery exception",
                                e
                            )

                            failPendingConnection(
                                ERROR_CONNECTION_FAILED,
                                e.message
                                    ?: "Failed to discover services"
                            )
                        }
                    }

                    // =========================================================
                    // DISCONNECTED
                    // =========================================================

                    BluetoothProfile.STATE_DISCONNECTED -> {

                        Log.d(
                            TAG,
                            "================================================"
                        )

                        Log.d(
                            TAG,
                            "GATT DISCONNECTED"
                        )

                        Log.d(
                            TAG,
                            "Device: ${gatt.device.address}"
                        )

                        Log.d(
                            TAG,
                            "status=$status"
                        )

                        Log.d(
                            TAG,
                            "Services discovered: $servicesDiscovered"
                        )

                        Log.d(
                            TAG,
                            "RX notification configured: " +
                                rxNotificationConfigured
                        )

                        Log.d(
                            TAG,
                            "Connection promise pending: " +
                                (pendingPromise != null)
                        )

                        Log.d(
                            TAG,
                            "================================================"
                        )

                        emitEvent(
                            EVENT_DISCONNECTED,
                            Arguments.createMap().apply {

                                putString(
                                    "address",
                                    gatt.device.address
                                )

                                putInt(
                                    "status",
                                    status
                                )

                                putBoolean(
                                    "servicesDiscovered",
                                    servicesDiscovered
                                )

                                putBoolean(
                                    "rxNotificationConfigured",
                                    rxNotificationConfigured
                                )
                            }
                        )

                        // -----------------------------------------------------
                        // CLEAR ALL BLE MODULE STATE
                        // -----------------------------------------------------

                        AlxBleTransportModule.clearGatt()
                        AlxBleGattModule.clearGatt()

                        if (connectionInProgress) {

                            failPendingConnection(
                                ERROR_CONNECTION_FAILED,
                                "BLE disconnected during connection. " +
                                    "status=$status"
                            )
                        }

                        try {
                            gatt.close()
                        } catch (_: Exception) {
                        }

                        if (activeGatt === gatt) {
                            activeGatt = null
                        }

                        activeDevice = null

                        txCharacteristic = null
                        rxCharacteristic = null
                        rx2Characteristic = null

                        servicesDiscovered = false
                        rxNotificationConfigured = false
                    }
                }
            }

            // =================================================================
            // SERVICES DISCOVERED
            // =================================================================

            override fun onServicesDiscovered(
                gatt: BluetoothGatt,
                status: Int
            ) {

                Log.d(
                    TAG,
                    "================================================"
                )

                Log.d(
                    TAG,
                    "SERVICES DISCOVERED"
                )

                Log.d(
                    TAG,
                    "status=$status"
                )

                Log.d(
                    TAG,
                    "serviceCount=${gatt.services.size}"
                )

                Log.d(
                    TAG,
                    "================================================"
                )

                if (
                    status !=
                    BluetoothGatt.GATT_SUCCESS
                ) {

                    failPendingConnection(
                        ERROR_CONNECTION_FAILED,
                        "GATT service discovery failed: status=$status"
                    )

                    return
                }

                // -------------------------------------------------------------
                // Make sure this exact GATT is the active one.
                // -------------------------------------------------------------

                activeGatt = gatt
                activeDevice = gatt.device

                servicesDiscovered = true

                // -------------------------------------------------------------
                // FIND ALX SERVICE
                // -------------------------------------------------------------

                val alxService =
                    gatt.services.firstOrNull {
                        it.uuid
                            .toString()
                            .equals(
                                ALX_SERVICE_UUID,
                                ignoreCase = true
                            )
                    }

                if (alxService == null) {

                    Log.e(
                        TAG,
                        "ALX service NOT FOUND"
                    )

                    failPendingConnection(
                        ERROR_CONNECTION_FAILED,
                        "ALX service not found: $ALX_SERVICE_UUID"
                    )

                    return
                }

                Log.d(
                    TAG,
                    "ALX service found: ${alxService.uuid}"
                )

                // -------------------------------------------------------------
                // RESET CHARACTERISTICS
                // -------------------------------------------------------------

                txCharacteristic = null
                rxCharacteristic = null
                rx2Characteristic = null

                // -------------------------------------------------------------
                // FIND TX / RX / RX2
                // -------------------------------------------------------------

                for (characteristic in alxService.characteristics) {

                    val uuid =
                        characteristic.uuid
                            .toString()
                            .lowercase()

                    val properties =
                        characteristic.properties

                    val propertyText =
                        buildString {

                            if (
                                properties and
                                BluetoothGattCharacteristic.PROPERTY_READ
                                != 0
                            ) {
                                append("READ|")
                            }

                            if (
                                properties and
                                BluetoothGattCharacteristic.PROPERTY_WRITE
                                != 0
                            ) {
                                append("WRITE|")
                            }

                            if (
                                properties and
                                BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE
                                != 0
                            ) {
                                append("WRITE_NO_RESPONSE|")
                            }

                            if (
                                properties and
                                BluetoothGattCharacteristic.PROPERTY_NOTIFY
                                != 0
                            ) {
                                append("NOTIFY|")
                            }

                            if (
                                properties and
                                BluetoothGattCharacteristic.PROPERTY_INDICATE
                                != 0
                            ) {
                                append("INDICATE|")
                            }

                            if (isEmpty()) {
                                append("NONE")
                            } else {
                                setLength(length - 1)
                            }
                        }

                    Log.d(
                        TAG,
                        "Characteristic: $uuid properties=$propertyText"
                    )

                    // ---------------------------------------------------------
                    // TX
                    // ---------------------------------------------------------

                    if (
                        uuid.equals(
                            ALX_TX_UUID,
                            ignoreCase = true
                        )
                    ) {

                        txCharacteristic =
                            characteristic

                        Log.d(
                            TAG,
                            "ALX TX found: ${characteristic.uuid}"
                        )
                    }

                    // ---------------------------------------------------------
                    // RX
                    // ---------------------------------------------------------

                    if (
                        uuid.equals(
                            ALX_RX_UUID,
                            ignoreCase = true
                        )
                    ) {

                        rxCharacteristic =
                            characteristic

                        Log.d(
                            TAG,
                            "ALX RX found: ${characteristic.uuid}"
                        )

                        val cccd =
                            characteristic.descriptors
                                .firstOrNull {
                                    it.uuid
                                        .toString()
                                        .equals(
                                            CCCD_UUID,
                                            ignoreCase = true
                                        )
                                }

                        if (cccd != null) {

                            Log.d(
                                TAG,
                                "ALX RX CCCD found: ${cccd.uuid}"
                            )

                        } else {

                            Log.w(
                                TAG,
                                "ALX RX CCCD NOT FOUND"
                            )
                        }
                    }

                    // ---------------------------------------------------------
                    // RX2
                    // ---------------------------------------------------------

                    if (
                        uuid.equals(
                            ALX_RX2_UUID,
                            ignoreCase = true
                        )
                    ) {

                        rx2Characteristic =
                            characteristic

                        Log.d(
                            TAG,
                            "ALX RX2 found: ${characteristic.uuid}"
                        )

                        val cccd =
                            characteristic.descriptors
                                .firstOrNull {
                                    it.uuid
                                        .toString()
                                        .equals(
                                            CCCD_UUID,
                                            ignoreCase = true
                                        )
                                }

                        if (cccd != null) {

                            Log.d(
                                TAG,
                                "ALX RX2 CCCD found: ${cccd.uuid}"
                            )

                        } else {

                            Log.w(
                                TAG,
                                "ALX RX2 CCCD NOT FOUND"
                            )
                        }
                    }
                }

                // -------------------------------------------------------------
                // CAPTURE DISCOVERED REFERENCES
                // -------------------------------------------------------------

                val tx =
                    txCharacteristic

                val rx =
                    rxCharacteristic

                val rx2 =
                    rx2Characteristic

                Log.d(
                    TAG,
                    "================================================"
                )

                Log.d(
                    TAG,
                    "ALX GATT DISCOVERY RESULT"
                )

                Log.d(
                    TAG,
                    "TX found : ${tx != null}"
                )

                Log.d(
                    TAG,
                    "RX found : ${rx != null}"
                )

                Log.d(
                    TAG,
                    "RX2 found: ${rx2 != null}"
                )

                Log.d(
                    TAG,
                    "================================================"
                )

                // -------------------------------------------------------------
                // TX + RX ARE REQUIRED
                // -------------------------------------------------------------

                if (tx == null || rx == null) {

                    failPendingConnection(
                        ERROR_CONNECTION_FAILED,
                        "Required ALX GATT characteristics not found"
                    )

                    return
                }

                // -------------------------------------------------------------
                // SYNCHRONIZE GATT MODULE
                //
                // Actual signature:
                //
                //     AlxBleGattModule.setGatt(
                //         gatt
                //     )
                //
                // The GATT module stores the GATT instance.
                // -------------------------------------------------------------

                AlxBleGattModule.setGatt(
                    gatt
                )

                Log.d(
                    TAG,
                    "AlxBleGattModule synchronized"
                )

                Log.d(
                    TAG,
                    "  GATT = ${gatt.device.address}"
                )

                Log.d(
                    TAG,
                    "  TX   = ${tx.uuid}"
                )

                Log.d(
                    TAG,
                    "  RX   = ${rx.uuid}"
                )

                Log.d(
                    TAG,
                    "  RX2  = ${rx2?.uuid ?: "<not found>"}"
                )

                // -------------------------------------------------------------
                // SYNCHRONIZE TRANSPORT MODULE
                //
                // Actual signature:
                //
                //     AlxBleTransportModule.setGatt(
                //         gatt,
                //         tx,
                //         rx,
                //         rx2
                //     )
                //
                // This is where the transport gets the characteristics it
                // needs to perform writes and receive notifications.
                // -------------------------------------------------------------

                AlxBleTransportModule.setGatt(
                    gatt,
                    tx,
                    rx,
                    rx2
                )

                Log.d(
                    TAG,
                    "AlxBleTransportModule synchronized"
                )

                Log.d(
                    TAG,
                    "  GATT = ${gatt.device.address}"
                )

                Log.d(
                    TAG,
                    "  TX   = ${tx.uuid}"
                )

                Log.d(
                    TAG,
                    "  RX   = ${rx.uuid}"
                )

                Log.d(
                    TAG,
                    "  RX2  = ${rx2?.uuid ?: "<not found>"}"
                )

                // -------------------------------------------------------------
                // EVERYTHING IS NOW READY.
                //
                // IMPORTANT:
                //
                // onGattReady() MUST happen AFTER both modules have their
                // correct GATT state.
                //
                // This prevents the previous:
                //
                //     TX REJECTED: activeGatt == null
                //
                // problem.
                // -------------------------------------------------------------

                AlxBleProtocolModule.onGattReady()

                Log.d(
                    TAG,
                    "================================================"
                )

                Log.d(
                    TAG,
                    "GATT TRANSPORT AVAILABLE"
                )

                Log.d(
                    TAG,
                    "GATT      : ${gatt.device.address}"
                )

                Log.d(
                    TAG,
                    "TX        : ${tx.uuid}"
                )

                Log.d(
                    TAG,
                    "RX        : ${rx.uuid}"
                )

                Log.d(
                    TAG,
                    "RX2       : ${rx2?.uuid ?: "<not found>"}"
                )

                Log.d(
                    TAG,
                    "Gatt      : READY"
                )

                Log.d(
                    TAG,
                    "Transport : READY"
                )

                Log.d(
                    TAG,
                    "Protocol  : READY"
                )

                Log.d(
                    TAG,
                    "================================================"
                )

                // -------------------------------------------------------------
                // Notifications remain disabled.
                //
                // CCCD configuration is performed only when explicitly
                // requested by the application/transport layer.
                // -------------------------------------------------------------

                Log.d(
                    TAG,
                    "RX notifications: NOT ENABLED"
                )

                Log.d(
                    TAG,
                    "CCCD write: WAITING FOR EXPLICIT REQUEST"
                )

                // -------------------------------------------------------------
                // Resolve exactly once.
                // -------------------------------------------------------------

                resolvePendingConnection()
            }

            // =================================================================
            // CHARACTERISTIC READ - API < 33
            // =================================================================

            @Deprecated("Deprecated in API 33")
            override fun onCharacteristicRead(
                gatt: BluetoothGatt,
                characteristic: BluetoothGattCharacteristic,
                status: Int
            ) {

                @Suppress("DEPRECATION")
                val value =
                    characteristic.value
                        ?: ByteArray(0)

                Log.d(
                    TAG,
                    "Characteristic read: " +
                        "${characteristic.uuid} " +
                        "status=$status " +
                        "length=${value.size}"
                )

                AlxBleTransportModule
                    .onCharacteristicRead(
                        gatt,
                        characteristic,
                        value,
                        status
                    )
            }

            // =================================================================
            // CHARACTERISTIC READ - API 33+
            // =================================================================

            override fun onCharacteristicRead(
                gatt: BluetoothGatt,
                characteristic: BluetoothGattCharacteristic,
                value: ByteArray,
                status: Int
            ) {

                Log.d(
                    TAG,
                    "Characteristic read: " +
                        "${characteristic.uuid} " +
                        "status=$status " +
                        "length=${value.size}"
                )

                AlxBleTransportModule
                    .onCharacteristicRead(
                        gatt,
                        characteristic,
                        value,
                        status
                    )
            }

            // =================================================================
            // DESCRIPTOR WRITE
            // =================================================================

            override fun onDescriptorWrite(
                gatt: BluetoothGatt,
                descriptor: BluetoothGattDescriptor,
                status: Int
            ) {

                val characteristic =
                    descriptor.characteristic

                val descriptorUuid =
                    descriptor.uuid
                        .toString()
                        .lowercase()

                val characteristicUuid =
                    characteristic.uuid
                        .toString()
                        .lowercase()

                val valueHex =
                    descriptor.value
                        ?.joinToString("") {
                            "%02X".format(
                                it.toInt() and 0xFF
                            )
                        }
                        ?: "<null>"

                val isAlxRx =
                    characteristicUuid ==
                        ALX_RX_UUID

                val isAlxRx2 =
                    characteristicUuid ==
                        ALX_RX2_UUID

                val isCccd =
                    descriptorUuid ==
                        CCCD_UUID

                val success =
                    status ==
                        BluetoothGatt.GATT_SUCCESS

                Log.d(
                    TAG,
                    "================================================"
                )

                Log.d(
                    TAG,
                    "DESCRIPTOR WRITE CALLBACK"
                )

                Log.d(
                    TAG,
                    "Device         : ${gatt.device.address}"
                )

                Log.d(
                    TAG,
                    "Descriptor     : ${descriptor.uuid}"
                )

                Log.d(
                    TAG,
                    "Characteristic : ${characteristic.uuid}"
                )

                Log.d(
                    TAG,
                    "Status         : $status"
                )

                Log.d(
                    TAG,
                    "Success        : $success"
                )

                Log.d(
                    TAG,
                    "CCCD           : $isCccd"
                )

                Log.d(
                    TAG,
                    "ALX RX         : $isAlxRx"
                )

                Log.d(
                    TAG,
                    "ALX RX2        : $isAlxRx2"
                )

                Log.d(
                    TAG,
                    "Value          : $valueHex"
                )

                Log.d(
                    TAG,
                    "================================================"
                )

                AlxBleTransportModule
                    .onDescriptorWrite(
                        gatt,
                        descriptor,
                        status
                    )

                if (
                    gatt === activeGatt &&
                    isCccd
                ) {

                    if (isAlxRx) {

                        rxNotificationConfigured =
                            success

                        Log.d(
                            TAG,
                            "RX notification state = $success"
                        )
                    }

                    if (isAlxRx2) {

                        Log.d(
                            TAG,
                            "RX2 notification CCCD result = $success"
                        )
                    }
                }
            }

            // =================================================================
            // CHARACTERISTIC CHANGED - API < 33
            // =================================================================

            @Deprecated("Deprecated in API 33")
            override fun onCharacteristicChanged(
                gatt: BluetoothGatt,
                characteristic: BluetoothGattCharacteristic
            ) {

                @Suppress("DEPRECATION")
                val value =
                    characteristic.value
                        ?: ByteArray(0)

                Log.d(
                    TAG,
                    "Notification received: " +
                        "${characteristic.uuid} " +
                        "length=${value.size}"
                )

                AlxBleTransportModule
                    .onCharacteristicChanged(
                        characteristic,
                        value
                    )
            }

            // =================================================================
            // CHARACTERISTIC CHANGED - API 33+
            // =================================================================

            override fun onCharacteristicChanged(
                gatt: BluetoothGatt,
                characteristic: BluetoothGattCharacteristic,
                value: ByteArray
            ) {

                Log.d(
                    TAG,
                    "Notification received: " +
                        "${characteristic.uuid} " +
                        "length=${value.size}"
                )

                AlxBleTransportModule
                    .onCharacteristicChanged(
                        characteristic,
                        value
                    )
            }
        }

    // =========================================================================
    // GATT STATE NAME
    // =========================================================================

    private fun gattStateName(
        state: Int
    ): String {

        return when (state) {

            BluetoothProfile.STATE_CONNECTED ->
                "CONNECTED"

            BluetoothProfile.STATE_CONNECTING ->
                "CONNECTING"

            BluetoothProfile.STATE_DISCONNECTED ->
                "DISCONNECTED"

            BluetoothProfile.STATE_DISCONNECTING ->
                "DISCONNECTING"

            else ->
                "UNKNOWN"
        }
    }

    // =========================================================================
    // BOND STATE NAME
    // =========================================================================

    @SuppressLint("MissingPermission")
    private fun bondStateName(
        state: Int
    ): String {

        return when (state) {

            BluetoothDevice.BOND_NONE ->
                "BOND_NONE"

            BluetoothDevice.BOND_BONDING ->
                "BOND_BONDING"

            BluetoothDevice.BOND_BONDED ->
                "BOND_BONDED"

            else ->
                "UNKNOWN"
        }
    }

    // =========================================================================
    // RESOLVE CONNECTION
    // =========================================================================

    private fun resolvePendingConnection() {

        val promise =
            pendingPromise

        pendingPromise = null
        pendingDevice = null
        connectionInProgress = false

        if (promise == null) {

            Log.w(
                TAG,
                "resolvePendingConnection(): no pending promise"
            )

            return
        }

        val device =
            activeDevice

        val result =
            Arguments.createMap().apply {

                putBoolean(
                    "connected",
                    true
                )

                putBoolean(
                    "paired",
                    false
                )

                putBoolean(
                    "bonded",
                    false
                )

                putBoolean(
                    "servicesDiscovered",
                    servicesDiscovered
                )

                putBoolean(
                    "rxNotificationConfigured",
                    rxNotificationConfigured
                )

                putBoolean(
                    "protocolReady",
                    servicesDiscovered
                )

                device?.let {

                    putString(
                        "address",
                        it.address
                    )

                    putString(
                        "name",
                        it.name
                    )

                    putString(
                        "bondState",
                        bondStateName(
                            it.bondState
                        )
                    )
                }
            }

        Log.d(
            TAG,
            "================================================"
        )

        Log.d(
            TAG,
            "BLE GATT CONNECTION SUCCESSFUL"
        )

        Log.d(
            TAG,
            "Direct GATT connection complete"
        )

        Log.d(
            TAG,
            "Pairing/bonding was NOT required"
        )

        Log.d(
            TAG,
            "GATT services discovered"
        )

        Log.d(
            TAG,
            "RX notifications NOT enabled automatically"
        )

        Log.d(
            TAG,
            "Connection is GATT-READY"
        )

        Log.d(
            TAG,
            "================================================"
        )

        promise.resolve(
            result
        )
    }

    // =========================================================================
    // FAIL CONNECTION
    // =========================================================================

    private fun failPendingConnection(
        code: String,
        message: String
    ) {

        Log.e(
            TAG,
            "================================================"
        )

        Log.e(
            TAG,
            "BLE CONNECTION FAILED"
        )

        Log.e(
            TAG,
            "code=$code"
        )

        Log.e(
            TAG,
            "message=$message"
        )

        Log.e(
            TAG,
            "servicesDiscovered=$servicesDiscovered"
        )

        Log.e(
            TAG,
            "rxNotificationConfigured=$rxNotificationConfigured"
        )

        Log.e(
            TAG,
            "================================================"
        )

        val promise =
            pendingPromise

        pendingPromise = null
        pendingDevice = null
        connectionInProgress = false

        promise?.reject(
            code,
            message
        )
    }

    // =========================================================================
    // DISCONNECT
    // =========================================================================

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun disconnectBleDevice(
        promise: Promise
    ) {

        try {

            Log.d(
                TAG,
                "Disconnect requested"
            )

            val gatt =
                activeGatt

            AlxBleTransportModule.clearGatt()
            AlxBleGattModule.clearGatt()

            activeGatt = null
            activeDevice = null

            servicesDiscovered = false
            rxNotificationConfigured = false

            txCharacteristic = null
            rxCharacteristic = null
            rx2Characteristic = null

            if (gatt != null) {

                try {
                    gatt.disconnect()
                } catch (_: Exception) {
                }

                try {
                    gatt.close()
                } catch (_: Exception) {
                }
            }

            connectionInProgress = false

            pendingPromise = null
            pendingDevice = null

            emitSimpleEvent(
                EVENT_DISCONNECTED
            )

            promise.resolve(
                true
            )

        } catch (e: Exception) {

            promise.reject(
                "BLUETOOTH_DISCONNECT_FAILED",
                e.message
                    ?: "Failed to disconnect"
            )
        }
    }

    // =========================================================================
    // CONNECTION STATE
    // =========================================================================

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun getConnectionState(
        promise: Promise
    ) {

        val gatt =
            activeGatt

        val device =
            activeDevice

        val result =
            Arguments.createMap().apply {

                putBoolean(
                    "connected",
                    gatt != null
                )

                putBoolean(
                    "connecting",
                    connectionInProgress
                )

                putBoolean(
                    "servicesDiscovered",
                    servicesDiscovered
                )

                putBoolean(
                    "rxNotificationConfigured",
                    rxNotificationConfigured
                )

                putBoolean(
                    "protocolReady",
                    gatt != null &&
                        servicesDiscovered
                )

                putBoolean(
                    "paired",
                    device?.bondState ==
                        BluetoothDevice.BOND_BONDED
                )

                putBoolean(
                    "bonded",
                    device?.bondState ==
                        BluetoothDevice.BOND_BONDED
                )

                if (device != null) {

                    putString(
                        "address",
                        device.address
                    )

                    putString(
                        "name",
                        device.name
                    )

                    putString(
                        "bondState",
                        bondStateName(
                            device.bondState
                        )

                    )

                } else {

                    putString(
                        "bondState",
                        "BOND_NONE"
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
            "invalidate()"
        )

        try {

            activeGatt?.let { gatt ->

                try {
                    gatt.disconnect()
                } catch (_: Exception) {
                }

                try {
                    gatt.close()
                } catch (_: Exception) {
                }
            }

        } catch (_: Exception) {
        }

        activeGatt = null
        activeDevice = null

        pendingPromise = null
        pendingDevice = null

        connectionInProgress = false
        servicesDiscovered = false
        rxNotificationConfigured = false

        txCharacteristic = null
        rxCharacteristic = null
        rx2Characteristic = null

        AlxBleTransportModule.clearGatt()
        AlxBleGattModule.clearGatt()

        super.invalidate()
    }

    // =========================================================================
    // INIT
    // =========================================================================

    init {

        Log.d(
            TAG,
            "BluetoothConnectionModule initialized"
        )

        Log.d(
            TAG,
            "ALX connection mode: DIRECT GATT / NO PAIRING"
        )

        Log.d(
            TAG,
            "RX CCCD mode: EXPLICIT / MANUAL"
        )
    }
}