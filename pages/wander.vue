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
      const bestOption = this._computeBestOption([current, ...alternatives]);
      console.log({ bestOption });

      this.trips.push(bestOption);
      console.log('trips', this.trips);

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

    .bike-marker {
      background-image: url('../assets/images/bike.svg');
      background-size: cover;
      width: 25px;
      height: 25px;
      cursor: pointer;
    }
  }
</style>
