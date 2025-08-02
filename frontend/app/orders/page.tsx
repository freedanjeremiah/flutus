import OrdersPage from "@/components/OrdersPage"

export default function Orders() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <OrdersPage />
      </div>
    </div>
  )
}
