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
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
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

        private const val DEFAULT_PAIRING_PIN = "123456"

        const val EVENT_CONNECTED = "BluetoothConnected"
        const val EVENT_DISCONNECTED = "BluetoothDisconnected"

        const val ERROR_BLUETOOTH_DISABLED = "BLUETOOTH_DISABLED"
        const val ERROR_DEVICE_NOT_FOUND = "BLUETOOTH_DEVICE_NOT_FOUND"
        const val ERROR_CONNECTION_FAILED = "BLUETOOTH_CONNECTION_FAILED"
        const val ERROR_CONNECTION_IN_PROGRESS = "BLUETOOTH_CONNECTION_IN_PROGRESS"
        const val ERROR_PAIRING_FAILED = "BLUETOOTH_PAIRING_FAILED"

        @Volatile
        private var instance: BluetoothConnectionModule? = null

        @Volatile
        private var activeGatt: BluetoothGatt? = null

        @Volatile
        private var activeDevice: BluetoothDevice? = null

        fun getGatt(): BluetoothGatt? = activeGatt

        fun getDevice(): BluetoothDevice? = activeDevice

        fun setGatt(gatt: BluetoothGatt?) {
            activeGatt = gatt
        }

        fun setDevice(device: BluetoothDevice?) {
            activeDevice = device
        }

        fun clearGatt() {
            activeGatt = null
            activeDevice = null
        }

        fun onGattReady() {
            val module = instance

            if (module == null) {
                Log.e(TAG, "onGattReady(): module instance is null")
                return
            }

            module.handleGattReady()
        }
    }

    private val bluetoothManager: BluetoothManager? =
        reactContext.getSystemService(
            Context.BLUETOOTH_SERVICE
        ) as? BluetoothManager

    private val bluetoothAdapter: BluetoothAdapter?
        get() = bluetoothManager?.adapter

    private var pendingPromise: Promise? = null
    private var pendingDevice: BluetoothDevice? = null

    private var pendingPairingPin: String =
        DEFAULT_PAIRING_PIN

    private var connectionInProgress = false
    private var pairingInProgress = false

    private var servicesDiscovered = false
    private var rxNotificationConfigured = false

    private var pairingReceiverRegistered = false

    private var pairOnlyRequest = false

    override fun getName(): String =
        "BluetoothConnection"

    private val pairingReceiver =
        object : BroadcastReceiver() {

            @SuppressLint("MissingPermission")
            override fun onReceive(
                context: Context?,
                intent: Intent?
            ) {

                if (intent == null) {
                    return
                }

                when (intent.action) {

                    BluetoothDevice.ACTION_PAIRING_REQUEST -> {

                        val device =
                            getDeviceFromIntent(intent)

                        if (device == null) {
                            Log.e(
                                TAG,
                                "PAIRING REQUEST: device == null"
                            )
                            return
                        }

                        if (!isPendingDevice(device)) {
                            Log.w(
                                TAG,
                                "Ignoring pairing request from " +
                                    "unexpected device ${device.address}"
                            )
                            return
                        }

                        val variant =
                            intent.getIntExtra(
                                BluetoothDevice.EXTRA_PAIRING_VARIANT,
                                BluetoothDevice.PAIRING_VARIANT_PIN
                            )

                        Log.d(TAG, "========================================")
                        Log.d(TAG, "BLE PAIRING REQUEST")
                        Log.d(TAG, "Device  : ${device.address}")
                        Log.d(TAG, "Name    : ${safeDeviceName(device)}")
                        Log.d(
                            TAG,
                            "Variant : $variant " +
                                "(${pairingVariantName(variant)})"
                        )

                        if (
                            variant ==
                            BluetoothDevice.PAIRING_VARIANT_PIN
                        ) {
                            Log.d(
                                TAG,
                                "ProvidePin stage reached"
                            )

                            Log.d(
                                TAG,
                                "Providing SMP pairing PIN: " +
                                    pendingPairingPin
                            )
                        }

                        Log.d(TAG, "========================================")

                        handlePairingRequest(
                            intent,
                            device,
                            variant
                        )
                    }

                    BluetoothDevice.ACTION_BOND_STATE_CHANGED -> {

                        val device =
                            getDeviceFromIntent(intent)
                                ?: return

                        if (!isPendingDevice(device)) {
                            Log.d(
                                TAG,
                                "Ignoring bond event from " +
                                    "unexpected device ${device.address}"
                            )
                            return
                        }

                        val state =
                            intent.getIntExtra(
                                BluetoothDevice.EXTRA_BOND_STATE,
                                BluetoothDevice.BOND_NONE
                            )

                        val previousState =
                            intent.getIntExtra(
                                BluetoothDevice.EXTRA_PREVIOUS_BOND_STATE,
                                BluetoothDevice.BOND_NONE
                            )

                        Log.d(
                            TAG,
                            "BOND STATE: " +
                                "${bondStateName(previousState)} -> " +
                                bondStateName(state)
                        )

                        when (state) {

                            BluetoothDevice.BOND_BONDING -> {

                                pairingInProgress = true

                                Log.d(
                                    TAG,
                                    "BLE PAIRING IN PROGRESS"
                                )
                            }

                            BluetoothDevice.BOND_BONDED -> {

                                pairingInProgress = false

                                Log.d(TAG, "========================================")
                                Log.d(TAG, "BLE PAIRING SUCCESSFUL")
                                Log.d(TAG, "Device : ${device.address}")
                                Log.d(TAG, "========================================")

                                unregisterPairingReceiver()

                                if (pairOnlyRequest) {

                                    Log.d(
                                        TAG,
                                        "Pair-only request complete"
                                    )

                                    pairOnlyRequest = false
                                    connectionInProgress = false

                                    val promise = pendingPromise

                                    pendingPromise = null
                                    pendingDevice = null

                                    promise?.resolve(true)

                                    return
                                }

                                val bondedDevice =
                                    pendingDevice ?: device

                                connectGatt(bondedDevice)
                            }

                            BluetoothDevice.BOND_NONE -> {

                                if (
                                    pairingInProgress ||
                                    connectionInProgress
                                ) {

                                    pairingInProgress = false

                                    Log.e(
                                        TAG,
                                        "========================================"
                                    )

                                    Log.e(
                                        TAG,
                                        "BLE PAIRING FAILED"
                                    )

                                    Log.e(
                                        TAG,
                                        "Device : ${device.address}"
                                    )

                                    Log.e(
                                        TAG,
                                        "========================================"
                                    )

                                    unregisterPairingReceiver()

                                    failPendingConnection(
                                        ERROR_PAIRING_FAILED,
                                        "Bluetooth pairing failed"
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

    private fun getDeviceFromIntent(
        intent: Intent
    ): BluetoothDevice? {

        return try {

            if (
                Build.VERSION.SDK_INT >=
                Build.VERSION_CODES.TIRAMISU
            ) {

                intent.getParcelableExtra(
                    BluetoothDevice.EXTRA_DEVICE,
                    BluetoothDevice::class.java
                )

            } else {

                @Suppress("DEPRECATION")
                intent.getParcelableExtra(
                    BluetoothDevice.EXTRA_DEVICE
                )
            }

        } catch (e: Exception) {

            Log.e(
                TAG,
                "Could not extract BluetoothDevice",
                e
            )

            null
        }
    }

    @SuppressLint("MissingPermission")
    private fun isPendingDevice(
        device: BluetoothDevice
    ): Boolean {

        val expected =
            pendingDevice ?: return false

        return try {

            expected.address.equals(
                device.address,
                ignoreCase = true
            )

        } catch (_: Exception) {

            false
        }
    }

    @SuppressLint("MissingPermission")
    private fun safeDeviceName(
        device: BluetoothDevice?
    ): String? {

        if (device == null) {
            return null
        }

        return try {
            device.name
        } catch (_: Exception) {
            null
        }
    }

    private fun pairingVariantName(
        variant: Int
    ): String {

        return when (variant) {

            BluetoothDevice.PAIRING_VARIANT_PIN ->
                "PIN"

            2 ->
                "PASSKEY"

            3 ->
                "PASSKEY_CONFIRMATION"

            4 ->
                "CONSENT"

            5 ->
                "DISPLAY_PASSKEY"

            6 ->
                "DISPLAY_PIN"

            else ->
                "UNKNOWN"
        }
    }

    @SuppressLint("MissingPermission")
    private fun handlePairingRequest(
        intent: Intent,
        device: BluetoothDevice,
        variant: Int
    ) {

        try {

            when (variant) {

                BluetoothDevice.PAIRING_VARIANT_PIN -> {

                    val pinBytes =
                        pendingPairingPin.toByteArray(
                            Charsets.UTF_8
                        )

                    val pinResult =
                        try {

                            device.setPin(
                                pinBytes
                            )

                        } catch (e: Exception) {

                            Log.e(
                                TAG,
                                "setPin() exception",
                                e
                            )

                            false
                        }

                    Log.d(
                        TAG,
                        "setPin() -> $pinResult"
                    )

                    try {

                        val confirmation =
                            device.setPairingConfirmation(
                                true
                            )

                        Log.d(
                            TAG,
                            "setPairingConfirmation(true) -> " +
                                confirmation
                        )

                    } catch (e: Exception) {

                        Log.d(
                            TAG,
                            "PIN confirmation not required"
                        )
                    }
                }

                2 -> {

                    Log.d(
                        TAG,
                        "Pairing variant = PASSKEY"
                    )

                    val passkeyBytes =
                        pendingPairingPin.toByteArray(
                            Charsets.UTF_8
                        )

                    val result =
                        try {

                            device.setPin(
                                passkeyBytes
                            )

                        } catch (e: Exception) {

                            Log.e(
                                TAG,
                                "setPin(passkey) exception",
                                e
                            )

                            false
                        }

                    Log.d(
                        TAG,
                        "setPin(passkey) -> $result"
                    )
                }

                3 -> {

                    val pairingKey =
                        intent.getIntExtra(
                            BluetoothDevice.EXTRA_PAIRING_KEY,
                            -1
                        )

                    Log.d(
                        TAG,
                        "Pairing variant = PASSKEY_CONFIRMATION"
                    )

                    Log.d(
                        TAG,
                        "Pairing key = $pairingKey"
                    )

                    try {

                        val result =
                            device.setPairingConfirmation(
                                true
                            )

                        Log.d(
                            TAG,
                            "setPairingConfirmation(true) -> " +
                                result
                        )

                    } catch (e: Exception) {

                        Log.e(
                            TAG,
                            "setPairingConfirmation() failed",
                            e
                        )
                    }
                }

                4,
                5,
                6 -> {

                    Log.d(
                        TAG,
                        "Pairing variant = " +
                            pairingVariantName(variant)
                    )

                    try {

                        val result =
                            device.setPairingConfirmation(
                                true
                            )

                        Log.d(
                            TAG,
                            "setPairingConfirmation(true) -> " +
                                result
                        )

                    } catch (e: Exception) {

                        Log.e(
                            TAG,
                            "setPairingConfirmation() failed",
                            e
                        )
                    }
                }

                else -> {

                    Log.w(
                        TAG,
                        "Unknown pairing variant: $variant"
                    )

                    try {

                        val result =
                            device.setPairingConfirmation(
                                true
                            )

                        Log.d(
                            TAG,
                            "Fallback confirmation -> $result"
                        )

                    } catch (e: Exception) {

                        Log.e(
                            TAG,
                            "Fallback pairing confirmation failed",
                            e
                        )
                    }
                }
            }

        } catch (e: Exception) {

            Log.e(
                TAG,
                "Exception handling pairing request",
                e
            )
        }
    }

    private fun registerPairingReceiver() {

        if (pairingReceiverRegistered) {
            return
        }

        val filter =
            IntentFilter().apply {

                addAction(
                    BluetoothDevice.ACTION_PAIRING_REQUEST
                )

                addAction(
                    BluetoothDevice.ACTION_BOND_STATE_CHANGED
                )
            }

        try {

            if (
                Build.VERSION.SDK_INT >=
                Build.VERSION_CODES.TIRAMISU
            ) {

                reactContext.registerReceiver(
                    pairingReceiver,
                    filter,
                    Context.RECEIVER_EXPORTED
                )

            } else {

                @Suppress("DEPRECATION")
                reactContext.registerReceiver(
                    pairingReceiver,
                    filter
                )
            }

            pairingReceiverRegistered = true

            Log.d(
                TAG,
                "Bluetooth pairing receiver registered"
            )

        } catch (e: Exception) {

            Log.e(
                TAG,
                "Failed to register pairing receiver",
                e
            )
        }
    }

    private fun unregisterPairingReceiver() {

        if (!pairingReceiverRegistered) {
            return
        }

        try {

            reactContext.unregisterReceiver(
                pairingReceiver
            )

            Log.d(
                TAG,
                "Bluetooth pairing receiver unregistered"
            )

        } catch (e: Exception) {

            Log.w(
                TAG,
                "Failed to unregister pairing receiver",
                e
            )
        }

        pairingReceiverRegistered = false
    }

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun connectBleDevice(
        address: String,
        password: String?,
        promise: Promise
    ) {

        Log.d(TAG, "========================================")
        Log.d(TAG, "connectBleDevice()")
        Log.d(TAG, "Address : $address")
        Log.d(TAG, "========================================")

        if (connectionInProgress) {

            promise.reject(
                ERROR_CONNECTION_IN_PROGRESS,
                "Bluetooth connection already in progress"
            )

            return
        }

        val adapter = bluetoothAdapter

        if (adapter == null) {

            promise.reject(
                ERROR_BLUETOOTH_DISABLED,
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

            } catch (e: IllegalArgumentException) {

                promise.reject(
                    ERROR_DEVICE_NOT_FOUND,
                    "Invalid Bluetooth address: $address",
                    e
                )

                return
            }

        pendingPromise = promise
        pendingDevice = device

        pairOnlyRequest = false

        pendingPairingPin =
            if (password.isNullOrBlank()) {
                DEFAULT_PAIRING_PIN
            } else {
                password
            }

        connectionInProgress = true
        pairingInProgress = false
        servicesDiscovered = false
        rxNotificationConfigured = false

        Log.d(
            TAG,
            "SMP pairing PIN configured: $pendingPairingPin"
        )

        val bondState =
            try {
                device.bondState
            } catch (_: Exception) {
                BluetoothDevice.BOND_NONE
            }

        Log.d(
            TAG,
            "Bond state = ${bondStateName(bondState)}"
        )

        when (bondState) {

            BluetoothDevice.BOND_BONDED -> {

                Log.d(
                    TAG,
                    "Device already bonded"
                )

                unregisterPairingReceiver()

                connectGatt(device)
            }

            BluetoothDevice.BOND_BONDING -> {

                Log.d(
                    TAG,
                    "Device already bonding"
                )

                pairingInProgress = true

                registerPairingReceiver()
            }

            else -> {

                Log.d(
                    TAG,
                    "Device not bonded - starting pairing"
                )

                registerPairingReceiver()

                createBond(device)
            }
        }
    }

    @SuppressLint("MissingPermission")
    private fun createBond(
        device: BluetoothDevice
    ) {

        Log.d(TAG, "========================================")
        Log.d(TAG, "STARTING BLE PAIRING")
        Log.d(TAG, "Device : ${device.address}")
        Log.d(TAG, "Name   : ${safeDeviceName(device)}")
        Log.d(TAG, "PIN    : $pendingPairingPin")
        Log.d(
            TAG,
            "Bond before createBond(): " +
                bondStateName(device.bondState)
        )
        Log.d(TAG, "========================================")

        pairingInProgress = true

        val result =
            try {

                device.createBond()

            } catch (e: Exception) {

                Log.e(
                    TAG,
                    "createBond() exception",
                    e
                )

                false
            }

        Log.d(
            TAG,
            "createBond() -> $result"
        )

        val state =
            try {
                device.bondState
            } catch (_: Exception) {
                BluetoothDevice.BOND_NONE
            }

        Log.d(
            TAG,
            "Bond immediately after createBond(): " +
                bondStateName(state)
        )

        if (result) {
            return
        }

        if (
            state ==
            BluetoothDevice.BOND_BONDED
        ) {

            pairingInProgress = false
            unregisterPairingReceiver()

            if (pairOnlyRequest) {

                val promise = pendingPromise

                pendingPromise = null
                pendingDevice = null

                pairOnlyRequest = false
                connectionInProgress = false

                promise?.resolve(true)

            } else {

                connectGatt(device)
            }

            return
        }

        if (
            state ==
            BluetoothDevice.BOND_BONDING
        ) {

            pairingInProgress = true
            return
        }

        pairingInProgress = false

        unregisterPairingReceiver()

        failPendingConnection(
            ERROR_PAIRING_FAILED,
            "Could not start Bluetooth pairing"
        )
    }

    private fun handleGattReady() {

        Log.d(TAG, "========================================")
        Log.d(TAG, "ALX GATT FULLY READY")
        Log.d(
            TAG,
            "Services discovered : $servicesDiscovered"
        )
        Log.d(
            TAG,
            "RX notifications    : confirmed"
        )
        Log.d(TAG, "========================================")

        if (activeGatt == null) {

            Log.e(
                TAG,
                "GATT ready received but activeGatt == null"
            )

            return
        }

        rxNotificationConfigured = true
        connectionInProgress = false
        pairingInProgress = false

        val promise = pendingPromise

        pendingPromise = null
        pendingDevice = null
        pairOnlyRequest = false

        unregisterPairingReceiver()

        if (promise != null) {

            Log.d(
                TAG,
                "Resolving connectBleDevice() promise"
            )

            val result =
                Arguments
                    .createMap()
                    .apply {

                        putBoolean(
                            "connected",
                            true
                        )

                        putBoolean(
                            "gattReady",
                            true
                        )

                        putBoolean(
                            "servicesDiscovered",
                            servicesDiscovered
                        )

                        putBoolean(
                            "notificationsConfigured",
                            true
                        )

                        putString(
                            "address",
                            activeDevice?.address
                        )

                        putString(
                            "name",
                            safeDeviceName(activeDevice)
                        )
                    }

            promise.resolve(result)
        }

        Log.d(
            TAG,
            "Connection workflow complete"
        )
    }

    @SuppressLint("MissingPermission")
    private fun connectGatt(
        device: BluetoothDevice
    ) {

        Log.d(TAG, "========================================")
        Log.d(TAG, "OPENING GATT")
        Log.d(TAG, "Device : ${device.address}")
        Log.d(TAG, "Name   : ${safeDeviceName(device)}")
        Log.d(
            TAG,
            "Bond   : ${bondStateName(device.bondState)}"
        )
        Log.d(TAG, "========================================")

        activeGatt?.let { oldGatt ->

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

        servicesDiscovered = false
        rxNotificationConfigured = false

        try {
            AlxBleTransportModule.clearGatt()
        } catch (e: Exception) {
            Log.w(
                TAG,
                "AlxBleTransportModule.clearGatt() failed",
                e
            )
        }

        try {
            AlxBleGattModule.clearGatt()
        } catch (e: Exception) {
            Log.w(
                TAG,
                "AlxBleGattModule.clearGatt() failed",
                e
            )
        }

        val gatt =
            try {

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

            } catch (e: Exception) {

                Log.e(
                    TAG,
                    "connectGatt() exception",
                    e
                )

                null
            }

        if (gatt == null) {

            failPendingConnection(
                ERROR_CONNECTION_FAILED,
                "connectGatt() returned null"
            )

            return
        }

        activeGatt = gatt

        Log.d(
            TAG,
            "connectGatt() returned GATT object"
        )
    }

    private val gattCallback =
        object : BluetoothGattCallback() {

            @SuppressLint("MissingPermission")
            override fun onConnectionStateChange(
                gatt: BluetoothGatt,
                status: Int,
                newState: Int
            ) {

                Log.d(
                    TAG,
                    "onConnectionStateChange() " +
                        "status=$status " +
                        "(${gattStatusName(status)}) " +
                        "state=$newState"
                )

                val currentGatt = activeGatt

                if (
                    currentGatt != null &&
                    currentGatt !== gatt
                ) {

                    Log.w(
                        TAG,
                        "Ignoring stale GATT callback from " +
                            "${gatt.device.address}"
                    )

                    return
                }

                when (newState) {

                    BluetoothProfile.STATE_CONNECTED -> {

                        Log.d(TAG, "========================================")
                        Log.d(TAG, "BLE GATT CONNECTED")
                        Log.d(
                            TAG,
                            "Status : $status " +
                                "(${gattStatusName(status)})"
                        )
                        Log.d(
                            TAG,
                            "Device : ${gatt.device.address}"
                        )
                        Log.d(
                            TAG,
                            "Bond   : " +
                                bondStateName(
                                    gatt.device.bondState
                                )
                        )
                        Log.d(TAG, "========================================")

                        activeGatt = gatt
                        activeDevice = gatt.device

                        servicesDiscovered = false
                        rxNotificationConfigured = false

                        emitConnected(gatt.device)

                        val started =
                            try {
                                gatt.discoverServices()
                            } catch (e: Exception) {
                                Log.e(
                                    TAG,
                                    "discoverServices() exception",
                                    e
                                )
                                false
                            }

                        Log.d(
                            TAG,
                            "discoverServices() -> $started"
                        )

                        if (!started) {

                            failPendingConnection(
                                ERROR_CONNECTION_FAILED,
                                "discoverServices() failed to start"
                            )
                        }
                    }

                    BluetoothProfile.STATE_DISCONNECTED -> {

                        Log.d(TAG, "========================================")
                        Log.d(TAG, "BLE GATT DISCONNECTED")
                        Log.d(
                            TAG,
                            "Status : $status " +
                                "(${gattStatusName(status)})"
                        )
                        Log.d(
                            TAG,
                            "Device : ${gatt.device.address}"
                        )
                        Log.d(TAG, "========================================")

                        servicesDiscovered = false
                        rxNotificationConfigured = false

                        emitDisconnected(
                            gatt.device,
                            status
                        )

                        try {
                            AlxBleTransportModule.clearGatt()
                        } catch (_: Exception) {
                        }

                        try {
                            AlxBleGattModule.clearGatt()
                        } catch (_: Exception) {
                        }

                        if (activeGatt === gatt) {

                            activeGatt = null
                            activeDevice = null
                        }

                        if (
                            pendingPromise != null &&
                            connectionInProgress
                        ) {

                            val promise = pendingPromise

                            pendingPromise = null
                            pendingDevice = null

                            pairOnlyRequest = false
                            connectionInProgress = false
                            pairingInProgress = false

                            promise?.reject(
                                ERROR_CONNECTION_FAILED,
                                "BLE disconnected before connection was ready"
                            )
                        }

                        try {
                            gatt.close()
                        } catch (_: Exception) {
                        }
                    }
                }
            }

            override fun onServicesDiscovered(
                gatt: BluetoothGatt,
                status: Int
            ) {

                if (
                    activeGatt != null &&
                    activeGatt !== gatt
                ) {

                    Log.w(
                        TAG,
                        "Ignoring stale service discovery callback"
                    )

                    return
                }

                Log.d(TAG, "========================================")
                Log.d(TAG, "GATT SERVICES DISCOVERED")
                Log.d(
                    TAG,
                    "Status : $status " +
                        "(${gattStatusName(status)})"
                )
                Log.d(
                    TAG,
                    "Services: ${gatt.services.size}"
                )
                Log.d(TAG, "========================================")

                if (
                    status !=
                    BluetoothGatt.GATT_SUCCESS
                ) {

                    Log.e(
                        TAG,
                        "Service discovery failed: " +
                            "$status (${gattStatusName(status)})"
                    )

                    failPendingConnection(
                        ERROR_CONNECTION_FAILED,
                        "GATT service discovery failed: $status"
                    )

                    return
                }

                activeGatt = gatt
                activeDevice = gatt.device
                servicesDiscovered = true

                try {

                    AlxBleGattModule.setGatt(gatt)

                    AlxBleGattModule.onServicesDiscovered(
                        gatt
                    )

                } catch (e: Exception) {

                    Log.e(
                        TAG,
                        "AlxBleGattModule service processing failed",
                        e
                    )

                    failPendingConnection(
                        ERROR_CONNECTION_FAILED,
                        "ALX GATT processing failed"
                    )
                }
            }

            override fun onCharacteristicRead(
                gatt: BluetoothGatt,
                characteristic: BluetoothGattCharacteristic,
                value: ByteArray,
                status: Int
            ) {

                if (
                    activeGatt != null &&
                    activeGatt !== gatt
                ) {
                    return
                }

                Log.d(
                    TAG,
                    "onCharacteristicRead: " +
                        "${characteristic.uuid} " +
                        "length=${value.size} " +
                        "status=$status"
                )

                try {

                    AlxBleTransportModule.onCharacteristicRead(
                        gatt,
                        characteristic,
                        value,
                        status
                    )

                } catch (e: Exception) {

                    Log.w(
                        TAG,
                        "AlxBleTransportModule.onCharacteristicRead() failed",
                        e
                    )
                }
            }

            @Suppress("DEPRECATION")
            override fun onCharacteristicRead(
                gatt: BluetoothGatt,
                characteristic: BluetoothGattCharacteristic,
                status: Int
            ) {

                if (
                    activeGatt != null &&
                    activeGatt !== gatt
                ) {
                    return
                }

                val value =
                    characteristic.value
                        ?: ByteArray(0)

                Log.d(
                    TAG,
                    "onCharacteristicRead(legacy): " +
                        "${characteristic.uuid} " +
                        "length=${value.size} " +
                        "status=$status"
                )

                try {

                    AlxBleTransportModule.onCharacteristicReadLegacy(
                        gatt,
                        characteristic,
                        status
                    )

                } catch (e: Exception) {

                    Log.w(
                        TAG,
                        "AlxBleTransportModule.onCharacteristicReadLegacy() failed",
                        e
                    )
                }
            }

            override fun onCharacteristicChanged(
                gatt: BluetoothGatt,
                characteristic: BluetoothGattCharacteristic,
                value: ByteArray
            ) {

                if (
                    activeGatt != null &&
                    activeGatt !== gatt
                ) {
                    return
                }

                Log.d(
                    TAG,
                    "onCharacteristicChanged: " +
                        "${characteristic.uuid} " +
                        "length=${value.size}"
                )

                try {

                    AlxBleTransportModule.onCharacteristicChanged(
                        characteristic,
                        value
                    )

                } catch (e: Exception) {

                    Log.w(
                        TAG,
                        "AlxBleTransportModule.onCharacteristicChanged() failed",
                        e
                    )
                }
            }

            @Suppress("DEPRECATION")
            override fun onCharacteristicChanged(
                gatt: BluetoothGatt,
                characteristic: BluetoothGattCharacteristic
            ) {

                if (
                    activeGatt != null &&
                    activeGatt !== gatt
                ) {
                    return
                }

                val value =
                    characteristic.value
                        ?: ByteArray(0)

                Log.d(
                    TAG,
                    "onCharacteristicChanged(legacy): " +
                        "${characteristic.uuid} " +
                        "length=${value.size}"
                )

                try {

                    AlxBleTransportModule.onCharacteristicChanged(
                        characteristic,
                        value
                    )

                } catch (e: Exception) {

                    Log.w(
                        TAG,
                        "AlxBleTransportModule.onCharacteristicChanged() " +
                            "legacy failed",
                        e
                    )
                }
            }

            override fun onCharacteristicWrite(
                gatt: BluetoothGatt,
                characteristic: BluetoothGattCharacteristic,
                status: Int
            ) {

                if (
                    activeGatt != null &&
                    activeGatt !== gatt
                ) {
                    return
                }

                Log.d(
                    TAG,
                    "onCharacteristicWrite: " +
                        "${characteristic.uuid} " +
                        "status=$status " +
                        "(${gattStatusName(status)})"
                )

                try {

                    AlxBleTransportModule.onCharacteristicWrite(
                        gatt,
                        characteristic,
                        status
                    )

                } catch (e: Exception) {

                    Log.w(
                        TAG,
                        "AlxBleTransportModule.onCharacteristicWrite() failed",
                        e
                    )
                }
            }

            override fun onDescriptorWrite(
                gatt: BluetoothGatt,
                descriptor: BluetoothGattDescriptor,
                status: Int
            ) {

                if (
                    activeGatt != null &&
                    activeGatt !== gatt
                ) {
                    return
                }

                Log.d(
                    TAG,
                    "onDescriptorWrite: " +
                        "characteristic=${descriptor.characteristic.uuid} " +
                        "descriptor=${descriptor.uuid} " +
                        "status=$status " +
                        "(${gattStatusName(status)})"
                )

                try {

                    AlxBleGattModule.onDescriptorWrite(
                        gatt,
                        descriptor,
                        status
                    )

                } catch (e: Exception) {

                    Log.w(
                        TAG,
                        "AlxBleGattModule.onDescriptorWrite() failed",
                        e
                    )
                }

                try {

                    AlxBleTransportModule.onDescriptorWrite(
                        gatt,
                        descriptor,
                        status
                    )

                } catch (e: Exception) {

                    Log.w(
                        TAG,
                        "AlxBleTransportModule.onDescriptorWrite() failed",
                        e
                    )
                }
            }
        }

    @SuppressLint("MissingPermission")
    private fun emitConnected(
        device: BluetoothDevice
    ) {

        val params =
            Arguments
                .createMap()
                .apply {

                    putString(
                        "address",
                        device.address
                    )

                    putString(
                        "name",
                        safeDeviceName(device)
                    )

                    putBoolean(
                        "bonded",
                        try {
                            device.bondState ==
                                BluetoothDevice.BOND_BONDED
                        } catch (_: Exception) {
                            false
                        }
                    )

                    putBoolean(
                        "gattReady",
                        false
                    )
                }

        sendEvent(
            EVENT_CONNECTED,
            params
        )
    }

    private fun emitDisconnected(
        device: BluetoothDevice?,
        status: Int
    ) {

        val params =
            Arguments
                .createMap()
                .apply {

                    putString(
                        "address",
                        device?.address
                    )

                    putString(
                        "name",
                        safeDeviceName(device)
                    )

                    putInt(
                        "status",
                        status
                    )

                    putString(
                        "statusName",
                        gattStatusName(status)
                    )
                }

        sendEvent(
            EVENT_DISCONNECTED,
            params
        )
    }

    private fun sendEvent(
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

            Log.w(
                TAG,
                "Could not emit event $eventName",
                e
            )
        }
    }

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun disconnectBleDevice(
        promise: Promise
    ) {

        Log.d(
            TAG,
            "disconnectBleDevice()"
        )

        unregisterPairingReceiver()

        pairingInProgress = false
        connectionInProgress = false
        pairOnlyRequest = false

        val pending = pendingPromise

        pendingPromise = null
        pendingDevice = null

        val gatt = activeGatt

        activeGatt = null
        activeDevice = null

        servicesDiscovered = false
        rxNotificationConfigured = false

        try {
            AlxBleTransportModule.clearGatt()
        } catch (_: Exception) {
        }

        try {
            AlxBleGattModule.clearGatt()
        } catch (_: Exception) {
        }

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

        pending?.reject(
            ERROR_CONNECTION_FAILED,
            "Bluetooth connection cancelled"
        )

        promise.resolve(true)
    }

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun getConnectionState(
        promise: Promise
    ) {

        val device = activeDevice
        val gatt = activeGatt

        val bondState =
            try {
                device?.bondState
                    ?: BluetoothDevice.BOND_NONE
            } catch (_: Exception) {
                BluetoothDevice.BOND_NONE
            }

        val bonded =
            bondState ==
                BluetoothDevice.BOND_BONDED

        val ready =
            gatt != null &&
                servicesDiscovered &&
                rxNotificationConfigured

        val result =
            Arguments
                .createMap()
                .apply {

                    putBoolean(
                        "connected",
                        ready
                    )

                    putBoolean(
                        "gattConnected",
                        gatt != null
                    )

                    putBoolean(
                        "servicesDiscovered",
                        servicesDiscovered
                    )

                    putBoolean(
                        "notificationsConfigured",
                        rxNotificationConfigured
                    )

                    putBoolean(
                        "gattReady",
                        ready
                    )

                    putBoolean(
                        "pairing",
                        pairingInProgress
                    )

                    putBoolean(
                        "connectionInProgress",
                        connectionInProgress
                    )

                    putBoolean(
                        "bonded",
                        bonded
                    )

                    putBoolean(
                        "paired",
                        bonded
                    )

                    putString(
                        "bondState",
                        bondStateName(bondState)
                    )

                    putString(
                        "address",
                        device?.address
                    )

                    putString(
                        "name",
                        safeDeviceName(device)
                    )
                }

        promise.resolve(result)
    }

    @ReactMethod
    fun isBluetoothEnabled(
        promise: Promise
    ) {

        val enabled =
            try {
                bluetoothAdapter?.isEnabled == true
            } catch (_: Exception) {
                false
            }

        promise.resolve(enabled)
    }

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun isDeviceBonded(
        address: String,
        promise: Promise
    ) {

        val adapter = bluetoothAdapter

        if (adapter == null) {

            promise.resolve(false)
            return
        }

        val device =
            try {
                adapter.getRemoteDevice(address)
            } catch (_: Exception) {
                promise.resolve(false)
                return
            }

        promise.resolve(
            device.bondState ==
                BluetoothDevice.BOND_BONDED
        )
    }

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun pairBleDevice(
        address: String,
        password: String?,
        promise: Promise
    ) {

        if (connectionInProgress) {

            promise.reject(
                ERROR_CONNECTION_IN_PROGRESS,
                "Bluetooth connection already in progress"
            )

            return
        }

        val adapter = bluetoothAdapter

        if (adapter == null) {

            promise.reject(
                ERROR_BLUETOOTH_DISABLED,
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
                adapter.getRemoteDevice(address)
            } catch (e: Exception) {

                promise.reject(
                    ERROR_DEVICE_NOT_FOUND,
                    "Invalid Bluetooth address",
                    e
                )

                return
            }

        pendingPairingPin =
            if (password.isNullOrBlank()) {
                DEFAULT_PAIRING_PIN
            } else {
                password
            }

        pendingDevice = device
        pendingPromise = promise

        pairingInProgress = true
        connectionInProgress = true
        pairOnlyRequest = true

        if (
            device.bondState ==
            BluetoothDevice.BOND_BONDED
        ) {

            pairingInProgress = false
            connectionInProgress = false
            pairOnlyRequest = false

            pendingPromise = null
            pendingDevice = null

            promise.resolve(true)

            return
        }

        registerPairingReceiver()

        createBond(device)
    }

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

    private fun gattStatusName(
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

    private fun failPendingConnection(
        code: String,
        message: String
    ) {

        Log.e(
            TAG,
            "$code: $message"
        )

        unregisterPairingReceiver()

        pairingInProgress = false
        connectionInProgress = false
        pairOnlyRequest = false

        val promise = pendingPromise

        pendingPromise = null
        pendingDevice = null

        promise?.reject(
            code,
            message
        )
    }

    override fun invalidate() {

        Log.d(
            TAG,
            "BluetoothConnectionModule.invalidate()"
        )

        unregisterPairingReceiver()

        pairingInProgress = false
        connectionInProgress = false
        pairOnlyRequest = false

        pendingPromise = null
        pendingDevice = null

        val gatt = activeGatt

        activeGatt = null
        activeDevice = null

        servicesDiscovered = false
        rxNotificationConfigured = false

        try {
            AlxBleTransportModule.clearGatt()
        } catch (_: Exception) {
        }

        try {
            AlxBleGattModule.clearGatt()
        } catch (_: Exception) {
        }

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

        instance = null

        super.invalidate()
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

    init {

        instance = this

        Log.d(TAG, "========================================")
        Log.d(
            TAG,
            "BluetoothConnectionModule initialized"
        )
        Log.d(
            TAG,
            "ALX connection mode: BLE PAIRING + GATT"
        )
        Log.d(
            TAG,
            "Default SMP pairing PIN: $DEFAULT_PAIRING_PIN"
        )
        Log.d(TAG, "========================================")
    }
}