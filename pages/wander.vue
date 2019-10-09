<template>
  <div id="wander">
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
  mapboxgl.accessToken = process.env.MAPBOX_API_KEY;
  const grant_token = process.env.CODE4MARSEILLE_API_KEY;

  const lineColors = {
    "bike": '#020887',
    "transfer": '#19ddff',
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
      this._getBikes();
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

      let sortedOptions = withoutCar.sort((a, b) => a.duration - b.duration);
      sortedOptions = sortedOptions.filter(option => {
        return !option.tags.includes("bike") || (option.tags.includes("bike") && option.duration < 1200)
      })



      let bestOption = sortedOptions[0];
      // const bikeOption = sortedOptions.find(option => option.tags.includes("bike"));
      // const ptOption = sortedOptions.find(option => option.tags.includes("walking") && option.sections.length > 1);
      // if (bikeOption && bikeOption.duration > 1200) {
      //   bestOption = ptOption;
      // }

      const walkingOption = sortedOptions.find(option => option.tags.includes("walking") && option.sections.length === 1);
      if (walkingOption && walkingOption.duration < 1200) {
        bestOption = walkingOption;
      }
      this.trips.push(bestOption);
      console.log(this.trips);

      const sections = bestOption.sections.map(section => {
        return section.geojson && ({
          coordinates: section.geojson.coordinates,
          mode: section.mode || section.type
        });
      });

      console.log({bestOption});
      const filtered = sections.filter(el => el);
      filtered.forEach(section => {
        console.log({section})
        const polyLine = layerFactory(section.coordinates, section.mode);

        this.map.addLayer(polyLine);
      })

    }

    _getBikes = () => {
      axios
        .get(`http://marcelle-mobi-api.herokuapp.com/vehicules/bike?grant_token=${grant_token}`)
        .then(({ data }) => this._drawBikes(data))
        .catch(error => console.log({ error }))
    }

    _drawBikes = (bikes) => {
      bikes.forEach(bike => {
        const bikeMarker = document.createElement('div');
        bikeMarker.className = 'bike-marker';
        new mapboxgl.Marker(bikeMarker).setLngLat([bike.position.lng, bike.position.lat]).addTo(this.map);
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

    .bike-marker {
      background-image: url('../assets/images/bike.svg');
      background-size: cover;
      width: 25px;
      height: 25px;
      cursor: pointer;
    }
  }
</style>
