"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    MessageCircle,
    RefreshCw,
    Wifi,
    WifiOff,
    Phone,
    User,
    Loader2,
    QrCode,
    LogOut
} from "lucide-react"

interface WhatsAppInfo {
    connected: boolean
    phone?: string
    name?: string
    platform?: string
}

const WHATSAPP_SERVER_URL = "http://localhost:3001"

export default function WhatsAppPage() {
    const [status, setStatus] = useState<WhatsAppInfo>({ connected: false })
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [disconnecting, setDisconnecting] = useState(false)

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch(`${WHATSAPP_SERVER_URL}/api/status`)
            const data = await res.json()
            setStatus(data)

            // If not connected, fetch QR code
            if (!data.connected) {
                fetchQRCode()
            } else {
                setQrCode(null)
            }
        } catch (error) {
            console.error("Failed to fetch status:", error)
            setStatus({ connected: false })
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchQRCode = async () => {
        try {
            const res = await fetch(`${WHATSAPP_SERVER_URL}/api/qr`)
            const data = await res.json()
            if (data.qr) {
                setQrCode(data.qr)
            }
        } catch (error) {
            console.error("Failed to fetch QR code:", error)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchStatus()
        setRefreshing(false)
    }

    const handleDisconnect = async () => {
        setDisconnecting(true)
        try {
            await fetch(`${WHATSAPP_SERVER_URL}/api/disconnect`, { method: "POST" })
            await fetchStatus()
        } catch (error) {
            console.error("Failed to disconnect:", error)
        } finally {
            setDisconnecting(false)
        }
    }

    useEffect(() => {
        fetchStatus()

        // Poll for status updates every 5 seconds
        const interval = setInterval(fetchStatus, 5000)
        return () => clearInterval(interval)
    }, [fetchStatus])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading WhatsApp status...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <MessageCircle className="h-7 w-7 text-green-500" />
                        WhatsApp Connection
                    </h2>
                    <p className="text-muted-foreground">
                        Connect your WhatsApp account to enable bot features.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Separator />

            {/* Main Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Left Side - QR Code */}
                <Card className="glass border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="h-5 w-5 text-primary" />
                            QR Code
                        </CardTitle>
                        <CardDescription>
                            Scan this QR code with your WhatsApp to connect
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center min-h-[300px] rounded-lg bg-background/50 border-2 border-dashed border-border p-6">
                            {status.connected ? (
                                <div className="text-center space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                                        <Wifi className="h-10 w-10 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-green-500">Connected!</p>
                                        <p className="text-sm text-muted-foreground">
                                            Your WhatsApp is connected and ready.
                                        </p>
                                    </div>
                                </div>
                            ) : qrCode ? (
                                <div className="text-center space-y-4">
                                    <div className="bg-white p-4 rounded-lg shadow-lg">
                                        <img
                                            src={qrCode}
                                            alt="WhatsApp QR Code"
                                            className="w-64 h-64 object-contain"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">How to connect:</p>
                                        <ol className="text-xs text-muted-foreground text-left list-decimal list-inside space-y-1">
                                            <li>Open WhatsApp on your phone</li>
                                            <li>Go to Settings → Linked Devices</li>
                                            <li>Tap &quot;Link a Device&quot;</li>
                                            <li>Scan this QR code</li>
                                        </ol>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                                        <WifiOff className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-medium">Waiting for QR Code...</p>
                                        <p className="text-sm text-muted-foreground">
                                            Make sure the WhatsApp server is running.
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Retry
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Right Side - Status & Info */}
                <div className="space-y-6">
                    {/* Connection Status Card */}
                    <Card className="glass border-border/50">
                        <CardHeader>
                            <CardTitle className="text-lg">Connection Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                {status.connected ? (
                                    <>
                                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                        <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
                                            <Wifi className="h-3 w-3 mr-1" />
                                            Connected
                                        </Badge>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <Badge variant="destructive" className="bg-red-500/20 text-red-500 border-red-500/30">
                                            <WifiOff className="h-3 w-3 mr-1" />
                                            Not Connected
                                        </Badge>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Info Card */}
                    <Card className="glass border-border/50">
                        <CardHeader>
                            <CardTitle className="text-lg">Account Details</CardTitle>
                            <CardDescription>
                                Information about the connected WhatsApp account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {status.connected ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                            <Phone className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Phone Number</p>
                                            <p className="font-medium">+{status.phone || "Unknown"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Account Name</p>
                                            <p className="font-medium">{status.name || "Unknown"}</p>
                                        </div>
                                    </div>

                                    {status.platform && (
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                                <MessageCircle className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Platform</p>
                                                <p className="font-medium">{status.platform}</p>
                                            </div>
                                        </div>
                                    )}

                                    <Separator />

                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        onClick={handleDisconnect}
                                        disabled={disconnecting}
                                    >
                                        {disconnecting ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <LogOut className="h-4 w-4 mr-2" />
                                        )}
                                        Disconnect WhatsApp
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <WifiOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No WhatsApp account connected.</p>
                                    <p className="text-sm">Scan the QR code to connect.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Server Info */}
            <Card className="glass border-border/50">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>WhatsApp Server: {WHATSAPP_SERVER_URL}</span>
                        <span>Auto-refresh every 5 seconds</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
