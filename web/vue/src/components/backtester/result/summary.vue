<template lang='pug'>
  div.contain

    .grd-row.summary
      .grd-row-col-3-6
        table.p1
          tr
            th start time
            td {{ report.startTime }}
          tr
            th end time
            td {{ report.endTime }}
          tr
            th timespan
            td {{ report.timespan }}
          tr
            th start price
            td {{ round(report.startPrice) }} {{ report.currency }}
          tr
            th end price
            td {{ round(report.endPrice) }} {{ report.currency }}
          tr
            th market
            td {{ round(report.market) }}%

      paperTradeSummary(:report='report')

</template>

<script>

  import paperTradeSummary from '../../global/paperTradeSummary.vue'

  export default {
    components: {
      paperTradeSummary
    },
    props: ['report'],
    computed: {
      profitClass: function () {
        if (this.report.relativeProfit > 0)
          return 'profit'
        else
          return 'loss'
      }
    },
    methods: {
      round: n => (+n).toFixed(5)
    }
  }
</script>

<style>
  .summary td {
    text-align: right;
  }

</style>
