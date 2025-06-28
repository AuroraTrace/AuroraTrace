

import requests
import asyncio
import aiohttp
from collections import Counter
from typing import List, Dict, Any

RPC_ENDPOINT = "https://api.mainnet-beta.solana.com"
MAX_ENTRIES = 300

async def pullSignatures(session: aiohttp.ClientSession, addr: str) -> List[str]:
    payload = {"jsonrpc":"2.0","id":1,"method":"getSignaturesForAddress","params":[addr,{"limit":MAX_ENTRIES}]}
    async with session.post(RPC_ENDPOINT, json=payload, timeout=10) as resp:
        data = await resp.json()
    return [e["signature"] for e in data.get("result", [])]

async def extractCpiCalls(session: aiohttp.ClientSession, sig: str) -> List[str]:
    payload = {"jsonrpc":"2.0","id":1,"method":"getTransaction","params":[sig,{"encoding":"jsonParsed"}]}
    async with session.post(RPC_ENDPOINT, json=payload, timeout=10) as resp:
        tx = await resp.json()
    inners = tx.get("result", {}).get("meta", {}).get("innerInstructions", [])
    calls = []
    for block in inners:
        for instr in block.get("instructions", []):
            pid = instr.get("programId")
            if pid:
                calls.append(pid)
    return calls

async def compileCpiStats(wallet: str) -> Dict[str, int]:
    async with aiohttp.ClientSession() as session:
        sigs = await pullSignatures(session, wallet)
        counts = Counter()
        tasks = [extractCpiCalls(session, s) for s in sigs]
        for coro in asyncio.as_completed(tasks):
            for pid in await coro:
                counts[pid] += 1
        return dict(counts)

if __name__ == "__main__":
    import sys
    wallet = sys.argv[1]
    stats = asyncio.run(compileCpiStats(wallet))
    sorted_stats = sorted(stats.items(), key=lambda x: x[1], reverse=True)[:10]
    for pid, cnt in sorted_stats:
        print(f"{pid}: {cnt}")
