<template lang='pug'>
  div
    .hr.contain
    div.contain
      h3 Backtest result
    result-summary(:report='result.performanceReport')
    .hr.contain
    chart(:data='candles', height='500')
    .hr.contain
    roundtripTable(:roundtrips='result.roundtrips')
</template>

<script>
  import resultSummary from './summary.vue'
  import chart from './chartWrapper.vue'
  import roundtripTable from './roundtripTable.vue'

  export default {
    components: {
      roundtripTable,
      resultSummary,
      chart
    },
    props: ['result'],
    data: () => {
      return {}
    },
    computed: {
      candles: function () {
        return {
          candles: this.result.stratCandles,
          trades: this.result.trades
        };
      }
    },
    methods: {}
  }
</script>

<style>
</style>
