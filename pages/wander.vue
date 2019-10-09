<template>
  <div id="wander">
    <div id="map"><div id="loader" class="hidden"><div class="lds-ring"><div></div><div></div><div></div><div></div></div></div></div>
    <div id="map"></div>
    <div id="legend">
      <ul>
        <li><div id="marker-bike"></div> Vélo</li>
        <li><div id="marker-bus"></div> Métro/Bus</li>
        <li><div id="marker-walking"></div> Marche</li>
      </ul>
    </div>
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
  import Bike from '../assets/images/bike.png';

  mapboxgl.accessToken = process.env.MAPBOX_API_KEY;
  const grant_token = process.env.CODE4MARSEILLE_API_KEY;

  const lineColors = {
    "bike": '#020887',
    "transfer": '#19ddff',
    "walking": '#19ddff',
    "public_transport": '#A4B0F5',
  };

  const polylineLayerFactory = (coordinates, tag) => {
    const id = Math.random().toString();
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

  const featureCollection = features => ({
    type: "geojson",
    data: {
      "type": "FeatureCollection",
      "features": features,
    },
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 40,
  })

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

      this.map.on('load', this._getBikes);
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
      const time = Math.round(trip.duration / 60);
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

      const distance = (trip.distances[mode] / 1000).toFixed(1);

      const co2Emission = `${trip.co2_emission.value} ${trip.co2_emission.unit}`;

      // If biking or walking
      if (
        (displaymode === '<i class="fas fa-biking"></i>') ||
        (displaymode === '<i class="fas fa-walking"></i>')
      ) {
        const insert =
          `<div class="details-poi">
            <div>${displaymode} pendant ${time} min, sur une distance de ${distance} km et 0 gEC !</div>
          </div>`;

        DetailsModal.insertAdjacentHTML('beforeend', insert);
      }
      // If public transport
      else {
        const insert =
          `<div class="details-poi">
            <div>
              ${displaymode} <strong>${metronumber}</strong> ${departure.replace("(Marseille)", "")} → ${arrival.replace("(Marseille)", "")}
            </div>
            <div class="numbers">
              ${distance} km | ${time} min | ${co2Emission}
            </div>
          </div>`;

        DetailsModal.insertAdjacentHTML('beforeend', insert);
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

      this._toggleLoader();
      axios
        .get('http://marcelle-mobi-api.herokuapp.com/itineraries/calculate', { params })
        .then(({ data }) => this._drawBestResult(data))
        .catch(error => console.log({ error }))
    }

    _drawBestResult = ({ current, alternatives }) => {
      this._toggleLoader();
      const options = [current, ...alternatives];
      const withoutCar = options.filter(({ tags }) => !tags.includes('car'));
      const bestOption = this._computeBestOption([current, ...alternatives]);
      console.log({ bestOption });

      const sections = bestOption.sections.map(section => section.geojson && ({
        coordinates: section.geojson.coordinates,
        mode: section.mode || section.type
      }));

      const filtered = sections.filter(el => el);
      console.log('sections', filtered);

      filtered.forEach(section => {
        const polyLine = polylineLayerFactory(section.coordinates, section.mode);
        this.map.addLayer(polyLine);
      })
    }

    _computeBestOption(options) {
      const withoutCar = options.filter(({ tags }) => !tags.includes('car'));

      let sortedOptions = withoutCar.sort((a, b) => a.duration - b.duration);
      sortedOptions = sortedOptions.filter(option =>
        !option.tags.includes("bike") || (option.tags.includes("bike") && option.duration < 1200)
      );

      let bestOption = sortedOptions[0];

      const walkingOption = sortedOptions.find(option =>
        option.tags.includes("walking") && option.sections.length === 1
      );

      if (walkingOption && walkingOption.duration < 1200) {
        bestOption = walkingOption;
      }

      this.trips.push(bestOption);
      console.log('trips', this.trips);

      this._addDetailsToModal();

      return bestOption;
    }

    _getBikes = () => {
      axios
        .get(`http://marcelle-mobi-api.herokuapp.com/vehicules/bike?grant_token=${grant_token}`)
        .then(({ data }) => this._drawBikes(data))
        .catch(error => console.log({ error }))
    }

    _drawBikes = bikes => {
      const features = bikes.map(bike => ({
        "type": "Feature",
        "properties": {
          "id": bike.address,
        },
        "geometry": {
          "type": "Point",
          "coordinates": [bike.position.lng, bike.position.lat],
        }
      }));

      this.map.addSource("bikes", featureCollection(features));

      this.map.loadImage(Bike, (error, image) => {
        if (error) throw error;
        this.map.addImage('bike', image);

        this.map.addLayer({
          "id": "bike-points",
          "type": "symbol",
          "source": "bikes",
          "layout": {
            "icon-image": "bike",
            "icon-size": 0.25,
          },
        });
      });
    }

    _toggleLoader = () => {
      const loader = document.querySelector("#loader");
      loader.classList.toggle("hidden");
      console.log("toggling");
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
    #legend {
    position: absolute;
    bottom: 60px;
    left: 10px;
    background-color: rgba(255, 255, 255, 0.8);
    color: black;
    font-weight: 500;
    width: 90px;
    font-size: 10px;
    padding: 5px;
    height: 60px;
    border-radius: 5px;
    border: 1px solid #3CB3EA;

    }
    #legend li {
      list-style-type: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    #legend ul {
      padding-left: 0px;
    }

    #marker-bike {
      height: 5px;
      width: 20px;
      background-color: #020887;
    }

    #marker-bus {
      height: 5px;
      width: 20px;
      background-color: #A4B0F5;
    }

    #marker-walking {
      height: 5px;
      width: 20px;
      background-color: #19ddff;
    }

    .hidden#loader {
      display: none;
    }

    .bike-marker {
      background-image: url('../assets/images/bike.svg');
      background-size: cover;
      width: 25px;
      height: 25px;
      cursor: pointer;
    }

    #loader {
      display: flex;
      width: 100vw;
      height: 100vh;
      align-items: center;
      justify-content: center;
      background: transparent;
      position: absolute;
    }
    .lds-ring {
      display: inline-block;
      position: absolute;
      align-items: center;
      width: 50px;
      height: 50px;
      z-index: 1000;
    }
    .lds-ring div {
      box-sizing: border-box;
      display: block;
      position: absolute;
      width: 50px;
      height: 50px;
      margin: 8px;
      border: 8px solid #fff;
      border-radius: 50%;
      animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      border-color: #fff transparent transparent transparent;
    }
    .lds-ring div:nth-child(1) {
      animation-delay: -0.45s;
    }
    .lds-ring div:nth-child(2) {
      animation-delay: -0.3s;
    }
    .lds-ring div:nth-child(3) {
      animation-delay: -0.15s;
    }
    @keyframes lds-ring {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

  }
</style>
