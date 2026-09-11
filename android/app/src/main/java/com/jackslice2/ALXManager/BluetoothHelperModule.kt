package com.allexo.alxmobile

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class BluetoothHelperModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private var bluetoothLeScanner: BluetoothLeScanner? = null
    private var scanCallback: ScanCallback? = null

    override fun getName(): String {
        return "BluetoothHelper"
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required by React Native NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required by React Native NativeEventEmitter
    }

    @ReactMethod
    fun isBluetoothEnabled(promise: Promise) {
        try {
            val bluetoothManager =
                reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager

            val adapter: BluetoothAdapter? = bluetoothManager.adapter

            promise.resolve(adapter?.isEnabled == true)
        } catch (e: Exception) {
            promise.reject("BLUETOOTH_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun startBleScan(promise: Promise) {
        try {
            val bluetoothManager =
                reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager

            val adapter = bluetoothManager.adapter
                ?: throw Exception("Bluetooth adapter unavailable")

            if (!adapter.isEnabled) {
                promise.reject(
                    "BLUETOOTH_DISABLED",
                    "Bluetooth is disabled"
                )
                return
            }

            // Prevent multiple scans
            stopCurrentScan()

            bluetoothLeScanner = adapter.bluetoothLeScanner
                ?: throw Exception("BLE scanner unavailable")

            scanCallback = object : ScanCallback() {

                override fun onScanResult(
                    callbackType: Int,
                    result: ScanResult
                ) {
                    val device = result.device

                    val data = Arguments.createMap().apply {
                        putString("name", device.name ?: "Unknown")
                        putString("address", device.address)
                        putInt("rssi", result.rssi)
                    }

                    reactContext
                        .getJSModule(
                            DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
                        )
                        .emit(
                            "BluetoothDeviceFound",
                            data
                        )

                    android.util.Log.d(
                        "BluetoothHelper",
                        "BLE device found: " +
                            "${device.name ?: "Unknown"} / " +
                            "${device.address} / " +
                            "RSSI ${result.rssi}"
                    )
                }

                override fun onScanFailed(errorCode: Int) {
                    android.util.Log.e(
                        "BluetoothHelper",
                        "BLE scan failed: $errorCode"
                    )

                    reactContext
                        .getJSModule(
                            DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
                        )
                        .emit(
                            "BluetoothScanFailed",
                            errorCode
                        )
                }
            }

            bluetoothLeScanner?.startScan(scanCallback)

            android.util.Log.d(
                "BluetoothHelper",
                "BLE scan started"
            )

            promise.resolve(true)

        } catch (e: Exception) {
            promise.reject(
                "BLUETOOTH_SCAN_ERROR",
                e.message,
                e
            )
        }
    }

    @ReactMethod
    fun stopBleScan(promise: Promise) {
        try {
            stopCurrentScan()

            android.util.Log.d(
                "BluetoothHelper",
                "BLE scan stopped"
            )

            promise.resolve(true)

        } catch (e: Exception) {
            promise.reject(
                "BLUETOOTH_SCAN_STOP_ERROR",
                e.message,
                e
            )
        }
    }

    private fun stopCurrentScan() {
        val scanner = bluetoothLeScanner
        val callback = scanCallback

        if (scanner != null && callback != null) {
            scanner.stopScan(callback)
        }

        scanCallback = null
        bluetoothLeScanner = null
    }
}