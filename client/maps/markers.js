var myURL = jQuery('script[src$="markers.js"]')
  .attr("src")
  .replace("markers.js", "");

// Icon des markers des villes.
var cityIcon = L.icon({
  iconUrl: myURL + "images/pinCity24.png",
  iconRetinaUrl: myURL + "images/pinCity48.png",
  iconSize: [29, 24],
  iconAnchor: [9, 21],
  popupAnchor: [0, -14],
});

// Icon des markers des esp.
var espIcon = L.icon({
  iconUrl: myURL + "images/pinEsp24.png",
  iconRetinaUrl: myURL + "images/pinEsp48.png",
  iconSize: [29, 24],
  iconAnchor: [9, 21],
  popupAnchor: [0, -14],
});

var markers = L.markerClusterGroup();
var customMarkers = [];

// Supprime de la carte du cache et de la page html la ville.
function removeCityMarker(cityName) {
  var cityCache = localStorage["city"] ? JSON.parse(localStorage["city"]) : [];
  document
    .getElementById("cityList")
    .removeChild(document.getElementById(`cityListElement_${cityName}`));
  localStorage["city"] = JSON.stringify(
    cityCache.filter((city) => city.name != cityName)
  );

  let tmp = [];
  let deletedMarker;
  for (let marker of customMarkers) {
    if (marker.city == cityName) {
      deletedMarker = marker.marker;
    } else {
      tmp.push(marker);
    }
  }
  customMarkers = tmp;
  markers.removeLayer(deletedMarker);
}

// Recupere depuis le serveur la temperature d'une ville lorsqu'on clique sur son marker.
function onMarkerClick(event) {
  getRequest(`/city?cityName=${event.sourceTarget.options.name}`).done(
    (resultat) => {
      event.sourceTarget.options.temp = resultat.temp || "?";
      event.sourceTarget.setPopupContent(popUpHtml(event.sourceTarget));
    }
  );
}

// Recupere depuis le serveur la temperature d'une ville lorsqu'on l'ajoute depuis le form.
function onFormSubmit() {
  getRequest(
    `/city?cityName=${document.getElementById("cityAddInput").value}`
  ).done((resultat) => {
    var error = document.getElementById("cityError");
    var cityCache = localStorage["city"]
      ? JSON.parse(localStorage["city"])
      : [];
    if (Object.keys(resultat).length === 0) {
      error.innerHTML =
        "Le nom de la ville n'a pas ??t?? reconnu par l'API openweather.";
    } else if (
      cityCache.find((city) => city.name == resultat.name) === undefined
    ) {
      cityCache.push(resultat);
      localStorage["city"] = JSON.stringify(cityCache);
      addCityMarkerAndHtml(resultat, document.getElementById("cityList"));

      error.innerHTML = "";
      document.getElementById("cityAddInput").value = "";
    } else {
      error.innerHTML = "La ville a deja ??t?? ajout?? a la carte.";
    }
  });
}

// Recupere depuis le serveur la temperature et la luminosit?? d'un esp lorsqu'on clique sur son marker.
function onEspMarkerClick(event) {
  getRequest(`/esp/latests?who=${event.sourceTarget.options.name}`).done(
    (resultat) => {
      let data = resultat[0];
      event.sourceTarget.options.temp =
        data.temp || event.sourceTarget.options.temp;
      event.sourceTarget.options.light =
        data.light || event.sourceTarget.options.light;
      event.sourceTarget.setPopupContent(popUpHtml(event.sourceTarget));
    }
  );
}

// Ajoute l'esp en tant que marker sur la map si celui ci a des coordonn??es gps.
function addEspMarker(esp) {
  try {
    var marker = L.marker([esp.localisation.lat, esp.localisation.long], {
      icon: espIcon,
      name: esp.who,
      temp: "?",
      light: "?",
    });
    marker.bindPopup(popUpHtml(marker)).on("click", onEspMarkerClick);
    markers.addLayer(marker);
  } catch {
    console.error(
      `L'esp ${esp.who} envoit des valeurs de latitude et longitude incorrectes.`
    );
  }

  window.setInterval(
    () =>
      getRequest(`/esp/latests?who=${esp.who}`).done((res) => {
        try {
          marker.setLatLng(
            new L.LatLng(
              res[0].localisation.lat || marker._latlng.lat,
              res[0].localisation.long || marker._latlng.long
            )
          );
        } catch {
          console.error(
            `L'esp ${esp.who} envoit des valeurs de latitude et longitude incorrectes.`
          );
        }
      }),
    refreshT
  );
}

// Ajoute la ville en tant que marker sur la map.
function addCityMarker(city) {
  var marker = L.marker([city.lat, city.long], {
    icon: cityIcon,
    name: city.name,
    country: city.country,
    temp: city.temp,
  });
  marker.bindPopup(popUpHtml(marker)).on("click", onMarkerClick);
  markers.addLayer(marker);
  return marker;
}

// Ajoute la ville en tant que marker sur la map et aussi comme article dans la liste de la page html.
function addCityMarkerAndHtml(city, parentNode) {
  parentNode.innerHTML += articleHtml(city.name);
  customMarkers.push({ city: city.name, marker: addCityMarker(city) });
}

// Permet de faire des requetes GET au serveur.
function getRequest(url) {
  return $.ajax({
    url: node_url.concat(url),
    type: "GET",
    headers: { Accept: "application/json" },
  });
}

// Ajoute des markers pour toutes les villes presentes dans le csv.
function setMarkers(csv) {
  for (var line of csv) {
    addCityMarker({
      name: line[0],
      country: line[3],
      lat: parseFloat(line[1]),
      long: parseFloat(line[2]),
      temp: "?",
    });
  }
  var cityCache = localStorage["city"] ? JSON.parse(localStorage["city"]) : [];
  var cityList = document.getElementById("cityList");
  for (var city of cityCache) {
    addCityMarkerAndHtml(city, cityList);
  }
  markers.addTo(map);
}

// Nettoie de le csv pour l'ajout des markers.
fetch("client/maps/worldcities.csv")
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
