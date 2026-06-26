package com.jackslice2.ALXMobile

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.modules.core.DeviceEventManagerModule

import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest

import java.net.Socket
import java.net.InetSocketAddress
import java.net.URL

import java.io.BufferedWriter
import java.io.OutputStreamWriter
import java.io.InputStream

import java.net.HttpURLConnection

class OpenTCPSocketModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private var socket: Socket? = null

    private var writer: BufferedWriter? = null

    private var listeningThread: Thread? = null

    override fun getName(): String = "OpenTCPSocket"

    //
    // REQUIRED FOR NativeEventEmitter
    //
    @ReactMethod
    fun addListener(eventName: String?) {
    }

    @ReactMethod
    fun removeListeners(count: Int) {
    }

    private fun sendEventToJS(
        eventName: String,
        data: String
    ) {

        reactContext
            .getJSModule(
                DeviceEventManagerModule
                    .RCTDeviceEventEmitter::class.java
            )
            .emit(eventName, data)
    }

    @ReactMethod
    fun openTcpSocket(
        host: String,
        port: Int,
        promise: Promise
    ) {

        try {

            val connectivityManager =
                reactContext.getSystemService(
                    ConnectivityManager::class.java
                )

            val request =
                NetworkRequest.Builder()
                    .addTransportType(
                        NetworkCapabilities.TRANSPORT_CELLULAR
                    )
                    .addCapability(
                        NetworkCapabilities.NET_CAPABILITY_INTERNET
                    )
                    .build()

            val callback =
                object : ConnectivityManager.NetworkCallback() {

                    override fun onAvailable(
                        network: Network
                    ) {

                        Thread {

                            try {

                                sendEventToJS(
                                    "TcpStatus",
                                    "CONNECTING"
                                )

                                sendEventToJS(
                                    "TcpLog",
                                    "Warming up cellular..."
                                )

                                //
                                // IMPORTANT:
                                // warmup request stabilizes
                                // Xiaomi/Redmi cellular routing
                                //
                                val conn =
                                    network.openConnection(
                                        URL(
                                            "https://clients3.google.com/generate_204"
                                        )
                                    ) as HttpURLConnection

                                conn.connectTimeout =
                                    3000

                                conn.readTimeout =
                                    3000

                                conn.responseCode

                                conn.disconnect()

                                sendEventToJS(
                                    "TcpLog",
                                    "Cellular warmed"
                                )

                                socket = Socket()

                                network.bindSocket(
                                    socket
                                )

                                socket?.keepAlive =
                                    true

                                socket?.tcpNoDelay =
                                    true

                                sendEventToJS(
                                    "TcpLog",
                                    "Connecting TCP..."
                                )

                                socket?.connect(
                                    InetSocketAddress(
                                        host,
                                        port
                                    ),
                                    5000
                                )

                                writer =
                                    BufferedWriter(
                                        OutputStreamWriter(
                                            socket?.getOutputStream()
                                        )
                                    )

                                sendEventToJS(
                                    "TcpStatus",
                                    "CONNECTED"
                                )

                                sendEventToJS(
                                    "TcpLog",
                                    "TCP connected"
                                )

                                promise.resolve(
                                    "TCP connected over cellular"
                                )

                                //
                                // START LISTENER
                                //
                                listeningThread = Thread {

                                    try {

                                        val input:
                                            InputStream =
                                            socket!!
                                                .getInputStream()

                                        val buffer =
                                            ByteArray(
                                                1024
                                            )

                                        while (

                                            !Thread
                                                .currentThread()
                                                .isInterrupted &&

                                            socket?.isConnected == true

                                        ) {

                                            val readBytes =
                                                input.read(
                                                    buffer
                                                )

                                            if (
                                                readBytes == -1
                                            ) {

                                                sendEventToJS(
                                                    "TcpStatus",
                                                    "DISCONNECTED"
                                                )

                                                break
                                            }

                                            if (
                                                readBytes > 0
                                            ) {

                                                val msg =
                                                    String(
                                                        buffer,
                                                        0,
                                                        readBytes
                                                    )

                                                sendEventToJS(
                                                    "TcpMessage",
                                                    msg
                                                )
                                            }
                                        }

                                    } catch (e: Exception) {

                                        sendEventToJS(
                                            "TcpError",
                                            e.message
                                                ?: "Unknown read error"
                                        )
                                    }
                                }

                                listeningThread?.start()

                            } catch (e: Exception) {

                                promise.reject(
                                    "TCP_ERROR",
                                    e
                                )

                                sendEventToJS(
                                    "TcpError",
                                    e.message ?: "Unknown error"
                                )
                            }

                        }.start()
                    }

                    override fun onUnavailable() {

                        promise.reject(
                            "NO_CELLULAR",
                            "Cellular unavailable"
                        )

                        sendEventToJS(
                            "TcpStatus",
                            "NO_CELLULAR"
                        )
                    }
                }

            connectivityManager.requestNetwork(
                request,
                callback
            )

        } catch (e: Exception) {

            promise.reject(
                "ERR_INIT",
                e
            )

            sendEventToJS(
                "TcpError",
                e.message ?: "Init error"
            )
        }
    }

    @ReactMethod
    fun sendTcpData(
        data: String,
        promise: Promise
    ) {

        try {

            if (
                socket?.isConnected == true
            ) {

                writer?.write(
                    data + "\n"
                )

                writer?.flush()

                sendEventToJS(
                    "TcpLog",
                    "SENT: $data"
                )

                promise.resolve(
                    "Data sent"
                )

            } else {

                promise.reject(
                    "TCP_NOT_CONNECTED",
                    "Socket is not connected"
                )

                sendEventToJS(
                    "TcpError",
                    "Socket is not connected"
                )
            }

        } catch (e: Exception) {

            promise.reject(
                "TCP_ERROR",
                e
            )

            sendEventToJS(
                "TcpError",
                e.message ?: "Send error"
            )
        }
    }

    @ReactMethod
    fun closeTcpSocket(
        promise: Promise
    ) {

        try {

            listeningThread?.interrupt()

            socket?.close()

            socket = null

            writer = null

            sendEventToJS(
                "TcpStatus",
                "CLOSED"
            )

            promise.resolve(
                "TCP closed"
            )

        } catch (e: Exception) {

            promise.reject(
                "TCP_CLOSE_ERROR",
                e
            )

            sendEventToJS(
                "TcpError",
                e.message ?: "Close error"
            )
        }
    }
}