import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Fetch real prices from CoinGecko API
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,cardano&vs_currencies=usd",
      {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 30 }, // Cache for 30 seconds
      },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch from CoinGecko")
    }

    const data = await response.json()

    const ethPrice = data.ethereum?.usd || 0
    const adaPrice = data.cardano?.usd || 0

    const prices = {
      eth: ethPrice,
      ada: adaPrice,
      ethToAda: ethPrice / adaPrice,
      adaToEth: adaPrice / ethPrice,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(prices)
  } catch (error) {
    console.error("Error fetching prices:", error)

    // Fallback prices if API fails
    const fallbackPrices = {
      eth: 2000,
      ada: 0.35,
      ethToAda: 2000 / 0.35,
      adaToEth: 0.35 / 2000,
      lastUpdated: new Date().toISOString(),
      error: "Using fallback prices",
    }

    return NextResponse.json(fallbackPrices)
  }
}
