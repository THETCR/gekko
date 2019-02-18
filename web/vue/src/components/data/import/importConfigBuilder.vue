<template lang='pug'>
  .grd.contain
    .grd-row
      .grd-row-col-3-6.mx1
        h3 Market
        market-picker(v-on:market='updateMarketConfig', only-importable='true')
      .grd-row-col-3-6.mx1
        range-creator(v-on:range='updateRange')
</template>

<script>

  import _ from 'lodash'
  import marketPicker from '../../global/configbuilder/marketpicker.vue'
  import rangeCreator from '../../global/configbuilder/rangecreator.vue'

  export default {
    components: {
      marketPicker,
      rangeCreator
    },
    data: () => {
      return {
        market: {},
        range: {}
      }
    },
    computed: {
      config: function () {

        let config = {};
        Object.assign(
          config,
          this.market,
          {
            importer: {
              daterange: this.range
            }
          },
          {
            candleWriter: { enabled: true }
          }
        );

        return config;
      }
    },
    methods: {
      updateMarketConfig: function (mc) {
        this.market = mc;
        this.emitConfig();
      },
      updateRange: function (range) {
        this.range = range;
        this.emitConfig();
      },
      emitConfig: function () {
        this.$emit('config', this.config);
      }
    }
  }
</script>

<style>
</style>
