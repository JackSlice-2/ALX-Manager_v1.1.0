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

    // Kept for API compatibility with existing JS listeners.
    // This module no longer initiates or handles pairing.
    private const val EVENT_PAIRING_REQUEST =
        "BluetoothPairingRequest"

    private const val EVENT_BOND_STATE =
        "BluetoothBondStateChanged"

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

private var connectionInProgress =
    false

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
//
// IMPORTANT:
//
// ALX-5DLG was successfully connected from Linux with:
//
//   Paired:  no
//   Bonded:  no
//
// and BlueZ successfully resolved:
//
//   12345678-1234-5678-1234-56789abcdef7
//
// Therefore Android must NOT call createBond() before GATT.
//
// Flow:
//
//   BLE device
//       ↓
//   connectGatt()
//       ↓
//   onConnectionStateChange()
//       ↓
//   discoverServices()
//       ↓
//   AlxBleGattModule
//
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

    pendingPromise =
        promise

    pendingDevice =
        device

    connectionInProgress =
        true

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
        "Password    : ${if (password.isNullOrEmpty()) "<unused>" else "<provided>"}"
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
        "================================================"
    )

    connectGatt(
        device
    )
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

        activeGatt = null
        activeDevice = device

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

        activeGatt =
            gatt

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

                    activeGatt =
                        gatt

                    activeDevice =
                        gatt.device

                    AlxBleGattModule.setGatt(
                        gatt
                    )

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
                        "================================================"
                    )

                    emitSimpleEvent(
                        EVENT_DISCONNECTED
                    )

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
                status ==
                BluetoothGatt.GATT_SUCCESS
            ) {

                /*
                 * AlxBleGattModule handles:
                 *
                 *   - service discovery
                 *   - target service selection
                 *   - TX selection
                 *   - RX selection
                 *   - RX2 selection
                 *   - notification setup
                 */

                AlxBleGattModule.onServicesDiscovered(
                    gatt
                )

                /*
                 * Connection is now established and the GATT database
                 * is available.
                 *
                 * AlxBleGattModule / AlxBleTransportModule determine
                 * protocol readiness.
                 */

                resolvePendingConnection()

            } else {

                failPendingConnection(
                    ERROR_CONNECTION_FAILED,
                    "GATT service discovery failed: status=$status"
                )
            }
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

            Log.d(
                TAG,
                "Descriptor write: " +
                    "${descriptor.uuid} " +
                    "status=$status"
            )

            AlxBleTransportModule
                .onDescriptorWrite(
                    gatt,
                    descriptor,
                    status
                )
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
//
// Kept only for diagnostics. Bonding is NOT part of the ALX connection
// flow anymore.
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

    pendingPromise =
        null

    pendingDevice =
        null

    connectionInProgress =
        false

    if (promise == null) {
        return
    }

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

            activeDevice?.let { device ->

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
            }
        }

    Log.d(
        TAG,
        "================================================"
    )

    Log.d(
        TAG,
        "BLE CONNECTION SUCCESSFUL"
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
        "================================================"
    )

    val promise =
        pendingPromise

    pendingPromise =
        null

    pendingDevice =
        null

    connectionInProgress =
        false

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

        connectionInProgress =
            false

        pendingPromise =
            null

        pendingDevice =
            null

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
}
}