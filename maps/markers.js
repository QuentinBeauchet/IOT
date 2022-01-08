var myURL = jQuery('script[src$="markers.js"]')
  .attr("src")
  .replace("markers.js", "");

var myIcon = L.icon({
  iconUrl: myURL + "images/pin24.png",
  iconRetinaUrl: myURL + "images/pin48.png",
  iconSize: [29, 24],
  iconAnchor: [9, 21],
  popupAnchor: [0, -14],
});

const popUpHtml = (marker) =>
  `<h2>${marker.options.city}</h2><h3>Temperature: ${marker.options.temp}°C</h3><b>${marker.options.country}</b>`;

function onMarkerClick(e) {
  $.ajax({
    url: node_url.concat("/city/" + e.sourceTarget.options.city),
    type: "GET",
    headers: { Accept: "application/json" },
    success: function (resultat, statut) {
      e.sourceTarget.options.temp = resultat.temp;
      e.sourceTarget.setPopupContent(popUpHtml(e.sourceTarget));
    },
    error: function (resultat, statut, erreur) {
      console.log(resultat, statut, erreur);
    },
    complete: function (resultat, statut) {},
  });
}

function setMarkers(csv) {
  var markers = L.markerClusterGroup();
  for (var line of csv) {
    var marker = L.marker([parseFloat(line[1]), parseFloat(line[2])], {
      icon: myIcon,
      city: line[0],
      country: line[3],
      temp: "?",
    });
    marker.bindPopup(popUpHtml(marker)).on("click", onMarkerClick);
    markers.addLayer(marker);
  }
  markers.addTo(map);
}

fetch("maps/worldcities.csv")
  .then((response) => response.text())
  .then((csv) =>
    csv
      .split("\n")
      .slice(1, 3000)
      .map((line) =>
        line.split(",").map((word) => {
          word = word.replace("\r", "");
          word = word.replaceAll('"', "");
          return word;
        })
      )
  )
  .then((csvCleaned) => setMarkers(csvCleaned));
