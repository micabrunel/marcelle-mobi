export default {
  mode: "spa",
  router: {
    linkActiveClass: "active"
  },
  /*
   ** Headers of the page
   */
  head: {
    title: 'Marcelle-mobi',
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        hid: "description",
        name: "description",
        content: "Déplacez-vous autrement dans Marseille"
      }
    ],
    link: [
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      {
        rel: "stylesheet",
        href:
          "https://cdnjs.cloudflare.com/ajax/libs/weather-icons/2.0.9/css/weather-icons.min.css"
      }
    ]
  },
  // PWA
  manifest: {
    theme_color: '#25A9E8'
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: "#fff" },
  /*
   ** Global CSS
   */
  css: ["~/assets/css/application.scss"],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    { src: "~/plugins/axios" },
    { src: '~/plugins/infinite-loading' }
  ],
  /*
   ** Nuxt.js dev-modules
   */

  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://bootstrap-vue.js.org/docs/
    "bootstrap-vue/nuxt",
    // Doc: https://axios.nuxtjs.org/usage
    "@nuxtjs/axios",
    "@nuxtjs/pwa",
    // leaflet map
    "nuxt-leaflet",
    "@nuxtjs/device",
    '@nuxtjs/dotenv'
  ],
  /*
   ** Axios module configuration
   ** See https://axios.nuxtjs.org/options
   */
  axios: {
    baseURL: "https://marcelle-mobi-api.herokuapp.com"
  },

  bootstrapVue: {
    bootstrapCSS: false, // Or `css: false`
    bootstrapVueCSS: false // Or `bvCSS: false`
  },

  env: {
    CODE4MARSEILLE_API_KEY: process.env.CODE4MARSEILLE_API_KEY,
    MAPBOX_API_KEY: process.env.MAPBOX_API_KEY
  },
  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) { }
  }
};
