import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for demo purposes
const orders: any[] = []

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id
    const orderIndex = orders.findIndex((order) => order.id === orderId)

    if (orderIndex === -1) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const order = orders[orderIndex]

    if (order.status !== "waiting") {
      return NextResponse.json({ error: "Cannot cancel order at this stage" }, { status: 400 })
    }

    orders.splice(orderIndex, 1)

    return NextResponse.json({ message: "Order cancelled successfully" })
  } catch (error) {
    console.error("Error cancelling order:", error)
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 })
  }
}
