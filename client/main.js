const node_url = "https://iot-esp-lucioles.herokuapp.com"; //"http://192.168.0.135:5500";

// Change l'onglet du menu.
function changeTab(evt, tabId) {
  let i, tabcontent, tablinks;

  // This is to clear the previous clicked content.
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Set the tab to be "active".
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Display the clicked tab and set it to active.
  document.getElementById(tabId).style.display = "block";
  evt.currentTarget.className += " active";
}

// Chache les onglets >1 a l'initialisation.
function initTab() {
  var tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 1; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
}

// InnerHtml du popUp des markers.
function popUpHtml(marker) {
  return `<h2>${
    marker.options.city || marker.options.name
  }</h2><h3>Temperature: ${marker.options.temp}°C</h3>${
    marker.options.light
      ? `<h3>Luminosité: ${marker.options.light} lumens</h3>`
      : ""
  }<b>${marker.options.country || ""}</b>`;
}

// Html d'un article de la liste des villes.
function articleHtml(city) {
  return `<article class="cityListElement" id="cityListElement_${city}">${city}<button onclick="removeCityMarker('${city}')">&#10006;</button></article>`;
}

initTab();
