package com.allexo.alxmobile.ble

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings

class BluetoothHelperModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "BluetoothHelper"
        private const val MODULE_NAME = "BluetoothHelper"

        private const val EVENT_DEVICE_FOUND = "BluetoothDeviceFound"
        private const val EVENT_SCAN_FAILED = "BluetoothScanFailed"

        private const val SCAN_DURATION_MS = 10_000L
        private const val DEVICE_NAME_PREFIX = "ALX"
    }

    private val bluetoothManager: BluetoothManager? =
        reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager

    private val bluetoothAdapter: BluetoothAdapter?
        get() = bluetoothManager?.adapter

    private var bluetoothLeScanner: BluetoothLeScanner? = null

    private val handler = Handler(Looper.getMainLooper())

    private var isScanning = false

    private val stopScanRunnable = Runnable {
        stopBleScanInternal()
    }

    private val scanCallback = object : ScanCallback() {

        override fun onScanResult(
            callbackType: Int,
            result: ScanResult
        ) {
            handleScanResult(result)
        }

        override fun onBatchScanResults(
            results: MutableList<ScanResult>
        ) {
            for (result in results) {
                handleScanResult(result)
            }
        }

        override fun onScanFailed(errorCode: Int) {
            isScanning = false
            bluetoothLeScanner = null

            handler.removeCallbacks(stopScanRunnable)

            android.util.Log.e(
                TAG,
                "BLE scan failed: errorCode=$errorCode"
            )

            val params = Arguments.createMap().apply {
                putInt("errorCode", errorCode)
            }

            sendEvent(EVENT_SCAN_FAILED, params)
        }
    }

    override fun getName(): String {
        return MODULE_NAME
    }

    // -------------------------------------------------------------------------
    // Bluetooth state
    // -------------------------------------------------------------------------

    @ReactMethod
    fun isBluetoothEnabled(promise: Promise) {
        try {
            val adapter = bluetoothAdapter

            if (adapter == null) {
                promise.reject(
                    "BLUETOOTH_UNAVAILABLE",
                    "Bluetooth adapter is not available"
                )
                return
            }

            promise.resolve(adapter.isEnabled)

        } catch (e: Exception) {
            promise.reject(
                "BLUETOOTH_STATE_ERROR",
                e.message,
                e
            )
        }
    }

    // -------------------------------------------------------------------------
    // Permissions
    // -------------------------------------------------------------------------

    private fun hasScanPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            reactApplicationContext.checkSelfPermission(
                Manifest.permission.BLUETOOTH_SCAN
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            reactApplicationContext.checkSelfPermission(
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        }
    }

    // -------------------------------------------------------------------------
    // BLE scanning
    // -------------------------------------------------------------------------

    @ReactMethod
    fun startBleScan(promise: Promise) {
        try {
            android.util.Log.d(TAG, "Starting BLE scan")

            val adapter = bluetoothAdapter

            if (adapter == null) {
                promise.reject(
                    "BLUETOOTH_UNAVAILABLE",
                    "Bluetooth adapter is not available"
                )
                return
            }

            if (!adapter.isEnabled) {
                promise.reject(
                    "BLUETOOTH_DISABLED",
                    "Bluetooth is disabled"
                )
                return
            }

            if (!hasScanPermission()) {
                promise.reject(
                    "BLUETOOTH_SCAN_PERMISSION_DENIED",
                    "Bluetooth scan permission has not been granted"
                )
                return
            }

            if (isScanning) {
                android.util.Log.d(
                    TAG,
                    "BLE scan already running"
                )

                promise.resolve(true)
                return
            }

            val scanner = adapter.bluetoothLeScanner

            if (scanner == null) {
                promise.reject(
                    "BLE_SCANNER_UNAVAILABLE",
                    "Bluetooth LE scanner is not available"
                )
                return
            }

            bluetoothLeScanner = scanner

            val settings = ScanSettings.Builder()
                .setScanMode(
                    ScanSettings.SCAN_MODE_LOW_LATENCY
                )
                .build()

            handler.removeCallbacks(stopScanRunnable)

            scanner.startScan(
                null,
                settings,
                scanCallback
            )

            isScanning = true

            handler.postDelayed(
                stopScanRunnable,
                SCAN_DURATION_MS
            )

            android.util.Log.d(
                TAG,
                "BLE scan started"
            )

            promise.resolve(true)

        } catch (e: SecurityException) {
            android.util.Log.e(
                TAG,
                "BLE scan permission/security error",
                e
            )

            promise.reject(
                "BLUETOOTH_SCAN_SECURITY_ERROR",
                e.message,
                e
            )

        } catch (e: Exception) {
            android.util.Log.e(
                TAG,
                "Failed to start BLE scan",
                e
            )

            promise.reject(
                "BLE_SCAN_START_FAILED",
                e.message,
                e
            )
        }
    }

    @ReactMethod
    fun stopBleScan(promise: Promise) {
        try {
            stopBleScanInternal()

            promise.resolve(true)

        } catch (e: Exception) {
            promise.reject(
                "BLE_SCAN_STOP_FAILED",
                e.message,
                e
            )
        }
    }

    private fun stopBleScanInternal() {
        handler.removeCallbacks(stopScanRunnable)

        val scanner = bluetoothLeScanner

        if (scanner != null && isScanning) {
            try {
                if (hasScanPermission()) {
                    scanner.stopScan(scanCallback)

                    android.util.Log.d(
                        TAG,
                        "BLE scan stopped"
                    )
                }
            } catch (e: SecurityException) {
                android.util.Log.e(
                    TAG,
                    "Unable to stop BLE scan",
                    e
                )
            } catch (e: Exception) {
                android.util.Log.e(
                    TAG,
                    "Error stopping BLE scan",
                    e
                )
            }
        }

        isScanning = false
        bluetoothLeScanner = null
    }

    // -------------------------------------------------------------------------
    // Scan result handling
    // -------------------------------------------------------------------------

    private fun handleScanResult(result: ScanResult) {
        try {
            val device = result.device

            val name = try {
                device.name
            } catch (e: SecurityException) {
                null
            }

            val address = device.address

            android.util.Log.d(
                TAG,
                "BLE device found: name=$name address=$address rssi=${result.rssi}"
            )

            /*
             * ALX devices are identified by their advertised/device name.
             *
             * Keep the filter here so the React Native side only receives
             * relevant ALX devices.
             */
            if (name.isNullOrBlank()) {
                return
            }

            if (!name.startsWith(
                    DEVICE_NAME_PREFIX,
                    ignoreCase = true
                )
            ) {
                return
            }

            val params: WritableMap = Arguments.createMap().apply {
                putString("name", name)
                putString("address", address)
                putInt("rssi", result.rssi)
                putInt("callbackType", 1)
            }

            sendEvent(
                EVENT_DEVICE_FOUND,
                params
            )

        } catch (e: SecurityException) {
            android.util.Log.e(
                TAG,
                "Unable to read BLE scan result",
                e
            )
        } catch (e: Exception) {
            android.util.Log.e(
                TAG,
                "Error processing BLE scan result",
                e
            )
        }
    }

    // -------------------------------------------------------------------------
    // React Native events
    // -------------------------------------------------------------------------

    private fun sendEvent(
        eventName: String,
        params: WritableMap
    ) {
        if (!reactApplicationContext.hasActiveCatalystInstance()) {
            android.util.Log.w(
                TAG,
                "React context is not active; dropping event=$eventName"
            )
            return
        }

        reactApplicationContext
            .getJSModule(
                DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
            )
            .emit(
                eventName,
                params
            )
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required by NativeEventEmitter.
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required by NativeEventEmitter.
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    override fun invalidate() {
        android.util.Log.d(
            TAG,
            "Invalidating BluetoothHelper"
        )

        stopBleScanInternal()

        super.invalidate()
    }
}