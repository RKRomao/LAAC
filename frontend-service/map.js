let map;
let userMarker;
let destMarker;
let routingControl;
let allLocations = [];
let lastSelectedLoc = null;

// Initialize Map
function initMap() {
    map = L.map('map-full', { zoomControl: false }).setView([40.281, -7.505], 15);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Mock User Location (Covilhã)
    const userPos = [40.278, -7.509];
    userMarker = L.circleMarker(userPos, {
        radius: 8,
        fillColor: "#6366f1",
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
    }).addTo(map).bindPopup("Tu estás aqui");
}

async function loadLocations() {
    try {
        const response = await fetch('/api/locations');
        allLocations = await response.json();
    } catch (error) {
        console.error('Error loading locations:', error);
    }
}

function toggleTimeInput(e) {
    e.preventDefault();
    const container = document.getElementById('time-input-container');
    const toggle = document.getElementById('plan-toggle');
    const timeInput = document.getElementById('departure-time');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        toggle.innerHTML = '<i class="fa-solid fa-xmark"></i> Cancelar plano';
        // Set current time as default
        const now = new Date();
        timeInput.value = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    } else {
        container.style.display = 'none';
        toggle.innerHTML = '<i class="fa-solid fa-clock"></i> Planear saída (agora)';
        timeInput.value = '';
        if (lastSelectedLoc) selectDestination(lastSelectedLoc); // Refresh route
    }
}

function searchLocations() {
    const query = document.getElementById('dest-input').value.toLowerCase();
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '';

    if (query.length < 2) return;

    const filtered = allLocations.filter(l => 
        l.name.toLowerCase().includes(query) || 
        l.type.toLowerCase().includes(query)
    ).slice(0, 5);

    filtered.forEach(loc => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `<strong>${loc.name}</strong><br><small>${loc.type}</small>`;
        div.onclick = () => selectDestination(loc);
        resultsDiv.appendChild(div);
    });
}

async function selectDestination(loc) {
    lastSelectedLoc = loc;
    document.getElementById('dest-input').value = loc.name;
    document.getElementById('search-results').innerHTML = '';

    if (destMarker) map.removeLayer(destMarker);
    destMarker = L.marker([loc.lat, loc.lng]).addTo(map).bindPopup(loc.name).openPopup();

    const userPos = userMarker.getLatLng();
    const timeVal = document.getElementById('departure-time').value;
    
    let url = `/api/route?start_lat=${userPos.lat}&start_lng=${userPos.lng}&dest_id=${loc.id}`;
    if (timeVal) url += `&time=${timeVal}`;
    
    try {
        const response = await fetch(url);
        const routeData = await response.json();
        displayRoute(routeData);
    } catch (error) {
        console.error('Error fetching route:', error);
    }
}

function displayRoute(data) {
    const panel = document.getElementById('route-panel');
    const instructionsDiv = document.getElementById('instructions');
    const metaP = document.getElementById('route-meta');
    
    panel.style.display = 'block';
    instructionsDiv.innerHTML = '';
    
    let modeText = "Caminhar";
    if (data.mode === 'bus') modeText = "Autocarro";
    
    metaP.innerText = `${data.distance_km} km • ${modeText}`;

    data.instructions.forEach(step => {
        const div = document.createElement('div');
        div.className = 'instruction-step';
        let icon = step.toLowerCase().includes("apanha") ? "fa-bus" : "fa-person-walking";
        div.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${step}</span>`;
        instructionsDiv.appendChild(div);
    });

    if (routingControl) {
        map.removeControl(routingControl);
    }

    const waypoints = [
        L.latLng(data.origin.lat, data.origin.lng),
        L.latLng(data.destination.lat, data.destination.lng)
    ];

    routingControl = L.Routing.control({
        waypoints: waypoints,
        router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        lineOptions: {
            styles: [{ color: data.mode === 'bus' ? '#10b981' : '#6366f1', opacity: 0.8, weight: 6 }]
        },
        createMarker: function() { return null; },
        addWaypoints: false,
        routeWhileDragging: false,
        show: false
    }).addTo(map);
}

function clearRoute() {
    if (routingControl) map.removeControl(routingControl);
    if (destMarker) map.removeLayer(destMarker);
    document.getElementById('route-panel').style.display = 'none';
    document.getElementById('dest-input').value = '';
    lastSelectedLoc = null;
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadLocations();
    
    // Refresh route if time changes
    document.getElementById('departure-time').addEventListener('change', () => {
        if (lastSelectedLoc) selectDestination(lastSelectedLoc);
    });
});
