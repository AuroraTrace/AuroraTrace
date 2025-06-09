def resolve_proxies(wallet_chain):
    resolved = []
    for wallet in wallet_chain:
        if wallet.startswith("proxy_"):
            resolved.append("unknown_wallet")
        else:
            resolved.append(wallet)
    return resolved

def map_trace_resolution(traces):
    return [resolve_proxies(trace) for trace in traces]