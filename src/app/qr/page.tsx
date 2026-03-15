"use client"

import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import QRCode from "react-qr-code"
import jsQR from "jsqr"

type Tab = "show" | "scan"

interface ScanResult {
  toUserId: string
  amount: number
  note?: string
}

interface TransferResult {
  fromBalance: number
  toBalance: number
}

export default function QRPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("show")
  const [customAmount, setCustomAmount] = useState("")
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState("")
  const [scanned, setScanned] = useState<ScanResult | null>(null)
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null)
  const [transferError, setTransferError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
  }, [status, router])

  const qrPayload = session?.user?.id
    ? JSON.stringify({
        toUserId: session.user.id,
        amount: customAmount ? parseFloat(customAmount) : 0,
        note: "",
      })
    : ""

  const startScan = async () => {
    setScanError("")
    setScanning(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      scanFrame()
    } catch {
      setScanError("Camera access denied. Please allow camera permission.")
      setScanning(false)
    }
  }

  const stopScan = () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setScanning(false)
  }

  const scanFrame = () => {
    const video = videoRef.current
    if (!video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame)
      return
    }
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)
    if (code) {
      stopScan()
      try {
        const parsed = JSON.parse(code.data) as ScanResult
        if (!parsed.toUserId || typeof parsed.amount !== "number") {
          setScanError("Invalid QR code — not a Podcoin payment.")
          return
        }
        setScanned(parsed)
      } catch {
        setScanError("Could not parse QR code.")
      }
    } else {
      rafRef.current = requestAnimationFrame(scanFrame)
    }
  }

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const handlePayScanned = async () => {
    if (!scanned || scanned.amount <= 0) {
      setTransferError("Amount must be greater than 0.")
      return
    }
    setSubmitting(true)
    setTransferError("")
    const res = await fetch("/api/qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrData: JSON.stringify(scanned) }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) {
      setTransferError(data.error ?? "Transfer failed")
    } else {
      setTransferResult(data)
    }
  }

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-green-700 animate-pulse">Loading…</div></div>
  }
  if (!session?.user) return null

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-green-900 mb-6">QR Payments</h1>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        {(["show", "scan"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setScanned(null); setTransferResult(null); setTransferError(""); stopScan() }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-white shadow text-green-800" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t === "show" ? "📲 My QR Code" : "🔍 Scan to Pay"}
          </button>
        ))}
      </div>

      {/* My QR Code */}
      {tab === "show" && (
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Share this QR code for others to pay you
          </p>
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white border-2 border-green-200 rounded-xl inline-block">
              {qrPayload && <QRCode value={qrPayload} size={200} />}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Set a specific amount (optional)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">₱</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0.00 (any amount)"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Receiving as: <strong>{session.user.name}</strong>
          </p>
        </div>
      )}

      {/* Scan to Pay */}
      {tab === "scan" && (
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
          {transferResult ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="text-xl font-bold text-green-800 mb-2">Payment Sent!</h2>
              <p className="text-gray-600 mb-1">₱{scanned?.amount.toFixed(2)} sent successfully</p>
              <p className="text-sm text-gray-400 mb-6">New balance: ₱{transferResult.fromBalance.toFixed(2)}</p>
              <button
                onClick={() => { setScanned(null); setTransferResult(null) }}
                className="px-5 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
              >
                Scan Another
              </button>
            </div>
          ) : scanned ? (
            <div>
              <h3 className="font-semibold text-gray-700 mb-4">Confirm Payment</h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">To User ID</span>
                  <span className="font-mono text-xs text-gray-700 truncate ml-4">{scanned.toUserId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-bold text-green-700">₱{scanned.amount.toFixed(2)}</span>
                </div>
                {scanned.note && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Note</span>
                    <span>{scanned.note}</span>
                  </div>
                )}
              </div>
              {transferError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm mb-4">
                  {transferError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setScanned(null)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayScanned}
                  disabled={submitting}
                  className="flex-1 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:bg-gray-300"
                >
                  {submitting ? "Sending…" : "Confirm & Pay"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div
                className="relative bg-black rounded-xl overflow-hidden mb-4"
                style={{ paddingTop: scanning ? "75%" : "0" }}
              >
                {scanning && (
                  <>
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-amber-400 rounded-lg" />
                    </div>
                  </>
                )}
              </div>
              {scanError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm mb-4">
                  {scanError}
                </div>
              )}
              {scanning ? (
                <button
                  onClick={stopScan}
                  className="px-6 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Stop Scanning
                </button>
              ) : (
                <>
                  <p className="text-gray-500 text-sm mb-4">Point your camera at a Podcoin QR code</p>
                  <button
                    onClick={startScan}
                    className="px-6 py-3 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800"
                  >
                    Start Camera
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
