// Initialize map on page load
let map = L.map("map").setView([10.8505, 76.2711], 7); // Default view for Kerala
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

function logoutUser() {
    localStorage.clear();
    window.location.href = 'signin.html';
}

async function searchRTO() {

    const location = document.getElementById("location").value.trim();
    if (!location) {
        alert("Please enter a location.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/rto?location=${location}`);
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            alert("No RTO offices found.");
            return;
        }

        // Clear previous markers and list
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        const rtoList = document.getElementById("rtoList");
        rtoList.innerHTML = ""; // Clear previous list

        // Add new markers and list items
        data.forEach((place, index) => {
            const marker = L.marker([place.lat, place.lon]).addTo(map)
                .bindPopup(`<b>${place.name}</b>`);

            if (index === 0) {
                marker.openPopup();
                map.setView([place.lat, place.lon], 12);
            }

            // Add RTO to list
            const listItem = document.createElement("li");
            listItem.className = "rto-item";
            listItem.innerHTML = `<b>${place.name}</b> <br> (${place.lat}, ${place.lon})`;
            listItem.onclick = () => {
                map.setView([place.lat, place.lon], 14);
                marker.openPopup();
            };

            rtoList.appendChild(listItem);
        });

    } catch (error) {
        console.error("Error fetching RTO locations:", error);
        alert("Error fetching RTO locations. Check console.");
    }
}
