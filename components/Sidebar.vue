<template>
  <div id="sidebarComponent">
    <div id="toggleBtn" @click="collapsed = !collapsed" class="ml-3 mt-3">
      <i class="fas fa-bars text-light"></i>
    </div>
    <sidebar-menu
      :menu="menu"
      widthCollapsed="0px"
      :hideToggle="true"
      :collapsed="collapsed"
      width="270px"
    >
      <div slot="header" class="vsm--item text-right" @click="collapsed = !collapsed">
        <img src="~/assets/images/cancel.svg" alt="close" class="close-svg m-3" />
      </div>
      <span slot="toggle-icon"></span>
    </sidebar-menu>
  </div>
</template>

<script>
import { SidebarMenu } from 'vue-sidebar-menu'
export default {
  components: {
    SidebarMenu
  },
  data() {
    return {
      collapsed: true,
      menu: [
        {
          title: 'Accueil',
          href: '/',
          hiddenOnCollapse: true,
          icon: {
            element: 'img',
            class: 'icon-sidebar',
            attributes: {
              src: require('~/assets/images/navbarHome.svg')
            }
          }
        },
        {
          title: 'Se déplacer',
          href: '/map',
          hiddenOnCollapse: true,
          icon: {
            element: 'img',
            class: 'icon-sidebar',
            attributes: {
              src: require('~/assets/images/navbarMap.svg')
            }
          }
        },
        {
          title: 'Balades 💯 Carbone',
          href: '/wander',
          hiddenOnCollapse: true,
          icon: {
            element: 'img',
            class: 'icon-sidebar',
            attributes: {
              src: require('~/assets/images/camera.svg')
            }
          }
        },
        {
          title: 'Se garer / Se Recharger',
          href: '/parking-map',
          hiddenOnCollapse: true,
          icon: {
            element: 'img',
            class: 'icon-sidebar',
            attributes: {
              src: require('~/assets/images/elec_car.svg')
            }
          }
        },
        {
          title: 'Analyser mon trajet',
          href: '/marius',
          hiddenOnCollapse: true,
          icon: {
            element: 'img',
            class: 'icon-sidebar',
            attributes: {
              src: require('~/assets/images/navbarMarius.svg')
            }
          }
        },
        {
          title: 'Bon à savoir',
          href: '/articles',
          hiddenOnCollapse: true,
          icon: {
            element: 'img',
            class: 'icon-sidebar',
            attributes: {
              src: require('~/assets/images/navbarBlog.svg')
            }
          }
        },
        {
          title: 'Proposer un article',
          href: '/articles/create',
          hiddenOnCollapse: true,
          icon: {
            element: 'img',
            class: 'icon-sidebar',
            attributes: {
              src: require('~/assets/images/navbarCreateArticle.svg')
            }
          }
        },
        {
          title: 'À propos',
          href: '/apropos',
          hiddenOnCollapse: true,
          icon: {
            element: 'img',
            class: 'icon-sidebar',
            attributes: {
              src: require('~/assets/images/help.svg')
            }
          }
        }
      ]
    }
  },
  watch: {
    $route(to, from) {
      this.collapsed = true
    }
  }
}
</script>

<style lang="scss">
#sidebarComponent {
  #toggleBtn {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 998;
  }

  .v-sidebar-menu {
    background: linear-gradient(156.38deg, #0e5da4 57.92%, #25a9e8 99.79%);
    .vsm--link_level-1 .vsm--icon {
      background-color: initial !important;
    }
    .vsm--item {
      border-bottom: 0.5px solid white;
    }

    .vsm--link {
      font-size: 14px;
      text-transform: uppercase;
      padding: 10px 0;
      display: flex;
      align-items: center;
    }
  }

  .fa-bars {
    background-color: rgba(39, 167, 232, 0.7);
    border-radius: 10px;
    padding: 10px;
  }

  .icon-sidebar {
    min-width: 40px;
    min-height: 40px;
    width: 6vw;
    height: 5vw;
    max-width: 50px;
    max-height: 50px;
    margin: 0 20px 0 1vh;
  }
  .close-svg {
    font-size: 30%;
    width: 10%;
    margin: 1vh 1vw 1vh auto;
  }

  a:hover {
    text-decoration: none;
  }
}
</style>
