from fastapi import FastAPI, Query
import json
import os
import httpx
from math import radians, cos, sin, asin, sqrt
from datetime import datetime

app = FastAPI(title="LAAC Map Service")

# Helper to calculate distance
def haversine(lat1, lon1, lat2, lon2):
    R = 6372.8
    dLat = radians(lat2 - lat1)
    dLon = radians(lon2 - lon1)
    lat1, lat2 = radians(lat1), radians(lat2)
    a = sin(dLat / 2)**2 + cos(lat1) * cos(lat2) * sin(dLon / 2)**2
    c = 2 * asin(sqrt(a))
    return R * c

# Load data
DATA_PATH = os.path.dirname(__file__)

def load_json(path):
    with open(os.path.join(DATA_PATH, path), 'r', encoding='utf-8') as f:
        return json.load(f)

ubi_data = load_json("UBI/locations.json")
res_data = load_json("residencias/locations.json")
bus_stops_raw = load_json("bus/data/stops.json")
bus_schedules = load_json("bus/data/schedules.json")

all_stops = []
for cat in bus_stops_raw:
    all_stops.extend(cat["stops"])
stop_map = {s["id"]: s for s in all_stops}

async def get_osrm_route(coords, profile="walking"):
    """Fetch road geometry from OSRM. coords is list of [lat, lng]"""
    # OSRM expects lon,lat
    coord_str = ";".join([f"{c[1]},{c[0]}" for c in coords])
    url = f"http://router.project-osrm.org/route/v1/{profile}/{coord_str}?overview=full&geometries=geojson"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=5)
            data = response.json()
            if data["code"] == "Ok":
                # Return list of [lat, lng]
                return [[p[1], p[0]] for p in data["routes"][0]["geometry"]["coordinates"]]
    except Exception as e:
        print(f"OSRM Error: {e}")
    return coords # Fallback to straight line

@app.get("/locations")
async def get_locations():
    unified = []
    for campus in ubi_data.get("campuses", []):
        unified.append({"id": f"ubi_{campus['name']}", "name": campus["name"], "type": "UBI", "lat": campus["coordinates"]["lat"], "lng": campus["coordinates"]["lng"]})
    for res in res_data.get("residences_and_canteens", []):
        unified.append({"id": f"res_{res['name']}", "name": res["name"], "type": "Residência", "lat": res["coordinates"]["lat"], "lng": res["coordinates"]["lng"]})
    for stop in all_stops:
        unified.append({"id": f"bus_{stop['id']}", "name": stop["name"], "type": "Paragem", "lat": stop["lat"], "lng": stop["lng"]})
    return unified

def find_best_trip(line, start_stop_id, current_time):
    idx_start = line["stopIds"].index(start_stop_id)
    for trip in line["trips"]:
        if trip["times"][idx_start] >= current_time:
            return trip, idx_start
    return None, None

@app.get("/route")
async def get_route(start_lat: float, start_lng: float, dest_id: str, time: str = None):
    if not time:
        time = datetime.now().strftime("%H:%M")
    
    all_locs = await get_locations()
    destination = next((l for l in all_locs if l["id"] == dest_id), None)
    if not destination: return {"error": "Destination not found"}

    dist_direct = haversine(start_lat, start_lng, destination["lat"], destination["lng"])
    
    route = {
        "origin": {"lat": start_lat, "lng": start_lng},
        "destination": destination,
        "distance_km": round(dist_direct, 2),
        "mode": "walk",
        "instructions": [],
        "geometry": []
    }

    # Search for closest stops
    closest_start_stop = min(all_stops, key=lambda s: haversine(start_lat, start_lng, s["lat"], s["lng"]))
    closest_dest_stop = min(all_stops, key=lambda s: haversine(destination["lat"], destination["lng"], s["lat"], s["lng"]))
    
    # Try Direct Bus
    bus_route = None
    if dist_direct > 0.6:
        for line in bus_schedules:
            if closest_start_stop["id"] in line["stopIds"] and closest_dest_stop["id"] in line["stopIds"]:
                idx_s, idx_d = line["stopIds"].index(closest_start_stop["id"]), line["stopIds"].index(closest_dest_stop["id"])
                if idx_s < idx_d:
                    trip, _ = find_best_trip(line, closest_start_stop["id"], time)
                    if trip:
                        bus_route = (line, trip, idx_s, idx_d)
                        break

    if bus_route:
        line, trip, idx_s, idx_d = bus_route
        route["mode"] = "bus"
        route["instructions"] = [
            f"Caminha até {closest_start_stop['name']}.",
            f"Apanha a linha {line['lineName']} às {trip['times'][idx_s]}.",
            f"Sai na paragem {closest_dest_stop['name']} às {trip['times'][idx_d]}.",
            f"Caminha até ao destino."
        ]
        # Geometry: Walk to stop -> Bus path -> Walk to dest
        # For simplicity, we fetch road path between all points
        route["geometry"] = await get_osrm_route([
            [start_lat, start_lng],
            [closest_start_stop["lat"], closest_start_stop["lng"]],
            [closest_dest_stop["lat"], closest_dest_stop["lng"]],
            [destination["lat"], destination["lng"]]
        ])
    else:
        route["instructions"] = [f"Caminha até ao destino ({round(dist_direct*1000)}m)."]
        route["geometry"] = await get_osrm_route([[start_lat, start_lng], [destination["lat"], destination["lng"]]])

    return route

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
