import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for demo purposes
// In production, use a proper database
const orders: any[] = []

export async function GET() {
  return NextResponse.json(orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromToken, toToken, fromAmount, toAmount, rate } = body

    const order = {
      id: Math.random().toString(36).substr(2, 9),
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      rate,
      status: "waiting",
      createdAt: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
    }

    orders.push(order)

    // Simulate order progression
    setTimeout(() => {
      const orderIndex = orders.findIndex((o) => o.id === order.id)
      if (orderIndex !== -1) {
        orders[orderIndex].status = "assigned"
        orders[orderIndex].resolverAddress = "0x" + Math.random().toString(16).substr(2, 40)
      }
    }, 5000) // 5 seconds

    setTimeout(() => {
      const orderIndex = orders.findIndex((o) => o.id === order.id)
      if (orderIndex !== -1) {
        orders[orderIndex].status = "processing"
      }
    }, 15000) // 15 seconds

    setTimeout(() => {
      const orderIndex = orders.findIndex((o) => o.id === order.id)
      if (orderIndex !== -1) {
        orders[orderIndex].status = "completed"
      }
    }, 30000) // 30 seconds

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
