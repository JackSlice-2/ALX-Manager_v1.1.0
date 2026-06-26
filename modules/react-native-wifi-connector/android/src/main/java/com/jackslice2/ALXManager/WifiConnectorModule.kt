package com.jackslice2.ALXMobile

import android.content.Context
import android.content.Intent
import android.net.*
import android.net.wifi.WifiManager
import android.net.wifi.WifiNetworkSuggestion
import android.net.wifi.WifiNetworkSpecifier
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = WifiConnectorModule.NAME)
class WifiConnectorModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "WifiConnector"
    }

    private var connectivityManager: ConnectivityManager? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private val suggestionList = mutableListOf<WifiNetworkSuggestion>()

    override fun getName(): String = NAME

    override fun onCatalystInstanceDestroy() {
        clearInternal()
        removeNetworkSuggestionsInternal()
        super.onCatalystInstanceDestroy()
    }

    @ReactMethod
    fun openWifiPicker(promise: Promise) {
        try {
            val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                Intent(Settings.Panel.ACTION_INTERNET_CONNECTIVITY)
            } else {
                Intent(Settings.ACTION_WIFI_SETTINGS)
            }
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("OPEN_WIFI_PICKER_ERROR", e)
        }
    }

    @ReactMethod
    fun connect(ssid: String?, password: String?, promise: Promise) {
        if (ssid.isNullOrEmpty()) {
            promise.reject("INVALID_ARGUMENT", "SSID is required")
            return
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            promise.reject("API_TOO_LOW", "WifiNetworkSpecifier requires Android 10+")
            return
        }

        try {
            clearInternal()

            val specBuilder = WifiNetworkSpecifier.Builder().setSsid(ssid)
            if (!password.isNullOrEmpty()) specBuilder.setWpa2Passphrase(password)
            val specifier = specBuilder.build()

            val request = NetworkRequest.Builder()
                .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
                .setNetworkSpecifier(specifier)
                .build()

            val cm = reactContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            connectivityManager = cm

            val callback = object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    try {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            cm.bindProcessToNetwork(network)
                        } else {
                            ConnectivityManager.setProcessDefaultNetwork(network)
                        }
                    } catch (_: Exception) {}
                    promise.resolve(true)
                }

                override fun onUnavailable() {
                    promise.reject("UNAVAILABLE", "Connection failed or cancelled")
                }
            }

            networkCallback = callback
            cm.requestNetwork(request, callback)

            Handler(Looper.getMainLooper()).postDelayed({
                try {
                    promise.reject("TIMEOUT", "Timeout waiting for network (20s)")
                    clearInternal()
                } catch (_: Exception) {}
            }, 20_000)

        } catch (e: Exception) {
            promise.reject("CONNECT_ERROR", e)
        }
    }

    @ReactMethod
    fun suggestNetwork(ssid: String?, password: String?, isWpa2: Boolean, promise: Promise) {
        if (ssid.isNullOrEmpty()) {
            promise.reject("INVALID_ARGUMENT", "SSID is required")
            return
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            promise.reject("API_TOO_LOW", "WifiNetworkSuggestion requires Android 10+")
            return
        }

        try {
            val wifiManager = reactContext.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            val builder = WifiNetworkSuggestion.Builder().setSsid(ssid)
            if (!password.isNullOrEmpty() && isWpa2) builder.setWpa2Passphrase(password)
            val suggestion = builder.build()
            suggestionList.add(suggestion)
            wifiManager.addNetworkSuggestions(suggestionList)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SUGGESTION_ERROR", e)
        }
    }

    @ReactMethod
    fun removeSuggestions(promise: Promise) {
        try {
            removeNetworkSuggestionsInternal()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("REMOVE_SUGGESTIONS_ERROR", e)
        }
    }

    @ReactMethod
    fun clearBinding(promise: Promise? = null) {
        try {
            clearInternal()
            promise?.resolve(true)
        } catch (e: Exception) {
            promise?.reject("CLEAR_BINDING_ERROR", e)
        }
    }

    private fun removeNetworkSuggestionsInternal() {
        try {
            val wifiManager = reactContext.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            if (suggestionList.isNotEmpty()) {
                wifiManager.removeNetworkSuggestions(suggestionList)
                suggestionList.clear()
            }
        } catch (_: Exception) {}
    }

    private fun clearInternal() {
        try {
            connectivityManager?.let { cm ->
                networkCallback?.let { cm.unregisterNetworkCallback(it) }
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        cm.bindProcessToNetwork(null)
                    } else {
                        ConnectivityManager.setProcessDefaultNetwork(null)
                    }
                } catch (_: Exception) {}
            }
        } catch (_: Exception) {}
        networkCallback = null
        connectivityManager = null
    }
}
