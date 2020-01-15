<template>
  <Panel
    title="Top domains"
    pre-select="today"
    :tabs="tabs"
    @tab-change="onTabChange"
  >
    <button
      slot="actions"
      @click="chart = chart === 'bar' ? 'pie' : 'bar'"
      class="h-6 w-6 text-gray-600 hover:text-gray-800"
      :title="chart === 'bar' ? 'Show as pie chart' : 'Show as bar chart'"
    >
      <IconPieChart v-if="chart === 'bar'" />
      <IconBarChart
        v-else-if="chart === 'pie'"
        style="transform: rotate(90deg)"
      />
    </button>
    <div v-if="state === 'loading'">Loading...</div>
    <template v-else-if="state === 'has-results' && chart === 'bar'">
      <BarChart
        v-if="timespan === 'today'"
        key="today"
        :chart-data="barChartData"
        :height="barChartHeight"
      />
      <BarChart
        v-else-if="timespan === 'this-week'"
        key="this-week"
        :chart-data="barChartData"
        :height="barChartHeight"
      />
      <BarChart
        v-else-if="timespan === 'all-time'"
        key="all-time"
        :chart-data="barChartData"
        :height="barChartHeight"
      />
    </template>
    <PieChart
      v-else-if="state === 'has-results' && chart === 'pie'"
      :chart-data="pieChartData"
      height="200px"
    />
  </Panel>
</template>

<script>
import BarChart from './BarChart.vue';
import PieChart from './PieChart.vue';
import Panel from './Panel.vue';
import IconBarChart from '../assets/icons/bar-chart.svg';
import IconPieChart from '../assets/icons/pie-chart.svg';

import {
  getTopDomains,
  fromToday,
  fromLastSevenDays,
  getTimeoutPreference,
  aggregateToBarChartData,
  SOLID_FILL_COLORS,
} from '../data';

export default {
  name: 'TopDomains',

  components: {
    Panel,
    BarChart,
    PieChart,
    IconPieChart,
    IconBarChart,
  },

  data() {
    return {
      state: 'loading',
      chart: 'bar', // TODO: Remember changes across refreshes?
      timespan: '',
      topDomains: [],
      tabs: [
        {
          label: 'Today',
          id: 'today',
        },
        {
          label: 'Last 7 Days',
          id: 'this-week',
        },
        {
          label: 'All time',
          id: 'all-time',
        },
      ],
    };
  },

  computed: {
    barChartData() {
      return this.toBarChartData(this.topDomains);
    },

    barChartHeight() {
      return `${this.topDomains.length * 40 + 100}px`;
    },

    pieChartData() {
      return this.toPieChartData(this.topDomains);
    },
  },

  async created() {
    this.showToday();
  },

  methods: {
    onTabChange({ id }) {
      if (id === 'today') {
        this.showToday();
      } else if (id === 'this-week') {
        this.showThisWeek();
      } else if (id === 'all-time') {
        this.showAllTime();
      }
    },

    async showToday() {
      this.topDomains = await getTopDomains(
        await getTimeoutPreference(),
        fromToday,
        10
      );
      this.timespan = 'today';
      this.state = 'has-results';
    },

    async showThisWeek() {
      this.topDomains = await getTopDomains(
        await getTimeoutPreference(),
        fromLastSevenDays,
        10
      );
      this.timespan = 'this-week';
      this.state = 'has-results';
    },

    async showAllTime() {
      this.topDomains = await getTopDomains(
        await getTimeoutPreference(),
        () => true,
        10
      );
      this.timespan = 'all-time';
      this.state = 'has-results';
    },

    toBarChartData(domains) {
      return aggregateToBarChartData(
        domains,
        'Total time (minutes)',
        domain => {
          return domain.origin.replace('https://', '').replace('http://', '');
        },
        domain => {
          return Math.floor(domain.totalTime / 1000 / 60);
        }
      );
    },

    toPieChartData(domains) {
      return aggregateToBarChartData(
        domains,
        'Total time (minutes)',
        domain => {
          return domain.origin.replace('https://', '').replace('http://', '');
        },
        domain => {
          return Math.floor(domain.totalTime / 1000 / 60);
        },
        {
          backgroundColor({ dataIndex: index }) {
            return SOLID_FILL_COLORS[index % SOLID_FILL_COLORS.length];
          },
          borderWidth: 2,
          borderColor: 'rgb(255, 255, 255)',
        }
      );
    },
  },
};
</script>
