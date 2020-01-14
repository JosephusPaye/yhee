<script>
import { Doughnut, mixins } from 'vue-chartjs';
const { reactiveProp } = mixins;

export default {
  name: 'DoughnutChart',
  extends: Doughnut,
  mixins: [reactiveProp],
  props: {
    options: Object,
  },
  mounted() {
    // this.chartData is a prop from the `reactiveProp` mixin
    this.renderChart(this.chartData, this.options);
  },
};
</script>
