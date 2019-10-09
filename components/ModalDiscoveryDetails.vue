<template>
  <div class="modalDetails">
    <b-collapse :visible="isVisible">
      <div
        class="mx-auto modal-dialog-scrollable modal-lg rounded-top bg-secondary border-0"
        style="min-height: 20vh;"
      >
        <div class="modal-body">
          <h3 class="title-details">TON TRAJET</h3>
          <div class="poi1">
            <div class="info-poi1">
            </div>
          </div>
          <div class="poi2">
            <div class="info-poi2">
            </div>
          </div>
          <div class="poi3">
            <div class="info-poi3">
            </div>
          </div>
          <div class="poi4">
            <div class="info-poi4">
            </div>
          </div>
          <div class="poi5">
            <div class="info-poi5">
            </div>
          </div>
          <div class="poi6">
            <div class="info-poi6">
            </div>
          </div>
        </div>
      </div>
    </b-collapse>
    <b-button
      id="modalTop"
      @click="isVisible = !isVisible"
      block
      class="modal_details_transport"
    >
      <i class="fas fa-chevron-up" v-if="!isVisible"></i>
      <i class="fas fa-chevron-down" v-else></i>
    </b-button>
  </div>
</template>
<script>
export default {
  data: () => ({
    isVisible: false,
    modes: {
      walking: 'Transport en commun',
      bike: 'Vélo',
      bss: 'LeVélo et marche à pied',
      car: 'En voiture'
    }
  })
}
</script>

<style lang="scss">
.modalDetails {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 998;
  .iconVehicule {
    width: 50px;
    height: 50px;
  }
.container-details {
  display: flex;
  border-radius: 10px;
  padding: 10px 15px;
  align-items: center;
  color: white;
}
.modal-body {
  max-height: 50vh;
  overflow-y: scroll;
}

.poi-name {
  margin: 0 10px 0;
}

.nbr-trajet {
  margin: 0;
  width: 30px;
  height: 30px;
  font-weight: bold;
  font-size: 16px;
  border: 3px solid white;
  border-radius: 50%;
  text-align: center;
}

.details-poi {
  position: relative;
  background-color: white;
  width: 90%;
  border-radius: 10px;
  margin-left: 20px;
  padding: 10px;
  text-align: center;
  font-size: 14px;

  .numbers {
    color: #0086c5;
  }

  &::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 10px;
    height: 11px;
    border-left: 2px solid white;
  }

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 10px;
    height: 11px;
    border-left: 2px solid white;
  }
}

.trajet {
  margin-left: 10px;
  font-weight: 500;
}

  #modalTop {
    z-index: 0;
    background-color: #25a9e8;
    border-radius: 0px;
  }

  #filter_itineraire {
    text-align: center;
    width: 100% !important;
    background-color: #25a9e8;
    margin-bottom: 0 !important;
    border-radius: 20px 20px 0 0;
  }

  .itineraries {
    height: 103px;
    margin: 10px 7px;
    border-radius: 10px;
    position: relative;
  }

  .title-details {
    color: white;
    text-align: center;
  }

  .iconVehicule {
    position: absolute;
    top: 40px;
    right: 15px;
  }

  .transport_now {
    border-bottom: 3px solid green !important;
  }
}
</style>
