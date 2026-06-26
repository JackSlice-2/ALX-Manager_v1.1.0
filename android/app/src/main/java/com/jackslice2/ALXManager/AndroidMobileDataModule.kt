package com.jackslice2.ALXMobile

import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import com.facebook.react.bridge.*
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

class AndroidMobileDataModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private val connectivityManager: ConnectivityManager =
        reactContext.getSystemService(ConnectivityManager::class.java)

    override fun getName(): String = "AndroidMobileData"

@ReactMethod
fun fetchUsingCellular(urlString: String, promise: Promise) {

    android.util.Log.d("CELLULAR", "START fetchUsingCellular")

    try {

        // 1. CHECK EXISTING CELLULAR FIRST (Samsung fix)
        val cellularNetwork = connectivityManager.allNetworks.firstOrNull { network ->
            val caps = connectivityManager.getNetworkCapabilities(network)
            caps?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true &&
            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        }

        if (cellularNetwork != null) {
            android.util.Log.d("CELLULAR", "Using existing cellular network")

            Thread {
                try {
                    val conn = cellularNetwork.openConnection(URL(urlString)) as HttpURLConnection
                    conn.connectTimeout = 5000
                    conn.readTimeout = 5000

                    val code = conn.responseCode
                    val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                    val result = BufferedReader(InputStreamReader(stream)).readText()

                    promise.resolve(result)

                } catch (e: Exception) {
                    android.util.Log.e("CELLULAR", "ERROR_FETCH_EXISTING", e)
                    promise.reject("ERROR_FETCH", e)
                }
            }.start()

            return
        }

        // 2. FALLBACK: REQUEST NETWORK
        android.util.Log.d("CELLULAR", "Requesting cellular network")

        val request = NetworkRequest.Builder()
            .addTransportType(NetworkCapabilities.TRANSPORT_CELLULAR)
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        val callback = object : ConnectivityManager.NetworkCallback() {

            override fun onAvailable(network: Network) {

                android.util.Log.d("CELLULAR", "onAvailable fired")

                Thread {
                    try {
                        val conn = network.openConnection(URL(urlString)) as HttpURLConnection
                        conn.connectTimeout = 5000
                        conn.readTimeout = 5000

                        val code = conn.responseCode
                        val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                        val result = BufferedReader(InputStreamReader(stream)).readText()

                        connectivityManager.unregisterNetworkCallback(this)
                        promise.resolve(result)

                    } catch (e: Exception) {
                        connectivityManager.unregisterNetworkCallback(this)
                        promise.reject("ERROR_FETCH", e)
                    }
                }.start()
            }

            override fun onUnavailable() {
                android.util.Log.d("CELLULAR", "onUnavailable fired")
                promise.reject("NO_CELLULAR", "Cellular unavailable")
            }

        }

        connectivityManager.requestNetwork(request, callback, 10000)

    } catch (e: Exception) {
        android.util.Log.e("CELLULAR", "ERR_INIT", e)
        promise.reject("ERR_INIT", e)
    }
}
}
