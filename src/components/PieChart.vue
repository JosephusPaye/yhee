<script>
import { Pie, mixins } from 'vue-chartjs';
const { reactiveProp } = mixins;

export default {
  name: 'PieChart',
  extends: Pie,
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
