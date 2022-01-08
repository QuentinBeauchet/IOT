// Inialisaiton des Tableaux de temperature et de luminosité.
function initCharts() {
  Highcharts.setOptions({
    global: {
      useUTC: false,
      type: "spline",
    },
    time: { timezone: "Europe/Paris" },
  });

  chart1 = new Highcharts.Chart({
    title: { text: "Temperatures" },
    subtitle: { text: "Irregular time data in Highcharts JS" },
    legend: { enabled: true },
    credits: false,
    chart: { renderTo: "temperature" },
    xAxis: { title: { text: "Heure" }, type: "datetime" },
    yAxis: { title: { text: "Temperature (Deg C)" } },
    series: Esps.map((esp) => {
      return { name: esp, data: [] };
    }),
    plotOptions: {
      line: {
        dataLabels: { enabled: true },
        enableMouseTracking: true,
      },
    },
  });

  chart2 = new Highcharts.Chart({
    title: { text: "Lights" },
    legend: { enabled: true },
    credits: false,
    chart: { renderTo: "luminosite" },
    xAxis: { title: { text: "Heure" }, type: "datetime" },
    yAxis: { title: { text: "Lumen (Lum)" } },
    series: Esps.map((esp) => {
      return { name: esp, data: [] };
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

// Initilalisation du rafraichissemnt des requetes GET des données.
function initEspRefresh() {
  for (var i = 0; i < Esps.length; i++) {
    let esp = Esps[i];
    get_samples("/esp/temp", chart1.series[i], esp);
    window.setInterval(
      () => get_samples("/esp/temp", chart1.series[i], esp),
      refreshT
    );

    get_samples("/esp/light", chart2.series[i], esp);
    window.setInterval(
      () => get_samples("/esp/light", chart2.series[i], esp),
      refreshT
    );
  }
}

// Fait la requete a la base de donnée mongodb pour recuper les dernieres valeurs de l'esp avec /esp/temp ou /esp/light.
function get_samples(path_on_node, serie, esp) {
  $.ajax({
    url: node_url.concat(path_on_node),
    type: "GET",
    headers: { Accept: "application/json" },
    data: { who: esp },
    success: function (resultat, statut) {
      let listeData = [];
      resultat.forEach(function (element) {
        listeData.push([Date.parse(element.date), element.value]);
      });
      serie.setData(listeData);
    },
    error: function (resultat, statut, erreur) {
      console.log(resultat, statut, erreur);
    },
    complete: function (resultat, statut) {},
  });
}

const refreshT = 10000;
var Esps = ["Paul", "80:7D:3A:FD:E8:48", "Marc", "Lola"];
var { chart1, chart2 } = initCharts();
initEspRefresh();
