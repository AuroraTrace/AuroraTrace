export function streamWalletFlow(wallets: string[], interval: number): void {
  let index = 0;
  const timer = setInterval(() => {
    if (index >= wallets.length) {
      clearInterval(timer);
      return;
    }
    console.log("Streaming wallet:", wallets[index]);
    index++;
  }, interval);
}