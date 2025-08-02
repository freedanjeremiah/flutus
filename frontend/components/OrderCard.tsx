"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle, AlertCircle, RefreshCw, ArrowRight, X, ExternalLink, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Order {
  id: string
  fromToken: string
  toToken: string
  fromAmount: number
  toAmount: number
  status: "waiting" | "assigned" | "processing" | "completed" | "failed"
  createdAt: string
  estimatedCompletion?: string
  resolverAddress?: string
}

interface OrderCardProps {
  order: Order
}

export default function OrderCard({ order }: OrderCardProps) {
  const { toast } = useToast()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "waiting":
        return <Clock className="w-4 h-4" />
      case "assigned":
      case "processing":
        return <RefreshCw className="w-4 h-4 animate-spin" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "failed":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
      case "assigned":
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "waiting":
        return "Waiting for resolver to be assigned..."
      case "assigned":
        return "Resolver assigned - Processing swap..."
      case "processing":
        return "Processing swap..."
      case "completed":
        return "Swap completed successfully! 🎉"
      case "failed":
        return "Swap failed - Please try again"
      default:
        return "Unknown status"
    }
  }

  const getProgress = (status: string) => {
    switch (status) {
      case "waiting":
        return 25
      case "assigned":
        return 50
      case "processing":
        return 75
      case "completed":
        return 100
      case "failed":
        return 0
      default:
        return 0
    }
  }

  const getTokenIcon = (token: string) => {
    return token === "ETH" ? "Ξ" : "₳"
  }

  const handleCancelOrder = async () => {
    if (order.status !== "waiting") {
      toast({
        title: "Cannot cancel",
        description: "Order cannot be cancelled at this stage",
        variant: "destructive",
      })
      return
    }

    try {
      await fetch(`/api/orders/${order.id}`, {
        method: "DELETE",
      })

      toast({
        title: "Order cancelled",
        description: `Order ${order.id} has been cancelled`,
      })
    } catch (error) {
      toast({
        title: "Cancellation failed",
        description: "Failed to cancel order",
        variant: "destructive",
      })
    }
  }

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.id)
    toast({
      title: "Order ID copied",
      description: "Order ID copied to clipboard",
    })
  }

  const copyResolverAddress = () => {
    if (order.resolverAddress) {
      navigator.clipboard.writeText(order.resolverAddress)
      toast({
        title: "Address copied",
        description: "Resolver address copied to clipboard",
      })
    }
  }

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white">Order #{order.id.slice(0, 8)}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyOrderId}
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Badge className={`${getStatusColor(order.status)} border font-medium`}>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(order.status)}
                  <span className="capitalize">{order.status}</span>
                </div>
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Created: {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          {order.status === "waiting" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelOrder}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>

        {/* Swap Details */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl">{getTokenIcon(order.fromToken)}</span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{order.fromToken}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{order.fromAmount}</p>
            </div>

            <div className="flex flex-col items-center px-4">
              <ArrowRight className="w-6 h-6 text-gray-400 mb-1" />
              <span className="text-xs text-gray-500">SWAP</span>
            </div>

            <div className="text-center flex-1">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl">{getTokenIcon(order.toToken)}</span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{order.toToken}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {order.toAmount.toFixed(order.toToken === "ETH" ? 6 : 2)}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Progress</span>
            <span className="font-bold text-lg">{getProgress(order.status)}%</span>
          </div>

          <div className="space-y-2">
            <Progress value={getProgress(order.status)} className="h-3 bg-gray-200 dark:bg-gray-700" />
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{getStatusText(order.status)}</p>
          </div>
        </div>

        {/* Resolver Info */}
        {order.resolverAddress && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Resolver Address:</p>
              <Button variant="ghost" size="sm" onClick={copyResolverAddress} className="h-6 w-6 p-0">
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400 break-all bg-white dark:bg-gray-900 p-2 rounded border">
              {order.resolverAddress}
            </p>
          </div>
        )}

        {/* Estimated Completion */}
        {order.estimatedCompletion && order.status !== "completed" && order.status !== "failed" && (
          <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>
              <strong>Estimated completion:</strong> {new Date(order.estimatedCompletion).toLocaleString()}
            </span>
          </div>
        )}

        {/* Action Buttons for Completed Orders */}
        {order.status === "completed" && (
          <div className="mt-6 flex space-x-3">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => {}}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
