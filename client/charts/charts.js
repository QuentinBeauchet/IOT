// Inialisaiton des Tableaux de temperature et de luminosité.
function initCharts(Esps) {
  Highcharts.setOptions({
    global: {
      useUTC: false,
      type: "spline",
    },
    time: { timezone: "Europe/Paris" },
  });

  chart1 = new Highcharts.Chart({
    title: { text: "Temperatures" },
    subtitle: { text: "Temperature des Esp32 de la flotte" },
    legend: { enabled: true },
    credits: false,
    chart: { renderTo: "temperature" },
    xAxis: { title: { text: "Heure" }, type: "datetime" },
    yAxis: { title: { text: "Temperature (Deg C)" } },
    series: Esps.map((esp) => {
      return { name: esp.who, data: [[esp.date, esp.temp]] };
    }),
    plotOptions: {
      line: {
        dataLabels: { enabled: true },
        enableMouseTracking: true,
      },
    },
  });

  chart2 = new Highcharts.Chart({
    title: { text: "Luminosité" },
    subtitle: { text: "Luminosité des Esp32 de la flotte" },
    legend: { enabled: true },
    credits: false,
    chart: { renderTo: "luminosite" },
    xAxis: { title: { text: "Heure" }, type: "datetime" },
    yAxis: { title: { text: "Lumen (Lum)" } },
    series: Esps.map((esp) => {
      return { name: esp.who, data: [[esp.date, esp.temp]] };
    }),
    plotOptions: {
      line: {
        dataLabels: { enabled: true },
        enableMouseTracking: true,
      },
    },
  });

  return { chart1, chart2 };
}

// Fait la requete a la base de donnée mongodb pour recuper les dernieres valeurs de l'esp avec /esp/temp ou /esp/light.
function get_samples(path_on_node, chartTemp, chartLight, esp) {
  $.ajax({
    url: node_url.concat(path_on_node),
    type: "GET",
    headers: { Accept: "application/json" },
    data: { who: esp },
  }).done((resultat) => {
    let tempData = [];
    let lightData = [];
    resultat.forEach(function (element) {
      console.log(element, element.date, new Date(element.date));
      tempData.push([element.date, element.temp]);
      lightData.push([element.date, element.light]);
    });
    chartTemp.setData(tempData);
    chartLight.setData(lightData);
  });
}

const refreshT = 10000;

// Recupere la liste des esp depuis le serveur.
getRequest("/esps").done((Esps) => {
  var { chart1, chart2 } = initCharts(Esps);
  // Initilalisation du rafraichissemnt des requetes GET des données.
  for (var i = 0; i < Esps.length; i++) {
    let esp = Esps[i];

    window.setInterval(
      get_samples,
      refreshT,
      "/esp/data",
      chart1.series[i],
      chart2.series[i],
      esp.who
    );

    addEspMarker(esp);
  }
});
