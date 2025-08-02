"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, TrendingUp, RefreshCw, Zap, Shield, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import WalletConnect from "./WalletConnect"

interface PriceData {
  eth: number
  ada: number
  ethToAda: number
  adaToEth: number
  lastUpdated: string
  error?: string
}

export default function SwapInterface() {
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [fromToken, setFromToken] = useState<"ETH" | "ADA">("ETH")
  const [toToken, setToToken] = useState<"ETH" | "ADA">("ADA")
  const [prices, setPrices] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [priceLoading, setPriceLoading] = useState(true)
  const [walletConnected, setWalletConnected] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (fromAmount && prices) {
      calculateToAmount()
    } else {
      setToAmount("")
    }
  }, [fromAmount, fromToken, toToken, prices])

  const fetchPrices = async () => {
    try {
      setPriceLoading(true)
      const response = await fetch("/api/prices")
      const data = await response.json()
      setPrices(data)
    } catch (error) {
      console.error("Failed to fetch prices:", error)
      toast({
        title: "Price fetch failed",
        description: "Using cached prices",
        variant: "destructive",
      })
    } finally {
      setPriceLoading(false)
    }
  }

  const calculateToAmount = () => {
    if (!fromAmount || !prices) return

    const amount = Number.parseFloat(fromAmount)
    if (isNaN(amount) || amount <= 0) return

    let result: number
    if (fromToken === "ETH" && toToken === "ADA") {
      result = amount * prices.ethToAda
    } else if (fromToken === "ADA" && toToken === "ETH") {
      result = amount * prices.adaToEth
    } else {
      result = amount // Same token
    }

    setToAmount(result.toFixed(fromToken === "ETH" ? 2 : 6))
  }

  const handleSwapDirection = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const handleSwap = async () => {
    if (!walletConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    if (!fromAmount || Number.parseFloat(fromAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to swap",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromToken,
          toToken,
          fromAmount: Number.parseFloat(fromAmount),
          toAmount: Number.parseFloat(toAmount),
          rate: prices?.[fromToken === "ETH" ? "ethToAda" : "adaToEth"],
        }),
      })

      const order = await response.json()

      toast({
        title: "Swap initiated! 🚀",
        description: `Order ${order.id} created successfully`,
      })

      // Reset form
      setFromAmount("")
      setToAmount("")

      router.push("/orders")
    } catch (error) {
      toast({
        title: "Swap failed",
        description: "Failed to create swap order",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return price < 1 ? price.toFixed(4) : price.toFixed(2)
  }

  const getTokenIcon = (token: string) => {
    return token === "ETH" ? "Ξ" : "₳"
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      

      {/* Wallet Connection */}
      <WalletConnect onConnectionChange={setWalletConnected} connected={walletConnected} />

      {/* Main Swap Card */}
      <Card className="shadow-2xl border-0 bg-white dark:bg-gray-900">
        <CardHeader className="pb-4">
          <CardTitle className="text-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Swap Tokens
          </CardTitle>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4" />
              <span>Instant</span>
            </div>
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>24/7</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* From Token */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From</label>
              {prices && (
                <span className="text-xs text-gray-500">
                  1 {fromToken} = ${formatPrice(fromToken === "ETH" ? prices.eth : prices.ada)}
                </span>
              )}
            </div>

            <div className="relative">
              <Input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="text-2xl h-16 pr-20 border-2 focus:border-blue-500 bg-gray-50 dark:bg-gray-800"
                step="any"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Button
                  variant="ghost"
                  className="h-10 px-3 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 font-bold"
                >
                  <span className="text-lg mr-1">{getTokenIcon(fromToken)}</span>
                  {fromToken}
                </Button>
              </div>
            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwapDirection}
              className="rounded-full border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-12 w-12 shadow-lg bg-transparent"
            >
              <ArrowUpDown className="w-5 h-5" />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To</label>
              {prices && (
                <span className="text-xs text-gray-500">
                  1 {toToken} = ${formatPrice(toToken === "ETH" ? prices.eth : prices.ada)}
                </span>
              )}
            </div>

            <div className="relative">
              <Input
                type="number"
                placeholder="0.0"
                value={toAmount}
                readOnly
                className="text-2xl h-16 pr-20 border-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Button
                  variant="ghost"
                  className="h-10 px-3 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 font-bold"
                >
                  <span className="text-lg mr-1">{getTokenIcon(toToken)}</span>
                  {toToken}
                </Button>
              </div>
            </div>
          </div>

          {/* Exchange Rate Display */}
          {prices && fromAmount && toAmount && (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Exchange Rate</p>
                    <p className="font-bold text-green-700 dark:text-green-300">
                      1 {fromToken} = {formatPrice(fromToken === "ETH" ? prices.ethToAda : prices.adaToEth)} {toToken}
                    </p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={loading || !walletConnected || !fromAmount || !toAmount}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg transform transition-all duration-200 hover:scale-[1.02] disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Swap...</span>
              </div>
            ) : !walletConnected ? (
              "Connect Wallet to Swap"
            ) : !fromAmount ? (
              "Enter Amount"
            ) : (
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Swap Now</span>
              </div>
            )}
          </Button>

          

          {/* Powered by 1inch */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Powered by</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">1</span>
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">1inch</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Display Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Live Prices</h3>
            <Button variant="ghost" size="sm" onClick={fetchPrices} disabled={priceLoading} className="h-8 w-8 p-0">
              <RefreshCw className={`w-4 h-4 ${priceLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {prices ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <span className="text-2xl">Ξ</span>
                  <span className="font-bold text-lg">ETH</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">${formatPrice(prices.eth)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <span className="text-2xl">₳</span>
                  <span className="font-bold text-lg">ADA</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">${formatPrice(prices.ada)}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )}

          {prices?.error && (
            <Badge variant="secondary" className="w-full justify-center mt-2">
              Using fallback prices
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
    
  )
}
