#!/usr/bin/env python3
"""
PeakRush — Ghost Replay Compression & Anti-Cheat Microservice
Runs on port 5100, called internally by the Node.js API.
"""

import json
import zstd
import base64
import math
from flask import Flask, request, jsonify

app = Flask(__name__)

# ── Physics constants (must match client usePhysicsEngine.ts) ─────────────────
MAX_SPEED = {
    "snowboard":  180,
    "ski":        220,
    "wingsuit":   300,
    "paraglider":  60,
}

@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "peakrush-python"})


@app.route("/compress", methods=["POST"])
def compress_replay():
    """
    Input:  { "keyframes": [...] }
    Output: { "compressed": "<base64>", "original_bytes": N, "compressed_bytes": M }
    """
    data = request.get_json(force=True)
    keyframes = data.get("keyframes", [])
    raw = json.dumps(keyframes, separators=(",", ":")).encode()
    compressed = zstd.compress(raw, level=19)
    return jsonify({
        "compressed":       base64.b64encode(compressed).decode(),
        "original_bytes":   len(raw),
        "compressed_bytes": len(compressed),
        "ratio":            round(len(raw) / max(len(compressed), 1), 2),
    })


@app.route("/decompress", methods=["POST"])
def decompress_replay():
    """
    Input:  { "compressed": "<base64>" }
    Output: { "keyframes": [...] }
    """
    data = request.get_json(force=True)
    raw_b64 = data.get("compressed", "")
    compressed = base64.b64decode(raw_b64)
    raw = zstd.decompress(compressed)
    keyframes = json.loads(raw)
    return jsonify({"keyframes": keyframes})


@app.route("/validate", methods=["POST"])
def validate_replay():
    """
    Anti-cheat: validate ghost replay keyframes against physics model.
    Input:  { "sport": "snowboard", "keyframes": [{t,x,y,z,speed}, ...] }
    Output: { "valid": bool, "violations": [...] }
    """
    data = request.get_json(force=True)
    sport = data.get("sport", "snowboard")
    frames = data.get("keyframes", [])
    max_spd = MAX_SPEED.get(sport, 220) * 1.15  # 15% tolerance

    violations = []

    for i in range(1, len(frames)):
        prev = frames[i - 1]
        curr = frames[i]

        dt = curr.get("t", 0) - prev.get("t", 0)
        if dt <= 0:
            continue

        # Speed check
        spd = curr.get("speed", 0)
        if spd > max_spd:
            violations.append({
                "frame": i,
                "type": "speed_violation",
                "value": spd,
                "limit": max_spd,
            })

        # Displacement check — catches teleport cheats
        dx = curr.get("x", 0) - prev.get("x", 0)
        dy = curr.get("y", 0) - prev.get("y", 0)
        dz = curr.get("z", 0) - prev.get("z", 0)
        dist = math.sqrt(dx*dx + dy*dy + dz*dz)
        max_dist = (max_spd / 3.6) * dt * 1.2   # allow 20% buffer
        if dist > max_dist:
            violations.append({
                "frame": i,
                "type": "teleport_violation",
                "distance": round(dist, 2),
                "max_allowed": round(max_dist, 2),
            })

    return jsonify({
        "valid":      len(violations) == 0,
        "violations": violations[:20],   # cap at 20 for response size
        "frames_checked": len(frames),
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5100, debug=False)
