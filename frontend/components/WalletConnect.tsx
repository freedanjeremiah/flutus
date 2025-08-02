"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, CheckCircle, AlertCircle, Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WalletConnectProps {
  onConnectionChange: (connected: boolean) => void
  connected: boolean
}

interface WalletInfo {
  address: string
  balance: string
  type: "metamask" | "eternl" | null
}

export default function WalletConnect({ onConnectionChange, connected }: WalletConnectProps) {
  const [connecting, setConnecting] = useState(false)
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({ address: "", balance: "", type: null })
  const [availableWallets, setAvailableWallets] = useState({ metamask: false, eternl: false })
  const { toast } = useToast()

  useEffect(() => {
    checkAvailableWallets()
  }, [])

  const checkAvailableWallets = () => {
    const metamaskAvailable = typeof window !== "undefined" && window.ethereum
    const eternlAvailable = typeof window !== "undefined" && window.cardano?.eternl

    setAvailableWallets({
      metamask: !!metamaskAvailable,
      eternl: !!eternlAvailable,
    })
  }

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask extension",
        variant: "destructive",
      })
      return
    }

    try {
      setConnecting(true)

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length > 0) {
        const balance = await window.ethereum.request({
          method: "eth_getBalance",
          params: [accounts[0], "latest"],
        })

        const ethBalance = (Number.parseInt(balance, 16) / 1e18).toFixed(4)

        setWalletInfo({
          address: accounts[0],
          balance: `${ethBalance} ETH`,
          type: "metamask",
        })

        onConnectionChange(true)
        toast({
          title: "MetaMask connected!",
          description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        })
      }
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to MetaMask",
        variant: "destructive",
      })
    } finally {
      setConnecting(false)
    }
  }

  const connectEternl = async () => {
    if (!window.cardano?.eternl) {
      toast({
        title: "Eternl not found",
        description: "Please install Eternl wallet extension",
        variant: "destructive",
      })
      return
    }

    try {
      setConnecting(true)

      const api = await window.cardano.eternl.enable()
      const addresses = await api.getUsedAddresses()
      const balance = await api.getBalance()

      if (addresses.length > 0) {
        // Convert balance from lovelace to ADA
        const adaBalance = (Number.parseInt(balance, 16) / 1e6).toFixed(2)

        setWalletInfo({
          address: addresses[0],
          balance: `${adaBalance} ADA`,
          type: "eternl",
        })

        onConnectionChange(true)
        toast({
          title: "Eternl connected!",
          description: `Connected to Cardano wallet`,
        })
      }
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to Eternl",
        variant: "destructive",
      })
    } finally {
      setConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setWalletInfo({ address: "", balance: "", type: null })
    onConnectionChange(false)
    toast({
      title: "Wallet disconnected",
      description: "Wallet has been disconnected",
    })
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(walletInfo.address)
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    })
  }

  if (connected && walletInfo.address) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-700 dark:text-green-300">
                {walletInfo.type === "metamask" ? "MetaMask" : "Eternl"} Connected
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnectWallet}
              className="text-green-700 hover:text-green-800 dark:text-green-300 h-8"
            >
              Disconnect
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-mono">
                  {walletInfo.address.slice(0, 6)}...{walletInfo.address.slice(-4)}
                </span>
                <Button variant="ghost" size="sm" onClick={copyAddress} className="h-6 w-6 p-0">
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Balance:</span>
              <span className="text-sm font-medium">{walletInfo.balance}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200 dark:border-gray-700">
      <CardContent className="p-4">
        <div className="text-center mb-4">
          <Wallet className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <h3 className="font-medium text-gray-900 dark:text-white mb-1">Connect Wallet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred wallet to start swapping</p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={connectMetaMask}
            disabled={connecting || !availableWallets.metamask}
            variant="outline"
            className="w-full h-12 bg-transparent border-2 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/10"
          >
            {connecting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                <div className="text-left">
                  <div className="font-medium">MetaMask</div>
                  <div className="text-xs text-gray-500">For Ethereum (ETH)</div>
                </div>
                {!availableWallets.metamask && <ExternalLink className="w-4 h-4 text-gray-400" />}
              </div>
            )}
          </Button>

          <Button
            onClick={connectEternl}
            disabled={connecting || !availableWallets.eternl}
            variant="outline"
            className="w-full h-12 bg-transparent border-2 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10"
          >
            {connecting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">E</span>
                </div>
                <div className="text-left">
                  <div className="font-medium">Eternl</div>
                  <div className="text-xs text-gray-500">For Cardano (ADA)</div>
                </div>
                {!availableWallets.eternl && <ExternalLink className="w-4 h-4 text-gray-400" />}
              </div>
            )}
          </Button>
        </div>

        {(!availableWallets.metamask || !availableWallets.eternl) && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <p className="font-medium mb-1">Missing Wallets</p>
                <ul className="text-xs space-y-1">
                  {!availableWallets.metamask && <li>• Install MetaMask for Ethereum support</li>}
                  {!availableWallets.eternl && <li>• Install Eternl for Cardano support</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
