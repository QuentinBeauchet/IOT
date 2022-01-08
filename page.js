const node_url = "http://192.168.0.135:5501";

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

initTab();
