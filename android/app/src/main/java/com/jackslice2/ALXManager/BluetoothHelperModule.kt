package com.allexo.alxmobile

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.content.Context
import android.os.Build
import android.util.Log

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class BluetoothHelperModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "BluetoothHelper"
    }

    // =========================================================
    // BLE SCANNER
    // =========================================================

    private var bluetoothLeScanner: BluetoothLeScanner? = null

    private var scanCallback: ScanCallback? = null

    // =========================================================
    // ACTIVE GATT CONNECTION
    // =========================================================

    private var bluetoothGatt: BluetoothGatt? = null

    // Promise used only while a connection is being established.
    private var pendingConnectPromise: Promise? = null

    // =========================================================
    // REACT NATIVE MODULE
    // =========================================================

    override fun getName(): String {
        return "BluetoothHelper"
    }

    // =========================================================
    // REACT NATIVE EVENT LISTENER SUPPORT
    // =========================================================

    @ReactMethod
    fun addListener(eventName: String) {
        // Required by React Native NativeEventEmitter.
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required by React Native NativeEventEmitter.
    }

    // =========================================================
    // EVENT HELPER
    // =========================================================

    private fun emitEvent(
        eventName: String,
        payload: Any?
    ) {
        try {
            reactContext
                .getJSModule(
                    DeviceEventManagerModule
                        .RCTDeviceEventEmitter::class.java
                )
                .emit(
                    eventName,
                    payload
                )
        } catch (e: Exception) {
            Log.e(
                TAG,
                "Failed to emit event: $eventName",
                e
            )
        }
    }

    // =========================================================
    // BLUETOOTH STATE
    // =========================================================

    @ReactMethod
    fun isBluetoothEnabled(
        promise: Promise
    ) {
        try {
            val bluetoothManager =
                reactContext.getSystemService(
                    Context.BLUETOOTH_SERVICE
                ) as BluetoothManager

            val adapter =
                bluetoothManager.adapter

            promise.resolve(
                adapter?.isEnabled == true
            )
        } catch (e: Exception) {
            Log.e(
                TAG,
                "Failed to check Bluetooth state",
                e
            )

            promise.reject(
                "BLUETOOTH_ERROR",
                e.message,
                e
            )
        }
    }

    // =========================================================
    // BLE SCAN
    // =========================================================

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun startBleScan(
        promise: Promise
    ) {
        try {
            val bluetoothManager =
                reactContext.getSystemService(
                    Context.BLUETOOTH_SERVICE
                ) as BluetoothManager

            val adapter =
                bluetoothManager.adapter
                    ?: throw Exception(
                        "Bluetooth adapter unavailable"
                    )

            if (!adapter.isEnabled) {
                promise.reject(
                    "BLUETOOTH_DISABLED",
                    "Bluetooth is disabled"
                )
                return
            }

            // Stop an existing scan first.
            stopCurrentScan()

            val scanner =
                adapter.bluetoothLeScanner
                    ?: throw Exception(
                        "BLE scanner unavailable"
                    )

            bluetoothLeScanner = scanner

            scanCallback =
                object : ScanCallback() {

                    override fun onScanResult(
                        callbackType: Int,
                        result: ScanResult
                    ) {
                        val device =
                            result.device

                        val name =
                            device.name
                                ?: return

                        // Only expose ALX devices.
                        if (!name.startsWith("ALX")) {
                            return
                        }

                        val data =
                            Arguments.createMap().apply {

                                putString(
                                    "name",
                                    name
                                )

                                putString(
                                    "address",
                                    device.address
                                )

                                putInt(
                                    "rssi",
                                    result.rssi
                                )
                            }

                        emitEvent(
                            "BluetoothDeviceFound",
                            data
                        )

                        Log.d(
                            TAG,
                            "Device found: " +
                                "$name " +
                                "${device.address} " +
                                "RSSI: ${result.rssi}"
                        )
                    }

                    override fun onScanFailed(
                        errorCode: Int
                    ) {
                        Log.e(
                            TAG,
                            "BLE scan failed: $errorCode"
                        )

                        emitEvent(
                            "BluetoothScanFailed",
                            errorCode
                        )
                    }
                }

            scanner.startScan(
                scanCallback
            )

            Log.d(
                TAG,
                "BLE scan started"
            )

            promise.resolve(true)

        } catch (e: Exception) {
            Log.e(
                TAG,
                "BLE scan error",
                e
            )

            promise.reject(
                "BLUETOOTH_SCAN_ERROR",
                e.message,
                e
            )
        }
    }

    // =========================================================
    // BLE CONNECTION
    //
    // IMPORTANT:
    //
    // We intentionally do NOT call:
    //
    //     device.createBond()
    //
    // Android Bluetooth pairing is NOT part of the ALX
    // connection flow.
    //
    // The ALX password is application-level authentication
    // and will be handled separately later.
    // =========================================================

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun connectBleDevice(
        address: String,
        password: String,
        promise: Promise
    ) {
        try {
            val bluetoothManager =
                reactContext.getSystemService(
                    Context.BLUETOOTH_SERVICE
                ) as BluetoothManager

            val adapter =
                bluetoothManager.adapter
                    ?: throw Exception(
                        "Bluetooth adapter unavailable"
                    )

            if (!adapter.isEnabled) {
                promise.reject(
                    "BLUETOOTH_DISABLED",
                    "Bluetooth is disabled"
                )
                return
            }

            if (address.isBlank()) {
                promise.reject(
                    "BLUETOOTH_INVALID_ADDRESS",
                    "Bluetooth device address is empty"
                )
                return
            }

            /*
             * Keep the password parameter for JS API compatibility.
             *
             * It is intentionally NOT stored, logged, or used here.
             *
             * The ALX application-level authentication will be
             * implemented later after the basic GATT connection
             * is stable.
             */
            @Suppress("UNUSED_VARIABLE")
            val applicationPassword = password

            val device =
                adapter.getRemoteDevice(address)

            Log.d(
                TAG,
                "Preparing direct BLE GATT connection: " +
                    "${device.name ?: "Unknown"} / $address"
            )

            Log.d(
                TAG,
                "Android bond state: " +
                    bondStateName(device.bondState)
            )

            // Stop scanning before connecting.
            stopCurrentScan()

            // Close any previous connection.
            closeCurrentGatt()

            // Store the connection promise.
            pendingConnectPromise = promise

            emitEvent(
                "BluetoothConnecting",
                Arguments.createMap().apply {

                    putString(
                        "address",
                        address
                    )

                    putString(
                        "name",
                        device.name ?: "Unknown"
                    )

                    putBoolean(
                        "bonded",
                        device.bondState ==
                            BluetoothDevice.BOND_BONDED
                    )

                    putBoolean(
                        "directGatt",
                        true
                    )
                }
            )

            Log.d(
                TAG,
                "Skipping Android Bluetooth pairing"
            )

            Log.d(
                TAG,
                "Connecting directly to BLE GATT..."
            )

            connectGatt(
                device,
                address
            )

        } catch (e: Exception) {
            Log.e(
                TAG,
                "BLE connection error",
                e
            )

            pendingConnectPromise = null

            promise.reject(
                "BLUETOOTH_CONNECT_ERROR",
                e.message,
                e
            )
        }
    }

    // =========================================================
    // CREATE GATT CONNECTION
    // =========================================================

    @SuppressLint("MissingPermission")
    private fun connectGatt(
        device: BluetoothDevice,
        address: String
    ) {
        Log.d(
            TAG,
            "Starting GATT connection: " +
                "${device.name ?: "Unknown"} / $address"
        )

        val callback =
            createGattCallback(address)

        bluetoothGatt =
            if (
                Build.VERSION.SDK_INT >=
                Build.VERSION_CODES.M
            ) {
                device.connectGatt(
                    reactContext,
                    false,
                    callback,
                    BluetoothDevice.TRANSPORT_LE
                )
            } else {
                device.connectGatt(
                    reactContext,
                    false,
                    callback
                )
            }

        /*
         * Give AlxBleGattModule the exact same BluetoothGatt
         * object.
         *
         * AlxBleGattModule does NOT create another connection.
         */
        AlxBleGattModule.setGatt(
            bluetoothGatt
        )

        if (bluetoothGatt == null) {
            Log.e(
                TAG,
                "Failed to create BluetoothGatt"
            )

            AlxBleGattModule.setGatt(null)

            rejectPendingConnection(
                "BLUETOOTH_GATT_ERROR",
                "Failed to create Bluetooth GATT connection"
            )

            return
        }

        Log.d(
            TAG,
            "GATT object created"
        )
    }

    // =========================================================
    // GATT CALLBACK
    // =========================================================

    private fun createGattCallback(
        address: String
    ): BluetoothGattCallback {

        return object : BluetoothGattCallback() {

            // =====================================================
            // CONNECTION STATE
            // =====================================================

            override fun onConnectionStateChange(
                gatt: BluetoothGatt,
                status: Int,
                newState: Int
            ) {
                Log.d(
                    TAG,
                    "GATT state changed: " +
                        "status=$status " +
                        "state=$newState"
                )

                // -------------------------------------------------
                // CONNECTED
                // -------------------------------------------------

                if (
                    status ==
                    BluetoothGatt.GATT_SUCCESS &&
                    newState ==
                    BluetoothProfile.STATE_CONNECTED
                ) {
                    Log.d(
                        TAG,
                        "BLE connected: $address"
                    )

                    /*
                     * Make absolutely sure the shared GATT module
                     * points to the actual connected GATT object.
                     */
                    AlxBleGattModule.setGatt(
                        gatt
                    )

                    emitEvent(
                        "BluetoothConnected",
                        Arguments.createMap().apply {

                            putString(
                                "address",
                                address
                            )

                            putString(
                                "name",
                                gatt.device.name
                                    ?: "Unknown"
                            )

                            putBoolean(
                                "bonded",
                                gatt.device.bondState ==
                                    BluetoothDevice.BOND_BONDED
                            )
                        }
                    )

                    // Resolve the connection promise exactly once.
                    resolvePendingConnection()

                    /*
                     * Start service discovery.
                     *
                     * IMPORTANT:
                     *
                     * Nothing else happens here.
                     *
                     * No CCCD.
                     * No notifications.
                     * No writes.
                     * No protocol.
                     */
                    val started =
                        try {
                            gatt.discoverServices()
                        } catch (e: Exception) {
                            Log.e(
                                TAG,
                                "Failed to start service discovery",
                                e
                            )

                            false
                        }

                    Log.d(
                        TAG,
                        "Service discovery started: $started"
                    )

                    if (!started) {
                        emitEvent(
                            "BluetoothServicesDiscoveryFailed",
                            Arguments.createMap().apply {
                                putString(
                                    "address",
                                    address
                                )

                                putInt(
                                    "status",
                                    1
                                )
                            }
                        )
                    }

                    return
                }

                // -------------------------------------------------
                // DISCONNECTED
                // -------------------------------------------------

                if (
                    newState ==
                    BluetoothProfile.STATE_DISCONNECTED
                ) {
                    Log.d(
                        TAG,
                        "BLE disconnected: " +
                            "$address status=$status"
                    )

                    emitEvent(
                        "BluetoothDisconnected",
                        address
                    )

                    /*
                     * Only clear the GATT if this is still the
                     * active connection.
                     */
                    AlxBleGattModule.clearGatt(
                        gatt
                    )

                    try {
                        gatt.close()
                    } catch (_: Exception) {
                    }

                    if (
                        bluetoothGatt === gatt
                    ) {
                        bluetoothGatt = null
                    }

                    /*
                     * Normally the connection promise was already
                     * resolved when STATE_CONNECTED occurred.
                     *
                     * Therefore we do not reject it here.
                     */
                    pendingConnectPromise = null

                    return
                }

                // -------------------------------------------------
                // CONNECTION FAILURE
                // -------------------------------------------------

                if (
                    status !=
                    BluetoothGatt.GATT_SUCCESS
                ) {
                    Log.e(
                        TAG,
                        "BLE GATT connection failed: " +
                            "status=$status " +
                            "address=$address"
                    )

                    emitEvent(
                        "BluetoothConnectionFailed",
                        Arguments.createMap().apply {

                            putString(
                                "address",
                                address
                            )

                            putInt(
                                "status",
                                status
                            )

                            putString(
                                "error",
                                gattStatusName(status)
                            )
                        }
                    )

                    AlxBleGattModule.clearGatt(
                        gatt
                    )

                    try {
                        gatt.close()
                    } catch (_: Exception) {
                    }

                    if (
                        bluetoothGatt === gatt
                    ) {
                        bluetoothGatt = null
                    }

                    rejectPendingConnection(
                        "BLUETOOTH_GATT_CONNECTION_FAILED",
                        "BLE GATT connection failed: " +
                            "status=$status " +
                            gattStatusName(status)
                    )
                }
            }

            // =====================================================
            // SERVICES DISCOVERED
            // =====================================================

            override fun onServicesDiscovered(
                gatt: BluetoothGatt,
                status: Int
            ) {
                Log.d(
                    TAG,
                    "GATT services discovered: " +
                        "status=$status"
                )

                /*
                 * Let AlxBleGattModule inspect the SAME GATT object.
                 *
                 * It will locate:
                 *
                 *   Service
                 *   TX
                 *   RX
                 *   RX2
                 *
                 * and emit AlxBleGattReady.
                 *
                 * Nothing else is done here.
                 */
                AlxBleGattModule.onServicesDiscovered(
                    gatt,
                    status
                )

                if (
                    status !=
                    BluetoothGatt.GATT_SUCCESS
                ) {
                    emitEvent(
                        "BluetoothServicesDiscoveryFailed",
                        Arguments.createMap().apply {

                            putString(
                                "address",
                                address
                            )

                            putInt(
                                "status",
                                status
                            )
                        }
                    )
                }
            }
        }
    }

    // =========================================================
    // STOP BLE SCAN
    // =========================================================

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun stopBleScan(
        promise: Promise
    ) {
        try {
            stopCurrentScan()

            Log.d(
                TAG,
                "BLE scan stopped"
            )

            promise.resolve(true)

        } catch (e: Exception) {
            Log.e(
                TAG,
                "Failed to stop BLE scan",
                e
            )

            promise.reject(
                "BLUETOOTH_SCAN_STOP_ERROR",
                e.message,
                e
            )
        }
    }

    // =========================================================
    // DISCONNECT BLE DEVICE
    // =========================================================

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun disconnectBleDevice(
        promise: Promise
    ) {
        try {
            val gatt =
                bluetoothGatt

            if (gatt != null) {

                Log.d(
                    TAG,
                    "Disconnecting BLE device: " +
                        gatt.device.address
                )

                AlxBleGattModule.clearGatt(
                    gatt
                )

                try {
                    gatt.disconnect()
                } catch (_: Exception) {
                }

                try {
                    gatt.close()
                } catch (_: Exception) {
                }
            }

            bluetoothGatt = null

            pendingConnectPromise = null

            Log.d(
                TAG,
                "BLE disconnected"
            )

            promise.resolve(true)

        } catch (e: Exception) {
            Log.e(
                TAG,
                "BLE disconnect error",
                e
            )

            promise.reject(
                "BLUETOOTH_DISCONNECT_ERROR",
                e.message,
                e
            )
        }
    }

    // =========================================================
    // STOP CURRENT SCAN
    // =========================================================

    @SuppressLint("MissingPermission")
    private fun stopCurrentScan() {

        val scanner =
            bluetoothLeScanner

        val callback =
            scanCallback

        if (
            scanner != null &&
            callback != null
        ) {
            try {
                scanner.stopScan(
                    callback
                )
            } catch (e: Exception) {
                Log.w(
                    TAG,
                    "Error stopping BLE scan",
                    e
                )
            }
        }

        scanCallback = null
        bluetoothLeScanner = null
    }

    // =========================================================
    // CLOSE CURRENT GATT
    // =========================================================

    @SuppressLint("MissingPermission")
    private fun closeCurrentGatt() {

        val gatt =
            bluetoothGatt

        if (gatt != null) {

            Log.d(
                TAG,
                "Closing previous GATT connection"
            )

            AlxBleGattModule.clearGatt(
                gatt
            )

            try {
                gatt.disconnect()
            } catch (_: Exception) {
            }

            try {
                gatt.close()
            } catch (_: Exception) {
            }
        }

        bluetoothGatt = null
    }

    // =========================================================
    // RESOLVE CONNECTION PROMISE
    // =========================================================

    private fun resolvePendingConnection() {

        val promise =
            pendingConnectPromise
                ?: return

        pendingConnectPromise = null

        try {
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(
                TAG,
                "Failed to resolve connection promise",
                e
            )
        }
    }

    // =========================================================
    // REJECT CONNECTION PROMISE
    // =========================================================

    private fun rejectPendingConnection(
        code: String,
        message: String
    ) {
        val promise =
            pendingConnectPromise
                ?: return

        pendingConnectPromise = null

        try {
            promise.reject(
                code,
                message
            )
        } catch (e: Exception) {
            Log.e(
                TAG,
                "Failed to reject connection promise",
                e
            )
        }
    }

    // =========================================================
    // GATT STATUS
    // =========================================================

    private fun gattStatusName(
        status: Int
    ): String {

        return when (status) {

            BluetoothGatt.GATT_SUCCESS ->
                "GATT_SUCCESS"

            5 ->
                "GATT_INSUFFICIENT_AUTHENTICATION"

            8 ->
                "GATT_INSUFFICIENT_AUTHENTICATION"

            15 ->
                "GATT_INSUFFICIENT_ENCRYPTION"

            22 ->
                "GATT_STATUS_22"

            133 ->
                "GATT_ERROR_133"

            else ->
                "GATT_STATUS_$status"
        }
    }

    // =========================================================
    // BOND STATE
    // =========================================================

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
                "UNKNOWN($state)"
        }
    }

    // =========================================================
    // MODULE CLEANUP
    // =========================================================

    @SuppressLint("MissingPermission")
    override fun invalidate() {

        Log.d(
            TAG,
            "BluetoothHelper invalidating"
        )

        pendingConnectPromise = null

        stopCurrentScan()

        val gatt =
            bluetoothGatt

        if (gatt != null) {

            AlxBleGattModule.clearGatt(
                gatt
            )

            try {
                gatt.disconnect()
            } catch (_: Exception) {
            }

            try {
                gatt.close()
            } catch (_: Exception) {
            }
        }

        bluetoothGatt = null

        super.invalidate()
    }
}