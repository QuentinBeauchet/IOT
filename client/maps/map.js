var map = L.map("map", {
  center: [20.0, 5.0],
  minZoom: 2,
  zoom: 2,
  worldCopyJump: true,
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: ["a", "b", "c"],
}).addTo(map);

//Polygon generé depuis https://polygons.openstreetmap.fr/ et https://france-geojson.gregoiredavid.fr/ puis reduit avec https://www.keene.edu/campus/maps/tool/
const geoJsonData = () =>
  fetch("client/maps/grassePoly.json")
    .then((res) => res.json())
    .then((json) => {
      return {
        json: json,
        geoJson: L.geoJson(json, {
          style: {
            color: "#ff7800",
            weight: 2,
            opacity: 0.5,
            fillOpacity: 0.2,
          },
        }),
      };
    });

geoJsonData().then((res) => res.geoJson.addTo(map));

//Renvoit une position aleatoire dans la zone du polygon
async function getRandomLoc() {
  const { json, geoJson } = await geoJsonData();
  const bounds = geoJson.getBounds();
  const x_max = bounds._northEast.lng;
  const x_min = bounds._southWest.lng;
  const y_max = bounds._northEast.lat;
  const y_min = bounds._southWest.lat;
  var newLoc = () => {
    return {
      lat: y_min + Math.random() * (y_max - y_min),
      long: x_min + Math.random() * (x_max - x_min),
    };
  };
  var loc = newLoc();
  while (!turf.inside(turf.point([loc.long, loc.lat]), json)) {
    loc = newLoc();
  }
  return loc;
}
