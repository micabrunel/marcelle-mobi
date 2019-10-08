<template>
  <div id="wander">
    <div id="map"></div>
  </div>
</template>
<script>
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
export default {
  mounted() {
    mapboxgl.accessToken = process.env.MAPBOX_API_KEY;

    const markers = [];

    const addMarkerToMap = coordinates => {
      const el = document.createElement('div');
      el.className = 'marker';

      new mapboxgl.Marker(el)
                  .setLngLat(coordinates)
                  .addTo(map);
    };

    const createMarker = ({ result }) => {
      markers.push(result);
      addMarkerToMap(result.center);
    }

    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [5.373907, 43.295336],
      zoom: 16,
      hash: true
    })

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      language: "fr",
      proximity: [5.373907, 43.295336],
      bbox: [5.3072, 43.1716, 5.43, 43.44],
      marker: false,
    });

    const fitToBounds = (map, markers) => {
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach(marker => bounds.extend(marker.center));
      map.fitBounds(bounds, { padding: 70, maxZoom: 15, duration: 800 });
    };

    geocoder.setFlyTo(false);
    geocoder.on("result", result => {
      createMarker(result);
      fitToBounds(map, markers);
      geocoder.clear();

    });


    map.addControl(geocoder);
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
