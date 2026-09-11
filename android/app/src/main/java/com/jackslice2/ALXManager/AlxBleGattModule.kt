package com.allexo.alxmobile

import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.util.Log

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.modules.core.DeviceEventManagerModule

import java.util.UUID

class AlxBleGattModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "AlxBleGatt"

        const val SERVICE_UUID =
            "12345678-1234-5678-1234-56789abcdef7"

        const val TX_UUID =
            "12345678-1234-5678-1234-56789abcdef8"

        const val RX_UUID =
            "12345678-1234-5678-1234-56789abcdef9"

        const val RX2_UUID =
            "12345678-1234-5678-1234-56789abcdefa"

        private var instance: AlxBleGattModule? = null
        private var activeGatt: BluetoothGatt? = null

        fun setGatt(gatt: BluetoothGatt?) {
            activeGatt = gatt

            Log.d(
                TAG,
                "GATT: ${gatt?.device?.address ?: "null"}"
            )
        }

        fun clearGatt(gatt: BluetoothGatt?) {
            if (activeGatt === gatt) {
                activeGatt = null
                instance?.clearCharacteristics()

                Log.d(TAG, "GATT cleared")
            }
        }

        fun onServicesDiscovered(
            gatt: BluetoothGatt,
            status: Int
        ) {
            instance?.handleServicesDiscovered(
                gatt,
                status
            )
        }
    }

    private var txCharacteristic:
        BluetoothGattCharacteristic? = null

    private var rxCharacteristic:
        BluetoothGattCharacteristic? = null

    private var rx2Characteristic:
        BluetoothGattCharacteristic? = null

    override fun getName(): String {
        return "AlxBleGatt"
    }

    init {
        instance = this
        Log.d(TAG, "AlxBleGatt initialized")
    }

    // ---------------------------------------------------------
    // React Native event support
    // ---------------------------------------------------------

    @ReactMethod
    fun addListener(eventName: String) {
        // Required by NativeEventEmitter.
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required by NativeEventEmitter.
    }

    private fun emitEvent(
        name: String,
        payload: Any?
    ) {
        try {
            reactContext
                .getJSModule(
                    DeviceEventManagerModule
                        .RCTDeviceEventEmitter::class.java
                )
                .emit(name, payload)
        } catch (e: Exception) {
            Log.e(TAG, "Event error: $name", e)
        }
    }

    // ---------------------------------------------------------
    // Connection state
    // ---------------------------------------------------------

    @ReactMethod
    fun isConnected(promise: Promise) {
        promise.resolve(activeGatt != null)
    }

    // ---------------------------------------------------------
    // GATT discovery
    // ---------------------------------------------------------

    private fun handleServicesDiscovered(
        gatt: BluetoothGatt,
        status: Int
    ) {
        if (gatt !== activeGatt) {
            Log.w(TAG, "Ignoring stale GATT")
            return
        }

        if (status != BluetoothGatt.GATT_SUCCESS) {
            Log.e(
                TAG,
                "Service discovery failed: $status"
            )

            emitEvent(
                "AlxBleGattServiceDiscoveryFailed",
                Arguments.createMap().apply {
                    putInt("status", status)
                }
            )

            return
        }

        val service = gatt.getService(
            UUID.fromString(SERVICE_UUID)
        )

        if (service == null) {
            Log.e(TAG, "ALX service not found")

            emitEvent(
                "AlxBleGattError",
                Arguments.createMap().apply {
                    putString(
                        "error",
                        "ALX GATT service not found"
                    )
                }
            )

            return
        }

        txCharacteristic =
            service.getCharacteristic(
                UUID.fromString(TX_UUID)
            )

        rxCharacteristic =
            service.getCharacteristic(
                UUID.fromString(RX_UUID)
            )

        rx2Characteristic =
            service.getCharacteristic(
                UUID.fromString(RX2_UUID)
            )

        Log.d(
            TAG,
            "TX: ${txCharacteristic?.uuid ?: "NOT FOUND"}"
        )

        Log.d(
            TAG,
            "RX: ${rxCharacteristic?.uuid ?: "NOT FOUND"}"
        )

        Log.d(
            TAG,
            "RX2: ${rx2Characteristic?.uuid ?: "NOT FOUND"}"
        )

        txCharacteristic?.let {
            Log.d(
                TAG,
                "TX properties: 0x${it.properties.toString(16)}"
            )
        }

        rxCharacteristic?.let {
            Log.d(
                TAG,
                "RX properties: 0x${it.properties.toString(16)}"
            )
        }

        if (
            txCharacteristic == null ||
            rxCharacteristic == null
        ) {
            emitEvent(
                "AlxBleGattError",
                Arguments.createMap().apply {
                    putString(
                        "error",
                        "Required ALX characteristics not found"
                    )
                }
            )

            return
        }

        emitEvent(
            "AlxBleGattReady",
            Arguments.createMap().apply {
                putString(
                    "service",
                    SERVICE_UUID
                )

                putString(
                    "tx",
                    txCharacteristic!!.uuid.toString()
                )

                putString(
                    "rx",
                    rxCharacteristic!!.uuid.toString()
                )

                putString(
                    "rx2",
                    rx2Characteristic?.uuid?.toString() ?: ""
                )
            }
        )

        Log.d(
            TAG,
            "ALX GATT READY"
        )
    }

    // ---------------------------------------------------------
    // Cleanup
    // ---------------------------------------------------------

    private fun clearCharacteristics() {
        txCharacteristic = null
        rxCharacteristic = null
        rx2Characteristic = null
    }

    override fun invalidate() {
        clearCharacteristics()

        if (instance === this) {
            instance = null
        }

        super.invalidate()
    }
}