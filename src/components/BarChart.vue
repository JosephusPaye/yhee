<script>
import { HorizontalBar, mixins } from 'vue-chartjs';
const { reactiveProp } = mixins;

export default {
  name: 'BarChart',
  extends: HorizontalBar,
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
