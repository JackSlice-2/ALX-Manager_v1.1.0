import { usePathname } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {  StyleSheet, TouchableOpacity, View } from 'react-native'
import useDataloggerFetch from '../hooks/useDataloggerFetch'
import RobotoText from './RobotoText'
import { useT } from '@/hooks/useT'

interface HeaderProps {
    titleTextColor: string
    subTitleTextColor: string
}

const Header: React.FC<HeaderProps> = ({
    subTitleTextColor,
    titleTextColor
}) => {
    const pathname = usePathname()
    const { dataMap, fetchEndpoint } = useDataloggerFetch('http://192.168.4.1')
    const [pingOk, setPingOk] = useState(false)
    const [failedPings, setFailedPings] = useState(0) 
    const [loading, setLoading] = useState(false)

    const t = useT()

    useEffect(() => {
        fetchEndpoint('/req_info_datalogger')
    }, [fetchEndpoint])

    const pingDevice = async () => {
        try {
            const response = await fetch('http://192.168.4.1/req_ping', { method: 'GET' })
            const text = await response.text()

            if (text.trim()) {
                setPingOk(true)
                setFailedPings(0) 
            } else {
                setPingOk(false)
                setFailedPings(prev => prev + 1) 
            }
        } catch {
            setPingOk(false)
            setFailedPings(prev => prev + 1) 
        }
    }

    const fetchWithRetry = async (url: string, options: RequestInit, retries: number = 3, delay: number = 1000) => {
        let attempt = 0
        while (attempt < retries) {
            try {
                const response = await fetch(url, options)
                return response
            } catch (error) {
                attempt++
                if (attempt < retries) {
                    console.warn(`Attempt ${attempt} failed, retrying...`)
                    await new Promise(resolve => setTimeout(resolve, delay * attempt))
                } else {
                    throw error  
                }
            }
        }
    }

    useEffect(() => {
        pingDevice() 
        const interval = setInterval(pingDevice, 3000)
        return () => clearInterval(interval)
    }, [])

    const handleButtonPress = async () => {
        setLoading(true)
        try {
            fetchEndpoint('/req_info_datalogger')
            const response = await fetchWithRetry('http://192.168.4.1/req_info_datalogger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'trigger' }) 
            })
            const result = await response?.text()
            console.log("Header", result)
        } catch (e) {
            console.warn('Button fetch failed:', e)
        } finally {
            setLoading(false)
        }
    }

    const info = dataMap['/req_info_datalogger']

    if (pathname === './index') return null

    const getButtonColor = () => { 
        return '#00c500' 
    }

    return (
        <>
            <View style={styles.container}>
                <View>
                    <RobotoText style={[styles.subTitle, { color: subTitleTextColor }]}>
                        {t.Header.Model}
                    </RobotoText>
                    <RobotoText style={[styles.title, { color: titleTextColor }]}>
                        ALX-4GSE
                    </RobotoText>
                </View>
                <View>
                    <RobotoText style={[styles.subTitle, { color: subTitleTextColor }]}>
                        {t.Header.Serial}
                    </RobotoText>
                    <RobotoText style={[styles.title, { color: titleTextColor }]}>
                        00000111
                    </RobotoText>
                </View>
                <View style={styles.button}>
                    <RobotoText style={[styles.subTitle, { color: subTitleTextColor }]}>
                        {t.Header.Connection}
                    </RobotoText>
                    <TouchableOpacity
                        onPress={handleButtonPress}
                        style={[
                            styles.signalButton,
                            { backgroundColor: getButtonColor() } 
                        ]}
                    />
                </View>
            </View>
        </>
    )
}
export default Header

const styles = StyleSheet.create({
    container: {
        paddingTop: '10%',
        paddingBottom: '5%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'rgb(233, 234, 235)'
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 1,
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    subTitle: {
        color: '#7a7676ff',
        fontSize: 15,
        textAlign: 'center',
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    signalButton: {
        marginVertical: 5,
        width: 25,
        height: 25,
        alignSelf: 'center',
        borderRadius: 100
    },
    button: {
        borderRadius: 10,
        marginLeft: -15
    }
})
