<template>
  <div id="app" class="font-sans text-center">
    <div v-if="state === 'loading'" class="text-lg p-10">Loading...</div>

    <div v-else-if="state === 'cant-track'">
      <div class="p-6 pt-8">
        <div class="text-3xl leading-none mb-3">Can't track</div>
        <div class="text-base text-gray-600">
          This is a special page that can't be tracked
        </div>
        <div class="mt-6">
          <Button class="w-full" href="dashboard.html" target="_new"
            >Dashboard</Button
          >
        </div>
      </div>
    </div>

    <div v-else-if="state === 'not-tracked'" class="border-2 border-gray-800">
      <div
        class="bg-gray-800 text-white leading-none text-base py-3 px-5 truncate max-w-xs"
        :title="origin"
      >
        {{ domain }}
      </div>
      <div class="p-5">
        <div class="text-3xl leading-none">Not tracked</div>
        <div class="mt-5">
          <Button
            color="primary"
            class="w-full mb-2"
            @click.native="trackDomain"
            >Track this domain</Button
          >
          <Button class="w-full" href="dashboard.html" target="_new"
            >Dashboard</Button
          >
        </div>
      </div>
    </div>

    <div v-else-if="state === 'no-data'" class="border-2 border-gray-800">
      <div
        class="bg-gray-800 text-white leading-none text-base py-3 px-5 truncate max-w-xs"
        :title="origin"
      >
        {{ domain }}
      </div>
      <div class="p-5">
        <div class="text-3xl leading-none mb-3">No data yet</div>
        <div class="text-base text-gray-600">Check back later</div>
        <div class="mt-5">
          <Button
            color="primary"
            class="w-full mb-2"
            @click.native="untrackDomain"
            >Don't track this domain</Button
          >
          <Button class="w-full" href="dashboard.html" target="_new"
            >Dashboard</Button
          >
        </div>
      </div>
    </div>

    <div v-else-if="state === 'has-data'" class="border-2 border-gray-800">
      <div
        class="bg-gray-800 text-white leading-none text-base py-3 px-5 truncate max-w-xs"
        :title="origin"
      >
        {{ domain }}
      </div>
      <div class="p-5">
        <div class="text-3xl leading-none mb-3">{{ timeToday }}</div>
        <div class="text-lg">today</div>
        <div class="mt-5">
          <Button
            color="primary"
            class="w-full mb-2"
            @click.native="untrackDomain"
            >Don't track this domain</Button
          >
          <Button class="w-full" href="dashboard.html" target="_new"
            >Dashboard</Button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// @ts-check
import Button from './components/Button.vue';
import {
  getActiveTab,
  getHeartbeats,
  heartbeatsToDurations,
  isToday,
  humanReadableDuration,
  hasPermission,
  requestPermission,
  removePermission,
  promptForReload,
} from './extension';

export default {
  name: 'app',

  components: { Button },

  data() {
    return {
      state: 'loading',
      durationToday: 0,
      domain: '',
      origin: '',
      timeoutPreference: 15 * 60 * 1000, // 15 minutes of timeout in ms
    };
  },

  computed: {
    timeToday() {
      const readable = humanReadableDuration(this.durationToday);

      if (readable.hours === 0) {
        if (readable.minutes === 0) {
          return `${readable.seconds}sec`;
        }
        return `${readable.minutes}min ${readable.seconds}sec`;
      }

      return `${readable.hours}hr ${readable.minutes}min`;
    },
  },

  async created() {
    const tab = await getActiveTab();
    const url = new URL(tab.url);

    if (
      url.protocol.includes('chrome') ||
      url.href.startsWith('https://chrome.google.com/webstore')
    ) {
      this.state = 'cant-track';
      return;
    }

    this.origin = url.origin;
    this.domain = url.hostname;

    const doesHavePermission = await hasPermission(url.origin);

    if (!doesHavePermission) {
      this.state = 'not-tracked';
      return;
    }

    const heartbeats = await getHeartbeats();

    const durations = heartbeatsToDurations(
      heartbeats,
      this.timeoutPreference,
      heartbeat => {
        return isToday(heartbeat) && heartbeat.origin === url.origin;
      }
    );

    if (durations.length === 0) {
      this.state = 'no-data';
    } else {
      this.durationToday = durations.reduce(
        (prev, current) => prev + current.length,
        0
      );
      this.state = 'has-data';
    }
  },

  methods: {
    async trackDomain() {
      const granted = await requestPermission(this.origin);

      if (granted) {
        this.state = 'no-data';
        promptForReload('Reload this page to start the Yhee time tracker?');
      }
    },

    async untrackDomain() {
      const removed = await removePermission(this.origin);

      if (removed) {
        this.state = 'not-tracked';
        promptForReload('Reload this page to stop the Yhee time tracker?');
      }
    },
  },
};
</script>

<style>
@import './assets/tailwind.css';

#app {
  color: rgba(0, 0, 0, 0.87);
  min-width: 240px;
}
</style>
