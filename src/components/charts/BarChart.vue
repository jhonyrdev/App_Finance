<script setup lang="ts">
import { computed, inject } from "vue";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  type ChartOptions,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

const t: any = inject("translations");

interface Props {
  labels: string[];
  data: number[];
  backgroundColor?: string | string[];
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  backgroundColor: "#3B82F6",
  label: "Amount",
});

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: props.label,
      data: props.data,
      backgroundColor: props.backgroundColor,
      borderRadius: 8,
      borderSkipped: false,
    },
  ],
}));

const chartOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      padding: 12,
      titleFont: {
        size: 14,
        weight: "bold",
      },
      bodyFont: {
        size: 13,
      },
      callbacks: {
        label: (context) => {
          return `$${context.parsed.y?.toFixed(2) || "0.00"}`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => `$${value}`,
      },
      grid: {
        color: "rgba(0, 0, 0, 0.05)",
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
  animation: {
    duration: 750,
    easing: "easeInOutQuart",
  },
};
</script>

<template>
  <div
    class="chart-container"
    role="img"
    :aria-label="`${t.analyticsView.budgetDistribution} ${props.label}`"
  >
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
}

@media (max-width: 768px) {
  .chart-container {
    min-height: 250px;
  }
}
</style>
