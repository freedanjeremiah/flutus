declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (accounts: string[]) => void) => void
      removeListener: (event: string, callback: (accounts: string[]) => void) => void
      isMetaMask?: boolean
    }
    cardano?: {
      eternl?: {
        enable: () => Promise<{
          getUsedAddresses: () => Promise<string[]>
          getBalance: () => Promise<string>
          getUtxos: () => Promise<any[]>
          signTx: (tx: string) => Promise<string>
        }>
        isEnabled: () => Promise<boolean>
      }
    }
  }
}

export {}
