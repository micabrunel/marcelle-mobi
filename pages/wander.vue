<template>
  <div id="wander">
    <div id="map"></div>
    <ModalDiscoveryDetails />
  </div>
</template>

<script>
  import mapboxgl from "mapbox-gl";
  import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
  import axios from 'axios';
  import 'mapbox-gl/dist/mapbox-gl.css';
  import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
  import ModalDiscoveryDetails from '~/components/ModalDiscoveryDetails'
  mapboxgl.accessToken = process.env.MAPBOX_API_KEY;
  const grant_token = process.env.CODE4MARSEILLE_API_KEY;

  const lineColors = {
    "bike": '#020887',
    "bss": '#19ddff',
    "walking": '#19ddff',
    "public_transport": '#A4B0F5',
  };

  const layerFactory = (coordinates, tag) => {
    const id = coordinates[0][0].toString();
    const lineColor = lineColors[tag];

    return ({
      "id": id,
      "type": "line",
      "source": {
        "type": "geojson",
        "data": {
          "type": "Feature",
          "properties": {},
          "geometry": {
            "type": "LineString",
            "coordinates": coordinates,
          },
        },
      },
      "layout": {
        "line-join": "round",
        "line-cap": "round"
      },
      "paint": {
        "line-color": lineColor,
        "line-width": 5,
      },
    })
  };

  class Wander {
    constructor() {
      this.markers = [];
      this.trips = [];

      this.map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v11",
        center: [5.373907, 43.295336],
        zoom: 16,
        hash: true,
      })

      this.geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        language: "fr",
        proximity: [5.373907, 43.295336],
        bbox: [5.3072, 43.1716, 5.43, 43.44],
        marker: false,
      });

      this.geocoder.setFlyTo(false);
      this.map.addControl(this.geocoder);
    }

    _handleResult = ({ result }) => {
      this.geocoder.clear();

      this.markers.push(result);

      this._addMarkerToMap(result.center);
      this._getItinary();
    }

    _addMarkerToMap = coordinates => {
      const el = document.createElement('div');
      el.className = 'marker';

      new mapboxgl.Marker(el).setLngLat(coordinates).addTo(this.map);

      this._fitToBounds();
      this._addMarkerToModal();
    };

    _fitToBounds = () => {
      const bounds = new mapboxgl.LngLatBounds();

      this.markers.forEach(marker => bounds.extend(marker.center));
      this.map.fitBounds(bounds, { padding: 70, maxZoom: 15, duration: 800 });
    };

    _addMarkerToModal = () => {
      const titleModal = document.querySelector(`.poi${this.markers.length}`);
      const marker = this.markers[this.markers.length - 1];
      titleModal.insertAdjacentHTML('beforeend',`<div class="container-details"><p class="nbr-trajet">${this.markers.length}</p><p class="poi-name">${marker.text_fr}</p>`);
    }

    _addDetailsToModal = () => {
      const DetailsModal = document.querySelector(`.info-poi${this.markers.length}`);
      const trip = this.trips[this.trips.length - 1];
      const time = Math.round(trip.duration/60);
      const mode = trip.tags[0];
      let displaymode = mode;
      if (mode == "walking") {
        displaymode = '<i class="fas fa-walking"></i>';
      }
      if (mode == "bike") {
        displaymode = '<i class="fas fa-biking"></i>';
      }
      let modesections = [];
      trip.sections.forEach(function(element) {
        modesections.push(element);
      });
      // console.log({modesections});

      // Si on est dans le cas d'un public transport
      let metronumber = "";
      let departure = "";
      let arrival = "";
      let regex_departure = "";
      let regex_arrival = "";
      const regex = new RegExp('\b(?!Marseille)\b\S+');
      if (modesections.length > 1) {
        displaymode = '<i class="fas fa-bus"></i>';
        metronumber = modesections[1]["display_informations"]["code"];
        departure = modesections[1]["from"]["name"];
        arrival = modesections[1]["to"]["name"];

        regex_departure = departure.match(regex);
        regex_arrival = arrival.match(regex);
      }

      const distance = (trip.distances[mode]/1000).toFixed(1);
      // Si vélo ou trajet à pied
      if ((displaymode == '<i class="fas fa-biking"></i>') || (displaymode == '<i class="fas fa-walking"></i>')) {
        DetailsModal.insertAdjacentHTML('beforeend',`<div class="details-poi"> <div> ${displaymode} pendant ${time} min, sur une distance de ${distance} km </div></div>`);
      }
      // Si métro
      else {
        DetailsModal.insertAdjacentHTML('beforeend',`<div class="details-poi"> <div> ${displaymode} ${metronumber} de ${departure.replace("(Marseille)", "")} à ${arrival.replace("(Marseille)", "")} </div> <div> ${distance} km | ${time} min</div></div>`);
      }
    }


    _getItinary = () => {
      if (this.markers.length < 2) {
        return;
      }

      const departure = this.markers[this.markers.length - 2];
      const arrival = this.markers[this.markers.length - 1];

      const [lng_departure, lat_departure] = departure.center;
      const [lng_arrival, lat_arrival] = arrival.center;

      const params = {
        grant_token,
        lat_departure,
        lng_departure,
        lat_arrival,
        lng_arrival,
        mode: "walking",
      };

      axios
        .get('http://marcelle-mobi-api.herokuapp.com/itineraries/calculate', { params })
        .then(({ data }) => this._drawBestResult(data))
        .catch(error => console.log({ error }))
    }

    _drawBestResult = ({ current, alternatives }) => {
      const options = [current, ...alternatives];
      const withoutCar = options.filter(({ tags }) => !tags.includes('car'));

      const sortedOptions = withoutCar.sort((a, b) => a.duration - b.duration);

      let bestOption = sortedOptions[0];
      const walkingOption = sortedOptions.find(section => section.tags.includes("walking"));
      if (walkingOption && walkingOption.duration < 1200) {
        bestOption = walkingOption;
      }
      this.trips.push(bestOption);
      this._addDetailsToModal();
      console.log(this.trips);

      const sections = bestOption.sections.map(section => {
        return section.geojson && ({
          coordinates: section.geojson.coordinates,
          mode: section.mode || section.type
        });
      });

      const filtered = sections.filter(el => el);
      filtered.forEach(section => {
        const polyLine = layerFactory(section.coordinates, section.mode);

        this.map.addLayer(polyLine);
      })

    }

    init() {
      this.geocoder.on("result", result => this._handleResult(result));
    }
  }

  export default {
    components: {ModalDiscoveryDetails},
    mounted() {
      const wander = new Wander();
      wander.init();
    }
  }
</script>

<style lang='scss'>
  #wander {
    #map {
      width: 100%;
      height: 100vh;
    }
    .marker {
      background-image: url('../assets/images/pin.svg');
      background-size: cover;
      width: 40px;
      height: 40px;
      cursor: pointer;
    }
  }
</style>
