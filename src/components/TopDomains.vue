<template>
  <Panel
    title="Top domains"
    pre-select="today"
    :tabs="tabs"
    @tab-change="onTabChange"
  >
    <div v-if="state === 'loading'">Loading...</div>
    <BarChart
      v-else-if="state === 'has-results'"
      :chart-data="topDomains"
      :options="{
        type: 'horizontalBar',
      }"
      :height="`${topDomains.labels.length * 50}px`"
    />
  </Panel>
</template>

<script>
import BarChart from './BarChart.vue';
import Panel from './Panel.vue';

import {
  getTopDomains,
  fromToday,
  fromLastSevenDays,
  getTimeoutPreference,
  aggregateToBarChartData,
} from '../data';

export default {
  name: 'TopDomains',

  components: {
    Panel,
    BarChart,
  },

  data() {
    return {
      topDomains: [],
      state: 'loading',
      tabs: [
        {
          label: 'Today',
          id: 'today',
        },
        {
          label: 'This week',
          id: 'this-week',
        },
        {
          label: 'All time',
          id: 'all-time',
        },
      ],
    };
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
      const topDomains = await getTopDomains(
        await getTimeoutPreference(),
        fromToday,
        10
      );
      this.topDomains = this.toChartData(topDomains);
      this.state = 'has-results';
    },

    async showThisWeek() {
      const topDomains = await getTopDomains(
        await getTimeoutPreference(),
        fromLastSevenDays,
        10
      );
      this.topDomains = this.toChartData(topDomains);
      this.state = 'has-results';
    },

    async showAllTime() {
      const topDomains = await getTopDomains(
        await getTimeoutPreference(),
        undefined,
        10
      );
      this.topDomains = this.toChartData(topDomains);
      this.state = 'has-results';
    },

    toChartData(domains) {
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
  },
};
</script>
